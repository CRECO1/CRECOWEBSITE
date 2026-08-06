/**
 * Billing reports — pure computation over invoices + expenses.
 *
 * Kept dependency-free (no Supabase, no React) so the same module powers
 * the dashboard tiles, the A/R aging page, the P&L page, and the 1099 export.
 * Callers fetch the raw rows and feed them in.
 *
 * All money math goes through src/lib/invoices.ts:round2 so totals are
 * deterministic to the penny.
 */

import { effectiveStatus, round2, isOutstanding, balanceDue, type Invoice } from './invoices';
import type { Expense } from './expenses';

// ── A/R aging ───────────────────────────────────────────────────────────────

export type ArBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';

export interface ArAgingRow {
  invoice: Invoice;
  bucket: ArBucket;
  /** Days past due — negative when not yet due (so we can still sort). */
  days_overdue: number;
}

export interface ArAgingSummary {
  current: number;    // Sent, not yet past due
  '1-30': number;
  '31-60': number;
  '61-90': number;
  '90+': number;
  total_outstanding: number;
  total_overdue: number; // sum of 1-30 + 31-60 + 61-90 + 90+
}

/** Days from due_date to today (today positive = overdue). */
export function daysOverdue(dueDateIso: string, asOf: Date = new Date()): number {
  // Compare at end-of-day on the due date so an invoice due "today" is
  // not yet overdue — matches effectiveStatus().
  const due = new Date(dueDateIso + 'T23:59:59Z').getTime();
  const ms = asOf.getTime() - due;
  return Math.floor(ms / 86_400_000);
}

export function bucketFor(daysOverdueValue: number): ArBucket {
  if (daysOverdueValue <= 0)  return 'current';
  if (daysOverdueValue <= 30) return '1-30';
  if (daysOverdueValue <= 60) return '31-60';
  if (daysOverdueValue <= 90) return '61-90';
  return '90+';
}

/**
 * Build the A/R aging rows from a list of invoices. Filters to outstanding
 * (sent + overdue), excludes drafts/paid/void. Sorted by most overdue first.
 */
export function computeArAging(invoices: Invoice[], asOf: Date = new Date()): {
  rows: ArAgingRow[];
  summary: ArAgingSummary;
} {
  const rows: ArAgingRow[] = [];
  const sum: ArAgingSummary = {
    current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0,
    total_outstanding: 0, total_overdue: 0,
  };

  for (const inv of invoices) {
    const eff = effectiveStatus(inv);
    if (!isOutstanding(eff)) continue;
    const dOver = daysOverdue(inv.due_date, asOf);
    const bucket = bucketFor(dOver);
    rows.push({ invoice: inv, bucket, days_overdue: dOver });
    // Age the remaining balance, not the full total, so a partially paid
    // invoice contributes only what's still owed.
    const amt = balanceDue(inv);
    sum[bucket] = round2(sum[bucket] + amt);
    sum.total_outstanding = round2(sum.total_outstanding + amt);
    if (bucket !== 'current') {
      sum.total_overdue = round2(sum.total_overdue + amt);
    }
  }

  rows.sort((a, b) => b.days_overdue - a.days_overdue);
  return { rows, summary: sum };
}

export const BUCKET_LABELS: Record<ArBucket, string> = {
  current:  'Current (not yet due)',
  '1-30':   '1–30 days overdue',
  '31-60':  '31–60 days overdue',
  '61-90':  '61–90 days overdue',
  '90+':    '90+ days overdue',
};

export const BUCKET_STYLES: Record<ArBucket, string> = {
  current:  'bg-blue-50 text-blue-800 border-blue-200',
  '1-30':   'bg-amber-50 text-amber-900 border-amber-200',
  '31-60':  'bg-orange-50 text-orange-900 border-orange-200',
  '61-90':  'bg-red-50 text-red-900 border-red-200',
  '90+':    'bg-red-100 text-red-950 border-red-300 font-bold',
};


// ── P&L ────────────────────────────────────────────────────────────────────

export interface PlSummary {
  /** Revenue is *cash basis* — sum of paid invoices' paid_amount (or total). */
  revenue: number;
  /** Expenses paid in the period. */
  expenses_total: number;
  /** Revenue minus expenses. */
  net_income: number;
  /** Revenue grouped by month (YYYY-MM keys), useful for trend charts. */
  revenue_by_month: Record<string, number>;
  /** Expenses grouped by category. */
  expenses_by_category: Record<string, number>;
  /** Expenses grouped by month + category, for stacked-bar charts. */
  expenses_by_month_category: Record<string, Record<string, number>>;
  /** Counts for context. */
  invoice_count: number;
  expense_count: number;
}

export interface PlDateRange {
  start: string;  // YYYY-MM-DD inclusive
  end: string;    // YYYY-MM-DD inclusive
}

/** Default range = current calendar year. */
export function currentYearRange(now: Date = new Date()): PlDateRange {
  const year = now.getUTCFullYear();
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

/** Last 12 months (rolling). */
export function trailing12MonthsRange(now: Date = new Date()): PlDateRange {
  const end = now.toISOString().slice(0, 10);
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  return { start: startDate.toISOString().slice(0, 10), end };
}

function isoMonthKey(iso: string): string {
  return iso.slice(0, 7);                  // 'YYYY-MM'
}

function inRange(iso: string, r: PlDateRange): boolean {
  return iso >= r.start && iso <= r.end;
}

/**
 * Compute P&L for the given range. Revenue is cash-basis (counts when paid).
 * Expenses are recorded by `expense_date`. Pass already-filtered or full
 * lists — the function re-filters by the range either way.
 */
export function computePl(
  invoices: Invoice[],
  expenses: Expense[],
  range: PlDateRange,
): PlSummary {
  let revenue = 0;
  let invoice_count = 0;
  const revenue_by_month: Record<string, number> = {};

  for (const inv of invoices) {
    if (inv.status !== 'paid' || !inv.paid_at) continue;
    const paidIso = inv.paid_at.slice(0, 10);
    if (!inRange(paidIso, range)) continue;
    const amt = Number(inv.paid_amount ?? inv.total);
    revenue = round2(revenue + amt);
    invoice_count++;
    const k = isoMonthKey(paidIso);
    revenue_by_month[k] = round2((revenue_by_month[k] ?? 0) + amt);
  }

  let expenses_total = 0;
  let expense_count = 0;
  const expenses_by_category: Record<string, number> = {};
  const expenses_by_month_category: Record<string, Record<string, number>> = {};

  for (const e of expenses) {
    if (!inRange(e.expense_date, range)) continue;
    const amt = Number(e.amount);
    expenses_total = round2(expenses_total + amt);
    expense_count++;
    expenses_by_category[e.category] = round2((expenses_by_category[e.category] ?? 0) + amt);
    const mk = isoMonthKey(e.expense_date);
    if (!expenses_by_month_category[mk]) expenses_by_month_category[mk] = {};
    expenses_by_month_category[mk][e.category] = round2(
      (expenses_by_month_category[mk][e.category] ?? 0) + amt,
    );
  }

  return {
    revenue,
    expenses_total,
    net_income: round2(revenue - expenses_total),
    revenue_by_month,
    expenses_by_category,
    expenses_by_month_category,
    invoice_count,
    expense_count,
  };
}

/** Sort a categories-totals dict by amount descending; useful for tables. */
export function sortCategoriesByAmount(
  byCategory: Record<string, number>,
): { category: string; total: number }[] {
  return Object.entries(byCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}


// ── 1099 ───────────────────────────────────────────────────────────────────

export interface ContractorAggregate {
  contractor_id: string;
  legal_name: string;
  display_name: string | null;
  tax_id: string | null;
  total_paid: number;
  expense_count: number;
  meets_threshold: boolean;     // >= $600 in calendar year
}

/**
 * Roll up 1099-eligible expenses by contractor for the given year. Returns
 * the list sorted by amount descending so the highest-paid contractors are
 * front and center on the export page.
 */
export function compute1099(
  expenses: Expense[],
  contractors: { id: string; legal_name: string; display_name: string | null; tax_id: string | null }[],
  year: number,
  threshold: number = 600,
): ContractorAggregate[] {
  const byId: Record<string, ContractorAggregate> = {};
  const yearStr = String(year);
  for (const c of contractors) {
    byId[c.id] = {
      contractor_id: c.id,
      legal_name: c.legal_name,
      display_name: c.display_name,
      tax_id: c.tax_id,
      total_paid: 0,
      expense_count: 0,
      meets_threshold: false,
    };
  }
  for (const e of expenses) {
    if (!e.is_1099_eligible || !e.contractor_id) continue;
    if (!e.expense_date.startsWith(yearStr)) continue;
    const agg = byId[e.contractor_id];
    if (!agg) continue;                     // contractor deleted; skip
    agg.total_paid = round2(agg.total_paid + Number(e.amount));
    agg.expense_count++;
  }
  for (const id of Object.keys(byId)) {
    byId[id].meets_threshold = byId[id].total_paid >= threshold;
  }
  return Object.values(byId)
    .filter(a => a.expense_count > 0)        // hide untouched contractors
    .sort((a, b) => b.total_paid - a.total_paid);
}

/**
 * RFC 4180 CSV-quote a cell + neuter spreadsheet formula injection.
 *
 * Excel / Google Sheets / Numbers treat any cell starting with `=`, `+`,
 * `-`, `@`, or a tab as a formula. A contractor named `=cmd|'/c...'` or
 * an invoice client field `@SUM(...)` would execute on open. We prefix
 * those leading chars with `'` so the spreadsheet renders the literal
 * text instead.
 *
 * Shared by every CSV export on the site — call it from anywhere user-
 * controlled text might end up in a .csv download.
 */
export function csvCell(v: string | number | null | boolean | undefined): string {
  if (v === null || v === undefined) return '';
  let s = String(v);
  // Neutralize formula injection — leading =, +, -, @, or tab/CR/LF
  if (/^[=+\-@\t\r\n]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** CSV builder for the year-end 1099 export. RFC 4180 quoting + formula safety. */
export function build1099Csv(rows: ContractorAggregate[], year: number): string {
  const header = [
    'Tax Year',
    'Legal Name',
    'Display Name',
    'Tax ID',
    'Total Paid',
    'Meets $600 Threshold',
    'Expense Count',
  ];
  const lines = [
    header.map(csvCell).join(','),
    ...rows.map(r => [
      year,
      r.legal_name,
      r.display_name ?? '',
      r.tax_id ?? '',
      r.total_paid.toFixed(2),
      r.meets_threshold ? 'YES' : 'no',
      r.expense_count,
    ].map(csvCell).join(',')),
  ];
  return lines.join('\r\n');
}
