import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/cron/geocode-listings
 *
 * Background job that finds every listing with NULL latitude/longitude and
 * geocodes its address. Writes the result back to public.listings along
 * with a geocoded_at timestamp.
 *
 * Geocoder: the US Census Bureau geocoder (public domain, no key, no
 * billing) with OpenStreetMap Nominatim as a fallback for addresses the
 * Census benchmark can't match (new construction, PO-style addresses).
 * Google's Geocoding API was dropped because the CRECO Cloud project has
 * no billing account, so every call was rejected.
 *
 * Strategy:
 *   1. Pull up to BATCH_LIMIT ungeocoded active/pending listings per run —
 *      keeps the run under Vercel's serverless time budget.
 *   2. Build a one-line full address for each and geocode serially
 *      (Nominatim's usage policy is 1 request/second; the volume is small).
 *   3. Skip and log failures. Successful ones get written back even if
 *      some failed.
 *
 * Idempotent: re-runs only pick up listings still missing coordinates. Won't
 * re-geocode anything that's already been geocoded — to refresh, set
 * latitude=NULL on the row manually.
 *
 * Auth: Vercel cron header `Authorization: Bearer ${CRON_SECRET}`. Without
 * the secret it 401s — keeps the endpoint from being abusable.
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

type GeoHit = { lat: number; lng: number; source: 'census' | 'nominatim' };

// Nominatim requires an identifying User-Agent; the Census geocoder doesn't
// care but it's harmless to send the same one.
const GEOCODER_UA = 'crecotx.com listings geocoder (info@crecotx.com)';

async function geocodeCensus(addr: string): Promise<GeoHit | null> {
  const url =
    'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress' +
    `?address=${encodeURIComponent(addr)}&benchmark=Public_AR_Current&format=json`;
  const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': GEOCODER_UA } });
  if (!res.ok) return null;
  const json = await res.json();
  const m = json?.result?.addressMatches?.[0];
  const x = Number(m?.coordinates?.x);
  const y = Number(m?.coordinates?.y);
  if (!m || !Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { lat: y, lng: x, source: 'census' };
}

async function geocodeNominatim(addr: string): Promise<GeoHit | null> {
  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?q=${encodeURIComponent(addr)}&format=jsonv2&limit=1&countrycodes=us`;
  const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': GEOCODER_UA } });
  if (!res.ok) return null;
  const json = await res.json();
  const hit = Array.isArray(json) ? json[0] : null;
  const lat = Number(hit?.lat);
  const lng = Number(hit?.lon);
  if (!hit || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng, source: 'nominatim' };
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

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
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase env missing' }, { status: 503 });
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Only active/pending — closed/sold listings aren't worth geocoding.
  const { data: rows, error } = await supabase
    .from('listings')
    .select('id, address, city, state, zip')
    .is('latitude', null)
    .in('status', ['active', 'pending'])
    .limit(BATCH_LIMIT);

  if (error) {
    console.error('[cron/geocode-listings] DB error:', error);
    return NextResponse.json({ error: 'Could not load listings' }, { status: 500 });
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
      let hit = await geocodeCensus(addr);
      if (!hit) {
        await sleep(1100); // Nominatim: max 1 req/s
        hit = await geocodeNominatim(addr);
      }
      if (!hit) {
        failures.push({ id: l.id, address: addr, status: 'NO_RESULTS' });
        continue;
      }
      const { error: upErr } = await supabase
        .from('listings')
        .update({
          latitude: hit.lat,
          longitude: hit.lng,
          geocoded_at: new Date().toISOString(),
        })
        .eq('id', l.id);
      if (upErr) {
        // Don't echo raw Supabase error text — it can include column names /
        // table structure that has no business being in a response body even
        // behind CRON_SECRET. Log the full thing server-side instead.
        console.error('[geocode-listings] update failed', { id: l.id, code: (upErr as { code?: string }).code, msg: upErr.message });
        failures.push({ id: l.id, address: addr, status: `UPDATE_FAILED: ${(upErr as { code?: string }).code ?? 'unknown'}` });
        continue;
      }
      geocoded++;
    } catch (e) {
      const msg = (e as Error).message?.slice(0, 100) ?? 'unknown';
      console.error('[geocode-listings] fetch failed', { id: l.id, msg });
      failures.push({ id: l.id, address: addr, status: 'FETCH_ERROR' });
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
