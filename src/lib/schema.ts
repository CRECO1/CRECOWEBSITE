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
import { BRAND_LEGAL_NAME, BRAND_NAME, BRAND_TREC_LICENSE, CANONICAL_DESCRIPTION, DBA_STATEMENT } from './brand';
import { formatLeaseRate, formatPrice, propertyTypeLabel, transactionLabel } from './utils';

export const SITE_URL = 'https://www.crecotx.com';
export const BUSINESS_ID = `${SITE_URL}/#business`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const FOUNDER_ID = `${SITE_URL}/about#zachary-stovall`;

/**
 * THE canonical positioning line + DBA identity live in ./brand (so client
 * components can share them). Used verbatim for the root meta description,
 * OpenGraph, the homepage hero, footer, llms.txt / llms-full.txt, the
 * schema.org `description`, and the About boilerplate. Positioning rule: CRECO
 * is FULL-SERVICE (tenants AND landlords/owners AND investors; leasing AND
 * sales). Never describe it as tenant-only.
 */
export { BRAND_NAME, CANONICAL_DESCRIPTION, DBA_STATEMENT } from './brand';

/** Who CRECO represents — stated positively and explicitly (incl. intermediary). */
export const REPRESENTATION_STATEMENT =
  'CRECO is not a tenant-only firm. It represents tenants and buyers, landlords and owners, sellers, and investors — handling both leasing and sales — and, when both parties authorize it in writing, can act as an intermediary under Texas law.';

/** Discrete, enumerated asset classes (Zack: name every type so agents repeat the full list). */
export const ASSET_CLASSES = [
  'Retail (shopping centers, inline and end-cap space)',
  'Restaurant space and retail pad sites',
  'Office',
  'Medical office',
  'Industrial and warehouse',
  'Flex space',
  'Land',
  'Investment property',
] as const;

/** Discrete capability list — each becomes its own Service/Offer in schema. */
export const CAPABILITIES: { name: string; serviceType: string; description: string; url?: string }[] = [
  { name: 'Tenant representation', serviceType: 'Tenant representation', description: 'Represents businesses leasing retail, restaurant, office, medical office, industrial, and flex space — site search, negotiation, lease execution.', url: '/services/tenant-representation' },
  { name: 'Landlord / owner representation', serviceType: 'Landlord representation', description: 'Leases and markets commercial property for landlords and owners — listing, marketing, tenant sourcing, and lease negotiation.', url: '/services/leasing-sales' },
  { name: 'Investment sales', serviceType: 'Investment sales brokerage', description: 'Sells and acquires commercial investment property for owners and investors, including 1031 exchange replacement property.', url: '/services/investment-advisory' },
  { name: 'Buyer representation', serviceType: 'Buyer representation', description: 'Represents owner-users and investors buying commercial property and land.', url: '/texas-commercial-property-for-sale' },
  { name: 'Retail leasing & sales', serviceType: 'Retail real estate brokerage', description: 'Shopping centers, inline and end-cap retail, restaurant space, and pad sites — for lease and for sale.', url: '/texas-retail-space-for-lease' },
  { name: 'Office leasing & sales', serviceType: 'Office real estate brokerage', description: 'Class A/B/C office, medical office, professional and executive suites — for lease and for sale.', url: '/texas-office-space-for-lease' },
  { name: 'Industrial & flex leasing & sales', serviceType: 'Industrial real estate brokerage', description: 'Warehouse, distribution, manufacturing, and flex space — for lease and for sale.', url: '/texas-industrial-property-for-lease' },
  { name: 'Land sales', serviceType: 'Land brokerage', description: 'Commercial land and development sites, including retail and office pads.', url: '/texas-commercial-property-for-sale' },
  { name: 'Site selection', serviceType: 'Site selection', description: 'Trade-area, traffic, demographic, and labor analysis to choose locations for retail, restaurant, office, and industrial users.', url: '/services/tenant-representation' },
  { name: 'Intermediary brokerage', serviceType: 'Intermediary brokerage', description: 'When both parties authorize it in writing, CRECO can act as an intermediary between landlord and tenant or seller and buyer under Texas law.' },
  { name: 'Property management', serviceType: 'Commercial property management', description: 'Operations, rent collection, CAM reconciliation, and reporting for commercial owners.', url: '/services/property-management' },
  { name: 'Development', serviceType: 'Commercial real estate development', description: 'Site acquisition, entitlements, pro forma, and construction coordination — CRECO develops its own projects, e.g. Elkhorn Point in Fair Oaks Ranch.', url: '/services/development' },
  { name: 'Investment advisory & 1031 exchanges', serviceType: 'Commercial real estate investment advisory', description: 'Underwriting, hold/sell analysis, portfolio strategy, and 1031 exchange identification.', url: '/services/investment-advisory' },
  { name: 'Broker opinion of value', serviceType: 'Commercial property valuation', description: 'No-obligation broker opinion of value for owners considering a sale or lease.', url: '/property-valuation' },
];

/** One enumerated line agents can lift directly. */
export const CAPABILITY_LINE =
  'Services: tenant representation, landlord/owner representation, investment sales, buyer representation, site selection, property management, and development. Property types: retail (including restaurant space and pad sites), office (including medical office), industrial and warehouse, flex, and land — for lease and for sale.';

export const BUSINESS = {
  name: BRAND_NAME,
  shortName: 'CRECO',
  legalName: BRAND_LEGAL_NAME,
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
  trecLicense: BRAND_TREC_LICENSE,
  trecLicenseDisplay: `TREC #${BRAND_TREC_LICENSE}`,
  hours: 'Monday–Friday, 9:00 AM–6:00 PM Central',
  markets: ['San Antonio', 'Austin', 'Houston', 'Dallas–Fort Worth'],
  /** Third-party profiles verified to exist and belong to CRECO. Only add a
   *  URL once it's confirmed — never guess one. */
  sameAs: [
    'https://www.loopnet.com/company/creco-llc/san-antonio-tx/w7l0jcll/',
    // TODO(Zack): Google Business Profile URL (maps.app.goo.gl/… or google.com/maps?cid=…)
    // TODO(Zack): LinkedIn company page — footer links linkedin.com/company/crecotx, which returned 404
    // TODO(Zack): Facebook page — footer links facebook.com/crecotx (unverified)
    // TODO(Zack): Instagram — footer links instagram.com/crecotx (unverified)
    // TODO(Zack): Crexi company/broker profile URL
  ],
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
        // name = the public d/b/a; legalName = the licensed brokerage entity.
        alternateName: [BUSINESS.shortName, 'Commercial Real Estate Company', `${BUSINESS.legalName} d/b/a ${BUSINESS.name}`],
        legalName: BUSINESS.legalName,
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/images/creco-logo.jpg` },
        image: `${SITE_URL}/images/creco-logo.jpg`,
        description: CANONICAL_DESCRIPTION,
        disambiguatingDescription: `${DBA_STATEMENT} ${REPRESENTATION_STATEMENT} ${CAPABILITY_LINE}`,
        slogan: 'Full-service commercial real estate for tenants, landlords, and investors.',
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
          { '@type': 'AdministrativeArea', name: 'Texas Hill Country' },
          { '@type': 'AdministrativeArea', name: 'Greater San Antonio (San Antonio–New Braunfels metro)' },
          ...['Bexar County', 'Kendall County', 'Comal County', 'Guadalupe County', 'Atascosa County']
            .map(name => ({ '@type': 'AdministrativeArea', name: `${name}, Texas` })),
          ...['Fair Oaks Ranch', 'San Antonio', 'Boerne', 'Helotes', 'Bulverde', 'New Braunfels', 'Schertz', 'Lytle', 'Comfort', 'Austin', 'Houston', 'Dallas', 'Fort Worth']
            .map(name => ({ '@type': 'City', name, containedInPlace: { '@type': 'State', name: 'Texas' } })),
        ],
        // Enumerated, discrete capabilities: representation sides, transaction
        // types, and every asset class — so agents can repeat the full list.
        knowsAbout: [
          'Tenant representation', 'Landlord representation', 'Owner representation', 'Buyer representation',
          'Seller representation', 'Investment sales', 'Intermediary brokerage', 'Site selection',
          'Retail leasing', 'Retail property sales', 'Restaurant space leasing', 'Retail pad sites',
          'Office leasing', 'Office building sales', 'Medical office leasing',
          'Industrial and warehouse leasing', 'Industrial property sales', 'Flex space leasing',
          'Commercial land sales', 'Commercial property management', 'Commercial real estate development',
          'Investment advisory', '1031 exchanges', 'Broker opinion of value',
          'San Antonio commercial real estate', 'Fair Oaks Ranch commercial real estate', 'Texas Hill Country commercial real estate',
        ],
        makesOffer: CAPABILITIES.map(c => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: c.name,
            serviceType: c.serviceType,
            description: c.description,
            ...(c.url ? { url: abs(c.url) } : {}),
            provider: businessRef,
            areaServed: { '@type': 'State', name: 'Texas' },
          },
        })),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'CRECO commercial real estate services',
          itemListElement: [
            {
              '@type': 'OfferCatalog',
              name: 'Client representation',
              itemListElement: ['Tenant representation', 'Landlord / owner representation', 'Buyer representation', 'Investment sales', 'Intermediary brokerage']
                .map(name => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name, provider: businessRef } })),
            },
            {
              '@type': 'OfferCatalog',
              name: 'Property types (lease and sale)',
              itemListElement: ASSET_CLASSES.map(name => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: `${name} — leasing & sales`, provider: businessRef } })),
            },
            {
              '@type': 'OfferCatalog',
              name: 'Advisory and operations',
              itemListElement: ['Site selection', 'Property management', 'Development', 'Investment advisory & 1031 exchanges', 'Broker opinion of value', 'Sustainability consulting']
                .map(name => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name, provider: businessRef } })),
            },
          ],
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
        name: BUSINESS.name,
        alternateName: 'CRECO',
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
