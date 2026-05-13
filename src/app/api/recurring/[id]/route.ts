import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * PATCH /api/recurring/[id]   — update a template (optionally with line items)
 * DELETE /api/recurring/[id]  — remove the template (line items cascade)
 *
 * Partial PATCH supported (e.g. just toggling `active`). If `line_items` is
 * included on PATCH, we replace the existing items wholesale — easier than
 * a delta-merge given the typical form-edit shape.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

interface LineInput {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  sort_order: number;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const lineItems = (body.line_items as LineInput[] | undefined) ?? null;
  delete body.line_items;

  if (Object.keys(body).length > 0) {
    const { error } = await supabase
      .from('recurring_invoice_templates')
      .update(body)
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (lineItems !== null) {
    await supabase.from('recurring_invoice_line_items').delete().eq('template_id', id);
    if (lineItems.length > 0) {
      const { error: liErr } = await supabase
        .from('recurring_invoice_line_items')
        .insert(lineItems.map(li => ({ ...li, template_id: id })));
      if (liErr) return NextResponse.json({ error: liErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }
  const { error } = await supabase
    .from('recurring_invoice_templates')
    .delete()
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
