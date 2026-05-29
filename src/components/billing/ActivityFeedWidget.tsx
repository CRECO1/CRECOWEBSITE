'use client';

/**
 * Recent activity feed for the /billing dashboard. Shows the last 10
 * audit entries with a click-through link to the affected entity.
 *
 * Full forensic view lives at /billing/activity — this widget is for
 * the morning glance ("what did I change yesterday, did the cron run").
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { History, ArrowRight, FileText, Receipt, Users, Building2, FileBadge, Repeat, Undo2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  describeActivity, formatRelativeTime, logActivity,
  type ActivityLogEntry, type ActivityEntityType,
} from '@/lib/activity-log';
import { useToast } from '@/components/billing/Toast';

const ENTITY_ICON: Record<ActivityEntityType, React.ReactNode> = {
  invoice:             <FileText className="h-3.5 w-3.5" />,
  expense:             <Receipt className="h-3.5 w-3.5" />,
  client:              <Users className="h-3.5 w-3.5" />,
  property:            <Building2 className="h-3.5 w-3.5" />,
  contractor:          <FileBadge className="h-3.5 w-3.5" />,
  recurring_template:  <Repeat className="h-3.5 w-3.5" />,
};

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

export function ActivityFeedWidget({ limit = 10 }: { limit?: number }) {
  const [entries, setEntries] = useState<ActivityLogEntry[] | null>(null);
  const toast = useToast();

  async function load() {
    const { data } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    setEntries((data ?? []) as ActivityLogEntry[]);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (cancelled) return;
      setEntries((data ?? []) as ActivityLogEntry[]);
    })();
    return () => { cancelled = true; };
  }, [limit]);

  /**
   * Restore from feed. Currently supports invoice + property soft-deletes
   * (the only entities with deleted_at columns + restore semantics). The
   * helper is centralized here so the dashboard feed + the full
   * /billing/activity page can share the same code via prop drilling.
   */
  async function handleRestore(e: ActivityLogEntry) {
    if (e.action !== 'deleted') return;
    const table = e.entity_type === 'invoice' ? 'invoices'
                : e.entity_type === 'property' ? 'properties'
                : null;
    if (!table) return;
    const { error } = await supabase
      .from(table)
      .update({ deleted_at: null })
      .eq('id', e.entity_id);
    if (error) {
      toast.show({ message: `Restore failed: ${error.message}` });
      return;
    }
    logActivity({
      action: 'restored',
      entity_type: e.entity_type,
      entity_id: e.entity_id,
      entity_label: e.entity_label,
      diff: { via: 'feed_restore' },
    });
    toast.show({ message: `Restored ${e.entity_type} ${e.entity_label ?? ''}.` });
    await load();
  }

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-heading text-body font-bold text-primary inline-flex items-center gap-2">
          <History className="h-4 w-4 text-gold" /> Recent activity
        </h2>
        <Link href="/billing/activity" className="text-caption text-gold-dark hover:text-gold inline-flex items-center gap-1">
          See all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {entries === null ? (
        <p className="text-caption text-foreground-muted">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-caption text-foreground-muted">
          No activity logged yet. Actions you take on invoices, expenses, and clients will appear here.
        </p>
      ) : (
        <ul className="divide-y divide-border -mx-1">
          {entries.map(e => {
            const canRestore = e.action === 'deleted'
              && (e.entity_type === 'invoice' || e.entity_type === 'property');
            return (
            <li key={e.id} className="px-1 py-2 flex items-start gap-2">
              <Link
                href={entityHref(e)}
                className="flex items-start gap-2.5 group flex-1 min-w-0"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold/10 text-gold-dark shrink-0 mt-0.5">
                  {ENTITY_ICON[e.entity_type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-primary group-hover:text-gold-dark transition-colors truncate">
                    {describeActivity(e)}
                  </p>
                  <p className="text-caption text-foreground-muted">
                    {e.actor_email ?? 'system'} · {formatRelativeTime(e.created_at)}
                  </p>
                </div>
              </Link>
              {canRestore && (
                <button
                  type="button"
                  onClick={() => handleRestore(e)}
                  title="Restore from trash"
                  className="inline-flex items-center gap-1 rounded-md border border-gold/40 bg-gold/5 px-2 py-0.5 text-caption font-semibold text-gold-dark hover:bg-gold/10 shrink-0 mt-0.5"
                >
                  <Undo2 className="h-3 w-3" /> Restore
                </button>
              )}
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
