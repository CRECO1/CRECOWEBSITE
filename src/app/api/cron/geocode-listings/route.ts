import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/cron/geocode-listings
 *
 * Background job that finds every listing with NULL latitude/longitude and
 * geocodes its address against Google's Geocoding API. Writes the result
 * back to public.listings along with a geocoded_at timestamp.
 *
 * Strategy:
 *   1. Pull up to BATCH_LIMIT ungeocoded active/pending listings per run —
 *      keeps the run under Vercel's serverless time budget and the daily
 *      Google API spend bounded even on bulk imports.
 *   2. Build a one-line full address for each, call Geocoding API serially
 *      (Google rate-limits parallel requests sharing the same key — serial
 *      is safer, and the volume is small).
 *   3. Skip and log failures (ZERO_RESULTS, INVALID_REQUEST). Successful
 *      ones get written back even if some failed.
 *
 * Idempotent: re-runs only pick up listings still missing coordinates. Won't
 * re-geocode anything that's already been geocoded — to refresh, set
 * latitude=NULL on the row manually.
 *
 * Auth: Vercel cron header `Authorization: Bearer ${CRON_SECRET}`. Without
 * the secret it 401s — keeps the endpoint from being abusable to drain the
 * Google quota.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const BATCH_LIMIT = 25;

interface GeocodeResult {
  ok: true;
  checked: number;
  geocoded: number;
  failed: number;
  failures: { id: string; address: string; status: string }[];
}

interface ListingRow {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 });
  }
  if (req.headers.get('authorization') !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase env missing' }, { status: 503 });
  }
  if (!mapsKey) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing' }, { status: 503 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Only active/pending — closed/sold listings aren't worth burning quota on.
  const { data: rows, error } = await supabase
    .from('listings')
    .select('id, address, city, state, zip')
    .is('latitude', null)
    .in('status', ['active', 'pending'])
    .limit(BATCH_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const listings: ListingRow[] = rows ?? [];
  const failures: { id: string; address: string; status: string }[] = [];
  let geocoded = 0;

  for (const l of listings) {
    const addr = [l.address, l.city, l.state, l.zip].filter(Boolean).join(', ');
    if (!addr.trim()) {
      failures.push({ id: l.id, address: addr, status: 'EMPTY_ADDRESS' });
      continue;
    }
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${mapsKey}`,
        { cache: 'no-store' }
      );
      const json = await res.json();
      if (json.status !== 'OK' || !json.results?.[0]) {
        failures.push({ id: l.id, address: addr, status: json.status || 'NO_RESULTS' });
        continue;
      }
      const loc = json.results[0].geometry.location;
      const { error: upErr } = await supabase
        .from('listings')
        .update({
          latitude: loc.lat,
          longitude: loc.lng,
          geocoded_at: new Date().toISOString(),
        })
        .eq('id', l.id);
      if (upErr) {
        failures.push({ id: l.id, address: addr, status: `UPDATE_FAILED: ${upErr.message}` });
        continue;
      }
      geocoded++;
    } catch (e) {
      failures.push({ id: l.id, address: addr, status: `FETCH_ERROR: ${(e as Error).message}` });
    }
  }

  const result: GeocodeResult = {
    ok: true,
    checked: listings.length,
    geocoded,
    failed: failures.length,
    failures,
  };
  return NextResponse.json(result);
}
