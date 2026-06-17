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
 * thumbnail is the wide retail-strip shot (most representative of the
 * "this is a leasable storefront" intent for the listings grid; the
 * monument-sign shot is reserved as the landing-page hero so we don't
 * burn its first impression on a thumbnail).
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
  images: ['/properties/8000-fair-oaks-pkwy/retail-strip-wide.jpg'],
  brochure_url: null,
  virtual_tour_url: null,
  status: 'active',
  listing_date: null,
  closed_date: null,
  submarket: 'Fair Oaks Ranch',
  featured: true,
  latitude: 29.7456,                         // approx — Fair Oaks Pkwy / Hwy 10
  longitude: -98.6739,
  geocoded_at: null,
  created_at: '',
  updated_at: '',
  landing_url: '/8000-fair-oaks-pkwy',
};

/** Add more bespoke landing-page listings to this array as they come up. */
export const SYNTHETIC_LISTINGS: Listing[] = [
  FAIR_OAKS_PLAZA_LISTING,
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
