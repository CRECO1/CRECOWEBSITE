import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';

/**
 * PATCH /api/recurring/[id]   — update a template (optionally with line items)
 * DELETE /api/recurring/[id]  — remove the template (line items cascade)
 *
 * Admin-only. Partial PATCH supported (e.g. just toggling `active`). If
 * `line_items` is included on PATCH, we replace the existing items
 * wholesale — easier than a delta-merge given the typical form-edit shape.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LineInput {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  sort_order: number;
}

function validatePatch(body: Record<string, unknown>): string | null {
  // frequency optional but if present must be valid
  if (body.frequency !== undefined && !['monthly', 'quarterly', 'annually'].includes(body.frequency as string)) {
    return 'Invalid frequency';
  }
  if (body.next_run_date !== undefined) {
    const next = new Date(body.next_run_date as string);
    if (Number.isNaN(next.getTime())) return 'Invalid next_run_date';
    // For PATCH we permit past dates only when explicitly rescheduling backward
    // is the user's intent — but block dates more than a year ago, which is
    // almost certainly a mistake and would generate dozens of back-invoices.
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    if (next.getTime() < oneYearAgo) return 'next_run_date is too far in the past';
  }
  if (body.tax_rate !== undefined && body.tax_rate !== null) {
    const tr = Number(body.tax_rate);
    if (!Number.isFinite(tr) || tr < 0 || tr > 1) return 'tax_rate must be between 0 and 1';
  }
  if (body.due_days !== undefined && body.due_days !== null) {
    const dd = Number(body.due_days);
    if (!Number.isInteger(dd) || dd < 0 || dd > 365) return 'due_days must be 0-365';
  }
  return null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const validationError = validatePatch(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const lineItems = (body.line_items as LineInput[] | undefined) ?? null;
  delete body.line_items;

  if (Object.keys(body).length > 0) {
    const { error } = await supabase
      .from('recurring_invoice_templates')
      .update(body)
      .eq('id', id);
    if (error) {
      console.error('[recurring.PATCH] update failed:', error.message);
      return NextResponse.json({ error: 'Could not save template' }, { status: 500 });
    }
  }

  if (lineItems !== null) {
    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'Keep at least one line item' }, { status: 400 });
    }
    await supabase.from('recurring_invoice_line_items').delete().eq('template_id', id);
    const { error: liErr } = await supabase
      .from('recurring_invoice_line_items')
      .insert(lineItems.map(li => ({ ...li, template_id: id })));
    if (liErr) {
      console.error('[recurring.PATCH] line items insert failed:', liErr.message);
      return NextResponse.json({ error: 'Could not save line items' }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { error } = await supabase
    .from('recurring_invoice_templates')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('[recurring.DELETE] failed:', error.message);
    return NextResponse.json({ error: 'Could not delete template' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
