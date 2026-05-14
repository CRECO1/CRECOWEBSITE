import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { clampString, MAX_LEN } from '@/lib/sanitize';

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
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase, user } = auth;

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const action = body.action as string | undefined;
  if (!action || !['expense', 'ignore', 'reconcile', 'unreview'].includes(action)) {
    return NextResponse.json({ error: 'action must be expense | ignore | reconcile | unreview' }, { status: 400 });
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
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
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
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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

  // Create the expense
  const { data: created, error: insertErr } = await supabase
    .from('expenses')
    .insert([{
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
