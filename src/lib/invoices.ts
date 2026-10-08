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
  /** Optional CC copied when this invoice is emailed (pre-fills the Compose modal). */
  cc_email?: string | null;

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
  /** Sum of credit notes applied to this invoice (migration 0047). Reduces
   *  the balance due alongside payments; maintained by the recalc trigger. */
  credited_amount: number | null;

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

/**
 * Normalize whatever a DB/driver hands back for a date column to a
 * YYYY-MM-DD string. Handles ISO date strings, full ISO timestamps,
 * JS Date objects (pg returns these for `date` columns) and
 * "YYYY-MM-DD HH:MM:SS". Returns null if unparseable.
 */
export function toIsoDay(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (v instanceof Date) {
    if (isNaN(v.getTime())) return null;
    // pg builds `date` Dates at local midnight — use local parts.
    const p = (n: number) => String(n).padStart(2, '0');
    return `${v.getFullYear()}-${p(v.getMonth() + 1)}-${p(v.getDate())}`;
  }
  const m = String(v).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : toIsoDay(d);
}

/** "Apr 15, 2026" — used in lists, the PDF and invoice emails. */
export function formatDate(iso: string | Date | null | undefined): string {
  const day = toIsoDay(iso);
  if (!day) return '—';
  return new Date(day + 'T12:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC',
  });
}

/**
 * "Is this invoice past due as of today?" Used to mark sent invoices as
 * overdue on the fly without needing a cron job — the list view computes
 * effective status from `status` + `due_date`.
 */
export function effectiveStatus(invoice: Pick<Invoice, 'status' | 'due_date'>): InvoiceStatus {
  if (invoice.status === 'sent') {
    const due = new Date((toIsoDay(invoice.due_date) ?? '') + 'T23:59:59Z');
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
export function balanceDue(inv: Pick<Invoice, 'total' | 'paid_amount' | 'credited_amount'>): number {
  return round2(Number(inv.total) - Number(inv.paid_amount ?? 0) - Number(inv.credited_amount ?? 0));
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
  /** The full Resend payload (kept by the webhook). Opens carry data.open.{ipAddress,userAgent}. */
  raw?: {
    data?: {
      open?: { ipAddress?: string; userAgent?: string };
      click?: { ipAddress?: string; userAgent?: string };
      headers?: { name: string; value: string }[];
    };
  } | null;
}

/** A human-signal event from the public invoice page: the recipient viewed it, downloaded the PDF, or clicked Pay online. */
export interface InvoiceView {
  id: string;
  invoice_id: string;
  recipient_email: string | null;
  role: 'to' | 'cc' | null;
  kind: 'view' | 'pdf' | 'pay_click';
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Whether an "opened" event is probably a machine rather than a person. The tracking pixel fires for mail
 * security scanners and Apple's Mail Privacy Protection too, so an open is only weak evidence. This is a
 * guess from the evidence we have — a confirmed "viewed online" always outranks it:
 *   • Apple Mail Privacy Protection fetches images via Apple's 17.x.x.x network
 *   • known security-scanner user agents
 *   • opened within ~20 s of delivery (people rarely read an invoice that fast; scanners do)
 */
export function openLooksAutomated(ev: InvoiceEmailEvent, deliveredAtMs: number | null): string | null {
  if (ev.event_type !== 'email.opened') return null;
  const ua = ev.user_agent ?? ev.raw?.data?.open?.userAgent ?? '';
  const ip = ev.ip_address ?? ev.raw?.data?.open?.ipAddress ?? '';
  if (/^17\./.test(ip)) return "Apple's privacy proxy";
  if (/barracuda|proofpoint|mimecast|symantec|messagelabs|safelinks|defender|scanner|headless/i.test(ua)) return 'a mail security scanner';
  if (deliveredAtMs != null && new Date(ev.occurred_at).getTime() - deliveredAtMs < 20_000) return 'opened within seconds of delivery';
  return null;
}

/** Where an open/click came from, in plain words ("Gmail image proxy", "Chrome on Windows"). */
export function describeEventSource(ev: InvoiceEmailEvent): string | null {
  const ua = ev.user_agent ?? ev.raw?.data?.open?.userAgent ?? ev.raw?.data?.click?.userAgent ?? '';
  if (!ua) return null;
  if (/GoogleImageProxy/i.test(ua)) return 'Gmail (image proxy)';
  if (/YahooMailProxy/i.test(ua)) return 'Yahoo Mail (image proxy)';
  const os = /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : /Windows/i.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : null;
  const browser = /Edg\//i.test(ua) ? 'Edge' : /Firefox\//i.test(ua) ? 'Firefox' : /Chrome\//i.test(ua) ? 'Chrome' : /Safari\//i.test(ua) ? 'Safari' : null;
  return [browser, os && `on ${os}`].filter(Boolean).join(' ') || 'Unknown device';
}

/** Whether this event's recipient was on To or Cc (read from the stored headers). */
export function recipientRole(ev: InvoiceEmailEvent): 'cc' | 'to' {
  const cc = ev.raw?.data?.headers?.find(h => h.name.toLowerCase() === 'cc')?.value ?? '';
  return ev.recipient_email && cc.toLowerCase().includes(ev.recipient_email.toLowerCase()) ? 'cc' : 'to';
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
