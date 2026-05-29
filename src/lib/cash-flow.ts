/**
 * Cash-flow forecasting. Aggregates expected cash in (outstanding
 * invoices + recurring template generations) over rolling 30/60/90
 * day windows. The operator answers "can I afford that $3K contractor
 * payment on the 15th?" without spreadsheeting.
 *
 * Scope notes:
 *   - We forecast INCOME only. Forecasting outflows requires recurring
 *     EXPENSE templates (not in the current schema). When we add that
 *     in the future, this module is the place to extend.
 *   - Outstanding invoices' due_date is the forecast pin — we assume
 *     the client pays on time. Historical-payment-velocity tuning
 *     could land later (Wave does this — "this client averages 14 days
 *     late") but for MVP, due_date is the model.
 *   - Recurring templates project forward at their next_run_date, then
 *     stepping by frequency. We honor end_date when set.
 */

import type { Invoice } from '@/lib/invoices';

interface RecurringTemplateLite {
  id: string;
  next_run_date: string;     // YYYY-MM-DD
  end_date: string | null;
  frequency: 'monthly' | 'quarterly' | 'annually';
  due_days: number;
  /** Best estimate of the total per generation — sum of line items at
   *  the template level, computed by the caller. */
  estimated_total: number;
  active: boolean;
}

export interface CashFlowForecast {
  /** Expected gross cash in the next N days. */
  in_30: number;
  in_60: number;
  in_90: number;
  /** Breakdown — useful for showing the "behind the number" detail. */
  outstanding_30: number;
  recurring_30: number;
  outstanding_60: number;
  recurring_60: number;
  outstanding_90: number;
  recurring_90: number;
}

/**
 * Build a forecast from the current snapshot of outstanding invoices +
 * recurring templates. Pure function — no DB calls, no side effects.
 * Caller fetches the data and hands it in.
 */
export function forecastCashFlow(
  outstandingInvoices: Pick<Invoice, 'total' | 'due_date' | 'paid_at' | 'status'>[],
  recurringTemplates: RecurringTemplateLite[],
  now: Date = new Date(),
): CashFlowForecast {
  const today = atMidnightUtc(now);
  const day30 = addDays(today, 30);
  const day60 = addDays(today, 60);
  const day90 = addDays(today, 90);

  let outstanding30 = 0, outstanding60 = 0, outstanding90 = 0;
  for (const inv of outstandingInvoices) {
    if (inv.paid_at) continue;
    if (inv.status === 'void' || inv.status === 'draft') continue;
    const due = atMidnightUtc(new Date(inv.due_date + 'T12:00:00Z'));
    const total = Number(inv.total);
    if (due <= day30) outstanding30 += total;
    if (due <= day60) outstanding60 += total;
    if (due <= day90) outstanding90 += total;
  }

  let recurring30 = 0, recurring60 = 0, recurring90 = 0;
  for (const tpl of recurringTemplates) {
    if (!tpl.active) continue;
    const stepDays = tpl.frequency === 'monthly' ? 30
                    : tpl.frequency === 'quarterly' ? 90
                    : 365;
    let next = atMidnightUtc(new Date(tpl.next_run_date + 'T12:00:00Z'));
    const end = tpl.end_date ? atMidnightUtc(new Date(tpl.end_date + 'T12:00:00Z')) : null;
    // Project occurrences forward through day90. Each occurrence's
    // expected cash date is the occurrence date + due_days (we assume
    // on-time payment).
    const safetyLimit = 12; // months ahead — annual frequency over 12y = 1 hit, monthly = 12; bounded loop
    let projected = 0;
    while (next <= day90 && projected < safetyLimit) {
      if (end && next > end) break;
      const expectedCash = addDays(next, tpl.due_days || 0);
      if (expectedCash <= day90) {
        if (expectedCash <= day30) recurring30 += tpl.estimated_total;
        if (expectedCash <= day60) recurring60 += tpl.estimated_total;
        recurring90 += tpl.estimated_total;
      }
      next = addDays(next, stepDays);
      projected++;
    }
  }

  return {
    outstanding_30: round2(outstanding30),
    recurring_30: round2(recurring30),
    outstanding_60: round2(outstanding60),
    recurring_60: round2(recurring60),
    outstanding_90: round2(outstanding90),
    recurring_90: round2(recurring90),
    in_30: round2(outstanding30 + recurring30),
    in_60: round2(outstanding60 + recurring60),
    in_90: round2(outstanding90 + recurring90),
  };
}

function atMidnightUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86_400_000);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
