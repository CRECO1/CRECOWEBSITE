/**
 * Shared invoice-email sender.
 *
 * Used by both `/api/invoices/[id]/send` (manual admin-triggered send) and
 * `/api/cron/invoice-reminders` (automated payment reminders). Renders the
 * branded HTML body, attaches the rendered PDF, fires through Resend, and
 * returns the Resend message ID for downstream logging.
 *
 * Callers are responsible for marking the invoice as sent / logging the reminder row.
 * The one thing it DOES write is invoice_email_messages (which Resend message ids went to
 * which recipient), so webhook events resolve back to the invoice. Best-effort.
 */

import { Resend } from 'resend';
import { renderInvoicePdf } from './invoice-pdf';
import type { Invoice } from './invoices';
import { buildInvoiceEmailHtml } from './invoice-email-html';
import { signInvoiceView } from './invoice-view-token';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://www.crecotx.com';

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

  // Invoice PDF is always first; extras (W-9, etc.) tail behind. Most
  // email clients show attachments in the order they're listed, so the
  // invoice itself stays the visually-primary file.
  const attachments = [
    { filename: `${invoice.invoice_number}.pdf`, content: pdfBuffer },
    ...(extraAttachments ?? []),
  ];

  const resend = new Resend(process.env.RESEND_API_KEY);

  // One message PER recipient. A single message with a Cc can't tell us who clicked or opened — every copy
  // carries the same link. So the client gets their copy with their own signed "View invoice online" link,
  // and anyone Cc'd gets a separate copy (marked as a copy) with theirs. Body HTML is still rendered by the
  // shared builder so the live preview matches what ships.
  const replyToAddr = replyTo ?? process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';
  const sendTo = async (recipient: string, role: 'to' | 'cc') => {
    let viewUrl: string | undefined;
    try { viewUrl = `${SITE_URL}/inv/${signInvoiceView({ inv: invoice.id, email: recipient.toLowerCase(), role })}`; }
    catch (e) { console.warn('[invoice-send] could not sign view link; sending without it:', e); }
    const html = buildInvoiceEmailHtml({ invoice, message, viewUrl, copyOf: role === 'cc' ? invoice.client_email : undefined });
    return resend.emails.send({
      from: getFromEmail(),
      to: recipient,
      replyTo: replyToAddr,
      subject: role === 'cc' ? `Copy: ${subject}` : subject,
      html,
      attachments,
    });
  };

  const result = await sendTo(invoice.client_email, 'to');
  if (result.error) {
    throw new Error(result.error.message ?? 'Resend rejected the send');
  }
  const primaryId = result.data?.id;

  // Record every message id so the Resend webhook can resolve events for the Cc copy (and reminders) back to this invoice.
  const recorded: { message_id: string; invoice_id: string; workspace_id: string; recipient_email: string; role: 'to' | 'cc' }[] = [];
  if (primaryId) recorded.push({ message_id: primaryId, invoice_id: invoice.id, workspace_id: invoice.workspace_id, recipient_email: invoice.client_email.toLowerCase(), role: 'to' });

  // The Cc copy never blocks or fails the invoice: the client's copy has already gone out.
  if (cc && cc.toLowerCase() !== invoice.client_email.toLowerCase()) {
    try {
      const ccResult = await sendTo(cc, 'cc');
      if (ccResult.error) console.error('[invoice-send] Cc copy rejected:', ccResult.error.message);
      else if (ccResult.data?.id) recorded.push({ message_id: ccResult.data.id, invoice_id: invoice.id, workspace_id: invoice.workspace_id, recipient_email: cc.toLowerCase(), role: 'cc' });
    } catch (e) { console.error('[invoice-send] Cc copy failed:', e); }
  }

  if (recorded.length) {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (url && key) await createClient(url, key, { auth: { persistSession: false } }).from('invoice_email_messages').upsert(recorded, { onConflict: 'message_id' });
    } catch (e) { console.error('[invoice-send] could not record message ids:', e); }
  }
  return primaryId;
}
