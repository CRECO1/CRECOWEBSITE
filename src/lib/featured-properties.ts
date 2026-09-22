/**
 * Synthetic listings for properties that live in code, not in the DB.
 *
 * These show up on `/listings` and the homepage Featured Properties
 * section alongside the real Supabase-backed listings, but their card
 * link target is a custom landing page (`landing_url`) instead of the
 * default `/listings/${slug}` detail route.
 *
 * Why not just add a row to the DB? Because:
 *   - These properties have bespoke landing pages with their own copy,
 *     gallery, lease terms, and inquiry form — the generic listing
 *     detail template doesn't represent them well.
 *   - Listings in the DB are typically third-party properties CRECO is
 *     repping. These are owned by CRECO and pre-leasing, which needs
 *     more storytelling than a spec sheet.
 *
 * To add another: define a Listing-shaped constant here, push it into
 * SYNTHETIC_LISTINGS, set `landing_url` to the dedicated page path.
 */

import type { Listing } from './supabase';

/**
 * 8000 Fair Oaks Plaza — mixed-use retail + executive suites in Fair
 * Oaks Ranch. Landing page lives at /8000-fair-oaks-pkwy. The card
 * thumbnail is the monument-sign photo — names the property at a
 * glance ("Fair Oaks Plaza 8000") and lists the marquee tenants
 * (Spotted Deer Coffee, Parker's Ice Creams, Fair Oaks Salon, Blume
 * Haus, Fair Oaks Realty Group), which carries more identifying
 * weight than any single building shot in a thumbnail-sized card.
 */
export const FAIR_OAKS_PLAZA_LISTING: Listing = {
  id: 'synth-fair-oaks-plaza',
  title: '8000 Fair Oaks Plaza',
  slug: '8000-fair-oaks-pkwy',
  address: '8000 Fair Oaks Pkwy',
  city: 'Fair Oaks Ranch',
  state: 'TX',
  zip: '78015',
  property_type: 'retail',
  transaction_type: 'lease',
  sale_price: null,
  lease_rate: null,                          // "Call for pricing" — no public quote
  lease_rate_basis: null,
  sqft: null,                                // varies — 4-bay retail + 2 exec suite bldgs
  available_sqft: null,
  lot_size: null,
  zoning: null,
  year_built: null,
  clear_height: null,
  dock_doors: null,
  grade_doors: null,
  headline: 'Mixed-use retail bays + executive office suites in Fair Oaks Ranch — now leasing',
  description: null,
  features: [
    'Fair Oaks Pkwy frontage',
    '4-bay retail center',
    'Two two-story executive office buildings',
    'Owner-represented by CRECO',
  ],
  images: ['/properties/8000-fair-oaks-pkwy/monument-sign.jpg'],
  brochure_url: null,
  virtual_tour_url: null,
  status: 'active',
  listing_date: null,
  closed_date: null,
  submarket: 'Fair Oaks Ranch',
  featured: true,
  latitude: 29.734008,                       // OSM house-level geocode (Sept 2026)
  longitude: -98.643139,
  geocoded_at: null,
  created_at: '',
  updated_at: '',
  landing_url: '/8000-fair-oaks-pkwy',
};

/**
 * 8923 Dietz Elkhorn — "Elkhorn Point" — new ±20,000 SF neighborhood
 * retail center pre-leasing in Fair Oaks Ranch: TWO ±10,000 SF retail
 * buildings, ground-up build-to-suit (nothing is built yet).
 *
 * The property has BOTH an internal landing page at /8923-dietz-elkhorn
 * AND a dedicated standalone site at elkhornpoint.com (built and managed
 * separately — NOTE: that site is outside this repo and must be updated
 * for the 8923 address / two-building program separately). The listing card here points to the standalone site
 * because it's the canonical presentation for this property — the
 * internal /8923-dietz-elkhorn page is kept around for SEO and direct
 * referrals but the standalone domain is where prospective tenants
 * should land. Card opens in a new tab so visitors don't lose context
 * of crecotx.com behind them.
 *
 * Thumbnail: the schematic site plan from the PUD26-01 submission, cropped
 * to the drawing only. It's not a building photo (the center hasn't been
 * built yet — it's pre-leasing) but it's the single most representative
 * visual we have until photography exists.
 */
export const DIETZ_ELKHORN_LISTING: Listing = {
  id: 'synth-8923-dietz-elkhorn',
  title: 'Elkhorn Point — 8923 Dietz Elkhorn',
  slug: '8923-dietz-elkhorn',
  address: '8923 Dietz Elkhorn Rd',
  city: 'Fair Oaks Ranch',
  state: 'TX',
  zip: '78015',
  property_type: 'retail',
  transaction_type: 'lease',
  sale_price: null,
  lease_rate: null,                          // "Call for pricing" — no public quote
  lease_rate_basis: null,
  sqft: 20000,                               // ±20K total GLA across two ±10,000 SF buildings
  available_sqft: 20000,
  lot_size: null,
  zoning: null,
  year_built: null,
  clear_height: null,
  dock_doors: null,
  grade_doors: null,
  headline: 'New ±20,000 SF neighborhood retail center — two ±10,000 SF buildings, built to suit, with F&B end caps',
  description: null,
  features: [
    'Two ±10,000 SF retail buildings',
    '±20,000 SF divisible — built to suit',
    'End-cap F&B positions with patio',
    'Pre-leasing local-first',
  ],
  images: ['/site-plans/8923-dietz-elkhorn-site-plan.png'],
  brochure_url: null,
  virtual_tour_url: null,
  status: 'active',
  listing_date: null,
  closed_date: null,
  submarket: 'Fair Oaks Ranch',
  featured: true,
  latitude: 29.73119,                        // OSM house-level geocode (Sept 2026)
  longitude: -98.662645,
  geocoded_at: null,
  created_at: '',
  updated_at: '',
  // External — standalone property site lives on its own domain.
  landing_url: 'https://elkhornpoint.com',
};

/**
 * 15033 Main St — multi-tenant retail FOR LEASE in Lytle, TX. CRECO
 * is both the OWNER and the leasing broker (same owner-operator
 * model as 8000 Fair Oaks Plaza). Landing page lives at
 * /15033-main-st-lytle.
 *
 * transaction_type='lease' so the listings grid filter "For Lease"
 * surfaces this asset to prospective tenants. The previous draft
 * accidentally framed this as a sale — corrected per owner: it is
 * not for sale, only for lease.
 *
 * `images: null` until on-site photos arrive — listings grid renders
 * a Building2 fallback icon on the card. The landing page itself
 * also ships without a hero photo; both degrade gracefully.
 *
 * SF + lease rate stay null because the LoopNet page is gated and
 * we don't want to guess. The card shows "Contact for pricing"; the
 * landing page elaborates with a full "Contact for details" spec
 * block. Update here + on the landing page (SPECS constant) when
 * the numbers come in.
 */
export const LYTLE_MAIN_ST_LISTING: Listing = {
  id: 'synth-15033-main-st-lytle',
  title: '15033 Main St — Lytle Retail Leasing',
  slug: '15033-main-st-lytle',
  address: '15033 Main St',
  city: 'Lytle',
  state: 'TX',
  zip: '78052',
  property_type: 'retail',
  transaction_type: 'lease',                 // FOR LEASE, not sale
  sale_price: null,
  lease_rate: null,                          // Call for pricing
  lease_rate_basis: 'NNN',                   // Standard for the property
  sqft: 11750,                               // 6 strip suites (11,100) + 1 standalone (650)
  available_sqft: null,                      // Per-suite availability varies; broker handles
  lot_size: null,
  zoning: null,
  year_built: null,
  clear_height: null,
  dock_doors: null,
  grade_doors: null,
  headline: '±11,750 SF multi-tenant retail center — 6 in-line suites (800–2,500 SF) + 650 SF standalone building',
  description: null,
  features: [
    '6 in-line suites (800 – 2,500 SF)',
    '650 SF standalone building',
    '5 established co-tenants in place',
    'NNN lease — I-35 corridor',
    'Owner-operator landlord (CRECO)',
  ],
  // front-wide is the clearest read at thumbnail size — shows the
  // whole building identity in one frame, blue corrugated roofline +
  // tenant signage visible. hero-corner is reserved for the landing
  // page hero so we don't burn its dramatic perspective on a small card.
  images: ['/properties/15033-main-st-lytle/front-wide.jpg'],
  brochure_url: null,
  virtual_tour_url: null,
  status: 'active',
  listing_date: null,
  closed_date: null,
  submarket: 'San Antonio Southwest',
  featured: true,
  // OSM house-level geocode for 15033 Main St (Sept 2026).
  latitude: 29.233958,
  longitude: -98.794303,
  geocoded_at: null,
  created_at: '',
  updated_at: '',
  landing_url: '/15033-main-st-lytle',
};

/** Add more bespoke landing-page listings to this array as they come up. */
export const SYNTHETIC_LISTINGS: Listing[] = [
  FAIR_OAKS_PLAZA_LISTING,
  DIETZ_ELKHORN_LISTING,
  LYTLE_MAIN_ST_LISTING,
];

/**
 * Resolve the click-through URL for a listing card.
 *
 * Default: `/listings/${slug}` (the generic detail page). When the
 * listing has a `landing_url`, that wins — the card routes to the
 * dedicated marketing page instead.
 */
export function listingHref(listing: Pick<Listing, 'slug' | 'landing_url'>): string {
  return listing.landing_url ?? `/listings/${listing.slug}`;
}

/**
 * Full anchor props for a listing card — handles internal vs. external
 * URLs in one call. External targets get `target="_blank" rel="noopener
 * noreferrer"` so the visitor doesn't lose context of crecotx.com when
 * jumping to a standalone property site (e.g. elkhornpoint.com).
 */
export function listingLinkProps(listing: Pick<Listing, 'slug' | 'landing_url'>): {
  href: string;
  target?: '_blank';
  rel?: 'noopener noreferrer';
} {
  const href = listingHref(listing);
  const external = /^https?:\/\//i.test(href);
  return external
    ? { href, target: '_blank', rel: 'noopener noreferrer' }
    : { href };
}

/**
 * Merge synthetic listings into a DB listings array, with the synthetic
 * ones pinned at the top so they read as the highest-priority items.
 *
 * Used on /listings (full grid) and on the homepage Featured Properties
 * section. Same call shape both places, so the ordering stays consistent.
 */
export function withSyntheticListings(dbListings: Listing[]): Listing[] {
  // De-dupe by slug in case a DB row ever lands with the same slug as a
  // synthetic one (the synthetic wins because it carries the bespoke
  // landing_url override).
  const syntheticSlugs = new Set(SYNTHETIC_LISTINGS.map(l => l.slug));
  const filteredDb = dbListings.filter(l => !syntheticSlugs.has(l.slug));
  return [...SYNTHETIC_LISTINGS, ...filteredDb];
}
