import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncAllAccounts } from '@/lib/plaid-sync';

/**
 * GET /api/cron/plaid-sync
 *
 * Daily Vercel cron — pulls new transactions from every linked bank
 * account. Auth via CRON_SECRET header. Uses the service-role client
 * since the cron has no user session.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  try {
    const results = await syncAllAccounts(supabase);
    return NextResponse.json({
      ok: true,
      date: new Date().toISOString().slice(0, 10),
      accounts_synced: results.length,
      total_added: results.reduce((s, r) => s + r.added, 0),
      total_modified: results.reduce((s, r) => s + r.modified, 0),
      total_removed: results.reduce((s, r) => s + r.removed, 0),
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) { return GET(req); }
