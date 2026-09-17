/**
 * Single source of truth for CRECO's business facts + schema.org builders.
 *
 * Every JSON-LD block on the site should reference the business by @id
 * (BUSINESS_ID) rather than re-declaring name/address/phone, so search
 * engines and LLM crawlers resolve ONE entity with ONE set of facts. Before
 * this module, several templates emitted their own LocalBusiness / broker
 * objects with drifting coordinates and names.
 *
 * Coordinates were geocoded against OpenStreetMap at house level
 * (Sept 2026). If the office moves, change BUSINESS here and every page —
 * JSON-LD, llms-full.txt, FAQ answers — follows.
 */
import type { Listing } from './supabase';
import { listingHref } from './featured-properties';
import { formatLeaseRate, formatPrice, propertyTypeLabel, transactionLabel } from './utils';

export const SITE_URL = 'https://www.crecotx.com';
export const BUSINESS_ID = `${SITE_URL}/#business`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const FOUNDER_ID = `${SITE_URL}/about#zachary-stovall`;

export const BUSINESS = {
  name: 'CRECO – Commercial Real Estate Company',
  shortName: 'CRECO',
  legalName: 'CRECO LLC',
  phoneDisplay: '(210) 817-3443',
  phoneE164: '+1-210-817-3443',
  email: 'info@crecotx.com',
  streetAddress: '8000 Fair Oaks Pkwy, Suite 102',
  locality: 'Fair Oaks Ranch',
  region: 'TX',
  postalCode: '78015',
  country: 'US',
  fullAddress: '8000 Fair Oaks Pkwy, Suite 102, Fair Oaks Ranch, TX 78015',
  latitude: 29.734008,
  longitude: -98.643139,
  trecLicense: '9014367',
  trecLicenseDisplay: 'TREC #9014367-BB',
  hours: 'Monday–Friday, 9:00 AM–6:00 PM Central',
  markets: ['San Antonio', 'Austin', 'Houston', 'Dallas–Fort Worth'],
  /** Third-party profiles verified to exist and belong to CRECO. Add the
   *  Google Business Profile URL here once confirmed. */
  sameAs: ['https://www.loopnet.com/company/creco-llc/san-antonio-tx/w7l0jcll/'],
} as const;

export const FOUNDER = {
  name: 'Zachary A. Stovall',
  jobTitle: 'Broker & Founder',
  trecLicense: '691174',
  sameAs: [
    'https://www.linkedin.com/in/zachary-a-stovall-072b2646/',
    'https://www.loopnet.com/commercial-real-estate-brokers/profile/zachary-stovall/f0jq0evb',
  ],
};

export type Crumb = { name: string; path: string };
export type Faq = { q: string; a: string };

const abs = (path: string) => (/^https?:\/\//i.test(path) ? path : `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`);

/** Strip undefined/null/empty-array values so the emitted JSON stays clean. */
function compact<T>(value: T): T {
  if (Array.isArray(value)) return value.map(compact).filter(v => v !== undefined) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
      out[k] = compact(v);
    }
    return out as T;
  }
  return value;
}

export const businessRef = { '@id': BUSINESS_ID };

export function postalAddress() {
  return {
    '@type': 'PostalAddress',
    streetAddress: BUSINESS.streetAddress,
    addressLocality: BUSINESS.locality,
    addressRegion: BUSINESS.region,
    postalCode: BUSINESS.postalCode,
    addressCountry: BUSINESS.country,
  };
}

/** Sitewide graph: the business entity, its founder, and the WebSite. */
export function siteGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['RealEstateAgent', 'LocalBusiness', 'Organization'],
        '@id': BUSINESS_ID,
        name: BUSINESS.name,
        alternateName: [BUSINESS.shortName, 'CRECO Texas', 'Commercial Real Estate Company'],
        legalName: BUSINESS.legalName,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/creco-logo.jpg` },
        image: `${SITE_URL}/images/creco-logo.jpg`,
        description:
          'CRECO is a licensed Texas commercial real estate brokerage (TREC #9014367) headquartered in Fair Oaks Ranch in the San Antonio metro. It represents tenants, landlords/owners, buyers, sellers, and investors in retail, office, industrial, flex, and land transactions for lease and sale across San Antonio, Austin, Houston, Dallas–Fort Worth, and statewide Texas, and provides investment advisory, property management, and development services.',
        slogan: 'Principal-led Texas commercial real estate.',
        telephone: BUSINESS.phoneE164,
        email: BUSINESS.email,
        address: postalAddress(),
        geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.latitude, longitude: BUSINESS.longitude },
        hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.fullAddress)}`,
        identifier: { '@type': 'PropertyValue', propertyID: 'TREC License', value: BUSINESS.trecLicense },
        hasCredential: {
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: 'Texas Real Estate Broker License (business entity)',
          identifier: BUSINESS.trecLicense,
          recognizedBy: { '@type': 'GovernmentOrganization', name: 'Texas Real Estate Commission', url: 'https://www.trec.texas.gov' },
        },
        contactPoint: [{
          '@type': 'ContactPoint',
          contactType: 'sales',
          telephone: BUSINESS.phoneE164,
          email: BUSINESS.email,
          areaServed: 'US-TX',
          availableLanguage: ['English'],
        }],
        founder: { '@id': FOUNDER_ID },
        employee: [{ '@id': FOUNDER_ID }],
        sameAs: [...BUSINESS.sameAs],
        areaServed: [
          { '@type': 'State', name: 'Texas' },
          ...['San Antonio', 'Austin', 'Houston', 'Dallas', 'Fort Worth', 'Fair Oaks Ranch', 'Boerne', 'New Braunfels', 'Schertz', 'Lytle', 'Comfort']
            .map(name => ({ '@type': 'City', name, containedInPlace: { '@type': 'State', name: 'Texas' } })),
        ],
        knowsAbout: [
          'Commercial real estate brokerage', 'Retail space leasing', 'Office space leasing', 'Industrial and warehouse leasing',
          'Flex space', 'Commercial land sales', 'Tenant representation', 'Landlord representation', 'Investment sales',
          'Investment advisory', '1031 exchanges', 'Commercial property management', 'Commercial real estate development',
          'Broker opinion of value',
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Commercial Real Estate Services',
          itemListElement: [
            ['Tenant Representation', 'tenant-representation'],
            ['Investment Advisory', 'investment-advisory'],
            ['Leasing & Sales (Owner Representation)', 'leasing-sales'],
            ['Property Management', 'property-management'],
            ['Property Development', 'development'],
            ['Sustainability Consulting', 'sustainability'],
          ].map(([name, slug]) => ({
            '@type': 'Offer',
            itemOffered: { '@type': 'Service', name, url: `${SITE_URL}/services/${slug}`, provider: businessRef },
          })),
        },
        openingHoursSpecification: [{
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '18:00',
        }],
        priceRange: 'Commission-based; tenant representation typically paid by landlord',
        currenciesAccepted: 'USD',
      },
      {
        '@type': 'Person',
        '@id': FOUNDER_ID,
        name: FOUNDER.name,
        jobTitle: FOUNDER.jobTitle,
        worksFor: businessRef,
        url: `${SITE_URL}/about#team`,
        telephone: BUSINESS.phoneE164,
        hasCredential: {
          '@type': 'EducationalOccupationalCredential',
          credentialCategory: 'Texas Real Estate Broker License',
          identifier: FOUNDER.trecLicense,
          recognizedBy: { '@type': 'GovernmentOrganization', name: 'Texas Real Estate Commission' },
        },
        sameAs: FOUNDER.sameAs,
      },
      {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        url: SITE_URL,
        name: 'CRECO – Texas Commercial Real Estate',
        description: 'Texas commercial real estate listings, market data, and brokerage services — retail, office, industrial, flex, and land for lease and sale.',
        publisher: businessRef,
        inLanguage: 'en-US',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/listings?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  };
}

export function breadcrumbList(crumbs: Crumb[]) {
  const all = crumbs[0]?.path === '/' ? crumbs : [{ name: 'Home', path: '/' }, ...crumbs];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: abs(c.path) })),
  };
}

export function faqPage(faqs: Faq[], path?: string) {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': path ? `${abs(path)}#faq` : undefined,
    mainEntity: faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  });
}

/** WebPage-family node (AboutPage, ContactPage, CollectionPage…) tied to the site + business. */
export function webPage(type: string, path: string, name: string, description: string, extra: Record<string, unknown> = {}) {
  return compact({
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${abs(path)}#webpage`,
    url: abs(path),
    name,
    description,
    isPartOf: { '@id': WEBSITE_ID },
    about: businessRef,
    publisher: businessRef,
    inLanguage: 'en-US',
    ...extra,
  });
}

// ─── Listings ────────────────────────────────────────────────────────────────

/** Human asset-class label an agent can match against a query ("retail", "industrial"…). */
export function assetCategory(propertyType: string | null | undefined): string {
  const t = (propertyType ?? '').toLowerCase();
  if (t === 'warehouse' || t === 'industrial') return 'Industrial / Warehouse';
  if (!t) return 'Commercial';
  return propertyTypeLabel(t);
}

const AVAILABILITY: Record<string, string> = {
  active: 'https://schema.org/InStock',
  pending: 'https://schema.org/LimitedAvailability',
  leased: 'https://schema.org/SoldOut',
  sold: 'https://schema.org/SoldOut',
  'off-market': 'https://schema.org/Discontinued',
};

export function listingPriceText(l: Pick<Listing, 'transaction_type' | 'sale_price' | 'lease_rate' | 'lease_rate_basis'>): string {
  if (l.transaction_type !== 'lease' && l.sale_price) return formatPrice(l.sale_price);
  if (l.lease_rate) return formatLeaseRate(l.lease_rate, l.lease_rate_basis);
  return 'Contact for pricing';
}

export function listingUrl(l: Pick<Listing, 'slug' | 'landing_url'>): string {
  return abs(listingHref(l));
}

/** One-sentence factual summary used in ItemLists, FAQ answers and llms-full.txt. */
export function listingSummary(l: Listing): string {
  const sf = l.sqft && l.sqft > 0 ? `${l.sqft.toLocaleString()} SF ` : '';
  const txn = (transactionLabel(l.transaction_type) || 'available').toLowerCase();
  const where = [l.address, l.city].filter(Boolean).join(', ');
  return `${sf}${assetCategory(l.property_type).toLowerCase()} property ${txn} at ${where}, ${l.state || 'TX'} — ${listingPriceText(l)}`;
}

function listingOffers(l: Listing, url: string) {
  const availability = AVAILABILITY[l.status] ?? AVAILABILITY.active;
  const base = {
    '@type': 'Offer',
    url,
    availability,
    // Offer.category carries the asset class (retail / office / industrial…);
    // RealEstateListing itself has no `category` property in schema.org.
    category: assetCategory(l.property_type),
    itemOffered: { '@id': `${url}#property` },
    offeredBy: businessRef,
    seller: businessRef,
    areaServed: { '@type': 'State', name: 'Texas' },
  };
  const offers: Record<string, unknown>[] = [];
  const wantsSale = l.transaction_type === 'sale' || l.transaction_type === 'both';
  const wantsLease = l.transaction_type === 'lease' || l.transaction_type === 'both';
  if (wantsSale) {
    offers.push(l.sale_price
      ? { ...base, businessFunction: 'https://schema.org/Sell', price: l.sale_price, priceCurrency: 'USD' }
      : { ...base, businessFunction: 'https://schema.org/Sell', priceCurrency: 'USD', description: 'For sale — contact CRECO for pricing' });
  }
  if (wantsLease) {
    offers.push(l.lease_rate
      ? {
          ...base,
          businessFunction: 'https://schema.org/LeaseOut',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: l.lease_rate,
            priceCurrency: 'USD',
            unitCode: 'FTK',
            unitText: 'per square foot per year',
            referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'FTK' },
            description: `${l.lease_rate_basis ?? 'NNN'} per SF per year`,
          },
        }
      : { ...base, businessFunction: 'https://schema.org/LeaseOut', priceCurrency: 'USD', description: `For lease${l.lease_rate_basis ? ` (${l.lease_rate_basis})` : ''} — contact CRECO for pricing` });
  }
  return offers.length === 1 ? offers[0] : offers;
}

/**
 * RealEstateListing for a single property. `withContext` = false when the node
 * is nested inside an ItemList.
 */
export function listingSchema(
  l: Listing,
  opts: { withContext?: boolean; description?: string; images?: string[]; url?: string } = {},
) {
  const url = opts.url ? abs(opts.url) : listingUrl(l);
  const features = Array.isArray(l.features)
    ? (l.features as unknown[]).map(f => (typeof f === 'string' ? f : (f as { feature?: string })?.feature)).filter((f): f is string => !!f)
    : [];
  const images = (opts.images ?? l.images ?? []).map(abs);
  const category = assetCategory(l.property_type);
  const sqft = l.sqft && l.sqft > 0 ? l.sqft : null;
  const available = l.available_sqft && l.available_sqft > 0 ? l.available_sqft : null;

  const additionalProperty = [
    { name: 'Transaction type', value: transactionLabel(l.transaction_type) },
    { name: 'Property type', value: category },
    { name: 'Asking price / rate', value: listingPriceText(l) },
    l.lease_rate_basis && l.transaction_type !== 'sale' ? { name: 'Lease basis', value: l.lease_rate_basis } : null,
    available ? { name: 'Available square feet', value: available, unitCode: 'FTK' } : null,
    l.lot_size ? { name: 'Lot size (acres)', value: l.lot_size, unitCode: 'ACR' } : null,
    l.zoning ? { name: 'Zoning', value: l.zoning } : null,
    l.submarket ? { name: 'Submarket', value: l.submarket } : null,
    l.clear_height ? { name: 'Clear height (ft)', value: Number(l.clear_height), unitCode: 'FOT' } : null,
    l.dock_doors ? { name: 'Dock-high doors', value: Number(l.dock_doors) } : null,
    l.grade_doors ? { name: 'Grade-level doors', value: Number(l.grade_doors) } : null,
    { name: 'Listing status', value: l.status },
  ].filter(Boolean).map(p => ({ '@type': 'PropertyValue', ...p }));

  return compact({
    ...(opts.withContext === false ? {} : { '@context': 'https://schema.org' }),
    '@type': 'RealEstateListing',
    '@id': `${url}#listing`,
    name: l.title,
    url,
    description: opts.description ?? l.description ?? l.headline ?? listingSummary(l),
    abstract: listingSummary(l),
    image: images.length > 0 ? images : [`${SITE_URL}/images/creco-logo.jpg`],
    datePosted: l.listing_date ?? (l.created_at || undefined),
    dateModified: l.updated_at || undefined,
    keywords: [category, transactionLabel(l.transaction_type), l.city, l.submarket, 'Texas commercial real estate'].filter(Boolean).join(', '),
    about: {
      // Accommodation is the schema.org Place subtype that carries floorSize /
      // yearBuilt / amenityFeature — the closest valid fit for a commercial building.
      '@type': 'Accommodation',
      '@id': `${url}#property`,
      name: l.title,
      additionalType: category,
      address: {
        '@type': 'PostalAddress',
        streetAddress: l.address,
        addressLocality: l.city,
        addressRegion: l.state || 'TX',
        postalCode: l.zip,
        addressCountry: 'US',
      },
      geo: l.latitude != null && l.longitude != null
        ? { '@type': 'GeoCoordinates', latitude: Number(l.latitude), longitude: Number(l.longitude) }
        : undefined,
      containedInPlace: l.city ? { '@type': 'City', name: `${l.city}, Texas` } : undefined,
      floorSize: sqft ? { '@type': 'QuantitativeValue', value: sqft, unitCode: 'FTK', unitText: 'square feet' } : undefined,
      yearBuilt: l.year_built ?? undefined,
      amenityFeature: features.map(name => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
      additionalProperty,
    },
    offers: listingOffers(l, url),
    // The listing broker. `broker` isn't valid on RealEstateListing in
    // schema.org, so the brokerage is expressed as provider/publisher here and
    // as offeredBy/seller on each Offer.
    provider: businessRef,
    publisher: businessRef,
    accountablePerson: { '@id': FOUNDER_ID },
  });
}

/** ItemList of listings for collection / market / asset-class pages. */
export function listingItemList(listings: Listing[], path: string, name: string, description?: string) {
  return compact({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${abs(path)}#listings`,
    name,
    description,
    numberOfItems: listings.length,
    itemListOrder: 'https://schema.org/ItemListUnordered',
    itemListElement: listings.map((l, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: listingUrl(l),
      item: listingSchema(l, { withContext: false }),
    })),
  });
}
