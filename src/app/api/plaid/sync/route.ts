import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-auth';
import { syncAllAccounts } from '@/lib/plaid-sync';

/**
 * POST /api/plaid/sync — manual sync trigger.
 *
 * Useful for the "Sync now" button on the bank page so the operator
 * doesn't have to wait for the daily cron. Uses the same syncAllAccounts
 * helper so behaviour is identical.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(_req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { supabase } = auth;

  try {
    const results = await syncAllAccounts(supabase);
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
