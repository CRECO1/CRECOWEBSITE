export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { PropertyLandingPage } from '@/components/marketing/PropertyLandingPage';

export const metadata: Metadata = {
  title: 'Office Space for Lease in Texas | CRECO',
  description:
    'Office space for lease across Texas — Class A, B, and C, medical office, professional suites, executive office, and creative office. CRECO places companies into the right Texas office submarkets in San Antonio, Austin, Houston, and DFW.',
  keywords: [
    'office space for lease texas',
    'texas office space',
    'office space for lease san antonio',
    'office space for lease austin',
    'office space for lease houston',
    'office space for lease dallas',
    'class a office texas',
    'medical office for lease texas',
    'executive suite texas',
    'creative office space texas',
    'office building for lease texas',
  ],
  alternates: { canonical: 'https://www.crecotx.com/texas-office-space-for-lease' },
  openGraph: {
    title: 'Office Space for Lease in Texas | CRECO',
    description:
      'Texas office space — Class A/B/C, medical, professional, executive, creative. San Antonio, Austin, Houston, DFW, statewide coverage.',
    url: 'https://www.crecotx.com/texas-office-space-for-lease',
    type: 'website',
  },
};

export default function Page() {
  return (
    <PropertyLandingPage
      config={{
        eyebrow: 'Texas Commercial Real Estate · Office',
        h1: 'Office Space for Lease in Texas',
        subhead:
          'Class A, B, and C office, medical office, professional suites, executive office, and creative space — across San Antonio, Austin, Houston, DFW, and the rest of the Texas office market. Whether you\'re a 5-person startup looking for executive suites or a 200-person company anchoring a Class A floor, CRECO matches your team size, growth path, and culture to the right Texas office building.',
        filterPropertyTypes: ['office'],
        filterTransactionType: 'lease',
        demoListings: [
          { id: 'd1', title: 'Stone Oak Class A Office', slug: '#', address: '— San Antonio —', city: 'San Antonio', property_type: 'office', transaction_type: 'lease', sqft: 4200, headline: 'Class A office in Stone Oak — full-floor available', images: null, lease_rate: 30, lease_rate_basis: 'Full Service' },
          { id: 'd2', title: 'Austin Domain Creative', slug: '#', address: '— Austin —', city: 'Austin', property_type: 'office', transaction_type: 'lease', sqft: 6800, headline: 'Creative office in The Domain — exposed brick, polished concrete, conference room', images: null, lease_rate: 48, lease_rate_basis: 'Full Service' },
          { id: 'd3', title: 'Houston Galleria Class A', slug: '#', address: '— Houston —', city: 'Houston', property_type: 'office', transaction_type: 'lease', sqft: 12500, headline: '12,500 SF Class A in established Galleria tower', images: null, lease_rate: 36, lease_rate_basis: 'Full Service' },
        ],
        marketBullets: [
          {
            title: 'Texas office is bifurcating.',
            body: 'Class A trophy office with modern amenities is in tight supply and commanding premium rents. Class B and older Class A space is over-supplied — meaning generous concessions for the right tenant. Knowing which side of the market you want to play on is half the battle.',
          },
          {
            title: 'Submarkets vary widely.',
            body: 'Stone Oak is not Downtown San Antonio. The Domain is not South Congress. Galleria is not Energy Corridor. Each Texas office submarket has different rent benchmarks, parking ratios, demographics of nearby talent, and amenity profiles. We help you pick the right one.',
          },
          {
            title: 'Tenant improvement is everything.',
            body: 'Class A landlords routinely offer $30-80/SF in TI allowance plus free rent for the right tenant. That can fund a full custom buildout. The asking rent only tells half the story — the effective rent after concessions is the real number.',
          },
        ],
        whyBullets: [
          'Tenant-rep representation across San Antonio, Austin, Houston, and DFW office submarkets',
          'Class A/B/C, medical office, executive suites, and creative office expertise',
          'Effective rent analysis — comparing offers net of TI allowance, free rent, and amenities',
          'Buildout coordination from space planning to move-in',
          'Renew vs. relocate analysis to maximize leverage at lease expiration',
        ],
        faqs: [
          {
            q: 'What does office space cost per square foot in Texas?',
            a: 'Office rates in Texas typically range from $20 to $55 per SF per year on a Full Service Gross basis (rent includes operating expenses). Class A trophy office in Austin\'s Domain or Houston\'s Galleria can exceed $50/SF FSG; suburban Class B office in San Antonio or Fort Worth submarkets can be found at $20-28/SF FSG. Always compare effective rent — net of free-rent months and tenant improvement allowance — not just the asking rate.',
          },
          {
            q: 'What\'s the difference between Class A, B, and C office?',
            a: 'Class A: newer construction (typically post-2000), high-end finishes, modern amenities (fitness, conferencing, on-site food, structured parking), prime submarkets, top rents. Class B: well-maintained older buildings (typically 1990s-2000s), functional space, reasonable amenities, good submarkets, mid-market rents. Class C: older buildings (pre-1990s), basic finishes, limited amenities, secondary submarkets, lowest rents. Class B is often the sweet spot for value.',
          },
          {
            q: 'How much parking should I expect with Texas office space?',
            a: 'Parking ratios are quoted per 1,000 SF leased. Suburban Texas office typically offers 4:1000 (4 spaces per 1,000 SF), which works for most companies. Urban / downtown towers often have 2-3:1000 with paid structured parking. Medical office and call centers may need 5-7:1000. Always confirm in writing — parking ratio is one of the most-disputed lease items.',
          },
          {
            q: 'Can I sublease Texas office space?',
            a: 'Yes — sublease can be a great way to save 20-40% off direct lease rates, especially for terms under 3 years. Texas office subleases come from companies that over-leased and need to offload space. CRECO tracks sublease availability across all Texas major markets and can shortlist sublease options alongside direct leases.',
          },
          {
            q: 'What is "Full Service Gross" vs "NNN" for office leases?',
            a: 'Full Service Gross (FSG) means the landlord covers operating expenses (taxes, insurance, utilities, janitorial, CAM) within the quoted rent — though tenants pay increases above a base year. NNN (less common in Class A office) means tenant pays a base rent plus their share of expenses. FSG is the dominant office structure in Texas; medical office and some industrial-flex office runs NNN.',
          },
        ],
        relatedLinks: [
          { href: '/texas-retail-space-for-lease', label: 'Retail Space' },
          { href: '/texas-industrial-property-for-lease', label: 'Industrial / Warehouse' },
          { href: '/texas-commercial-property-for-sale', label: 'Properties for Sale' },
          { href: '/services/tenant-representation', label: 'Tenant Representation' },
          { href: '/submarkets/north-central', label: 'San Antonio North Central' },
          { href: '/listings?type=office', label: 'All Office Listings' },
        ],
        primaryCta: { href: '/tenant-needs', label: 'Submit Tenant Needs' },
        secondaryCta: { href: 'tel:+12108173443', label: '(210) 817-3443' },
      }}
    />
  );
}
