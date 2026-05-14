import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Invoice, InvoiceLineItem, LateFeeSettings } from '@/lib/invoices';
import { calculateTotals, round2 } from '@/lib/invoices';

/**
 * GET /api/cron/late-fees
 *
 * Daily Vercel cron. Reads the late-fee settings from the singleton
 * invoice_settings row. If enabled:
 *   1. Find every invoice with status in ('sent', 'overdue') and the
 *      `reminders_enabled` flag true (we reuse the same flag — opting
 *      out of reminders also opts out of late fees, which is the
 *      behaviour the operator expects).
 *   2. Compute how many days each invoice is past due.
 *   3. Check how many late-fee line items the invoice already has and
 *      when the most recent one was added.
 *   4. Add a new fee line if:
 *      - One-shot mode: invoice is N+ days overdue AND has zero late-fee
 *        lines so far.
 *      - Recurring mode: invoice is N+ days overdue AND the last late-fee
 *        line was added at least N days ago (or never).
 *   5. Recompute invoice subtotal/tax/total to reflect the new line.
 *
 * Idempotent on retry: the "days since last late fee" check + the
 * "exists at all" check both gate re-adds, so manual reruns the same
 * day don't double up.
 *
 * Auth: Vercel sets `Authorization: Bearer ${CRON_SECRET}`.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

interface RunResult {
  ok: true;
  date: string;
  invoices_checked: number;
  fees_added: number;
  errors: { invoice_id: string; error: string }[];
  added: { invoice_id: string; invoice_number: string; fee_amount: number }[];
}

function daysBetween(aIso: string, bIso: string): number {
  const a = new Date(aIso + 'T00:00:00Z').getTime();
  const b = new Date(bIso + 'T00:00:00Z').getTime();
  return Math.round((b - a) / 86_400_000);
}

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  // 1. Pull settings — bail early if late fees are off
  const { data: settings } = await supabase
    .from('invoice_settings')
    .select('late_fee_enabled, late_fee_type, late_fee_amount, late_fee_days, late_fee_recurring')
    .eq('id', 1)
    .single();

  const s = settings as LateFeeSettings | null;
  if (!s || !s.late_fee_enabled) {
    return NextResponse.json({
      ok: true,
      skipped: 'late_fee_enabled=false (or settings row missing)',
      invoices_checked: 0,
      fees_added: 0,
    });
  }

  // Validate config — defensive in case bad values got persisted somehow
  if (s.late_fee_amount < 0 || (s.late_fee_type === 'percent' && s.late_fee_amount > 1)) {
    return NextResponse.json(
      { error: 'late_fee_amount out of range — fix in /billing/invoices/settings' },
      { status: 500 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  // 2. Candidates: sent/overdue + reminders enabled
  const { data: invoices, error: fetchErr } = await supabase
    .from('invoices')
    .select('*')
    .in('status', ['sent', 'overdue'])
    .eq('reminders_enabled', true);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const result: RunResult = {
    ok: true,
    date: today,
    invoices_checked: invoices?.length ?? 0,
    fees_added: 0,
    errors: [],
    added: [],
  };

  for (const inv of (invoices as Invoice[] | null) ?? []) {
    try {
      const daysOverdue = daysBetween(inv.due_date, today);
      if (daysOverdue < s.late_fee_days) continue;

      // 3. Pull the invoice's line items, isolate late-fee lines
      const { data: lines } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', inv.id)
        .order('sort_order', { ascending: true });
      const lineItems = (lines as InvoiceLineItem[] | null) ?? [];
      const lateFeeLines = lineItems.filter(l => l.is_late_fee);

      // 4. Gate
      if (!s.late_fee_recurring && lateFeeLines.length > 0) {
        // One-shot mode, already applied — skip forever
        continue;
      }
      if (s.late_fee_recurring && lateFeeLines.length > 0) {
        // Find the most recent late fee line by sort_order (we append, so
        // larger sort_order == newer). Use its sort_order as a proxy for
        // "when was the last fee added" — we don't carry a per-line
        // timestamp. Fallback: check if today is at least
        // (due_date + N + N*lateFeeLines.length) days past — the Nth fee
        // shouldn't go on until the Nth window has elapsed.
        const expectedDueWindow = s.late_fee_days * (lateFeeLines.length + 1);
        if (daysOverdue < expectedDueWindow) continue;
      }

      // 5. Compute fee
      const subtotalBefore = lineItems.reduce((sum, l) => sum + Number(l.amount), 0);
      const feeAmount = s.late_fee_type === 'percent'
        ? round2(subtotalBefore * s.late_fee_amount)
        : round2(Number(s.late_fee_amount));

      if (feeAmount <= 0) continue;

      const nextSortOrder = (lineItems.length === 0
        ? 0
        : Math.max(...lineItems.map(l => l.sort_order ?? 0)) + 1);

      const description = s.late_fee_type === 'percent'
        ? `Late fee (${(s.late_fee_amount * 100).toFixed(2)}% — assessed ${today})`
        : `Late fee (${today})`;

      // 6. Insert the line + recompute totals atomically-ish (Supabase JS
      // doesn't expose a real transaction, but the operations are small
      // and the worst-case is a fee inserted without totals updated,
      // which we'd reconcile manually).
      const { error: insertErr } = await supabase
        .from('invoice_line_items')
        .insert([{
          invoice_id: inv.id,
          description,
          quantity: 1,
          rate: feeAmount,
          amount: feeAmount,
          sort_order: nextSortOrder,
          is_late_fee: true,
        }]);
      if (insertErr) throw new Error(`Line insert: ${insertErr.message}`);

      const newItems = [...lineItems, { quantity: 1, rate: feeAmount }];
      const totals = calculateTotals(newItems, Number(inv.tax_rate));
      const { error: updErr } = await supabase
        .from('invoices')
        .update({
          subtotal: totals.subtotal,
          tax_amount: totals.tax_amount,
          total: totals.total,
        })
        .eq('id', inv.id);
      if (updErr) throw new Error(`Total update: ${updErr.message}`);

      result.fees_added++;
      result.added.push({
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        fee_amount: feeAmount,
      });
    } catch (err) {
      result.errors.push({
        invoice_id: inv.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) { return GET(req); }
