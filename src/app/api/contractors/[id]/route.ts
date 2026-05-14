import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { clampString, MAX_LEN } from '@/lib/sanitize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Same sanitisation as POST but applied per-field so a PATCH can be partial. */
function sanitizePatch(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if ('legal_name' in body)    out.legal_name    = clampString(body.legal_name, MAX_LEN.name);
  if ('display_name' in body)  out.display_name  = body.display_name ? clampString(body.display_name, MAX_LEN.name) : null;
  if ('email' in body)         out.email         = body.email ? clampString(body.email, MAX_LEN.email) : null;
  if ('phone' in body)         out.phone         = body.phone ? clampString(body.phone, MAX_LEN.phone) : null;
  if ('tax_id' in body)        out.tax_id        = body.tax_id ? clampString(body.tax_id, 30) : null;
  if ('tax_id_type' in body)   out.tax_id_type   = body.tax_id_type === 'SSN' || body.tax_id_type === 'EIN' ? body.tax_id_type : null;
  if ('address_line1' in body) out.address_line1 = body.address_line1 ? clampString(body.address_line1, MAX_LEN.shortField) : null;
  if ('address_line2' in body) out.address_line2 = body.address_line2 ? clampString(body.address_line2, MAX_LEN.shortField) : null;
  if ('city' in body)          out.city          = body.city ? clampString(body.city, MAX_LEN.shortField) : null;
  if ('state' in body)         out.state         = body.state ? clampString(body.state, 2) : null;
  if ('zip' in body)           out.zip           = body.zip ? clampString(body.zip, 10) : null;
  if ('notes' in body)         out.notes         = body.notes ? clampString(body.notes, MAX_LEN.notes) : null;
  if ('active' in body)        out.active        = !!body.active;
  return out;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const clean = sanitizePatch(body);
  if (Object.keys(clean).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }
  if ('legal_name' in clean && !clean.legal_name) {
    return NextResponse.json({ error: 'legal_name cannot be empty' }, { status: 400 });
  }

  const { error } = await supabase
    .from('contractors')
    .update(clean)
    .eq('id', id);
  if (error) {
    console.error('[contractors.PATCH] update failed:', error.message);
    return NextResponse.json({ error: 'Could not save contractor' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { error } = await supabase
    .from('contractors')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('[contractors.DELETE] failed:', error.message);
    return NextResponse.json({ error: 'Could not delete contractor' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
