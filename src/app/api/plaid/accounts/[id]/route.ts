import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getPlaidClient } from '@/lib/plaid';

/**
 * DELETE /api/plaid/accounts/[id]
 *
 * Disconnects a linked bank account. Calls Plaid /item/remove to
 * invalidate the access_token (so the credential can't be used to
 * pull more transactions), then deletes the bank_accounts row.
 * Transactions cascade-delete with the row, which is the right
 * default — if you want to keep them for audit, mark `active=false`
 * via PATCH instead.
 *
 * PATCH /api/plaid/accounts/[id]
 * Body: { active: boolean } — pause sync without removing the link.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  let body: { active?: boolean };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'active required (boolean)' }, { status: 400 });
  }
  const { error } = await supabase
    .from('bank_accounts')
    .update({ active: body.active })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const { id } = await params;
  // Fetch the access_token so we can invalidate it server-side
  const { data: row } = await supabase
    .from('bank_accounts')
    .select('plaid_access_token, plaid_item_id')
    .eq('id', id)
    .single();

  // Best-effort: call Plaid to revoke the item. Don't block the delete
  // if Plaid errors — operator wants the row gone either way.
  if (row?.plaid_access_token) {
    const plaid = getPlaidClient();
    if (plaid) {
      try {
        await plaid.client.itemRemove({ access_token: row.plaid_access_token });
      } catch (err) {
        console.warn('[plaid/account.DELETE] itemRemove failed:', err);
      }
    }
  }

  const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
