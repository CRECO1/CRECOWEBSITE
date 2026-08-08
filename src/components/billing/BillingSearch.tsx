'use client';

/**
 * Global billing search — header-mounted Cmd/Ctrl-K modal that searches
 * across invoices, expenses, recurring templates, and contractors. Hits
 * Supabase with `ilike` queries, debounced 200ms, displays the top 5
 * results per type with a click-through to the detail page.
 *
 * Kept as a single component so it can be mounted once in BillingRail and
 * triggered from anywhere via the keyboard shortcut or the search button.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, X, Loader2, Receipt, ArrowDownCircle, Repeat, FileBadge,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatMoney, formatDate, type Invoice } from '@/lib/invoices';
import type { Expense } from '@/lib/expenses';
import type { RecurringTemplate } from '@/lib/recurring-invoices';

interface ContractorLite {
  id: string;
  legal_name: string;
  display_name: string | null;
  email: string | null;
}

interface SearchResults {
  invoices: Invoice[];
  expenses: Expense[];
  recurring: RecurringTemplate[];
  contractors: ContractorLite[];
}

const EMPTY: SearchResults = { invoices: [], expenses: [], recurring: [], contractors: [] };

export function BillingSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Global Cmd/Ctrl-K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Focus the input when modal opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults(EMPTY);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const like = `%${q.replace(/[%_]/g, m => '\\' + m)}%`;
      const [invR, expR, recR, conR] = await Promise.all([
        supabase
          .from('invoices')
          .select('*')
          .or(`invoice_number.ilike.${like},client_name.ilike.${like},client_email.ilike.${like},client_company.ilike.${like},property_reference.ilike.${like}`)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('expenses')
          .select('*')
          .or(`vendor.ilike.${like},description.ilike.${like},category.ilike.${like},property_reference.ilike.${like}`)
          .order('expense_date', { ascending: false })
          .limit(5),
        supabase
          .from('recurring_invoice_templates')
          .select('*')
          .or(`name.ilike.${like},client_name.ilike.${like},client_email.ilike.${like}`)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('contractors')
          .select('id, legal_name, display_name, email')
          .or(`legal_name.ilike.${like},display_name.ilike.${like},email.ilike.${like}`)
          .order('legal_name')
          .limit(5),
      ]);
      setResults({
        invoices: (invR.data ?? []) as Invoice[],
        expenses: (expR.data ?? []) as Expense[],
        recurring: (recR.data ?? []) as RecurringTemplate[],
        contractors: (conR.data ?? []) as ContractorLite[],
      });
      setLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const totalResults =
    results.invoices.length + results.expenses.length + results.recurring.length + results.contractors.length;

  const goTo = (href: string) => {
    router.push(href);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger button (used by the rail) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-body-sm transition-colors"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="hidden lg:inline-flex items-center rounded border border-white/20 px-1.5 py-0.5 text-[10px] font-mono text-white/50">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-start justify-center pt-20 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Search className="h-5 w-5 text-foreground-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search invoices, expenses, templates, contractors…"
                className="flex-1 bg-transparent text-body text-primary focus:outline-none placeholder:text-foreground-muted/60"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-foreground-muted hover:text-primary"
                aria-label="Close search"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {query.trim().length < 2 ? (
                <div className="px-4 py-10 text-center text-body-sm text-foreground-muted">
                  Type at least 2 characters to search.
                </div>
              ) : !loading && totalResults === 0 ? (
                <div className="px-4 py-10 text-center text-body-sm text-foreground-muted">
                  No results for <span className="font-mono text-primary">"{query}"</span>.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {results.invoices.length > 0 && (
                    <Section title="Invoices" icon={Receipt}>
                      {results.invoices.map(inv => (
                        <ResultRow
                          key={inv.id}
                          onClick={() => goTo(`/billing/invoices/${inv.id}`)}
                          primary={
                            <span>
                              <span className="font-mono font-semibold">{inv.invoice_number}</span>{' '}
                              <span className="text-foreground-muted">·</span>{' '}
                              {inv.client_name}
                            </span>
                          }
                          secondary={`${formatDate(inv.issue_date)} · ${inv.status}`}
                          right={formatMoney(inv.total)}
                        />
                      ))}
                    </Section>
                  )}

                  {results.expenses.length > 0 && (
                    <Section title="Expenses" icon={ArrowDownCircle}>
                      {results.expenses.map(e => (
                        <ResultRow
                          key={e.id}
                          onClick={() => goTo(`/billing/expenses/${e.id}`)}
                          primary={
                            <span>
                              {e.vendor}{' '}
                              <span className="text-foreground-muted">·</span>{' '}
                              <span className="text-foreground-muted">{e.category}</span>
                            </span>
                          }
                          secondary={`${formatDate(e.expense_date)}${e.description ? ' · ' + e.description : ''}`}
                          right={`−${formatMoney(e.amount)}`}
                        />
                      ))}
                    </Section>
                  )}

                  {results.recurring.length > 0 && (
                    <Section title="Recurring templates" icon={Repeat}>
                      {results.recurring.map(t => (
                        <ResultRow
                          key={t.id}
                          onClick={() => goTo(`/billing/recurring/${t.id}`)}
                          primary={t.name}
                          secondary={`${t.client_name} · ${t.frequency}${t.active ? '' : ' · paused'}`}
                        />
                      ))}
                    </Section>
                  )}

                  {results.contractors.length > 0 && (
                    <Section title="Contractors" icon={FileBadge}>
                      {results.contractors.map(c => (
                        <ResultRow
                          key={c.id}
                          onClick={() => goTo(`/billing/contractors/${c.id}`)}
                          primary={c.display_name ?? c.legal_name}
                          secondary={c.email ?? (c.display_name && c.display_name !== c.legal_name ? c.legal_name : '')}
                        />
                      ))}
                    </Section>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-border bg-background-cream/40 px-4 py-2.5 flex items-center justify-between text-caption text-foreground-muted">
              <span>
                <kbd className="font-mono">↵</kbd> open ·{' '}
                <kbd className="font-mono">esc</kbd> close
              </span>
              <span>
                <kbd className="font-mono">⌘K</kbd> toggle anywhere
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({
  title, icon: Icon, children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2">
      <div className="px-4 py-1.5 text-caption uppercase tracking-widest text-foreground-muted flex items-center gap-2">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      <ul>{children}</ul>
    </div>
  );
}

function ResultRow({
  onClick, primary, secondary, right,
}: {
  onClick: () => void;
  primary: React.ReactNode;
  secondary?: string;
  right?: string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-background-cream/60 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="text-body-sm text-primary truncate">{primary}</div>
          {secondary && <div className="text-caption text-foreground-muted truncate">{secondary}</div>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {right && <span className="font-mono text-body-sm text-primary">{right}</span>}
          <ArrowRight className="h-3.5 w-3.5 text-foreground-muted" />
        </div>
      </button>
    </li>
  );
}
