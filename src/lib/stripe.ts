/**
 * Server-side Stripe helpers — Payment Link creation + webhook utilities.
 *
 * Only initializes the Stripe client when STRIPE_SECRET_KEY is set. Routes
 * that use this lib must handle the "not configured" case gracefully:
 *   - /api/invoices/[id]/payment-link returns 503 if no key
 *   - /api/invoices/[id]/send skips link generation if no key
 *   - /api/stripe/webhook returns 503 if no key
 *
 * Why server-only: the secret key can charge cards, issue refunds, and
 * read all payment data. It must NEVER reach the browser. This file
 * imports `stripe`, which has a `'server-only'` guard via its export
 * shape; if a client component accidentally imports it, the Next.js
 * compiler will surface the issue.
 */

import Stripe from 'stripe';
import type { Invoice } from './invoices';

/** Lazy-construct the client. Returns null if the key isn't configured. */
let _client: Stripe | null | undefined;
export function getStripe(): Stripe | null {
  if (_client !== undefined) return _client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    _client = null;
    return null;
  }
  _client = new Stripe(key, {
    // Pin to a stable API version. Bump when you want new Stripe features;
    // pinning ensures our types + webhook payloads don't shift under us.
    apiVersion: '2026-04-22.dahlia',
    typescript: true,
    appInfo: { name: 'CRECO Website', version: '1.0.0' },
  });
  return _client;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Create a Stripe Payment Link for an invoice. The customer can pay by card
 * or ACH Direct Debit (us_bank_account). Metadata.invoice_id is set so the
 * webhook can resolve the Stripe checkout event back to our invoice row.
 *
 * Idempotent at the caller layer — if the invoice already has a
 * stripe_payment_link_url set, callers should skip this and reuse it.
 */
export async function createInvoicePaymentLink(invoice: Invoice): Promise<{
  id: string;
  url: string;
}> {
  const stripe = getStripe();
  if (!stripe) throw new Error('Stripe is not configured (set STRIPE_SECRET_KEY)');

  // Stripe wants amounts in cents — convert from numeric(12,2)
  const amountCents = Math.round(Number(invoice.total) * 100);
  if (amountCents <= 0) {
    throw new Error('Invoice total must be greater than zero before generating a payment link');
  }

  const productName = invoice.invoice_number
    ? `Invoice ${invoice.invoice_number}`
    : 'CRECO Invoice';
  const productDescription = invoice.property_reference
    ? `Property: ${invoice.property_reference}`
    : (invoice.notes ? invoice.notes.slice(0, 200) : undefined);

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: productDescription
            ? { name: productName, description: productDescription }
            : { name: productName },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    // 'us_bank_account' enables ACH Direct Debit (requires the merchant to
    // have ACH activated in their Stripe Dashboard — which the user does).
    // 'card' covers cards. Stripe handles Plaid + microdeposit verification
    // on the hosted page.
    payment_method_types: ['card', 'us_bank_account'],
    // Metadata flows: Payment Link → Checkout Session, so the webhook sees
    // invoice_id when checkout.session.completed fires.
    metadata: {
      invoice_id: invoice.id,
      invoice_number: invoice.invoice_number,
      client_email: invoice.client_email,
    },
    after_completion: {
      type: 'hosted_confirmation',
      hosted_confirmation: {
        custom_message: `Thanks for paying ${invoice.invoice_number}. We'll send a receipt to ${invoice.client_email}.`,
      },
    },
    // Restrict to one payment per link — invoices shouldn't be paid twice.
    restrictions: { completed_sessions: { limit: 1 } },
  });

  return { id: paymentLink.id, url: paymentLink.url };
}

/**
 * Deactivate a Stripe Payment Link. Called when an invoice is voided or
 * deleted so the link can't be used to pay a cancelled invoice.
 *
 * Best-effort: Stripe rejects deactivation of already-completed links, and
 * we don't surface that as an error — the invoice was paid, the link
 * shouldn't have been live anyway.
 */
export async function deactivatePaymentLink(linkIdOrUrl: string): Promise<void> {
  const stripe = getStripe();
  if (!stripe) return;
  // Accept either the plink_ ID or the buy.stripe.com URL
  const id = linkIdOrUrl.startsWith('plink_')
    ? linkIdOrUrl
    : (linkIdOrUrl.match(/\/([a-zA-Z0-9_]+)$/)?.[1] ?? null);
  if (!id) return;
  try {
    await stripe.paymentLinks.update(id, { active: false });
  } catch {
    // Already deactivated or never existed — fine
  }
}
