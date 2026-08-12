import type { Metadata } from 'next';
import { CityHubPage } from '@/components/marketing/CityHubPage';

export const metadata: Metadata = {
  title: 'Austin Commercial Real Estate | Office, Industrial, Retail | CRECO',
  description:
    'Austin commercial real estate — office, industrial, retail, and flex space for lease and sale across the Austin metro. Tenant representation, owner services, and investment advisory from CRECO.',
  keywords: [
    'austin commercial real estate',
    'austin commercial property',
    'austin commercial real estate broker',
    'austin office space for lease',
    'austin warehouse for lease',
    'austin retail space for lease',
    'commercial property for sale austin',
    'austin commercial real estate services',
    'tenant representation austin',
    'south congress retail space',
    'domain office space',
  ],
  alternates: { canonical: 'https://www.crecotx.com/austin-commercial-real-estate' },
  openGraph: {
    title: 'Austin Commercial Real Estate | CRECO',
    description:
      'Austin commercial real estate — office, industrial, retail, flex. Tenant representation and owner services across the Austin metro and surrounding submarkets.',
    url: 'https://www.crecotx.com/austin-commercial-real-estate',
    type: 'website',
  },
};

export default function AustinPage() {
  return (
    <CityHubPage
      config={{
        canonicalPath: '/austin-commercial-real-estate',
        city: 'Austin',
        cityShort: 'Austin',
        heroEyebrow: 'Texas Commercial Real Estate · Austin',
        heroTitle: 'Austin commercial real estate, with the broker network to back it up.',
        heroSubhead:
          "Office, industrial, retail, flex, and land across the Austin metro — Domain, Downtown, South Congress, East Austin, Round Rock, Pflugerville, Cedar Park, and beyond. CRECO's tenant representation and owner services team helps Austin businesses, investors, and property owners navigate one of the most dynamic commercial real estate markets in the United States.",
        marketStats: [
          { label: 'Population growth', value: '#2', context: 'major US metro, last 5 years' },
          { label: 'Office vacancy', value: '~17%', context: 'with Class A trophy below 10%' },
          { label: 'Industrial absorption', value: 'Strong', context: 'driven by chip + EV manufacturing' },
          { label: 'Tech employer base', value: 'Top 5', context: 'national tech employment market' },
        ],
        marketIntro: [
          "Austin commercial real estate is the most paradoxical market in Texas. The headlines are all about office vacancy and the slowdown from 2021-2022 peaks — and those headlines are real. Class B office in suburban submarkets is offering tenant improvement allowances of $50-80/SF, free rent of 9-15 months, and rent abatement levels we haven't seen in 15 years. At the same time, Austin's chip manufacturing corridor (Samsung, Tesla suppliers, NXP, Applied Materials) is absorbing industrial space faster than developers can deliver it, and Class A trophy office in The Domain and Downtown is leasing at premium rates with limited supply.",
          "The Austin market in 2026 rewards specificity. Generalist brokers who treat Austin as a single market miss the bifurcation. Tenants who don't understand the differences between East Austin, South Congress, The Domain, and Downtown end up in the wrong submarket for their business. Owners who don't know which Austin submarkets are oversupplied vs supply-constrained make pricing decisions that leave money on the table.",
          "CRECO covers the Austin commercial real estate market end-to-end — tenant representation for businesses scouting Austin space, owner services for Austin-based investors and property owners, and investment advisory for buyers and sellers across the metro. We work with a network of Austin-based brokers, attorneys, lenders, and contractors that we've built relationships with over years of cross-Texas activity.",
        ],
        servicesIntro: [
          "From our Fair Oaks Ranch headquarters, CRECO's Austin practice focuses on the same disciplined work we bring to every Texas market — tenant rep for businesses signing leases, landlord rep for owners optimizing rent rolls, investment advisory for buyers and sellers, and portfolio strategy for multi-property owners.",
          "Austin tenancy demands particular discipline because the market is bifurcated. CRECO's Austin tenant rep practice runs structured 4-5 candidate processes that use the asymmetry between strong and weak Austin submarkets to negotiate effective rents, TI, abatement, and exit options that wouldn't be on the table otherwise.",
          "For Austin commercial property owners, our owner services practice provides quarterly portfolio reviews, off-market deal flow for acquisitions and 1031 replacement, day-to-day property management, and direct broker access — every engagement led by a senior CRECO broker who knows the Austin market.",
        ],
        submarkets: [
          {
            name: 'The Domain & North Austin',
            characterization: 'Class A office + retail',
            description: 'Mixed-use district anchored by The Domain — Austin\'s Class A office concentration with strong retail and lifestyle amenities. Premium rents but tight supply and strong tenant attraction.',
            href: '/markets/the-domain',
          },
          {
            name: 'Downtown Austin',
            characterization: 'Trophy office + lifestyle',
            description: 'Trophy office towers, walkable urban core, and high-density commercial. Currently sees the bifurcation play out — Class A holds, Class B has tenant leverage.',
          },
          {
            name: 'East Austin',
            characterization: 'Creative + retail + flex',
            description: 'Adaptive reuse, creative office, food and beverage, boutique retail. The Austin market most reflective of the city\'s cultural identity — and increasingly, its premium retail submarket.',
            href: '/markets/east-austin',
          },
          {
            name: 'South Congress (SoCo) & South Lamar',
            characterization: 'Walkable retail + office',
            description: 'Walkable retail districts with strong daytime traffic, lifestyle tenants, and growing office demand. Ground-floor retail commands premium rents.',
          },
          {
            name: 'Round Rock',
            characterization: 'Industrial + office',
            description: "Austin's northern industrial corridor — Dell HQ + the Samsung-Taylor adjacency. Strong Class A industrial leasing and growing office demand.",
            href: '/markets/round-rock',
          },
          {
            name: 'Pflugerville',
            characterization: 'I-35 industrial growth',
            description: "Northeast Austin's industrial growth corridor — bulk distribution + small-bay flex serving e-commerce and the Samsung-Taylor supplier ecosystem.",
            href: '/markets/pflugerville',
          },
          {
            name: 'Cedar Park & Leander',
            characterization: 'Suburban retail + office',
            description: "Suburban growth corridor northwest of Austin. Demographic-driven retail demand, growing healthcare and professional service occupancy.",
            href: '/markets/cedar-park-leander',
          },
        ],
        whyBullets: [
          'Texas-wide network with deep Austin-specific market knowledge',
          'Off-market deal flow across all major Austin submarkets',
          'Tenant rep for businesses scouting Austin space — landlord pays our commission',
          'Owner services for Austin-based investors and property owners',
          'Direct broker access — every engagement led by a senior CRECO broker',
          'Tenant Improvement, abatement, and exit-option negotiation as core competencies',
          'Investment advisory and 1031 exchange coordination across Texas',
        ],
        relatedInsights: [
          {
            slug: 'texas-commercial-real-estate-outlook-2026',
            category: 'Market Outlook',
            title: 'Texas Commercial Real Estate Outlook: What Owners and Tenants Should Watch in 2026',
          },
          {
            slug: 'lease-vs-buy-texas-business',
            category: 'Tenant Strategy',
            title: 'Lease vs Buy: How Texas Business Owners Should Think About Their Commercial Real Estate',
          },
          {
            slug: 'texas-industrial-warehouse-leasing-2026',
            category: 'Tenant Strategy',
            title: 'Texas Industrial Warehouse Leasing 2026: What Tenants Should Pay, Push For, and Walk Away From',
          },
        ],
        propertyLinks: [
          { label: 'Office space for lease — Texas', href: '/texas-office-space-for-lease', description: 'Class A trophy and Class B office across the Austin metro and major Texas markets.' },
          { label: 'Industrial / warehouse for lease', href: '/texas-industrial-property-for-lease', description: 'Modern bulk distribution, flex, and industrial space — Round Rock, Pflugerville, and Austin-area corridors.' },
          { label: 'Retail space for lease', href: '/texas-retail-space-for-lease', description: 'Inline retail, end-cap, and pad sites across The Domain, SoCo, and Austin retail corridors.' },
          { label: 'Commercial property for sale', href: '/texas-commercial-property-for-sale', description: 'Texas commercial property for sale — investment, owner-user, and 1031 replacement opportunities.' },
        ],
      }}
    />
  );
}
