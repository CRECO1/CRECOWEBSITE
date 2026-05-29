import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { clampString, isValidEmail, MAX_LEN } from '@/lib/sanitize';

/**
 * POST /api/clients — create a client.
 *
 * Used by the /billing/clients management UI. Invoice + recurring
 * template forms use upsertClient() (in src/lib/client-upsert.ts) on
 * save, not this endpoint — that path needs to be transactional with
 * the invoice itself.
 *
 * Dedupe is enforced by the unique lower(email) index — re-posting the
 * same email returns 409 with the existing client's id.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitize(body: Record<string, unknown>): Record<string, unknown> | { error: string } {
  if (!isValidEmail(body.email)) return { error: 'Valid email is required' };
  const name = clampString(body.name, MAX_LEN.name);
  if (!name) return { error: 'Name is required' };

  // Defaults — all optional. Clamp numbers, gate enums.
  const taxRaw = body.default_tax_rate;
  const taxRate = typeof taxRaw === 'number' && Number.isFinite(taxRaw) && taxRaw >= 0 && taxRaw <= 1
    ? taxRaw : null;
  const cadenceRaw = body.reminder_cadence;
  const cadence = cadenceRaw === 'gentle' || cadenceRaw === 'firm' || cadenceRaw === 'standard'
    ? cadenceRaw : null;

  return {
    name,
    email: (body.email as string).trim().toLowerCase(),
    company:            body.company            ? clampString(body.company, MAX_LEN.company) : null,
    address:            body.address            ? clampString(body.address, MAX_LEN.message) : null,
    phone:              body.phone              ? clampString(body.phone, MAX_LEN.phone) : null,
    property_reference: body.property_reference ? clampString(body.property_reference, MAX_LEN.shortField) : null,
    notes:              body.notes              ? clampString(body.notes, MAX_LEN.notes) : null,
    active:             body.active === false ? false : true,
    default_tax_rate:          taxRate,
    default_payment_terms:     body.default_payment_terms ? clampString(body.default_payment_terms, MAX_LEN.shortField) : null,
    reminders_enabled_default: body.reminders_enabled_default === false ? false : true,
    reminder_cadence:          cadence,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const clean = sanitize(body);
  if ('error' in clean) return NextResponse.json(clean, { status: 400 });

  const { data, error } = await supabase
    .from('clients')
    .insert([clean])
    .select('id')
    .single();
  if (error) {
    // Unique violation on email — return the existing row instead so the
    // caller can transparently treat it as "already saved".
    if ((error as { code?: string }).code === '23505') {
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .ilike('email', String(clean.email))
        .single();
      if (existing) return NextResponse.json({ ok: true, id: existing.id, existed: true });
    }
    // Admin-only endpoint — surface the real Postgres error so schema
    // drift / RLS denials / missing column issues are visible in the
    // form's error banner without having to dig through Vercel logs.
    console.error('[clients.POST] insert failed:', error.message, error);
    const code = (error as { code?: string }).code;
    return NextResponse.json(
      { error: `Save failed: ${error.message}${code ? ` (${code})` : ''}` },
      { status: 500 },
    );
  }
  return NextResponse.json({ ok: true, id: data.id });
}
