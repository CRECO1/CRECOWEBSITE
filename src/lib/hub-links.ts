/**
 * Where a listing sits in the site's hub structure.
 *
 * Every listing detail page was a dead end: the audit found zero editorial
 * links from any of them to the city hub or the asset hub that page belongs
 * to, so the pages we most want to rank — /san-antonio-commercial-real-estate,
 * /san-antonio-industrial-space — collected nothing from the listings that are
 * literally about them. These links give a crawler (and a visitor who wants
 * more of the same) the way back up.
 *
 * Only hubs that actually exist are returned. A listing in a town with no hub
 * of its own falls back to the statewide asset page, which is still a real,
 * relevant destination rather than an invented one.
 */

export interface HubLink {
  href: string;
  label: string;
}

/**
 * Cities that have an indexable /<city>-commercial-real-estate hub. The
 * Austin / Houston / DFW hubs still exist but are noindex (outside the San
 * Antonio & Hill Country focus), so they are deliberately not linked here.
 */
const CITY_HUBS: Record<string, { path: string; label: string }> = {
  'san antonio':     { path: '/san-antonio-commercial-real-estate',     label: 'San Antonio' },
  'boerne':          { path: '/boerne-commercial-real-estate',          label: 'Boerne' },
  'fair oaks ranch': { path: '/fair-oaks-ranch-commercial-real-estate', label: 'Fair Oaks Ranch' },
};

/** Cities that additionally have per-asset hubs (/<city>-<asset>-space). */
const ASSET_HUB_CITIES: Record<string, string> = {
  'san antonio': 'san-antonio',
};

/** Our property_type values collapsed onto the three asset hubs we publish. */
function assetHubKey(propertyType: string | null | undefined): 'office' | 'retail' | 'industrial' | null {
  const t = (propertyType ?? '').toLowerCase();
  if (!t) return null;
  if (t.includes('office')) return 'office';           // covers "medical office"
  if (t.includes('retail')) return 'retail';
  if (t.includes('warehouse') || t.includes('industrial') || t.includes('flex')) return 'industrial';
  return null;
}

const ASSET_LABEL: Record<string, string> = {
  office: 'Office space',
  retail: 'Retail space',
  industrial: 'Industrial & warehouse space',
};

/** Region-wide (San Antonio & Hill Country) fallback per asset, and the sale page for for-sale listings. */
const TEXAS_ASSET_HUB: Record<string, HubLink> = {
  office:     { href: '/texas-office-space-for-lease',        label: 'San Antonio & Hill Country office space for lease' },
  retail:     { href: '/texas-retail-space-for-lease',        label: 'San Antonio & Hill Country retail space for lease' },
  industrial: { href: '/texas-industrial-property-for-lease', label: 'San Antonio & Hill Country industrial for lease' },
};
const TEXAS_FOR_SALE: HubLink = {
  href: '/texas-commercial-property-for-sale',
  label: 'San Antonio & Hill Country commercial property for sale',
};

export function hubLinksForListing(l: {
  city?: string | null;
  property_type?: string | null;
  transaction_type?: string | null;
}): HubLink[] {
  const city = (l.city ?? '').trim().toLowerCase();
  const asset = assetHubKey(l.property_type);
  const links: HubLink[] = [];

  const cityHub = CITY_HUBS[city];
  if (cityHub) links.push({ href: cityHub.path, label: `${cityHub.label} commercial real estate` });

  const assetCity = ASSET_HUB_CITIES[city];
  if (asset && assetCity) {
    links.push({ href: `/${assetCity}-${asset}-space`, label: `${ASSET_LABEL[asset]} in ${CITY_HUBS[city].label}` });
  } else if (asset) {
    // No city-level asset hub (Comfort, Lytle, Fair Oaks Ranch…) — the
    // statewide page is the honest next step up.
    links.push(TEXAS_ASSET_HUB[asset]);
  }

  const tx = (l.transaction_type ?? '').toLowerCase();
  if (tx === 'sale' || tx === 'both') links.push(TEXAS_FOR_SALE);

  // De-duplicate by href, keep order.
  const seen = new Set<string>();
  return links.filter(x => (seen.has(x.href) ? false : (seen.add(x.href), true)));
}

/** Markets a service page should point at — San Antonio & the Hill Country. */
export const SERVICE_MARKET_LINKS: HubLink[] = [
  { href: '/san-antonio-commercial-real-estate',     label: 'San Antonio' },
  { href: '/fair-oaks-ranch-commercial-real-estate', label: 'Fair Oaks Ranch' },
  { href: '/boerne-commercial-real-estate',          label: 'Boerne' },
  { href: '/markets/stone-oak',                      label: 'Stone Oak' },
  { href: '/markets/northwest-san-antonio',          label: 'Northwest San Antonio' },
  { href: '/markets/new-braunfels',                  label: 'New Braunfels' },
];
