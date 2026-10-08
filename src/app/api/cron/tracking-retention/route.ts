import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cron/tracking-retention
 *
 * Keeps first-party visitor tracking for 12 months. Deletes crecotx.com rows older than RETENTION_DAYS from the
 * CRM project's site_pageviews and site_events (the tracker's sink — see lib/tracker.ts). Only this site's rows
 * are touched; the other sites sharing those tables are left alone.
 *
 * Runs daily from /api/cron/dispatch. Idempotent. `?dry=1` reports what would be deleted without deleting.
 * Auth: `Authorization: Bearer ${CRON_SECRET}` (the dispatcher forwards it).
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RETENTION_DAYS = 365;
const SITES = '(crecotx.com,www.crecotx.com)';
const TABLES = ['site_events', 'site_pageviews'] as const;

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  if (req.headers.get('authorization') !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = (process.env.CRM_SUPABASE_URL ?? '').trim();
  const key = (process.env.CRM_SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
  if (!url || !key) return NextResponse.json({ ok: true, skipped: 'CRM_SUPABASE_* not configured' });

  const dry = req.nextUrl.searchParams.get('dry') === '1';
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
  const headers = { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact, return=minimal' };
  const deleted: Record<string, number | string> = {};

  for (const table of TABLES) {
    const qs = `site=in.${SITES}&created_at=lt.${encodeURIComponent(cutoff)}`;
    try {
      // HEAD counts without touching anything; DELETE removes and reports the same Content-Range.
      const res = await fetch(`${url}/rest/v1/${table}?${qs}`, {
        method: dry ? 'HEAD' : 'DELETE',
        headers,
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) { deleted[table] = `http_${res.status}`; continue; }
      const range = res.headers.get('content-range') ?? '';       // "0-41/42" or "*/0"
      deleted[table] = Number(range.split('/')[1]) || 0;
    } catch (err) {
      deleted[table] = err instanceof Error ? err.message.slice(0, 80) : 'error';
    }
  }

  return NextResponse.json({ ok: true, dry, cutoff, retention_days: RETENTION_DAYS, rows: deleted });
}
