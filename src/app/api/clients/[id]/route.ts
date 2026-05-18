import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { clampString, isValidEmail, MAX_LEN } from '@/lib/sanitize';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizePatch(body: Record<string, unknown>): Record<string, unknown> | { error: string } {
  const out: Record<string, unknown> = {};
  if ('email' in body) {
    if (!isValidEmail(body.email)) return { error: 'Valid email is required' };
    out.email = (body.email as string).trim().toLowerCase();
  }
  if ('name' in body) {
    const n = clampString(body.name, MAX_LEN.name);
    if (!n) return { error: 'Name cannot be empty' };
    out.name = n;
  }
  if ('company' in body)            out.company            = body.company            ? clampString(body.company, MAX_LEN.company) : null;
  if ('address' in body)            out.address            = body.address            ? clampString(body.address, MAX_LEN.message) : null;
  if ('phone' in body)              out.phone              = body.phone              ? clampString(body.phone, MAX_LEN.phone) : null;
  if ('property_reference' in body) out.property_reference = body.property_reference ? clampString(body.property_reference, MAX_LEN.shortField) : null;
  if ('notes' in body)              out.notes              = body.notes              ? clampString(body.notes, MAX_LEN.notes) : null;
  if ('active' in body)             out.active             = !!body.active;
  if ('default_tax_rate' in body) {
    const v = body.default_tax_rate;
    if (v === null || v === undefined || v === '') {
      out.default_tax_rate = null;
    } else if (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 1) {
      out.default_tax_rate = v;
    }
  }
  if ('default_payment_terms' in body) {
    out.default_payment_terms = body.default_payment_terms ? clampString(body.default_payment_terms, MAX_LEN.shortField) : null;
  }
  if ('reminders_enabled_default' in body) out.reminders_enabled_default = !!body.reminders_enabled_default;
  if ('reminder_cadence' in body) {
    const c = body.reminder_cadence;
    if (c === 'standard' || c === 'gentle' || c === 'firm') {
      out.reminder_cadence = c;
    }
  }
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
  if ('error' in clean) return NextResponse.json(clean, { status: 400 });
  if (Object.keys(clean).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error } = await supabase
    .from('clients')
    .update(clean)
    .eq('id', id);
  if (error) {
    console.error('[clients.PATCH]', error.message);
    return NextResponse.json({ error: 'Could not save client' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) {
    console.error('[clients.DELETE]', error.message);
    return NextResponse.json({ error: 'Could not delete client' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
