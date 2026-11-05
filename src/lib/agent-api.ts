import { getAvailableListings, filterListings } from '@/lib/public-listings';
import { getListingBySlug, type Listing } from '@/lib/supabase';
import { SYNTHETIC_LISTINGS } from '@/lib/featured-properties';
import { BUSINESS, SITE_URL, assetCategory, listingPriceText, listingUrl } from '@/lib/schema';
import { transactionLabel } from '@/lib/utils';

/**
 * Public, read-only data for outside AI agents (OpenAPI at /api/openapi.json).
 *
 * Two rules:
 *   1. An ALLOW-LIST projection. The listings table is read with select('*'), so a column added
 *      later must never reach an outside caller by accident: only the fields named in
 *      publicListing() are ever returned.
 *   2. Availability. The list endpoint serves available (active/pending) inventory only, the same
 *      set /llms-full.txt and the structured data use. A detail lookup by slug can return a closed
 *      listing, but its `status` says so.
 */

export const AGENT_API_VERSION = '1';
const MAX_LIMIT = 100;

export const AGENT_CONTACT = {
  name: BUSINESS.name,
  phone: BUSINESS.phoneDisplay,
  email: BUSINESS.email,
  address: BUSINESS.fullAddress,
  hours: BUSINESS.hours,
  website: SITE_URL,
  inquiry_url: `${SITE_URL}/get-started`,
  note: 'To inquire about a property, send the person to inquiry_url or have them call or email. This API does not accept inquiries.',
};

export function publicListing(l: Listing) {
  return {
    slug: l.slug,
    url: listingUrl(l),
    markdown_url: `${SITE_URL}/listings/${l.slug}.md`,
    title: l.title,
    headline: l.headline ?? null,
    description: l.description ?? null,
    status: l.status,
    transaction: l.transaction_type,
    asset_category: assetCategory(l.property_type),
    property_type: l.property_type,
    price_text: listingPriceText(l),
    sale_price: l.sale_price ?? null,
    lease_rate_per_sf_year: l.lease_rate ?? null,
    lease_rate_basis: l.lease_rate_basis ?? null,
    building_sqft: l.sqft ?? null,
    available_sqft: l.available_sqft ?? null,
    available_spaces: l.available_spaces ?? null,
    lot_acres: l.lot_size ?? null,
    year_built: l.year_built ?? null,
    zoning: l.zoning ?? null,
    clear_height_ft: l.clear_height ?? null,
    dock_doors: l.dock_doors ?? null,
    grade_doors: l.grade_doors ?? null,
    features: l.features ?? [],
    address: l.address,
    city: l.city,
    state: l.state || 'TX',
    zip: l.zip,
    submarket: l.submarket ?? null,
    latitude: l.latitude ?? null,
    longitude: l.longitude ?? null,
    images: l.images ?? [],
    brochure_url: l.brochure_url ?? null,
    virtual_tour_url: l.virtual_tour_url ?? null,
    listed_on: l.listing_date ?? null,
    updated_at: l.updated_at ?? null,
  };
}

export type ListQuery = {
  asset?: string; transaction?: 'lease' | 'sale'; city?: string; metro?: string; submarket?: string; q?: string;
  minSqft?: number; maxSqft?: number; maxLeaseRate?: number; maxPrice?: number; limit: number; offset: number;
};

const num = (v: string | null) => { if (v == null || v.trim() === '') return undefined; const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : undefined; };

export function parseListQuery(sp: URLSearchParams): ListQuery {
  const t = (sp.get('transaction') ?? '').toLowerCase();
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(num(sp.get('limit')) ?? 50)));
  return {
    asset: sp.get('type')?.trim() || undefined,
    transaction: t === 'lease' || t === 'sale' ? t : undefined,
    city: sp.get('city')?.trim() || undefined,
    metro: sp.get('metro')?.trim() || undefined,
    submarket: sp.get('submarket')?.trim() || undefined,
    q: sp.get('q')?.trim().toLowerCase() || undefined,
    minSqft: num(sp.get('min_sqft')), maxSqft: num(sp.get('max_sqft')),
    maxLeaseRate: num(sp.get('max_lease_rate')), maxPrice: num(sp.get('max_price')),
    limit, offset: Math.max(0, Math.floor(num(sp.get('offset')) ?? 0)),
  };
}

export async function queryListings(q: ListQuery): Promise<{ total: number; rows: Listing[] }> {
  let rows = filterListings(await getAvailableListings(), { metro: q.metro, city: q.city, asset: q.asset, transaction: q.transaction });
  if (q.submarket) rows = rows.filter(l => (l.submarket ?? '').toLowerCase() === q.submarket!.toLowerCase());
  const size = (l: Listing) => l.available_sqft ?? l.sqft ?? 0;
  if (q.minSqft != null) rows = rows.filter(l => size(l) >= q.minSqft!);
  if (q.maxSqft != null) rows = rows.filter(l => size(l) > 0 && size(l) <= q.maxSqft!);
  if (q.maxLeaseRate != null) rows = rows.filter(l => l.lease_rate != null && l.lease_rate <= q.maxLeaseRate!);
  if (q.maxPrice != null) rows = rows.filter(l => l.sale_price != null && l.sale_price <= q.maxPrice!);
  if (q.q) rows = rows.filter(l => [l.title, l.address, l.city, l.submarket, l.headline, l.description].join(' ').toLowerCase().includes(q.q!));
  return { total: rows.length, rows: rows.slice(q.offset, q.offset + q.limit) };
}

export async function findListing(slug: string): Promise<Listing | null> {
  const db = await getListingBySlug(slug).catch(() => null);
  return db ?? SYNTHETIC_LISTINGS.find(l => l.slug === slug) ?? null;
}

export function listingMarkdown(l: Listing): string {
  const sf = (n: number | null | undefined) => (n && n > 0 ? `${n.toLocaleString('en-US')} SF` : null);
  const lines = [
    `# ${l.title}`,
    '',
    l.headline ? `> ${l.headline}` : null,
    l.headline ? '' : null,
    `- Status: ${l.status}`,
    `- Transaction: ${transactionLabel(l.transaction_type) || l.transaction_type}`,
    `- Type: ${assetCategory(l.property_type)}`,
    `- Price / rate: ${listingPriceText(l)}`,
    `- Address: ${[l.address, l.city].filter(Boolean).join(', ')}, ${l.state || 'TX'} ${l.zip ?? ''}`.trim(),
    l.submarket ? `- Submarket: ${l.submarket}` : null,
    sf(l.sqft) ? `- Building size: ${sf(l.sqft)}` : null,
    sf(l.available_sqft) && l.available_sqft !== l.sqft ? `- Available: ${sf(l.available_sqft)}` : null,
    l.lot_size ? `- Lot: ${l.lot_size} acres` : null,
    l.year_built ? `- Year built: ${l.year_built}` : null,
    l.zoning ? `- Zoning: ${l.zoning}` : null,
    l.clear_height ? `- Clear height: ${l.clear_height} ft` : null,
    l.dock_doors ? `- Dock-high doors: ${l.dock_doors}` : null,
    l.grade_doors ? `- Grade-level doors: ${l.grade_doors}` : null,
    Array.isArray(l.features) && l.features.length ? `- Features: ${l.features.join('; ')}` : null,
    l.latitude != null && l.longitude != null ? `- Coordinates: ${l.latitude}, ${l.longitude}` : null,
    l.brochure_url ? `- Brochure: ${l.brochure_url}` : null,
    l.virtual_tour_url ? `- Virtual tour: ${l.virtual_tour_url}` : null,
    `- Web page: ${listingUrl(l)}`,
    `- JSON: ${SITE_URL}/api/v1/listings/${l.slug}`,
  ];
  const spaces = (l.available_spaces ?? []).map(s => `- Suite ${s.suite}${s.building ? ` (${s.building})` : ''}: ${sf(s.sqft) ?? ''}${s.note ? ` — ${s.note}` : ''}`);
  return [
    ...lines.filter((x): x is string => x !== null),
    ...(spaces.length ? ['', '## Available spaces', ...spaces] : []),
    ...(l.description ? ['', '## Description', '', String(l.description).trim()] : []),
    '',
    '## Contact',
    `${AGENT_CONTACT.name}: ${AGENT_CONTACT.phone} · ${AGENT_CONTACT.email} · inquiries: ${AGENT_CONTACT.inquiry_url}`,
    '',
  ].join('\n');
}

export function listingsMarkdown(rows: Listing[], total: number): string {
  return [
    '# CRECO available commercial properties',
    '',
    `${rows.length} of ${total} shown. Data refreshes about every 5 minutes. Each entry links to a detail page, a markdown version and JSON.`,
    '',
    ...rows.map(l => `- [${l.title}](${listingUrl(l)}): ${assetCategory(l.property_type)}, ${(transactionLabel(l.transaction_type) || '').toLowerCase()}, ${listingPriceText(l)}${l.sqft ? `, ${l.sqft.toLocaleString('en-US')} SF` : ''}, ${[l.address, l.city].filter(Boolean).join(', ')} (markdown: ${SITE_URL}/listings/${l.slug}.md)`),
    '',
    `Contact: ${AGENT_CONTACT.phone} · ${AGENT_CONTACT.email}`,
    '',
  ].join('\n');
}

export const CACHE = 'public, s-maxage=300, stale-while-revalidate=900';
export const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Accept, Content-Type' };
