import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getPlaidClient } from '@/lib/plaid';

/**
 * POST /api/plaid/exchange
 *
 * Called by the frontend on Plaid Link success. We exchange the
 * public_token for a long-lived access_token, fetch the institution +
 * account metadata, and persist one row per linked account.
 *
 * Body: { public_token: string }
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  const plaid = getPlaidClient();
  if (!plaid) {
    return NextResponse.json({ error: 'Plaid not configured' }, { status: 503 });
  }

  let body: { public_token?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (!body.public_token) {
    return NextResponse.json({ error: 'public_token required' }, { status: 400 });
  }

  try {
    // 1. Exchange the public token for an access token
    const exchange = await plaid.client.itemPublicTokenExchange({
      public_token: body.public_token,
    });
    const access_token = exchange.data.access_token;
    const item_id = exchange.data.item_id;

    // 2. Pull institution + accounts metadata
    const itemRes = await plaid.client.itemGet({ access_token });
    const accountsRes = await plaid.client.accountsGet({ access_token });

    let institutionName: string | null = null;
    if (itemRes.data.item.institution_id) {
      try {
        const instRes = await plaid.client.institutionsGetById({
          institution_id: itemRes.data.item.institution_id,
          country_codes: ['US' as never],
        });
        institutionName = instRes.data.institution.name;
      } catch {
        // Institution lookup is best-effort; if it fails we still link
        // the account, just without the human name.
      }
    }

    // 3. Insert one bank_accounts row per account on this Item
    const rows = accountsRes.data.accounts.map(a => ({
      plaid_item_id: item_id,
      plaid_access_token: access_token,
      plaid_account_id: a.account_id,
      institution_name: institutionName,
      account_name: a.name,
      account_mask: a.mask,
      account_type: String(a.type),
      account_subtype: a.subtype ? String(a.subtype) : null,
      active: true,
    }));

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No accounts on this Item' }, { status: 400 });
    }

    const { error: insertErr } = await supabase
      .from('bank_accounts')
      .upsert(rows, { onConflict: 'plaid_account_id' });

    if (insertErr) {
      console.error('[plaid/exchange] insert failed:', insertErr.message);
      return NextResponse.json({ error: 'Could not save accounts' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, accounts_linked: rows.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[plaid/exchange]', msg);
    return NextResponse.json({ error: `Plaid error: ${msg}` }, { status: 500 });
  }
}
