import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/recurring — create a recurring invoice template.
 *
 * Body shape mirrors the table schema. Line items are saved separately into
 * recurring_invoice_line_items. The whole operation is best-effort
 * transactional: if line items fail, we roll back the parent.
 *
 * Auth: this route runs inside /billing which is admin-only. We use the
 * service role on the server because the Supabase client in this route
 * never sees the user's session.
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

export async function POST(req: NextRequest) {
  const supabase = adminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const lineItems = (body.line_items as LineInput[] | undefined) ?? [];
  delete body.line_items;

  // Validate required fields cheaply
  for (const k of ['name', 'client_name', 'client_email', 'frequency', 'next_run_date']) {
    if (!body[k]) return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
  }

  const { data: tpl, error } = await supabase
    .from('recurring_invoice_templates')
    .insert([body])
    .select('id')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (lineItems.length > 0) {
    const { error: liErr } = await supabase
      .from('recurring_invoice_line_items')
      .insert(lineItems.map(li => ({ ...li, template_id: tpl.id })));
    if (liErr) {
      // Roll back the parent
      await supabase.from('recurring_invoice_templates').delete().eq('id', tpl.id);
      return NextResponse.json({ error: `Line item insert failed: ${liErr.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, id: tpl.id });
}
