/**
 * Pure renderer — builds the HTML body for an invoice email.
 *
 * Used by both:
 *   - src/lib/invoice-send.ts → the actual outbound send via Resend
 *   - src/app/billing/invoices/new → the live preview iframe on the
 *     create page
 *
 * Keeping it in one place means the preview is always byte-identical to
 * what the client receives (modulo Resend's own transit handling). If
 * you change the email's appearance, change it here.
 */

import { formatMoney, formatDate, type Invoice } from './invoices';
import { escapeHtml } from './sanitize';

export interface InvoiceEmailHtmlOptions {
  invoice: Invoice;
  /** The (already-substituted) personal message that appears above the summary. */
  message: string;
}

/**
 * Render the HTML body of an invoice email. Subject lives on the envelope,
 * not in here — render it separately in the preview chrome if you want.
 */
export function buildInvoiceEmailHtml({ invoice, message }: InvoiceEmailHtmlOptions): string {
  const payLinkBlock = invoice.stripe_payment_link_url
    ? `<p style="margin:16px 0"><a href="${escapeHtml(invoice.stripe_payment_link_url)}" style="display:inline-block;background:#1A1A1A;color:#C9A962;padding:12px 22px;border-radius:8px;font-weight:700;text-decoration:none">Pay online →</a></p>`
    : '';

  const safeTotal = escapeHtml(formatMoney(invoice.total));
  const safeDue = escapeHtml(formatDate(invoice.due_date));
  const safeNumber = escapeHtml(invoice.invoice_number);

  return `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#1A1A1A">
      <div style="margin:0 0 20px;padding:0 0 18px;border-bottom:2px solid #C9A962">
        <a href="https://www.crecotx.com" style="text-decoration:none;display:inline-block">
          <img src="https://www.crecotx.com/images/creco-logo-light.png"
               alt="CRECO"
               width="180"
               style="display:block;width:180px;max-width:180px;height:auto;border:0" />
        </a>
      </div>

      <h2 style="margin:0 0 16px;color:#1A1A1A;font-size:20px">Invoice ${safeNumber}</h2>

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
      <p style="color:#999;font-size:11px;margin:24px 0 0">TREC #9014367-BB · crecotx.com</p>
    </div>
  `;
}

/**
 * Wrap the email body in a full HTML doc with a simulated inbox header
 * (From / To / Subject / Attached). Used by the live preview iframe on
 * /billing/invoices/new — gives the admin a true "this is what they'll
 * see when they open it" experience.
 *
 * Not used for the actual send — Resend only takes the body HTML.
 */
export function buildInvoiceEmailPreview({
  invoice,
  subject,
  message,
  fromEmail = 'CRECO <noreply@crecotx.com>',
}: {
  invoice: Invoice;
  subject: string;
  message: string;
  fromEmail?: string;
}): string {
  const bodyHtml = buildInvoiceEmailHtml({ invoice, message });

  const safeFrom    = escapeHtml(fromEmail);
  const safeTo      = escapeHtml(invoice.client_email || '(client email)');
  const safeSubject = escapeHtml(subject || '(no subject)');
  const safePdf     = escapeHtml(`${invoice.invoice_number || 'INV-PREVIEW'}.pdf`);

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Email preview</title>
    <style>
      body { margin: 0; padding: 0; background: #f5f5f0; font-family: Helvetica, Arial, sans-serif; color: #1A1A1A; }
      .preview-shell { padding: 16px; }
      .preview-header { background: white; padding: 14px 18px; border: 1px solid #E8E5E0; border-radius: 8px 8px 0 0; font-size: 12.5px; line-height: 1.5; }
      .preview-header strong { color: #525252; display: inline-block; width: 70px; }
      .preview-body { background: white; padding: 24px 24px 32px; border: 1px solid #E8E5E0; border-top: 0; border-radius: 0 0 8px 8px; }
      .attachment-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; background: #FAFAF8; border: 1px solid #E8E5E0; border-radius: 999px; font-size: 11px; color: #525252; }
    </style>
  </head>
  <body>
    <div class="preview-shell">
      <div class="preview-header">
        <div><strong>From</strong> ${safeFrom}</div>
        <div><strong>To</strong> ${safeTo}</div>
        <div><strong>Subject</strong> <span style="color:#1A1A1A;font-weight:600">${safeSubject}</span></div>
        <div style="margin-top:6px"><strong>Attached</strong> <span class="attachment-chip">📎 ${safePdf}</span></div>
      </div>
      <div class="preview-body">
        ${bodyHtml}
      </div>
    </div>
  </body>
</html>`;
}
