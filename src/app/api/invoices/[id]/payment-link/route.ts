import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import type { Invoice } from '@/lib/invoices';
import { createInvoicePaymentLink, isStripeConfigured } from '@/lib/stripe';

/**
 * POST /api/invoices/[id]/payment-link
 *
 * Creates a Stripe Payment Link for this invoice (or returns the existing
 * one if already created). Stores the URL on `invoices.stripe_payment_link_url`
 * so the invoice email + PDF can include the "Pay online" CTA.
 *
 * Idempotent — calling twice doesn't create a second link. To force a new
 * link (e.g., the old one was deactivated), clear stripe_payment_link_url
 * first.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in Vercel env.' },
      { status: 503 },
    );
  }

  // Admin-only: match the sibling invoice routes. requireAdmin() returns a
  // session-scoped, RLS-honoring client plus the admin_users allowlist check.
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Idempotent — if the invoice already has a link, return it
  if (invoice.stripe_payment_link_url) {
    return NextResponse.json({
      ok: true,
      url: invoice.stripe_payment_link_url,
      reused: true,
    });
  }

  try {
    const { url } = await createInvoicePaymentLink(invoice as Invoice);
    await supabase
      .from('invoices')
      .update({ stripe_payment_link_url: url })
      .eq('id', id);
    return NextResponse.json({ ok: true, url, reused: false });
  } catch (err) {
    console.error('Payment link creation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not create payment link' },
      { status: 502 },
    );
  }
}
