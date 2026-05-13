import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

/**
 * POST /api/stripe/webhook
 *
 * Stripe → CRECO inbound webhook. Verifies the signature, then handles the
 * relevant event types and flips invoices to Paid (or back if a payment
 * fails after the fact).
 *
 * IMPORTANT: this route reads the raw request body to verify the signature.
 * Next.js Route Handlers preserve the raw body when we use req.text(); do
 * NOT call req.json() first or the verification will fail.
 *
 * Auth: by signature only — no bearer header, no user session. Stripe is
 * the only legitimate caller; if the signature check fails, we return 400
 * and the request is rejected before any DB write.
 *
 * RLS bypass: like the reminders cron, the webhook uses
 * SUPABASE_SERVICE_ROLE_KEY (server-only) because it acts as a system
 * process, not an authenticated user.
 *
 * Settlement timing note: for ACH (us_bank_account), `checkout.session.
 * completed` fires when the customer authorizes the debit, NOT when the
 * money settles 3-5 days later. We mark the invoice Paid optimistically
 * on completion. If the ACH later fails, Stripe fires `charge.failed` and
 * we revert. Most ACH transactions succeed, so optimistic UX is the right
 * default for invoicing.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function svcSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase service role not configured');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 503 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  // Raw body — must NOT be parsed by req.json() before signature verification
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('Stripe webhook signature verification failed:', msg);
    return NextResponse.json({ error: `Signature verification failed: ${msg}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }
      case 'charge.failed':
      case 'charge.refunded':
      case 'charge.dispute.created': {
        await handleChargeIssue(event.data.object as Stripe.Charge, event.type);
        break;
      }
      // ACH-specific: when the ACH debit completes (3-5 days after
      // checkout.session.completed), Stripe fires `payment_intent.succeeded`
      // again with a different status. We've already marked the invoice
      // Paid on the initial completion event, so this is a no-op. Listed
      // here so the user knows it's expected (and doesn't trigger an
      // "unknown event" warning in logs).
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
        break;
      default:
        // Unhandled events are fine — Stripe sends many we don't care about
        break;
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    // 500 prompts Stripe to retry, which is what we want if our DB was
    // temporarily unreachable. The webhook is idempotent by design (we
    // check status before re-applying), so retries are safe.
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const invoiceId = session.metadata?.invoice_id;
  if (!invoiceId) {
    console.warn('checkout.session.completed missing metadata.invoice_id', session.id);
    return;
  }

  const supabase = svcSupabase();

  // Idempotency — if already paid, do nothing. Stripe retries failed
  // webhook deliveries up to 3 days, so we may see this event multiple
  // times for the same checkout.
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', invoiceId)
    .single();
  if (!invoice) {
    console.warn('Webhook: invoice not found', invoiceId);
    return;
  }
  if (invoice.status === 'paid') return;

  // Stripe gives amount_total in cents
  const paidAmount = (session.amount_total ?? 0) / 100;

  // Detect payment method — Stripe's session has payment_method_types but
  // not always the chosen method. We resolve via the linked payment_intent
  // when we can; otherwise label as "Stripe" generically.
  let paidMethod = 'Stripe';
  try {
    if (session.payment_intent && typeof session.payment_intent === 'string') {
      const stripe = getStripe();
      if (stripe) {
        const pi = await stripe.paymentIntents.retrieve(session.payment_intent);
        const charges = pi.latest_charge ? [pi.latest_charge] : [];
        const chargeId = typeof charges[0] === 'string' ? charges[0] : charges[0]?.id;
        if (chargeId) {
          const charge = await stripe.charges.retrieve(chargeId);
          const method = charge.payment_method_details?.type;
          if (method === 'us_bank_account') paidMethod = 'Stripe (ACH)';
          else if (method === 'card') paidMethod = 'Stripe (Card)';
          else if (method) paidMethod = `Stripe (${method})`;
        }
      }
    }
  } catch (err) {
    console.warn('Could not resolve payment method, defaulting to "Stripe":', err);
  }

  await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      paid_amount: paidAmount,
      paid_method: paidMethod,
    })
    .eq('id', invoiceId);
}

/**
 * Revert an invoice from Paid → Sent if Stripe later reports the charge
 * failed, was refunded, or disputed. The admin still sees the original
 * invoice in their list with the proper status; we don't auto-resend the
 * reminders cron, that's their call.
 */
async function handleChargeIssue(charge: Stripe.Charge, eventType: string) {
  // We need the invoice_id from the parent payment intent's metadata
  // (the metadata flows from PaymentLink → Session → PaymentIntent → Charge).
  let invoiceId = charge.metadata?.invoice_id;
  if (!invoiceId && charge.payment_intent && typeof charge.payment_intent === 'string') {
    const stripe = getStripe();
    if (stripe) {
      try {
        const pi = await stripe.paymentIntents.retrieve(charge.payment_intent);
        invoiceId = pi.metadata?.invoice_id;
      } catch (err) {
        console.warn('Could not load PI for charge issue:', err);
      }
    }
  }
  if (!invoiceId) return;

  // Read existing notes before reverting so we can append a status note
  // (rather than clobber prior admin context).
  const supabase = svcSupabase();
  const { data: row } = await supabase
    .from('invoices')
    .select('internal_notes')
    .eq('id', invoiceId)
    .single();
  const note = `[${new Date().toISOString().slice(0, 10)}] Stripe reported ${eventType} — invoice reverted to Sent. Charge: ${charge.id}.`;
  const internal_notes = row?.internal_notes ? `${row.internal_notes}\n${note}` : note;

  await supabase
    .from('invoices')
    .update({
      status: 'sent',
      paid_at: null,
      paid_amount: null,
      paid_method: null,
      internal_notes,
    })
    .eq('id', invoiceId);
}
