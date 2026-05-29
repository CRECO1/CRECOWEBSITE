/**
 * Activity log helper. Append-only audit trail across invoices,
 * expenses, clients, properties, contractors, and recurring templates.
 *
 * Powers two surfaces:
 *   1. A dashboard "Recent activity" feed (last 10 actions)
 *   2. A full /billing/activity page for forensic lookups
 *
 * Logging is best-effort fire-and-forget — a failure to write to
 * activity_log must never block the underlying mutation. We log the
 * failure to console but resolve the helper anyway. The audit trail
 * is supplementary; the actual mutation is the source of truth.
 *
 * Backed by public.activity_log (migration 0027). RLS gates inserts to
 * the authenticated user and pins actor_id = auth.uid().
 */

import { supabase } from '@/lib/supabase';

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'sent'
  | 'marked_paid'
  | 'voided'
  | 'deleted'
  | 'restored'
  | 'reminder_sent'
  | 'late_fee_applied'
  | 'payment_recorded'
  | 'duplicated'
  | 'reopened';

export type ActivityEntityType =
  | 'invoice'
  | 'expense'
  | 'client'
  | 'property'
  | 'contractor'
  | 'recurring_template';

export interface ActivityLogEntry {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string;
  entity_label: string | null;
  diff: Record<string, unknown> | null;
  created_at: string;
}

interface LogParams {
  action: ActivityAction;
  entity_type: ActivityEntityType;
  entity_id: string;
  /** Friendly identifier — invoice number, client name, property name. */
  entity_label?: string | null;
  /** Optional structured payload — before/after, amount, etc. */
  diff?: Record<string, unknown> | null;
}

/**
 * Write one activity row. Resolves the current user from the Supabase
 * session client-side so the API surface is "describe the action,
 * we'll attribute it correctly".
 *
 * Best-effort: never throws. Failure paths log to console and resolve.
 */
export async function logActivity(params: LogParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('activity_log')
      .insert([{
        actor_id: user?.id ?? null,
        actor_email: user?.email ?? null,
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        entity_label: params.entity_label ?? null,
        diff: params.diff ?? null,
      }]);
    if (error) {
      console.warn('[activity-log] insert failed (non-fatal)', error.message);
    }
  } catch (err) {
    console.warn('[activity-log] unexpected error (non-fatal)', err);
  }
}

/**
 * Render a friendly verb phrase for the activity feed.
 *   logActivity({ action: 'marked_paid', entity_type: 'invoice', ... })
 *   → "marked invoice INV-001 as paid"
 */
export function describeActivity(entry: Pick<ActivityLogEntry, 'action' | 'entity_type' | 'entity_label'>): string {
  const label = entry.entity_label ?? entry.entity_type;
  switch (entry.action) {
    case 'created':         return `Created ${entry.entity_type} ${label}`;
    case 'updated':         return `Edited ${entry.entity_type} ${label}`;
    case 'sent':            return `Sent ${entry.entity_type} ${label}`;
    case 'marked_paid':     return `Marked ${label} paid`;
    case 'voided':          return `Voided ${label}`;
    case 'deleted':         return `Deleted ${entry.entity_type} ${label}`;
    case 'restored':        return `Restored ${entry.entity_type} ${label}`;
    case 'reminder_sent':   return `Sent reminder for ${label}`;
    case 'late_fee_applied':return `Applied late fee to ${label}`;
    case 'payment_recorded':return `Recorded payment on ${label}`;
    case 'duplicated':      return `Duplicated ${entry.entity_type} ${label}`;
    case 'reopened':        return `Reopened ${entry.entity_type} ${label}`;
    default:                return `${entry.action} on ${label}`;
  }
}

/**
 * Pretty-print a relative time (e.g. "5m ago", "2h ago", "3d ago"). For
 * older entries falls back to an absolute date. Used in the feed.
 */
export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
