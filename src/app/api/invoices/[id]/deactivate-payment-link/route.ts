import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { deactivatePaymentLink, isStripeConfigured } from '@/lib/stripe';

/**
 * POST /api/invoices/[id]/deactivate-payment-link
 *
 * Deactivates the Stripe Payment Link attached to this invoice (so a client
 * can no longer pay through it) and clears the stored URL on the invoice
 * row. Idempotent — safe to call on invoices that never had a link, or
 * have already been deactivated.
 *
 * Called from the detail page when:
 *   - Admin manually marks an invoice as Paid (avoid double-payment if the
 *     client clicks the link after our records show it paid)
 *   - Invoice voided
 *   - Invoice deleted
 *
 * Authenticated admin only. Treats Stripe API failures as non-fatal — we
 * still clear the URL field so the UI doesn't keep showing a stale link.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // Admin-only: match the sibling invoice routes. requireAdmin() returns a
  // session-scoped, RLS-honoring client plus the admin_users allowlist check.
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('stripe_payment_link_url')
    .eq('id', id)
    .single();
  if (error || !invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  if (!invoice.stripe_payment_link_url) {
    return NextResponse.json({ ok: true, deactivated: false, reason: 'no link attached' });
  }

  // Best-effort deactivation. If Stripe isn't configured (key missing) or
  // the link no longer exists in Stripe, we still proceed to clear our
  // stored URL so the UI reflects the intent.
  if (isStripeConfigured()) {
    try {
      await deactivatePaymentLink(invoice.stripe_payment_link_url);
    } catch (err) {
      console.warn('Stripe payment link deactivation failed (continuing):', err);
    }
  }

  await supabase
    .from('invoices')
    .update({ stripe_payment_link_url: null })
    .eq('id', id);

  return NextResponse.json({ ok: true, deactivated: true });
}
