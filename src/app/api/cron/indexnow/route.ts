import { NextRequest, NextResponse } from 'next/server';
import { isCronAuthorized } from '@/lib/cron-auth';

/**
 * GET /api/cron/indexnow
 *
 * Daily, via the cron dispatcher: tells IndexNow (Bing, and through Bing ChatGPT Search + Copilot)
 * about every sitemap URL whose lastmod changed in the last 36 hours, so new/updated listings and
 * pages are recrawled in hours instead of weeks. No-ops when nothing changed.
 * `?dry=1` lists what would be sent without sending. Manual full submit: `npm run indexnow -- --sitemap`.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const HOST = 'www.crecotx.com';
const KEY = '9246f38b795b1b2989ff05deba06c6f6';
const WINDOW_MS = 36 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  if (!isCronAuthorized(req.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const dry = req.nextUrl.searchParams.get('dry') === '1';
  const res = await fetch(`https://${HOST}/sitemap.xml`, { signal: AbortSignal.timeout(20_000), cache: 'no-store' });
  if (!res.ok) return NextResponse.json({ ok: false, error: `sitemap HTTP ${res.status}` }, { status: 502 });
  const xml = await res.text();
  const cutoff = Date.now() - WINDOW_MS;
  const urls: string[] = [];
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = m[1].match(/<loc>\s*([^<\s]+)\s*<\/loc>/)?.[1];
    const mod = m[1].match(/<lastmod>\s*([^<\s]+)\s*<\/lastmod>/)?.[1];
    if (!loc || !mod || new URL(loc).host !== HOST) continue;
    if (new Date(mod).getTime() >= cutoff) urls.push(loc);
  }
  if (!urls.length || dry) return NextResponse.json({ ok: true, changed: urls.length, sent: false, urls: dry ? urls : undefined });
  const post = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `https://${HOST}/${KEY}.txt`, urlList: urls.slice(0, 10_000) }),
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  const ok = !!post && (post.status === 200 || post.status === 202);
  return NextResponse.json({ ok, changed: urls.length, sent: ok, status: post?.status ?? null }, { status: ok ? 200 : 502 });
}
