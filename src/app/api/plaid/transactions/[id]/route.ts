import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspaceAdmin } from '@/lib/api-auth';
import { clampString, MAX_LEN } from '@/lib/sanitize';
import { deactivatePaymentLink, isStripeConfigured } from '@/lib/stripe';

/**
 * PATCH /api/plaid/transactions/[id]
 *
 * Review-action endpoint for a single bank transaction. The operator
 * picks one of three actions from the inbox:
 *
 *   { action: 'expense', category, description?, payment_method?,
 *     property_reference?, reimbursable?, is_1099_eligible?, contractor_id? }
 *     — Creates an expense row from the transaction's data and links it
 *       back. Outflows only (amount > 0 in Plaid sign convention).
 *
 *   { action: 'ignore', note? }
 *     — Marks the transaction reviewed and ignored (transfers between
 *       own accounts, refunds, personal charges on a business card,
 *       etc).
 *
 *   { action: 'reconcile', expense_id }
 *     — Links the transaction to an EXISTING expense (user already
 *       logged it manually before the bank feed pulled it).
 *
 *   { action: 'unreview' }
 *     — Move back to unreviewed (lets the operator undo a misclick).
 *
 * All actions update reviewed_at/reviewed_by + status atomically.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BankTransaction {
  id: string;
  amount: number;
  merchant_name: string | null;
  description: string;
  posted_date: string;
  status: string;
  expense_id: string | null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;
  const { supabase, user, workspace } = auth;

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const action = body.action as string | undefined;
  if (!action || !['expense', 'ignore', 'reconcile', 'unreview', 'apply_to_invoice'].includes(action)) {
    return NextResponse.json({ error: 'action must be expense | ignore | reconcile | unreview | apply_to_invoice' }, { status: 400 });
  }

  // Pull the txn so we know its current state and amount
  const { data: txn, error: fetchErr } = await supabase
    .from('bank_transactions')
    .select('id, amount, merchant_name, description, posted_date, status, expense_id')
    .eq('id', id)
    .single<BankTransaction>();
  if (fetchErr || !txn) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
  }

  // If we're un-reviewing a previously-expensed txn, also delete the
  // child expense row to keep state consistent. (Better to delete the
  // expense than leave it orphaned.)
  if (action === 'unreview') {
    if (txn.expense_id) {
      await supabase.from('expenses').delete().eq('id', txn.expense_id);
    }
    const { error } = await supabase
      .from('bank_transactions')
      .update({
        status: 'unreviewed',
        expense_id: null,
        reviewed_at: null,
        reviewed_by: null,
        internal_notes: null,
      })
      .eq('id', id);
    if (error) {
      // Log the raw Postgres error server-side; return a generic message
      // to the client. Even for admin-only routes, leaking schema details
      // is unnecessary attack-surface info.
      console.error('[plaid/transactions PATCH] DB error:', error);
      return NextResponse.json({ error: 'Could not update transaction' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === 'ignore') {
    const note = clampString(body.note, MAX_LEN.notes);
    const { error } = await supabase
      .from('bank_transactions')
      .update({
        status: 'ignored',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        internal_notes: note || null,
      })
      .eq('id', id);
    if (error) {
      // Log the raw Postgres error server-side; return a generic message
      // to the client. Even for admin-only routes, leaking schema details
      // is unnecessary attack-surface info.
      console.error('[plaid/transactions PATCH] DB error:', error);
      return NextResponse.json({ error: 'Could not update transaction' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  /**
   * apply_to_invoice — link this inflow to an open invoice and mark the
   * invoice paid in one step. Bank reconciliation MVP.
   *
   * Required body: { action: 'apply_to_invoice', invoice_id }
   * Optional:      { method, date }   — defaults to 'ACH' + the txn date
   *
   * Side effects (in order):
   *   1. UPDATE invoices SET status='paid' ...
   *   2. UPDATE bank_transactions SET status='reconciled', reconciled_invoice_id
   *   3. Deactivate the Stripe Payment Link if any (best-effort)
   *
   * The invoice's paid_amount uses the txn's absolute amount (which may
   * exceed the invoice total if the deposit covers fees) and paid_at uses
   * the txn's posted_date so the cash-basis date matches reality.
   */
  if (action === 'apply_to_invoice') {
    const invoiceId = body.invoice_id as string | undefined;
    if (!invoiceId) {
      return NextResponse.json({ error: 'invoice_id required for apply_to_invoice' }, { status: 400 });
    }
    if (Number(txn.amount) >= 0) {
      return NextResponse.json(
        { error: 'apply_to_invoice is only valid for inflows (negative-amount transactions).' },
        { status: 400 },
      );
    }

    // Belt-and-suspenders numeric guard. Number() accepts Infinity / NaN /
    // out-of-range strings; this catches anything Postgres / Plaid might
    // throw us before we write a garbage paid_amount.
    const paidAmount = Math.abs(Number(txn.amount));
    if (!Number.isFinite(paidAmount) || paidAmount <= 0 || paidAmount > 1_000_000_000) {
      return NextResponse.json({ error: 'Invalid transaction amount' }, { status: 400 });
    }

    const { data: inv, error: invErr } = await supabase
      .from('invoices')
      .select('id, total, status, stripe_payment_link_url, internal_notes, workspace_id')
      .eq('id', invoiceId)
      .single();
    if (invErr || !inv) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    if (inv.status === 'paid' || inv.status === 'void') {
      return NextResponse.json(
        { error: `Invoice is already ${inv.status}; reopen it first if you want to reconcile.` },
        { status: 400 },
      );
    }

    const method = clampString(body.method, MAX_LEN.shortField) || 'ACH';
    const txnRef = txn.merchant_name || txn.description || 'bank deposit';

    // 1. Record the bank inflow as a payment in the ledger. The recalc
    //    trigger (migration 0046) derives the invoice's paid_amount + status
    //    — a deposit smaller than the balance marks it 'partial', not fully
    //    paid (fixing the old "$1 inflow marks a $10k invoice paid").
    const { error: payErr } = await supabase
      .from('invoice_payments')
      .insert({
        workspace_id: inv.workspace_id,
        invoice_id: invoiceId,
        amount: paidAmount,
        method,
        paid_at: txn.posted_date,
        notes: `Reconciled from bank: ${txnRef}`,
        source: 'plaid',
      });
    if (payErr) {
      return NextResponse.json({ error: payErr.message }, { status: 500 });
    }

    // 2. Mark txn reconciled + linked
    const { error: tErr } = await supabase
      .from('bank_transactions')
      .update({
        status: 'reconciled',
        reconciled_invoice_id: invoiceId,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', id);
    if (tErr) {
      return NextResponse.json({ error: tErr.message }, { status: 500 });
    }

    // 3. Deactivate Stripe payment link inline. The previous version did a
    //    server-to-server fetch to /api/invoices/[id]/deactivate-payment-link
    //    which silently returned 401 because the operator's session cookies
    //    don't propagate on internal fetches — net effect: invoice was
    //    marked paid but the Stripe link stayed live, exposing a
    //    double-payment risk. Calling the lib directly bypasses the broken
    //    self-auth path. Failures stay non-fatal but now surface in logs.
    if (inv.stripe_payment_link_url) {
      try {
        if (isStripeConfigured()) {
          await deactivatePaymentLink(inv.stripe_payment_link_url);
        }
        await supabase
          .from('invoices')
          .update({ stripe_payment_link_url: null })
          .eq('id', invoiceId);
      } catch (err) {
        console.warn('[apply_to_invoice] Stripe link deactivation failed (continuing):', err);
      }
    }

    return NextResponse.json({ ok: true, invoice_id: invoiceId, applied_amount: paidAmount });
  }

  if (action === 'reconcile') {
    const expenseId = body.expense_id as string | undefined;
    if (!expenseId) {
      return NextResponse.json({ error: 'expense_id required for reconcile' }, { status: 400 });
    }
    // Make sure the expense exists
    const { data: existing } = await supabase.from('expenses').select('id').eq('id', expenseId).single();
    if (!existing) return NextResponse.json({ error: 'expense not found' }, { status: 404 });
    const { error } = await supabase
      .from('bank_transactions')
      .update({
        status: 'reconciled',
        expense_id: expenseId,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', id);
    if (error) {
      // Log the raw Postgres error server-side; return a generic message
      // to the client. Even for admin-only routes, leaking schema details
      // is unnecessary attack-surface info.
      console.error('[plaid/transactions PATCH] DB error:', error);
      return NextResponse.json({ error: 'Could not update transaction' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ── action === 'expense' ───────────────────────────────────────────
  // Plaid's sign convention: positive = outflow (debits, charges).
  // An income / refund would be negative — refuse to create a normal
  // expense for those; the operator should use 'ignore' or build us a
  // separate "income tracking" flow.
  if (Number(txn.amount) <= 0) {
    return NextResponse.json(
      { error: 'This is a credit / inflow. Use Ignore (or build income tracking).' },
      { status: 400 },
    );
  }

  const category    = clampString(body.category, MAX_LEN.shortField) || 'Other';
  const description = clampString(body.description, MAX_LEN.message) || txn.description;
  const payment_method = clampString(body.payment_method, MAX_LEN.shortField) || null;
  const property_reference = clampString(body.property_reference, MAX_LEN.shortField) || null;
  const reimbursable = !!body.reimbursable;
  const is_1099_eligible = !!body.is_1099_eligible;
  const contractor_id = body.contractor_id ? String(body.contractor_id) : null;

  const vendor = txn.merchant_name || txn.description || 'Unknown';

  // Create the expense — stamped with the calling user's workspace.
  const { data: created, error: insertErr } = await supabase
    .from('expenses')
    .insert([{
      workspace_id: workspace.id,
      expense_date: txn.posted_date,
      vendor,
      category,
      amount: Number(txn.amount),
      payment_method,
      description,
      property_reference,
      reimbursable,
      is_1099_eligible,
      contractor_id,
    }])
    .select('id')
    .single();
  if (insertErr) {
    console.error('[plaid/txn/expense]', insertErr.message);
    return NextResponse.json({ error: 'Could not create expense' }, { status: 500 });
  }

  const { error: updErr } = await supabase
    .from('bank_transactions')
    .update({
      status: 'expensed',
      expense_id: created.id,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', id);
  if (updErr) {
    // Roll back the expense — we never want a dangling expense if we
    // couldn't mark the txn reviewed.
    await supabase.from('expenses').delete().eq('id', created.id);
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, expense_id: created.id });
}
