/**
 * Syndication export — turns CRECO's active inventory into upload-ready files
 * for Crexi / Showcase / Brevitas / Biproxi etc., so listings don't get
 * hand-keyed into five portals.
 *
 * Sources, matching what /listings itself renders:
 *   - the Supabase `listings` table (status active or pending), read over the
 *     public REST endpoint with the anon key — the same rows the public site
 *     serves, nothing private;
 *   - SYNTHETIC_LISTINGS (src/lib/featured-properties.ts) — the CRECO-owned
 *     properties that live in code with bespoke landing pages.
 * `leased` / `sold` / `off-market` rows are excluded: a syndication feed that
 * ships a closed deal generates junk leads and erodes trust on the portal.
 *
 * NOTHING IS INVENTED. A missing size, rate or coordinate exports as an empty
 * cell and is counted in the "gaps" summary this script prints — so the gap is
 * visible and fixable at the source (the CRM), not papered over with a guess.
 *
 * Usage:
 *   npm run export:listings                 # writes to ~/Documents/CRECO/Marketing
 *   npm run export:listings -- <out-dir>
 *
 * Writes creco-listings-feed.csv / .json / .xml. Network call is bounded.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { SYNTHETIC_LISTINGS } from '../src/lib/featured-properties';
import type { Listing } from '../src/lib/supabase';

const SITE_URL = 'https://www.crecotx.com';
const DEFAULT_OUT_DIR = path.join(os.homedir(), 'Documents', 'CRECO', 'Marketing');
const REQUEST_TIMEOUT_MS = 25_000;

/** Listing agent of record for every syndicated row. */
const BROKER = {
  name: 'Zachary Stovall',
  phone: '(210) 817-3443',
  email: 'zack@crecotx.com',
  company: 'CRECO - Commercial Real Estate Company',
  license: 'TREC #9014367',
};

/** Per-listing broker override shown on crecotx.com, carried through as data. */
const SITE_ASSIGNED_BROKER: Record<string, string> = {
  'move-in-ready-medical-building': 'Brian Blanco, Director of Leasing',
};

/**
 * DB property_type → the asset class every syndication portal actually has a
 * dropdown for. Anything unmapped becomes "Specialty" and keeps its original
 * string in asset_type_raw, so a one-off type never silently becomes "Retail".
 */
const ASSET_CLASS: Record<string, string> = {
  retail: 'Retail',
  office: 'Office',
  industrial: 'Industrial',
  warehouse: 'Industrial',
  flex: 'Flex',
  land: 'Land',
  multifamily: 'Multifamily',
  'mixed-use': 'Mixed-Use',
};

function loadEnv(): Record<string, string> {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split('\n')
      .filter(l => l.includes('=') && !l.trim().startsWith('#'))
      .map(l => {
        const i = l.indexOf('=');
        return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
      }),
  );
}

async function fetchDbListings(): Promise<Listing[]> {
  const env = { ...loadEnv(), ...process.env } as Record<string, string>;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY missing (.env.local)');
  }
  const res = await fetch(
    `${url}/rest/v1/listings?select=*&status=in.(active,pending)&order=title.asc`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
  );
  if (!res.ok) throw new Error(`Supabase REST ${res.status}: ${await res.text()}`);
  return res.json() as Promise<Listing[]>;
}

const absUrl = (u: string) => (/^https?:\/\//i.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`);

const listingUrl = (l: Listing) =>
  l.landing_url ? absUrl(l.landing_url) : `${SITE_URL}/listings/${l.slug}`;

/** One flat, portal-shaped record per listing. */
type Row = Record<string, string | number | ''>;

function toRow(l: Listing): Row {
  const type = (l.property_type ?? '').toLowerCase();
  const assetClass = ASSET_CLASS[type] ?? 'Specialty';
  const isLand = assetClass === 'Land';

  const sqft = l.sqft && l.sqft > 0 ? l.sqft : null;
  const acres = l.lot_size && l.lot_size > 0 ? l.lot_size : null;
  // Land sells by the acre, everything else by the foot. When the primary
  // measure is absent the cell stays empty rather than falling back to the
  // other unit, which would silently change what the number means.
  const size = isLand ? acres : sqft;
  const sizeUnit = size == null ? '' : isLand ? 'acres' : 'SF';

  const forSale = l.transaction_type === 'sale' || l.transaction_type === 'both';
  const forLease = l.transaction_type === 'lease' || l.transaction_type === 'both';
  const saleOrLease = l.transaction_type === 'both' ? 'For Sale or Lease' : forSale ? 'For Sale' : 'For Lease';

  const price = forSale && l.sale_price ? l.sale_price : forLease && l.lease_rate ? l.lease_rate : null;
  const priceUnit = price == null ? '' : forSale && l.sale_price ? 'total (USD)' : `$/SF/yr${l.lease_rate_basis ? ` ${l.lease_rate_basis}` : ''}`;
  const priceDisplay = price == null
    ? 'Contact for pricing'
    : forSale && l.sale_price
      ? `$${l.sale_price.toLocaleString()}`
      : `$${l.lease_rate}/SF/yr${l.lease_rate_basis ? ` ${l.lease_rate_basis}` : ''}`;

  const images = (l.images ?? []).map(absUrl);
  const description = (l.description || l.headline || '').replace(/\s+/g, ' ').trim();

  return {
    property_name: l.title ?? '',
    address: l.address ?? '',
    city: l.city ?? '',
    state: l.state || 'TX',
    zip: l.zip ?? '',
    asset_type: assetClass,
    asset_type_raw: l.property_type ?? '',
    size: size ?? '',
    size_unit: sizeUnit,
    building_sf: sqft ?? '',
    available_sf: l.available_sqft && l.available_sqft > 0 ? l.available_sqft : '',
    lot_acres: acres ?? '',
    sale_or_lease: saleOrLease,
    price: price ?? '',
    price_unit: priceUnit,
    price_display: priceDisplay,
    description,
    highlights: (l.features ?? []).join(' | '),
    zoning: l.zoning ?? '',
    year_built: l.year_built ?? '',
    clear_height_ft: l.clear_height ?? '',
    dock_doors: l.dock_doors ?? '',
    grade_doors: l.grade_doors ?? '',
    submarket: l.submarket ?? '',
    latitude: l.latitude ?? '',
    longitude: l.longitude ?? '',
    broker_name: BROKER.name,
    broker_phone: BROKER.phone,
    broker_email: BROKER.email,
    broker_company: BROKER.company,
    broker_license: BROKER.license,
    site_assigned_broker: SITE_ASSIGNED_BROKER[l.slug] ?? '',
    listing_url: listingUrl(l),
    image_url: images[0] ?? '',
    all_image_urls: images.join(' | '),
    image_count: images.length,
    brochure_url: l.brochure_url || '',
    virtual_tour_url: l.virtual_tour_url || '',
    listing_id: l.slug,
    status: l.status,
    listing_date: l.listing_date ?? '',
    source: String(l.id).startsWith('synth-') ? 'code (landing page)' : 'supabase',
  };
}

/** Columns whose absence actually blocks a good portal listing. */
const REQUIRED = ['property_name', 'address', 'city', 'state', 'zip', 'size', 'price', 'description', 'image_url', 'latitude'] as const;

const csvCell = (v: string | number) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const xmlEscape = (v: string | number) =>
  String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function main() {
  const outDir = process.argv[2] || DEFAULT_OUT_DIR;
  fs.mkdirSync(outDir, { recursive: true });

  const db = await fetchDbListings();
  // Synthetic first, mirroring withSyntheticListings() on /listings, and
  // de-duped by slug the same way so a DB row can never double-publish.
  const syntheticSlugs = new Set(SYNTHETIC_LISTINGS.map(l => l.slug));
  const all = [...SYNTHETIC_LISTINGS, ...db.filter(l => !syntheticSlugs.has(l.slug))]
    .filter(l => l.status === 'active' || l.status === 'pending');

  const rows = all.map(toRow);
  const headers = Object.keys(rows[0] ?? {});

  const csv = [headers.join(','), ...rows.map(r => headers.map(h => csvCell(r[h] as string)).join(','))].join('\n');
  const generatedAt = new Date().toISOString();

  const json = {
    feed: 'CRECO commercial listings',
    provider: { name: BROKER.company, license: BROKER.license, url: SITE_URL, '@id': `${SITE_URL}/#organization` },
    broker: BROKER,
    generatedAt,
    count: rows.length,
    listings: rows,
  };

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!-- CRECO commercial listing feed. Generic flat schema: one <listing> per',
    '     property, element names matching the CSV columns. Portals that want a',
    '     proprietary DTD (Crexi, Catylist) can map from these names 1:1. -->',
    `<listings provider="${xmlEscape(BROKER.company)}" generatedAt="${generatedAt}" count="${rows.length}">`,
    ...rows.map(r =>
      ['  <listing>', ...headers.map(h => `    <${h}>${xmlEscape(r[h] as string)}</${h}>`), '  </listing>'].join('\n'),
    ),
    '</listings>',
    '',
  ].join('\n');

  const base = path.join(outDir, 'creco-listings-feed');
  fs.writeFileSync(`${base}.csv`, `${csv}\n`);
  fs.writeFileSync(`${base}.json`, `${JSON.stringify(json, null, 2)}\n`);
  fs.writeFileSync(`${base}.xml`, xml);

  console.log(`Exported ${rows.length} active listings:`);
  for (const ext of ['csv', 'json', 'xml']) console.log(`  ${base}.${ext}`);

  console.log('\nMissing fields per listing (empty in the feed — fix at the source, do not invent):');
  let clean = 0;
  for (const r of rows) {
    const gaps = REQUIRED.filter(k => r[k] === '' || r[k] === undefined);
    if (gaps.length === 0) { clean++; continue; }
    console.log(`  ${String(r.property_name).padEnd(34)} ${gaps.join(', ')}`);
  }
  console.log(`  (${clean}/${rows.length} listings complete on every required field)`);
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
