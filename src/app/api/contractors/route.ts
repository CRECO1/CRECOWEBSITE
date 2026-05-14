import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { clampString, MAX_LEN } from '@/lib/sanitize';

/**
 * POST /api/contractors — create a contractor record.
 *
 * Admin-only. Validates required fields + sane string lengths so we
 * never write giant blobs to the contractors table.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  // Cap every text field at MAX_LEN.shortField (or longer where appropriate).
  // The whole record is interpolated nowhere unsafe (HTML emails, etc) but
  // length caps protect the DB and keep the UI consistent.
  return {
    legal_name:    clampString(body.legal_name, MAX_LEN.name),
    display_name:  body.display_name ? clampString(body.display_name, MAX_LEN.name) : null,
    email:         body.email ? clampString(body.email, MAX_LEN.email) : null,
    phone:         body.phone ? clampString(body.phone, MAX_LEN.phone) : null,
    tax_id:        body.tax_id ? clampString(body.tax_id, 30) : null,
    tax_id_type:   body.tax_id_type === 'SSN' || body.tax_id_type === 'EIN' ? body.tax_id_type : null,
    address_line1: body.address_line1 ? clampString(body.address_line1, MAX_LEN.shortField) : null,
    address_line2: body.address_line2 ? clampString(body.address_line2, MAX_LEN.shortField) : null,
    city:          body.city ? clampString(body.city, MAX_LEN.shortField) : null,
    state:         body.state ? clampString(body.state, 2) : null,
    zip:           body.zip ? clampString(body.zip, 10) : null,
    notes:         body.notes ? clampString(body.notes, MAX_LEN.notes) : null,
    active:        body.active === false ? false : true,
  };
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const clean = sanitizeBody(body);
  if (!clean.legal_name) {
    return NextResponse.json({ error: 'legal_name is required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('contractors')
    .insert([clean])
    .select('id')
    .single();

  if (error) {
    console.error('[contractors.POST] insert failed:', error.message);
    return NextResponse.json({ error: 'Could not save contractor' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: data.id });
}
