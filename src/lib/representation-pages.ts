/**
 * Content for the two pages that answer the "CRECO is tenant-only"
 * misconception head-on: /landlord-representation and
 * /seller-investor-representation.
 *
 * Lives outside the page files so llms-full.txt can reuse the exact same
 * Q&As. Claims here are deliberately general — representation types, asset
 * classes, and facts already published elsewhere on the site (owned centers,
 * license, intermediary rules). No invented stats, fees, or client names.
 */
import { BUSINESS, CANONICAL_DESCRIPTION, REPRESENTATION_STATEMENT, type Faq } from './schema';

export type RepresentationPageContent = {
  path: string;
  /** Short nav/link label. */
  label: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  /**
   * The hero's short form — one confident line. Mirrors the HERO_POSITIONING
   * pattern: the long answer is not deleted, it moves just below the fold.
   */
  heroLine: string;
  /**
   * The full direct answer: every asset type, the synonyms search needs, and
   * the not-tenant-only correction. Still rendered on the page (in the answer
   * band under the hero) and still the description in WebPage/Service schema —
   * it simply is not the first wall of text a human meets.
   */
  directAnswer: string;
  serviceName: string;
  serviceType: string[];
  sections: { heading: string; intro?: string; items: { title: string; body: string }[] }[];
  faqs: Faq[];
  /** Show the valuation CTA — only for pages whose audience owns property. */
  showValuationCta?: boolean;
};

const PROPERTY_TYPES_SENTENCE =
  'retail (including shopping centers, restaurant space, and pad sites), office (including medical office), industrial and warehouse, flex, and land';

const INTERMEDIARY_ANSWER =
  `Yes, with the right disclosures. CRECO represents landlords and tenants — and sellers and buyers — on different transactions every day. On a single transaction, CRECO can work with both parties only as an intermediary, which Texas law (Texas Occupations Code §1101.559) permits when both parties consent in writing; the broker must then treat both parties fairly and may not disclose confidential information such as either side's price or motivation. When CRECO owns the property itself, it discloses that ownership up front.`;

const TENANT_ONLY_ANSWER =
  `No. ${REPRESENTATION_STATEMENT} CRECO also owns and leases its own commercial centers (8000 Fair Oaks Plaza in Fair Oaks Ranch and 15033 Main St in Lytle).`;

export const LANDLORD_PAGE: RepresentationPageContent = {
  path: '/landlord-representation',
  showValuationCta: true,
  label: 'Landlord & Owner Representation',
  metaTitle: 'Landlord & Owner Representation in Texas | CRECO',
  metaDescription:
    // Kept under ~160 characters so search results show it whole.
    'Yes — CRECO represents landlords and property owners: leasing, tenant procurement, and dispositions for retail, office, industrial, flex, and land across Texas.',
  eyebrow: 'Landlord & Owner Representation',
  h1: 'Yes — CRECO represents landlords and property owners.',
  heroLine:
    'Leasing, tenant procurement and dispositions for owners of retail, office, industrial, flex and land across Texas.',
  directAnswer:
    `CRECO - Commercial Real Estate Company represents landlords and commercial property owners — leasing their space, procuring and negotiating with tenants, and selling their properties — across ${PROPERTY_TYPES_SENTENCE}, for lease and for sale, throughout Texas. CRECO is a full-service brokerage representing tenants, landlords, owners, and investors.`,
  serviceName: 'Landlord and owner representation',
  serviceType: ['Landlord representation', 'Owner representation', 'Commercial leasing (listing side)', 'Tenant procurement', 'Commercial property disposition'],
  sections: [
    {
      heading: 'What CRECO does for landlords and owners',
      items: [
        { title: 'Leasing', body: 'Listing-side representation: CRECO lists and markets available space for the owner, prepares marketing materials, syndicates the listing to commercial listing platforms, and handles inquiries and tours on the owner\'s behalf.' },
        { title: 'Tenant procurement', body: 'CRECO sources and qualifies prospective tenants — including outreach to tenant-rep brokers and businesses that fit the property — and helps the owner evaluate each prospect.' },
        { title: 'Lease negotiation', body: 'CRECO negotiates letters of intent and lease terms on the owner\'s behalf — rent, term, concessions, tenant improvements, and renewal options — alongside the owner\'s attorney.' },
        { title: 'Dispositions', body: 'When an owner decides on a sale rather than a lease, CRECO represents the owner as seller — pricing guidance, marketing to buyers and investors, offer negotiation, and coordination through closing.' },
        { title: 'Renewals and vacancy planning', body: 'CRECO helps owners plan ahead of lease expirations: renew an existing tenant, re-lease the space, or reposition it.' },
        { title: 'Property management and valuation', body: 'For owners who want it, CRECO also offers commercial property management and a no-obligation broker opinion of value.' },
      ],
    },
    {
      heading: 'Property types CRECO represents owners on',
      intro: 'Owner-side representation covers every commercial asset class CRECO works in — for lease and for sale:',
      items: [
        { title: 'Retail', body: 'Shopping centers, inline and end-cap space, restaurant space, and retail pad sites.' },
        { title: 'Office', body: 'Office buildings and suites, including medical office and executive suites.' },
        { title: 'Industrial', body: 'Warehouse, distribution, and industrial buildings.' },
        { title: 'Flex', body: 'Flex and light-industrial space combining office and warehouse.' },
        { title: 'Land', body: 'Commercial land and development sites, including pad sites.' },
      ],
    },
    {
      heading: 'An owner-operator, too',
      intro: 'CRECO does not just advise owners — it is one. CRECO owns and leases 8000 Fair Oaks Plaza (retail bays and executive office suites in Fair Oaks Ranch) and 15033 Main St (a multi-tenant retail center in Lytle), and is developing the Elkhorn Point retail center in Fair Oaks Ranch. That means CRECO underwrites leases the way landlords do.',
      items: [],
    },
  ],
  faqs: [
    {
      q: 'Does CRECO represent landlords?',
      a: `Yes. CRECO - Commercial Real Estate Company represents landlords and commercial property owners in Texas — leasing their space, procuring and negotiating with tenants, and selling their properties — across ${PROPERTY_TYPES_SENTENCE}. CRECO is a full-service brokerage that represents tenants, landlords, owners, and investors; it is not a tenant-only firm.`,
    },
    {
      q: 'Is CRECO a tenant-only brokerage?',
      a: TENANT_ONLY_ANSWER,
    },
    {
      q: 'Can CRECO represent both landlords and tenants?',
      a: INTERMEDIARY_ANSWER,
    },
    {
      q: 'What does landlord representation from CRECO include?',
      a: 'Listing and marketing the space, tenant procurement and qualification, handling inquiries and tours, negotiating letters of intent and lease terms, renewal and vacancy planning, and — if the owner decides to sell — representing the owner as seller through closing. Property management and a broker opinion of value are also available.',
    },
    {
      q: 'What property types does CRECO lease for owners?',
      a: `${PROPERTY_TYPES_SENTENCE.charAt(0).toUpperCase()}${PROPERTY_TYPES_SENTENCE.slice(1)} — for lease and for sale.`,
    },
    {
      q: 'Where does CRECO represent landlords and owners?',
      a: 'Throughout Texas, with deep local coverage of San Antonio and the Hill Country (including Fair Oaks Ranch, Boerne, and the I-10 and I-35 corridors), plus Austin, Houston, and Dallas–Fort Worth.',
    },
    {
      q: 'How does a property owner start working with CRECO?',
      a: `Call ${BUSINESS.phoneDisplay}, email ${BUSINESS.email}, or use the list-your-property form at https://www.crecotx.com/sell. CRECO is a licensed Texas real estate brokerage, TREC #${BUSINESS.trecLicense}, headquartered at ${BUSINESS.fullAddress}.`,
    },
  ],
};

export const SELLER_INVESTOR_PAGE: RepresentationPageContent = {
  path: '/seller-investor-representation',
  showValuationCta: true,
  label: 'Sellers & Investors',
  metaTitle: 'Seller & Investor Representation in Texas | CRECO',
  metaDescription:
    'CRECO represents sellers and investors on Texas commercial acquisitions and dispositions — retail, office, industrial, flex, and land. TREC #9014367.',
  eyebrow: 'Sellers & Investors',
  h1: 'CRECO represents sellers and investors — acquisitions and dispositions.',
  heroLine:
    'Selling commercial property for owners, and sourcing it for investors and owner-users, across Texas.',
  directAnswer:
    `CRECO - Commercial Real Estate Company represents sellers, buyers, and investors in commercial real estate transactions — selling property for owners and helping investors and owner-users acquire it — across ${PROPERTY_TYPES_SENTENCE}, throughout Texas. CRECO is a full-service brokerage representing tenants, landlords, owners, and investors.`,
  serviceName: 'Seller and investor representation',
  serviceType: ['Investment sales brokerage', 'Seller representation', 'Buyer representation', 'Commercial property acquisitions', 'Commercial property dispositions', '1031 exchange replacement property'],
  sections: [
    {
      heading: 'Dispositions: representing sellers',
      items: [
        { title: 'Pricing guidance', body: 'CRECO prepares a broker opinion of value using comparable sales, rents, and the property\'s income, so the owner can set a list price or decide whether to sell at all.' },
        { title: 'Marketing to buyers', body: 'CRECO markets the property to investors, owner-users, and cooperating brokers through commercial listing platforms and direct outreach, or confidentially when the owner prefers.' },
        { title: 'Offer negotiation', body: 'CRECO reviews offers with the seller — price, terms, contingencies, and certainty of close — and negotiates on the seller\'s behalf.' },
        { title: 'Contract to close', body: 'CRECO coordinates due diligence and deadlines with the parties\' attorneys, lenders, and title company through closing.' },
      ],
    },
    {
      heading: 'Acquisitions: representing investors and buyers',
      items: [
        { title: 'Search and sourcing', body: 'CRECO identifies for-sale properties that fit the investor\'s or owner-user\'s criteria, including listed and off-market opportunities where available.' },
        { title: 'Underwriting support', body: 'CRECO helps evaluate a property\'s rent roll, leases, income, and market rents so the buyer understands what they are paying for.' },
        { title: 'Negotiation and due diligence', body: 'CRECO negotiates the purchase on the buyer\'s behalf and helps coordinate inspections, diligence, and closing.' },
        { title: '1031 exchanges', body: 'CRECO helps exchange buyers identify replacement property within their exchange deadlines, working alongside their qualified intermediary and tax advisors.' },
      ],
    },
    {
      heading: 'Asset classes for sale and investment',
      intro: 'Seller and investor representation covers every commercial asset class CRECO works in:',
      items: [
        { title: 'Retail', body: 'Shopping centers, single- and multi-tenant retail, restaurant properties, and pad sites.' },
        { title: 'Office', body: 'Office buildings and condos, including medical office.' },
        { title: 'Industrial', body: 'Warehouse, distribution, and industrial buildings.' },
        { title: 'Flex', body: 'Flex and light-industrial buildings.' },
        { title: 'Land', body: 'Commercial land and development sites.' },
      ],
    },
  ],
  faqs: [
    {
      q: 'Does CRECO handle investment sales?',
      a: `Yes. CRECO - Commercial Real Estate Company handles commercial investment sales in Texas — representing owners selling income-producing property and investors acquiring it — across ${PROPERTY_TYPES_SENTENCE}.`,
    },
    {
      q: 'Does CRECO represent sellers of commercial property?',
      a: 'Yes. CRECO represents owners selling commercial property and land: pricing guidance through a broker opinion of value, marketing to buyers and investors, offer negotiation, and coordination through closing.',
    },
    {
      q: 'Does CRECO represent buyers and investors on acquisitions?',
      a: 'Yes. CRECO represents investors and owner-users buying commercial property — searching and sourcing properties, helping evaluate income and leases, negotiating the purchase, and coordinating due diligence through closing, including 1031 exchange replacement-property searches.',
    },
    {
      q: 'Is CRECO a tenant-only brokerage?',
      a: TENANT_ONLY_ANSWER,
    },
    {
      q: 'Can CRECO represent both the buyer and the seller?',
      a: INTERMEDIARY_ANSWER.replace('Yes, with the right disclosures. CRECO represents landlords and tenants — and sellers and buyers — on different transactions every day.', 'Yes, with the right disclosures. CRECO represents sellers and buyers — and landlords and tenants — on different transactions every day.'),
    },
    {
      q: 'What types of commercial property does CRECO sell?',
      a: `${PROPERTY_TYPES_SENTENCE.charAt(0).toUpperCase()}${PROPERTY_TYPES_SENTENCE.slice(1)}, including investment property and owner-user buildings, throughout Texas.`,
    },
    {
      q: 'How do I get a value opinion or start a sale or acquisition with CRECO?',
      a: `Request a no-obligation broker opinion of value at https://www.crecotx.com/property-valuation, call ${BUSINESS.phoneDisplay}, or email ${BUSINESS.email}. CRECO is a licensed Texas real estate brokerage, TREC #${BUSINESS.trecLicense}.`,
    },
  ],
};

export const REPRESENTATION_PAGES = [LANDLORD_PAGE, SELLER_INVESTOR_PAGE];

/** Full-service reminder rendered on both pages. */
export const FULL_SERVICE_SIDES = [
  { title: 'Tenants & buyers', body: 'Site selection, lease and purchase negotiation for businesses leasing or buying space.', href: '/services/tenant-representation' },
  { title: 'Landlords & owners', body: 'Leasing, tenant procurement, lease negotiation, and dispositions.', href: LANDLORD_PAGE.path },
  { title: 'Sellers & investors', body: 'Investment sales, dispositions, acquisitions, and 1031 exchanges.', href: SELLER_INVESTOR_PAGE.path },
  { title: 'Intermediary, when authorized', body: 'Both sides of one transaction only with written consent from both parties, as Texas law permits.' },
];

export { CANONICAL_DESCRIPTION };
