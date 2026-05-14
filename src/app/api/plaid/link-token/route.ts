import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { getPlaidClient, PLAID_COUNTRIES, PLAID_PRODUCTS } from '@/lib/plaid';

/**
 * POST /api/plaid/link-token
 *
 * Creates a short-lived link token the frontend uses to open Plaid Link.
 * The token is bound to a `client_user_id` — we use the authenticated
 * admin's auth.users.id so Plaid can attribute the linked Item back to
 * a specific operator. Tokens expire in 30 minutes.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { user } = auth;

  const plaid = getPlaidClient();
  if (!plaid) {
    return NextResponse.json(
      { error: 'Plaid not configured. Set PLAID_CLIENT_ID and PLAID_SECRET in Vercel env.' },
      { status: 503 },
    );
  }

  try {
    const res = await plaid.client.linkTokenCreate({
      client_name: 'CRECO Billing',
      user: { client_user_id: user.id },
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRIES,
      language: 'en',
    });
    return NextResponse.json({ link_token: res.data.link_token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[plaid/link-token]', msg);
    return NextResponse.json({ error: `Plaid error: ${msg}` }, { status: 500 });
  }
}
