/**
 * Shared invoice-email sender.
 *
 * Used by both `/api/invoices/[id]/send` (manual admin-triggered send) and
 * `/api/cron/invoice-reminders` (automated payment reminders). Renders the
 * branded HTML body, attaches the rendered PDF, fires through Resend, and
 * returns the Resend message ID for downstream logging.
 *
 * Does NOT touch the database — callers are responsible for marking the
 * invoice as sent / logging the reminder row. This keeps the helper pure.
 */

import { Resend } from 'resend';
import { renderInvoicePdf } from './invoice-pdf';
import type { Invoice } from './invoices';
import { buildInvoiceEmailHtml } from './invoice-email-html';

export interface SendInvoiceOptions {
  invoice: Invoice;
  /** Subject line — already substituted, ready to ship. */
  subject: string;
  /** Personal-message body — appears above the auto-generated summary. */
  message: string;
  /** Optional CC recipient. */
  cc?: string;
  /** Optional Reply-To override. Defaults to LEAD_NOTIFICATION_EMAIL. */
  replyTo?: string;
  /**
   * Optional secondary attachments. The invoice PDF is always sent;
   * additional files (W-9 today, possibly contractor docs in the future)
   * land here so the helper stays unaware of which side files happen to
   * be in scope for a given workspace.
   */
  extraAttachments?: { filename: string; content: Buffer }[];
}

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

/**
 * Render + send. Throws on Resend failure so the caller can decide whether
 * to log the failure / retry / surface to the admin.
 *
 * Returns the Resend message ID — store it on the reminder/lead row for
 * cross-reference with the Resend dashboard (open/click stats, bounces).
 */
export async function sendInvoiceEmail(opts: SendInvoiceOptions): Promise<string | undefined> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  const { invoice, subject, message, cc, replyTo, extraAttachments } = opts;

  const pdf = await renderInvoicePdf(invoice);
  const pdfBuffer = Buffer.from(pdf);

  // Body HTML is rendered by the shared builder so the live preview on
  // /billing/invoices/new is guaranteed to match what we ship.
  const html = buildInvoiceEmailHtml({ invoice, message });

  // Invoice PDF is always first; extras (W-9, etc.) tail behind. Most
  // email clients show attachments in the order they're listed, so the
  // invoice itself stays the visually-primary file.
  const attachments = [
    { filename: `${invoice.invoice_number}.pdf`, content: pdfBuffer },
    ...(extraAttachments ?? []),
  ];

  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: getFromEmail(),
    to: invoice.client_email,
    cc: cc ? [cc] : undefined,
    replyTo: replyTo ?? process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com',
    subject,
    html,
    attachments,
  });

  if (result.error) {
    throw new Error(result.error.message ?? 'Resend rejected the send');
  }
  return result.data?.id;
}
