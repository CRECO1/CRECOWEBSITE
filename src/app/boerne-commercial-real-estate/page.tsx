import type { Metadata } from 'next';
import { CityHubPage } from '@/components/marketing/CityHubPage';

export const metadata: Metadata = {
  title: 'Boerne Commercial Real Estate | Retail, Office, Hill Country | CRECO',
  description:
    'Boerne commercial real estate — retail, office, and land for lease and sale across the Hill Country gateway market. Tenant representation, owner services, and investment advisory from CRECO\'s Texas-wide practice.',
  keywords: [
    'boerne commercial real estate',
    'boerne tx commercial property',
    'boerne retail space for lease',
    'boerne main street retail',
    'boerne i-10 commercial',
    'boerne commercial broker',
    'commercial property for sale boerne',
    'kendall county commercial real estate',
    'hill country commercial real estate',
    'fair oaks ranch boerne commercial',
  ],
  alternates: { canonical: 'https://www.crecotx.com/boerne-commercial-real-estate' },
  openGraph: {
    title: 'Boerne Commercial Real Estate | CRECO',
    description:
      "Boerne commercial real estate — historic Main Street, I-10 corridor, and the Hill Country gateway market. CRECO's broker practice covers Boerne end-to-end.",
    url: 'https://www.crecotx.com/boerne-commercial-real-estate',
    type: 'website',
  },
};

export default function BoernePage() {
  return (
    <CityHubPage
      config={{
        city: 'Boerne',
        cityShort: 'Boerne',
        heroEyebrow: 'Texas Commercial Real Estate · Boerne',
        heroTitle: 'Boerne commercial real estate — the Hill Country gateway market, served end-to-end.',
        heroSubhead:
          "Boerne is one of the most distinctive commercial real estate markets in Texas — a historic Hill Country town with a destination Main Street, a fast-growing I-10 commercial corridor, and demographics that consistently outperform the state average. CRECO covers Boerne as a core submarket of our broader Texas practice — from tenant representation for retail and restaurant concepts to owner services for I-10 corridor property and investment advisory across Kendall County.",
        marketStats: [
          { label: 'Population growth', value: 'Top 10', context: 'fastest-growing micropolitan areas in Texas' },
          { label: 'Median household income', value: '$95K+', context: 'meaningfully above Texas average' },
          { label: 'Trade area', value: 'Regional', context: 'destination retail + Hill Country tourism + daily-needs commerce' },
          { label: 'Commercial corridors', value: 'Three', context: 'Main Street · I-10 · Highway 46' },
        ],
        marketIntro: [
          "Boerne occupies a position in Texas commercial real estate that's hard to replicate. The historic Main Street is a genuine destination retail district — restaurants, boutiques, gallery space, and lifestyle retail anchored by the kind of pedestrian energy most Texas towns spend decades trying to manufacture and rarely achieve. The I-10 commercial corridor — anchored by H-E-B and Walmart, with a deep tenant mix of national chains, fast-casual restaurants, and service operators — handles the daily-needs commerce for a fast-growing trade area. Highway 46 is the emerging third corridor, picking up commercial activity as residential growth heads east toward Bulverde and west toward Fredericksburg.",
          "What makes Boerne distinctive isn't just the corridors — it's that they don't compete with each other. Main Street is destination retail; I-10 is daily-needs and chain commerce; Highway 46 is suburban-format residential-adjacent. Tenants don't have to choose between visibility and authenticity. Owners don't have to bet on one corridor over another. The trade area can support all three.",
          "CRECO covers Boerne with the same disciplined broker practice we bring to every Texas market — tenant representation for businesses scouting Boerne space, owner services for Boerne and Kendall County property owners, and investment advisory connecting Boerne deals to our Texas-wide buyer/seller network. Boerne and neighboring Fair Oaks Ranch (where CRECO is developing at 8000 Fair Oaks Pkwy) form the core of our Hill Country gateway practice.",
        ],
        servicesIntro: [
          "Boerne tenancy rewards specificity. The right Main Street space is wrong for a fast-casual concept that needs drive-thru access; the right I-10 location is wrong for a destination boutique. CRECO's tenant rep practice underwrites every Boerne opportunity against the tenant's specific concept, target customer, and operating model — and we know the differences between Main Street, I-10, and Highway 46 cold.",
          "For Boerne and Kendall County property owners, we provide hold/sell/reposition recommendations, leasing campaigns to drive occupancy on multi-tenant assets, and disposition coordination for owners ready to take chips off the table. The Boerne market has trade enough small-and-mid-sized commercial assets that there's almost always something owners are weighing — and we want to be the broker they call.",
          "Investment advisory connects Boerne deals to CRECO's Texas-wide network. 1031 buyers from San Antonio, Austin, and Houston frequently look at Boerne as a stable, demographic-driven Texas market. Boerne sellers benefit from our network surfacing them as candidates to that buyer pool.",
        ],
        submarkets: [
          {
            name: 'Main Street / Downtown Boerne',
            characterization: 'Destination retail + dining',
            description: 'Historic Hill Country Main Street — restaurants, boutiques, galleries, and lifestyle retail. The pedestrian energy is real, the rent premium reflects it, and the right tenants build loyal customers here.',
          },
          {
            name: 'I-10 Commercial Corridor',
            characterization: 'Daily-needs + national chains',
            description: 'Anchored by H-E-B, Walmart, and a deep mix of national tenants. The daily-needs commercial spine for the Boerne trade area and a high-volume retail corridor.',
          },
          {
            name: 'Highway 46',
            characterization: 'Emerging suburban commercial',
            description: 'The growth corridor heading east toward Bulverde and Spring Branch. Residential demand is driving commercial demand for the right concepts at the right scale.',
          },
          {
            name: 'River Road / Cibolo Creek',
            characterization: 'Tourism + lifestyle',
            description: 'The Cibolo Creek corridor and the residential lifestyle areas adjacent to Main Street. Specialty service businesses, professional offices, and complementary commercial.',
          },
          {
            name: 'Boerne Stage / Fair Oaks Ranch Border',
            characterization: 'Cross-market commercial',
            description: 'The corridor connecting Boerne to Fair Oaks Ranch — where Boerne trade area meets Fair Oaks Ranch demographics. Strong opportunity for multi-tenant retail and professional office.',
          },
          {
            name: 'Industrial / Service Commercial',
            characterization: 'Contractor + light industrial',
            description: 'Boerne\'s industrial and service-commercial submarket — contractor yards, light industrial, and service trades supporting Kendall County and Hill Country residential growth.',
          },
        ],
        whyBullets: [
          'Texas-wide reach with deep Boerne and Kendall County market knowledge',
          'Sister market to our Fair Oaks Ranch practice — where CRECO is developing at 8000 Fair Oaks Pkwy',
          'Tenant rep for retail, restaurants, professional services, and Hill Country concepts — landlord pays our commission',
          'Owner services for Boerne and Kendall County property owners',
          'Investment advisory connecting Boerne deals to our Texas-wide 1031 + buyer network',
          'Off-market deal flow across Main Street, I-10, and Highway 46 corridors',
          'Direct broker access — every engagement led by a senior CRECO broker',
        ],
        relatedInsights: [
          {
            slug: 'texas-retail-leasing-fundamentals-2026',
            category: 'Market Outlook',
            title: 'Texas Retail Leasing Fundamentals 2026: What Strong Centers Have, What Weak Centers Don\'t',
          },
          {
            slug: 'texas-commercial-real-estate-outlook-2026',
            category: 'Market Outlook',
            title: 'Texas Commercial Real Estate Outlook: What Owners and Tenants Should Watch in 2026',
          },
          {
            slug: 'multi-property-owner-strategy',
            category: 'Owner Strategy',
            title: 'Multi-Property Owner Strategy: When to Hold, When to Sell, When to Reposition Your Texas Commercial Real Estate',
          },
        ],
        propertyLinks: [
          { label: 'Retail space for lease', href: '/texas-retail-space-for-lease', description: 'Boerne and Texas retail — Main Street destination, I-10 chain corridor, and Highway 46 emerging commercial.' },
          { label: 'Office space for lease', href: '/texas-office-space-for-lease', description: 'Professional services office in Boerne, Kendall County, and the I-10 corridor.' },
          { label: 'Fair Oaks Ranch commercial', href: '/fair-oaks-ranch-commercial-real-estate', description: "Boerne's neighboring submarket where CRECO is developing at 8000 Fair Oaks Pkwy." },
          { label: 'Commercial property for sale', href: '/texas-commercial-property-for-sale', description: 'Boerne, Kendall County, and Texas commercial property for sale — investment, owner-user, and 1031 opportunities.' },
        ],
      }}
    />
  );
}
