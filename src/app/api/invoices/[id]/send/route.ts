import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { renderInvoicePdf } from '@/lib/invoice-pdf';
import { formatMoney, formatDate, type Invoice } from '@/lib/invoices';
import { escapeHtml, isValidEmail, clampString, MAX_LEN } from '@/lib/sanitize';
import { FALLBACK_TEMPLATE, substituteTemplate } from '@/lib/invoice-email';

/**
 * POST /api/invoices/[id]/send
 *
 * Body: { subject?: string, message?: string, cc?: string }
 *   - subject — overrides the default; if missing, uses the invoice-settings
 *               default_subject (or the hard-coded fallback) with variables
 *               substituted
 *   - message — the personal-message body that appears at the top of the
 *               email. Same fallback chain as subject.
 *   - cc      — optional second recipient
 *
 * Renders the invoice PDF, sends a Resend email with the PDF attached,
 * marks the invoice 'sent', and stamps sent_at. All user-controlled values
 * escapeHtml'd before they reach the HTML email body.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getFromEmail(): string {
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  if (process.env.RESEND_FROM_VERIFIED === 'true') return 'CRECO <noreply@crecotx.com>';
  return 'onboarding@resend.dev';
}

async function authSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { /* read-only in API routes */ },
      },
    },
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await authSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: 'Email is not configured. Set RESEND_API_KEY in Vercel env.' },
      { status: 503 },
    );
  }

  // Fetch invoice + line items
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }
  if (!isValidEmail(invoice.client_email)) {
    return NextResponse.json({ error: 'Invoice client_email is invalid' }, { status: 400 });
  }

  const { data: line_items } = await supabase
    .from('invoice_line_items')
    .select('*')
    .eq('invoice_id', id)
    .order('sort_order', { ascending: true });

  const fullInvoice: Invoice = { ...invoice, line_items: line_items ?? [] };

  // Parse + sanitize the request body
  let bodySubject = '';
  let bodyMessage = '';
  let bodyCc: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.subject === 'string') bodySubject = clampString(body.subject, MAX_LEN.shortField);
    if (typeof body?.message === 'string') bodyMessage = clampString(body.message, MAX_LEN.message);
    if (typeof body?.cc === 'string' && isValidEmail(body.cc)) bodyCc = body.cc;
  } catch { /* no body is fine */ }

  // Fall back to the global template (substituted against this invoice) if
  // the request didn't include explicit subject / message
  if (!bodySubject || !bodyMessage) {
    const { data: settings } = await supabase
      .from('invoice_settings')
      .select('default_subject, default_message')
      .eq('id', 1)
      .single();
    const template = settings ?? FALLBACK_TEMPLATE;
    if (!bodySubject) bodySubject = substituteTemplate(template.default_subject, fullInvoice);
    if (!bodyMessage) bodyMessage = substituteTemplate(template.default_message, fullInvoice);
  }

  // Render PDF
  const pdf = await renderInvoicePdf(fullInvoice);
  const pdfBuffer = Buffer.from(pdf);

  const resend = new Resend(process.env.RESEND_API_KEY);

  const payLinkBlock = invoice.stripe_payment_link_url
    ? `<p style="margin:16px 0"><a href="${escapeHtml(invoice.stripe_payment_link_url)}" style="display:inline-block;background:#1A1A1A;color:#C9A962;padding:12px 22px;border-radius:8px;font-weight:700;text-decoration:none">Pay online →</a></p>`
    : '';

  const safeTotal = escapeHtml(formatMoney(invoice.total));
  const safeDue = escapeHtml(formatDate(invoice.due_date));
  const safeNumber = escapeHtml(invoice.invoice_number);

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;max-width:600px;color:#1A1A1A">
      <h2 style="margin:0 0 16px;color:#1A1A1A">Invoice ${safeNumber} from CRECO</h2>

      <div style="white-space:pre-line;margin:0 0 24px;line-height:1.6">${escapeHtml(bodyMessage)}</div>

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

  try {
    await resend.emails.send({
      from: getFromEmail(),
      to: invoice.client_email,
      cc: bodyCc ? [bodyCc] : undefined,
      replyTo: process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com',
      subject: bodySubject || `Invoice ${invoice.invoice_number} from CRECO`,
      html,
      attachments: [
        {
          filename: `${invoice.invoice_number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  } catch (err) {
    console.error('Invoice send error:', err);
    return NextResponse.json(
      { error: 'Could not send email. Check Resend configuration and try again.' },
      { status: 502 },
    );
  }

  // Flip status → 'sent' and stamp sent_at
  await supabase
    .from('invoices')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
    })
    .eq('id', id);

  return NextResponse.json({ success: true });
}
