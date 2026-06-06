import { NextRequest, NextResponse } from 'next/server';
import { requireWorkspaceAdmin } from '@/lib/api-auth';

/**
 * POST /api/recurring — create a recurring invoice template.
 *
 * Admin-only. Auth verified via the user's Supabase session cookie. The
 * session-scoped client honors RLS (migration 0017 grants authenticated
 * users full access to recurring_invoice_templates +
 * recurring_invoice_line_items).
 *
 * Body shape mirrors the table schema. Line items are saved separately
 * into recurring_invoice_line_items. If line items fail to insert, the
 * parent template row is rolled back so we don't end up with orphaned
 * empty templates that the cron would later treat as 0-amount invoices.
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

function validateBody(body: Record<string, unknown>): string | null {
  // Required fields
  for (const k of ['name', 'client_name', 'client_email', 'frequency', 'next_run_date'] as const) {
    if (!body[k] || typeof body[k] !== 'string') return `Missing ${k}`;
  }
  // Frequency must be one of the allowed values
  if (!['monthly', 'quarterly', 'annually'].includes(body.frequency as string)) {
    return 'Invalid frequency';
  }
  // next_run_date can't be more than 1 day in the past. Otherwise the cron
  // would generate years of back-dated invoices on the next run.
  const next = new Date(body.next_run_date as string);
  if (Number.isNaN(next.getTime())) return 'Invalid next_run_date';
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  if (next.getTime() < oneDayAgo) return 'next_run_date must be today or in the future';
  // Tax rate sanity bounds. 0..1 (e.g. 0.0825 for 8.25%). Reject negative
  // and absurd values; 100% tax is implausible but allowed.
  if (body.tax_rate !== undefined && body.tax_rate !== null) {
    const tr = Number(body.tax_rate);
    if (!Number.isFinite(tr) || tr < 0 || tr > 1) return 'tax_rate must be between 0 and 1';
  }
  // due_days bounds
  if (body.due_days !== undefined && body.due_days !== null) {
    const dd = Number(body.due_days);
    if (!Number.isInteger(dd) || dd < 0 || dd > 365) return 'due_days must be 0-365';
  }
  return null;
}

export async function POST(req: NextRequest) {
  const auth = await requireWorkspaceAdmin();
  if (auth.error) return auth.error;
  const { supabase, workspace } = auth;

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const validationError = validateBody(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const lineItems = (body.line_items as LineInput[] | undefined) ?? [];
  delete body.line_items;

  if (lineItems.length === 0) {
    return NextResponse.json({ error: 'Add at least one line item' }, { status: 400 });
  }

  const { data: tpl, error } = await supabase
    .from('recurring_invoice_templates')
    .insert([{ ...body, workspace_id: workspace.id }])
    .select('id')
    .single();
  if (error) {
    console.error('[recurring.POST] template insert failed:', error.message);
    return NextResponse.json({ error: 'Could not save template' }, { status: 500 });
  }

  // Line items also workspace-scoped — keeps the per-table index narrow
  // and means cross-workspace queries can't leak via a bad join.
  const { error: liErr } = await supabase
    .from('recurring_invoice_line_items')
    .insert(lineItems.map(li => ({ ...li, template_id: tpl.id, workspace_id: workspace.id })));
  if (liErr) {
    // Roll back the parent so we don't leave a header with zero lines.
    await supabase.from('recurring_invoice_templates').delete().eq('id', tpl.id);
    console.error('[recurring.POST] line items insert failed:', liErr.message);
    return NextResponse.json({ error: 'Could not save line items' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: tpl.id });
}
