'use client';

/**
 * /billing/activity — full audit trail across invoices, expenses,
 * clients, properties, contractors, and recurring templates.
 *
 * Filter strip: by entity type. The default is "All". Click any row
 * to navigate to the affected entity's detail page.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, History, Filter,
  FileText, Receipt, Users, Building2, FileBadge, Repeat,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  describeActivity, formatRelativeTime,
  type ActivityLogEntry, type ActivityEntityType,
} from '@/lib/activity-log';

const ENTITY_ICON: Record<ActivityEntityType, React.ReactNode> = {
  invoice:             <FileText className="h-3.5 w-3.5" />,
  expense:             <Receipt className="h-3.5 w-3.5" />,
  client:              <Users className="h-3.5 w-3.5" />,
  property:            <Building2 className="h-3.5 w-3.5" />,
  contractor:          <FileBadge className="h-3.5 w-3.5" />,
  recurring_template:  <Repeat className="h-3.5 w-3.5" />,
};

const FILTERS: { label: string; value: 'all' | ActivityEntityType }[] = [
  { label: 'All',          value: 'all' },
  { label: 'Invoices',     value: 'invoice' },
  { label: 'Expenses',     value: 'expense' },
  { label: 'Clients',      value: 'client' },
  { label: 'Properties',   value: 'property' },
  { label: 'Contractors',  value: 'contractor' },
  { label: 'Recurring',    value: 'recurring_template' },
];

function entityHref(entry: Pick<ActivityLogEntry, 'entity_type' | 'entity_id'>): string {
  switch (entry.entity_type) {
    case 'invoice':            return `/billing/invoices/${entry.entity_id}`;
    case 'expense':            return `/billing/expenses/${entry.entity_id}`;
    case 'client':             return `/billing/clients/${entry.entity_id}`;
    case 'property':           return `/billing/properties/${entry.entity_id}`;
    case 'contractor':         return `/billing/contractors/${entry.entity_id}`;
    case 'recurring_template': return `/billing/recurring/${entry.entity_id}`;
  }
}

export default function ActivityLogPage() {
  const [entries, setEntries] = useState<ActivityLogEntry[] | null>(null);
  const [filter, setFilter] = useState<'all' | ActivityEntityType>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (cancelled) return;
      setEntries((data ?? []) as ActivityLogEntry[]);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => (entries ?? []).filter(e => filter === 'all' || e.entity_type === filter),
    [entries, filter],
  );

  return (
    <main className="min-h-screen bg-background-cream pb-20">
      <header className="border-b border-border bg-white">
        <div className="mx-auto max-w-4xl pl-16 pr-6 lg:px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/billing" className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Billing
            </Link>
            <span className="text-foreground-muted">/</span>
            <h1 className="font-heading text-heading-md font-bold text-primary flex items-center gap-2">
              <History className="h-5 w-5 text-gold" /> Activity log
            </h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <section className="flex items-center gap-2 flex-wrap">
          <span className="text-caption uppercase tracking-widest text-foreground-muted mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filter
          </span>
          {FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${
                filter === f.value
                  ? 'bg-primary border-primary text-white'
                  : 'bg-white border-border text-foreground-muted hover:border-primary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </section>

        <section className="rounded-xl border border-border bg-white overflow-hidden">
          {entries === null ? (
            <div className="p-12 text-center text-foreground-muted">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <History className="mx-auto h-10 w-10 text-foreground-subtle mb-3" />
              <p className="text-body-sm text-foreground-muted">
                {entries.length === 0
                  ? 'No activity yet. Actions across billing will appear here as they happen.'
                  : 'No activity matches this filter.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map(e => (
                <li key={e.id}>
                  <Link
                    href={entityHref(e)}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-background-cream/40 transition-colors"
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gold/10 text-gold-dark shrink-0 mt-0.5">
                      {ENTITY_ICON[e.entity_type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm text-primary">{describeActivity(e)}</p>
                      <p className="text-caption text-foreground-muted">
                        {e.actor_email ?? 'system'} · {formatRelativeTime(e.created_at)} · {new Date(e.created_at).toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
