/**
 * Invoice shared types + math helpers.
 *
 * Money is stored in the DB as numeric(12,2). All math here is done with
 * JavaScript numbers — fine for two-decimal currency at single-invoice
 * scale, but every result is rounded to 2 decimals before display or
 * persistence so we never write 19.999999999 into the DB.
 */

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'void' | 'partial';

export interface InvoiceLineItem {
  id?: string;
  invoice_id?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  sort_order: number;
  /** True when the line was auto-added by the late-fee cron. We use this
   *  flag to avoid double-adding on the same day and to keep late fees
   *  visually distinct on the invoice + reports. */
  is_late_fee?: boolean;
}

/** Late-fee config lives on the singleton row in invoice_settings. */
export interface LateFeeSettings {
  late_fee_enabled: boolean;
  late_fee_type: 'percent' | 'flat';
  /** Decimal — 0.05 = 5% for percent type, dollars for flat type. */
  late_fee_amount: number;
  /** Days after due_date before the first fee is added. */
  late_fee_days: number;
  /** When true, add another fee every N days; otherwise one-shot. */
  late_fee_recurring: boolean;
}

export interface Invoice {
  id: string;
  /** Multi-tenancy: workspace this invoice belongs to. Required on every
   *  insert; populated server-side from requireWorkspaceAdmin() or
   *  client-side from useWorkspace(). RLS gates reads/writes per workspace. */
  workspace_id: string;
  invoice_number: string;

  client_name: string;
  client_email: string;
  client_company: string | null;
  client_address: string | null;

  issue_date: string;          // ISO date, YYYY-MM-DD
  due_date: string;            // ISO date

  status: InvoiceStatus;

  subtotal: number;
  tax_rate: number;            // 0.0825 = 8.25%
  tax_amount: number;
  total: number;

  property_reference: string | null;
  /** Optional FK to properties.id for property-level P&L. Falls back to
   *  property_reference (text) when null. */
  property_id?: string | null;
  /** Soft-delete timestamp. List queries filter on `IS NULL`. */
  deleted_at?: string | null;
  notes: string | null;
  internal_notes: string | null;

  stripe_payment_link_url: string | null;
  payment_terms: string | null;

  // Per-invoice opt-out for the auto-reminder cron (defaults to true)
  reminders_enabled?: boolean;

  // Per-invoice email overrides — null means "render from global template
  // at send time". Set when the admin customizes the email for a specific
  // client.
  email_subject?: string | null;
  email_message?: string | null;

  sent_at: string | null;
  paid_at: string | null;
  paid_amount: number | null;
  paid_method: string | null;

  /** Set when the invoice was generated from a recurring template (or
   *  when the operator chose Repeat on the create-invoice form). Lets
   *  the detail page show a "Recurring" badge that links to the template. */
  recurring_template_id?: string | null;

  // ── Open tracking (populated by Resend webhook) ─────────────────────
  /** Resend message_id from the most recent send. The webhook uses
   *  this to correlate opened/clicked/bounced events back to the row. */
  last_email_message_id?: string | null;
  /** First time the recipient opened the email (any send). */
  first_opened_at?: string | null;
  /** Most recent open event. */
  last_opened_at?: string | null;
  /** Total open events ever recorded for this invoice. */
  open_count?: number;

  created_at: string;
  updated_at: string;

  // Joined in by the API when relevant
  line_items?: InvoiceLineItem[];
}

/** Round to 2 decimals deterministically (avoids -0 and Math.round bias). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Compute a single line's amount from quantity * rate. */
export function lineAmount(item: { quantity: number; rate: number }): number {
  return round2((item.quantity || 0) * (item.rate || 0));
}

/**
 * Given a list of line items and a tax rate (e.g. 0.0825), return the three
 * totals to persist on the invoice row: subtotal, tax_amount, total.
 */
export function calculateTotals(
  items: { quantity: number; rate: number }[],
  taxRate: number,
): { subtotal: number; tax_amount: number; total: number } {
  const subtotal = round2(items.reduce((sum, it) => sum + lineAmount(it), 0));
  const tax_amount = round2(subtotal * (taxRate || 0));
  const total = round2(subtotal + tax_amount);
  return { subtotal, tax_amount, total };
}

/** Currency formatter — uses USD by default. */
const usdFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(n: number | null | undefined): string {
  if (n == null) return '—';
  return usdFmt.format(n);
}

/** Tax rate display: 0.0825 → "8.25%". */
export function formatTaxRate(rate: number | null | undefined): string {
  if (!rate) return '0%';
  return `${(rate * 100).toFixed(rate * 100 < 10 ? 3 : 2).replace(/\.?0+$/, '')}%`;
}

/** "Apr 15, 2026" — used in lists and on the PDF. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

/**
 * "Is this invoice past due as of today?" Used to mark sent invoices as
 * overdue on the fly without needing a cron job — the list view computes
 * effective status from `status` + `due_date`.
 */
export function effectiveStatus(invoice: Pick<Invoice, 'status' | 'due_date'>): InvoiceStatus {
  if (invoice.status === 'sent') {
    const due = new Date(invoice.due_date + 'T23:59:59Z');
    if (Date.now() > due.getTime()) return 'overdue';
  }
  return invoice.status;
}

/**
 * Amount still owed on an invoice = total − payments applied. Use this
 * anywhere "outstanding" matters (AR aging, portal, list, dashboards) so a
 * partially paid invoice contributes only its remaining balance, not the
 * full total.
 */
export function balanceDue(inv: Pick<Invoice, 'total' | 'paid_amount'>): number {
  return round2(Number(inv.total) - Number(inv.paid_amount ?? 0));
}

/** Statuses that still owe money (contribute to AR / outstanding totals). */
export function isOutstanding(status: InvoiceStatus): boolean {
  return status === 'sent' || status === 'overdue' || status === 'partial';
}

/**
 * Generate the next invoice number. Format: "INV-YYYY-####" where #### is
 * derived from the count of existing invoices in the current year + 1001.
 * Caller passes the count it already queried.
 */
export function nextInvoiceNumber(yearCount: number, year: number = new Date().getFullYear()): string {
  const seq = (1001 + yearCount).toString();
  return `INV-${year}-${seq}`;
}

/**
 * One row per webhook event from Resend (delivered, opened, clicked,
 * bounced, complained). Powers the activity timeline on the invoice
 * detail page.
 */
export interface InvoiceEmailEvent {
  id: string;
  invoice_id: string;
  message_id: string;
  event_type: string;          // 'email.opened' | 'email.delivered' | etc.
  occurred_at: string;
  recipient_email: string | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

/** Color classes for status badges. Keeps the admin list legible at a glance. */
export const STATUS_STYLES: Record<InvoiceStatus, { label: string; className: string }> = {
  draft:   { label: 'Draft',   className: 'bg-gray-100 text-gray-700 border-gray-200' },
  sent:    { label: 'Sent',    className: 'bg-blue-100 text-blue-800 border-blue-200' },
  paid:    { label: 'Paid',    className: 'bg-green-100 text-green-800 border-green-200' },
  partial: { label: 'Partial', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  overdue: { label: 'Overdue', className: 'bg-red-100 text-red-800 border-red-200' },
  void:    { label: 'Void',    className: 'bg-gray-50 text-gray-400 border-gray-200 line-through' },
};
