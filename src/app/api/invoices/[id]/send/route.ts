import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Invoice } from '@/lib/invoices';
import { isValidEmail, clampString, MAX_LEN } from '@/lib/sanitize';
import { FALLBACK_TEMPLATE, substituteTemplate } from '@/lib/invoice-email';
import { sendInvoiceEmail } from '@/lib/invoice-send';
import { createInvoicePaymentLink, isStripeConfigured } from '@/lib/stripe';

/**
 * POST /api/invoices/[id]/send
 *
 * Manual admin-triggered send. Pulls subject/message from the request body
 * (Compose modal) or falls back to the invoice-settings default template.
 * Delegates the actual render+send to lib/invoice-send.ts so the cron
 * reminder job uses the exact same code path.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

  // If Stripe is configured AND this invoice doesn't yet have a payment link,
  // create one before sending so the email + PDF include the "Pay online" CTA.
  // Failures here aren't fatal — we still send the invoice without the link
  // and the admin can retry the link later from the detail page.
  if (isStripeConfigured() && !fullInvoice.stripe_payment_link_url) {
    try {
      const { url } = await createInvoicePaymentLink(fullInvoice);
      fullInvoice.stripe_payment_link_url = url;
      await supabase.from('invoices').update({ stripe_payment_link_url: url }).eq('id', id);
    } catch (err) {
      console.warn('Auto payment-link creation failed; sending without link:', err);
    }
  }

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

  // Resolution order for subject + message:
  //   1. Request body (Compose modal — admin tweaked something at send time)
  //   2. Per-invoice override stored on the invoice row (set by the create
  //      page or detail-page edit)
  //   3. Global template from invoice_settings → substituted against this
  //      invoice's variables
  //   4. Hard-coded FALLBACK_TEMPLATE (covers the case where 0011 hasn't
  //      been run yet)
  if (!bodySubject || !bodyMessage) {
    if (!bodySubject && fullInvoice.email_subject) bodySubject = fullInvoice.email_subject;
    if (!bodyMessage && fullInvoice.email_message) bodyMessage = fullInvoice.email_message;
  }
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

  try {
    await sendInvoiceEmail({
      invoice: fullInvoice,
      subject: bodySubject || `Invoice ${invoice.invoice_number} from CRECO`,
      message: bodyMessage,
      cc: bodyCc,
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
