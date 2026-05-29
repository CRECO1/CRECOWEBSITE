'use client';

/**
 * Cmd+K (Ctrl+K) global search for the billing surface. Drop the
 * operator into any invoice, client, expense, or property in 2-3 keys.
 *
 * Triggers:
 *   - Cmd+K / Ctrl+K from anywhere
 *   - / when no input is focused
 *
 * Data loading:
 *   - On first open, parallel-fetches the four entity sets (each capped
 *     at 200 rows — generous enough for a solo operator, small enough
 *     that the client-side filter is instant). Keeps in component state
 *     for the session. Subsequent opens reuse the cache; toggle the
 *     hidden refresh button if you've changed something in another tab.
 *
 * Filter:
 *   - Client-side fuzzy-ish match across the visible fields. Empty
 *     query shows the 5 most-recent of each type as a "starting point."
 *
 * Keyboard nav:
 *   - ArrowDown / ArrowUp move selection
 *   - Enter opens the selected result
 *   - Esc closes (handled by ModalBase)
 *
 * Routing:
 *   - Invoice  → /billing/invoices/[id]
 *   - Client   → /billing/clients/[id]
 *   - Expense  → /billing/expenses/[id]
 *   - Property → /billing/properties/[id]
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, FileText, Users, Receipt, Building2, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ModalBase } from '@/components/ui/ModalBase';
import { formatMoney } from '@/lib/invoices';

interface InvoiceHit {
  type: 'invoice';
  id: string;
  invoice_number: string;
  client_name: string;
  total: number;
  status: string;
}

interface ClientHit {
  type: 'client';
  id: string;
  name: string;
  email: string;
  company: string | null;
}

interface ExpenseHit {
  type: 'expense';
  id: string;
  vendor: string;
  category: string;
  amount: number;
  expense_date: string;
}

interface PropertyHit {
  type: 'property';
  id: string;
  name: string;
  address: string | null;
  status: string;
}

type Hit = InvoiceHit | ClientHit | ExpenseHit | PropertyHit;

const SUPPRESS_PATHS = ['/api/', '/_next/'];

export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [data, setData] = useState<{ invoices: InvoiceHit[]; clients: ClientHit[]; expenses: ExpenseHit[]; properties: PropertyHit[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Only mount the palette on billing routes. The component is rendered
  // from the billing layout so this is mostly a no-op — kept as a
  // belt-and-suspenders guard in case mount surface changes.
  const isBillingRoute = pathname?.startsWith('/billing');

  // Cmd+K / Ctrl+K global shortcut. Also "/" when no input is focused
  // (matches GitHub, Stripe, Linear conventions).
  useEffect(() => {
    if (!isBillingRoute) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inEditable = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      } else if (e.key === '/' && !inEditable && !open) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, isBillingRoute]);

  // Reset query + selection when reopening so the panel always starts
  // in a clean state instead of remembering the last search.
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [open]);

  // Load entity data on first open. Cache in state across opens.
  useEffect(() => {
    if (!open || data) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [invR, cliR, expR, propR] = await Promise.all([
        supabase
          .from('invoices')
          .select('id, invoice_number, client_name, total, status')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(200),
        supabase
          .from('clients')
          .select('id, name, email, company')
          .order('updated_at', { ascending: false })
          .limit(200),
        supabase
          .from('expenses')
          .select('id, vendor, category, amount, expense_date')
          .is('deleted_at', null)
          .order('expense_date', { ascending: false })
          .limit(200),
        supabase
          .from('properties')
          .select('id, name, address, status')
          .is('deleted_at', null)
          .order('name')
          .limit(200),
      ]);
      if (cancelled) return;
      setData({
        invoices: (invR.data ?? []).map(r => ({ ...r, type: 'invoice' as const })),
        clients: (cliR.data ?? []).map(r => ({ ...r, type: 'client' as const })),
        expenses: (expR.data ?? []).map(r => ({ ...r, type: 'expense' as const })),
        properties: (propR.data ?? []).map(r => ({ ...r, type: 'property' as const })),
      });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, data]);

  // Client-side filter. Empty query → 5 most-recent of each type.
  // Non-empty → match across the visible columns, capped to 5 per type
  // so the list stays scannable.
  const results = useMemo<Hit[]>(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const pick = <T extends Hit>(arr: T[], match: (h: T) => boolean): T[] =>
      (q ? arr.filter(match) : arr).slice(0, 5);
    const invHits = pick(data.invoices, h =>
      h.invoice_number.toLowerCase().includes(q) || h.client_name.toLowerCase().includes(q));
    const cliHits = pick(data.clients, h =>
      h.name.toLowerCase().includes(q) ||
      h.email.toLowerCase().includes(q) ||
      (h.company ?? '').toLowerCase().includes(q));
    const expHits = pick(data.expenses, h =>
      h.vendor.toLowerCase().includes(q) ||
      h.category.toLowerCase().includes(q));
    const propHits = pick(data.properties, h =>
      h.name.toLowerCase().includes(q) ||
      (h.address ?? '').toLowerCase().includes(q));
    // Order: invoices → clients → properties → expenses. Match by impact
    // — operators look for invoices most often, then clients.
    return [...invHits, ...cliHits, ...propHits, ...expHits];
  }, [data, query]);

  // Clamp selection within the current result count.
  useEffect(() => {
    if (selectedIndex >= results.length) setSelectedIndex(Math.max(0, results.length - 1));
  }, [results.length, selectedIndex]);

  const navigate = useCallback((hit: Hit) => {
    setOpen(false);
    switch (hit.type) {
      case 'invoice':  router.push(`/billing/invoices/${hit.id}`); break;
      case 'client':   router.push(`/billing/clients/${hit.id}`); break;
      case 'expense':  router.push(`/billing/expenses/${hit.id}`); break;
      case 'property': router.push(`/billing/properties/${hit.id}`); break;
    }
  }, [router]);

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      const hit = results[selectedIndex];
      if (hit) {
        e.preventDefault();
        navigate(hit);
      }
    }
  }

  // Keep the selected row scrolled into view as the operator arrow-keys
  // through a long result list.
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isBillingRoute) return null;

  return (
    <ModalBase
      open={open}
      onClose={() => setOpen(false)}
      size="xl"
      backdropClassName="bg-black/40"
      innerClassName="mt-[10vh] my-0"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Search className="h-4 w-4 text-foreground-muted shrink-0" />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder="Search invoices, clients, expenses, properties…"
          className="flex-1 bg-transparent outline-none text-body text-primary placeholder:text-foreground-muted"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-foreground-muted shrink-0" />}
        <kbd className="hidden sm:inline-block text-caption font-mono px-1.5 py-0.5 rounded border border-border bg-background-cream/50 text-foreground-muted">
          esc
        </kbd>
      </div>
      <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
        {!data && loading && (
          <div className="p-8 text-center text-body-sm text-foreground-muted">Loading index…</div>
        )}
        {data && results.length === 0 && (
          <div className="p-8 text-center text-body-sm text-foreground-muted">
            {query ? 'No matches.' : 'Type to search.'}
          </div>
        )}
        {results.map((hit, i) => {
          const isSelected = i === selectedIndex;
          return (
            <button
              key={`${hit.type}-${hit.id}`}
              type="button"
              data-index={i}
              onClick={() => navigate(hit)}
              onMouseEnter={() => setSelectedIndex(i)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                isSelected ? 'bg-gold/10' : 'hover:bg-background-cream/40'
              }`}
            >
              <ResultIcon type={hit.type} />
              <ResultBody hit={hit} />
            </button>
          );
        })}
      </div>
      <div className="px-4 py-2 border-t border-border bg-background-cream/30 flex items-center justify-between text-caption text-foreground-muted">
        <span>↑↓ navigate · ⏎ open · esc close</span>
        <span>{results.length} {results.length === 1 ? 'result' : 'results'}</span>
      </div>
    </ModalBase>
  );
}

function ResultIcon({ type }: { type: Hit['type'] }) {
  const cls = 'h-4 w-4 shrink-0 text-gold-dark';
  switch (type) {
    case 'invoice':  return <FileText className={cls} />;
    case 'client':   return <Users className={cls} />;
    case 'expense':  return <Receipt className={cls} />;
    case 'property': return <Building2 className={cls} />;
  }
}

function ResultBody({ hit }: { hit: Hit }) {
  switch (hit.type) {
    case 'invoice':
      return (
        <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-body-sm text-primary truncate">
              <span className="font-mono font-semibold">{hit.invoice_number}</span> · {hit.client_name}
            </div>
            <div className="text-caption text-foreground-muted uppercase tracking-wider">Invoice · {hit.status}</div>
          </div>
          <span className="font-mono text-body-sm text-primary shrink-0">{formatMoney(hit.total)}</span>
        </div>
      );
    case 'client':
      return (
        <div className="flex-1 min-w-0">
          <div className="text-body-sm text-primary truncate">{hit.name}{hit.company ? ` · ${hit.company}` : ''}</div>
          <div className="text-caption text-foreground-muted truncate">Client · {hit.email}</div>
        </div>
      );
    case 'expense':
      return (
        <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-body-sm text-primary truncate">{hit.vendor}</div>
            <div className="text-caption text-foreground-muted truncate">Expense · {hit.category} · {hit.expense_date}</div>
          </div>
          <span className="font-mono text-body-sm text-primary shrink-0">{formatMoney(hit.amount)}</span>
        </div>
      );
    case 'property':
      return (
        <div className="flex-1 min-w-0">
          <div className="text-body-sm text-primary truncate">{hit.name}</div>
          <div className="text-caption text-foreground-muted truncate">
            Property · {hit.status}{hit.address ? ` · ${hit.address}` : ''}
          </div>
        </div>
      );
  }
}
