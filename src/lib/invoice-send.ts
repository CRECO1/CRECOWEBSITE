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
import { formatMoney, formatDate, type Invoice } from './invoices';
import { escapeHtml } from './sanitize';

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

  const { invoice, subject, message, cc, replyTo } = opts;

  const pdf = await renderInvoicePdf(invoice);
  const pdfBuffer = Buffer.from(pdf);

  const payLinkBlock = invoice.stripe_payment_link_url
    ? `<p style="margin:16px 0"><a href="${escapeHtml(invoice.stripe_payment_link_url)}" style="display:inline-block;background:#1A1A1A;color:#C9A962;padding:12px 22px;border-radius:8px;font-weight:700;text-decoration:none">Pay online →</a></p>`
    : '';

  const safeTotal = escapeHtml(formatMoney(invoice.total));
  const safeDue = escapeHtml(formatDate(invoice.due_date));
  const safeNumber = escapeHtml(invoice.invoice_number);

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#1A1A1A">
      <h2 style="margin:0 0 16px;color:#1A1A1A">Invoice ${safeNumber} from CRECO</h2>

      <div style="white-space:pre-line;margin:0 0 24px;line-height:1.6">${escapeHtml(message)}</div>

      <table style="width:100%;border-collapse:collapse;margin:0 0 20px">
        <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Invoice #</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0">${safeNumber}</td></tr>
        <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Amount due</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0;font-size:18px;color:#C9A962"><strong>${safeTotal}</strong></td></tr>
        <tr><td style="padding:8px 12px;background:#FAFAF8;border:1px solid #E8E5E0"><strong>Due date</strong></td><td style="padding:8px 12px;border:1px solid #E8E5E0">${safeDue}</td></tr>
      </table>

      ${payLinkBlock}

      <p style="margin:20px 0;color:#525252">Mail check to:<br/>CRECO – Commercial Real Estate Company<br/>8000 Fair Oaks Pkwy, Suite 102<br/>Fair Oaks Ranch, TX 78015</p>

      <p style="margin:20px 0;color:#525252">Questions? Reply here or call <a href="tel:+12108173443" style="color:#C9A962">(210) 817-3443</a>.</p>

      <br/>
      <p style="color:#525252;margin:0">— The CRECO Team</p>
      <p style="color:#999;font-size:11px;margin:24px 0 0">TREC #9014367-BB</p>
    </div>
  `;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: getFromEmail(),
    to: invoice.client_email,
    cc: cc ? [cc] : undefined,
    replyTo: replyTo ?? process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com',
    subject,
    html,
    attachments: [
      {
        filename: `${invoice.invoice_number}.pdf`,
        content: pdfBuffer,
      },
    ],
  });

  if (result.error) {
    throw new Error(result.error.message ?? 'Resend rejected the send');
  }
  return result.data?.id;
}
