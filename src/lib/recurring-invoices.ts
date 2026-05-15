/**
 * Recurring invoice templates — types + helpers.
 *
 * A template is the "shape" of an invoice that gets sent on a schedule —
 * client info, line items, tax rate. The monthly cron at
 * /api/cron/recurring-invoices reads templates where `next_run_date <= today`,
 * clones each one into a new invoice (draft or auto-sent based on the
 * template config), advances next_run_date by the frequency, and saves
 * the new invoice ID on the template for traceability.
 */

import type { InvoiceLineItem } from './invoices';

export type RecurringFrequency = 'monthly' | 'quarterly' | 'annually';
export type RecurringOnGenerate = 'draft' | 'send_immediately';

export interface RecurringTemplate {
  id: string;
  name: string;

  /** Link to a reusable clients row when present. Snapshot fields below
   *  still carry the historical client info so a deleted clients row
   *  doesn't break the template. */
  client_id?: string | null;
  client_name: string;
  client_email: string;
  client_company: string | null;
  client_address: string | null;
  property_reference: string | null;

  tax_rate: number;
  payment_terms: string | null;
  notes: string | null;
  internal_notes: string | null;

  frequency: RecurringFrequency;
  next_run_date: string;          // YYYY-MM-DD
  end_date: string | null;
  on_generate: RecurringOnGenerate;
  due_days: number;

  active: boolean;
  last_run_at: string | null;
  last_run_invoice_id: string | null;

  created_at: string;
  updated_at: string;

  // Joined in when needed
  line_items?: RecurringLineItem[];
}

export interface RecurringLineItem extends Omit<InvoiceLineItem, 'invoice_id'> {
  template_id?: string;
}

export const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  monthly:   'Monthly',
  quarterly: 'Quarterly',
  annually:  'Annually',
};

export const ON_GENERATE_LABELS: Record<RecurringOnGenerate, string> = {
  draft:            "Create as draft (I'll review + send)",
  send_immediately: 'Send automatically on generation date',
};

/**
 * Advance a YYYY-MM-DD date by one cycle of the given frequency. Used by the
 * cron to set the next run date after generating an invoice.
 *
 * "End of month" gotcha: if you start on Jan 31 monthly, the next run becomes
 * Feb 28 (or 29) — JS Date already handles this by virtue of overflowing day
 * arithmetic, but we want the LAST day of the month, not "March 3" from the
 * Feb 31 overflow. We clamp manually.
 */
export function advanceNextRun(dateIso: string, frequency: RecurringFrequency): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));

  if (frequency === 'monthly') {
    // Move to first of next month, then add (d - 1) days clamped to month end
    const nextMonth = new Date(Date.UTC(y, m, 1));
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    nextMonth.setUTCDate(Math.min(d, lastDay));
    return nextMonth.toISOString().slice(0, 10);
  }
  if (frequency === 'quarterly') {
    const next = new Date(Date.UTC(y, m + 2, 1)); // 3 months later
    const lastDay = new Date(Date.UTC(y, m + 3, 0)).getUTCDate();
    next.setUTCDate(Math.min(d, lastDay));
    return next.toISOString().slice(0, 10);
  }
  // annually
  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

/** Compute the due_date for a generated invoice given an issue_date + due_days. */
export function computeDueDate(issueDateIso: string, dueDays: number): string {
  const [y, m, d] = issueDateIso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + dueDays);
  return date.toISOString().slice(0, 10);
}
