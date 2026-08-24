import type { Metadata } from 'next';
import { CityHubPage } from '@/components/marketing/CityHubPage';

/**
 * /san-antonio-commercial-real-estate — flagship city hub for CRECO's
 * headquarters market. SA is the 7th-largest US city, 2nd-largest in
 * Texas, and CRECO's home base — this is the highest-priority
 * geographic page on the site, period.
 *
 * Content depth matches the Houston/Austin pattern: hero, 4 market
 * stats, 3 paragraphs of market context, 7 submarket cards with
 * characterization + description, services intro, related insights
 * + property-type links. Total ~1,200 words of original content that
 * passes the helpful-content + AI-citation bars.
 */
export const metadata: Metadata = {
  title: 'San Antonio Commercial Real Estate | Industrial, Office, Retail | CRECO',
  description:
    'San Antonio commercial real estate — industrial, office, retail, medical, and flex space for lease and sale across Greater San Antonio. Tenant representation, owner services, and investment advisory from CRECO, headquartered in San Antonio.',
  keywords: [
    'san antonio commercial real estate',
    'san antonio commercial property',
    'san antonio commercial real estate broker',
    'san antonio commercial real estate firm',
    'san antonio industrial space',
    'san antonio warehouse for lease',
    'san antonio office space for lease',
    'san antonio retail space for lease',
    'san antonio medical office space',
    'commercial property for sale san antonio',
    'stone oak commercial real estate',
    'downtown san antonio office',
    'medical center san antonio',
    'westover hills san antonio',
    'south san antonio industrial',
    'schertz industrial space',
    'san antonio tenant representation',
    'san antonio commercial broker headquarters',
  ],
  alternates: { canonical: 'https://www.crecotx.com/san-antonio-commercial-real-estate' },
  openGraph: {
    title: 'San Antonio Commercial Real Estate | CRECO',
    description:
      'Headquartered in San Antonio. Industrial, office, retail, medical commercial real estate across Greater San Antonio — tenant rep, owner services, investment advisory.',
    url: 'https://www.crecotx.com/san-antonio-commercial-real-estate',
    type: 'website',
  },
};

export default function SanAntonioPage() {
  return (
    <CityHubPage
      config={{
        canonicalPath: '/san-antonio-commercial-real-estate',
        city: 'San Antonio',
        cityShort: 'San Antonio',
        heroEyebrow: 'Texas Commercial Real Estate · San Antonio · HQ',
        heroTitle:
          'San Antonio commercial real estate — CRECO\'s home market and one of the strongest demographic stories in Texas.',
        heroSubhead:
          "Industrial, office, retail, medical, and flex space across Greater San Antonio — Stone Oak, the Medical Center, Westover Hills, the Pearl, downtown, South Side, and the Schertz/Cibolo industrial corridor. CRECO is headquartered in San Antonio, and Greater San Antonio is the market we know building-by-building. Tenant representation, owner services, and investment advisory for businesses, multi-property owners, and 1031 investors.",
        marketStats: [
          { label: 'Metro population', value: '2.7M+', context: '7th-largest US city, 24th-largest US metro' },
          { label: 'Industrial vacancy', value: '~7%', context: 'Q2 2026; Schertz/Cibolo + South Side leading absorption' },
          { label: 'Class A office vacancy', value: '~18%', context: 'Q2 2026; Stone Oak and Westover Hills outperforming downtown' },
          { label: 'Population growth (10yr)', value: '+14%', context: 'Among the fastest-growing major US metros' },
        ],
        marketIntro: [
          "San Antonio is the 2nd-largest city in Texas, the 7th-largest in the United States, and one of the fastest-growing major US metros — and it gets dramatically less commercial real estate press than Austin, Houston, or Dallas. That gap between fundamentals and attention is exactly why San Antonio is one of the most disciplined commercial real estate markets in Texas: pricing reflects real cash flows, vacancy reflects real demand, and submarket dynamics aren't distorted by speculative capital looking for a coastal-style story.",
          "The San Antonio economy rests on four durable pillars: the largest joint military presence in the US (Joint Base San Antonio across four installations), a biosciences and medical anchor centered on the South Texas Medical Center and the Texas Research Park, advanced manufacturing led by the Toyota Texas plant and its supplier ecosystem on the South Side, and a tourism/hospitality engine anchored by the Riverwalk that generates consistent retail demand downtown. The result is a CRE market with multiple uncorrelated absorption drivers — industrial, office, retail, and medical all operate on their own cycles, and the worst submarket year in San Antonio is rarely worse than other Texas metros' average.",
          "CRECO is headquartered in San Antonio. That matters in a market this granular: Stone Oak is not Westover Hills is not the Medical Center is not Schertz, and the differences between them — credit quality of typical tenants, asking rents per SF, concession depth, time-to-lease, capex assumptions — are decisive. We've walked these buildings. We know the landlords. We know which submarkets are mispriced. Tenants, owners, and investors looking for someone who actually understands San Antonio commercial real estate at the building level start here.",
        ],
        servicesIntro: [
          "Tenant representation in San Antonio works because the depth of submarkets and asset classes means there are almost always more options than a tenant can evaluate alone. CRECO runs structured tenant rep processes that filter to the 4-5 properties that genuinely fit the tenant's spec, then negotiate aggressively across that competitive set. The landlord pays our commission. Tenants close on the right space at terms meaningfully better than asking — typically 6-15% better on rent and 30-50% more in TI than a single-property negotiation produces.",
          "For San Antonio commercial property owners, our owner services practice provides hold/sell/reposition analysis at the asset level, day-to-day property management with institutional-quality reporting, off-market deal flow when it's time to acquire, and active disposition strategy when it's time to sell. We work with multi-property owners across San Antonio who need the strategic discipline that's hard to maintain when daily operations consume attention. Owners get the senior-broker access typically reserved for institutional accounts.",
          "Investment advisory connects San Antonio buyers and sellers with CRECO's Texas-wide network — including 1031 buyers from Austin and Houston looking for San Antonio replacement property (San Antonio cap rates frequently outperform Austin by 75-150 bps for comparable product), and San Antonio sellers looking for diversifying acquisitions in DFW, Austin, or coastal Texas. Cross-Texas deal flow is one of the structural advantages of working with a Texas-wide broker that's actually based in San Antonio.",
        ],
        submarkets: [
          {
            name: 'Stone Oak / North Central',
            characterization: 'Class A office + retail + medical',
            description:
              "The 1604/281 corridor — San Antonio's strongest Class A office submarket on a per-SF basis, with deep retail and medical office across Stone Oak Parkway, Sonterra, and the Vineyard. Outperforms downtown on vacancy and rent growth.",
          },
          {
            name: 'Medical Center',
            characterization: 'Medical office + biosciences',
            description:
              "South Texas Medical Center — one of the largest medical concentrations in the US. Medical office (MOB) demand is structurally strong; the surrounding I-10 corridor supports adjacent professional office and retail.",
          },
          {
            name: 'Westover Hills',
            characterization: 'Corporate campus + suburban office',
            description:
              "Far West Side corporate campuses anchored by JPMorgan Chase, USAA-adjacent contractors, and Loop 1604 office product. Class A vacancy lower than downtown; deep tenant pool for build-to-suit.",
          },
          {
            name: 'The Pearl / Tobin Hill',
            characterization: 'Creative office + lifestyle retail',
            description:
              "San Antonio's premier mixed-use district — adaptive-reuse creative office (Pearl Brewery), award-winning food + beverage retail, and walkable density that operates more like Austin's East Side than typical SA. Premium rents.",
            href: '/markets/the-pearl',
          },
          {
            name: 'Downtown / Riverwalk',
            characterization: 'Tourism retail + Class B office',
            description:
              "Tourism-driven retail along the Riverwalk + Class B office in the legacy commercial core. Bifurcated office market — trophy holds tenancy, B and C product faces 25%+ vacancy in places. Conversion plays underway.",
          },
          {
            name: 'South Side / Toyota Corridor',
            characterization: 'Industrial + manufacturing',
            description:
              "Toyota Texas plant + supplier ecosystem anchors the heaviest concentration of advanced manufacturing in South Texas. Modern bulk industrial, build-to-suit, and special-use industrial. Growing fast.",
          },
          {
            name: 'Schertz / Cibolo',
            characterization: 'Modern bulk distribution',
            description:
              "I-35 northeast corridor — modern bulk distribution serving the SA/Austin combined market. The fastest-absorbing industrial submarket in Greater San Antonio; multiple 500K+ SF deliveries underway.",
          },
        ],
        whyBullets: [
          'CRECO is headquartered in San Antonio — building-level market knowledge, not Texas-generic coverage',
          'Senior broker leads every engagement — no junior handoff after the pitch',
          'Off-market deal flow across Stone Oak, the Medical Center, Westover Hills, the South Side, and Schertz/Cibolo',
          'Tenant rep for San Antonio businesses — landlord pays the commission',
          'Owner services for multi-property San Antonio investors with institutional-quality reporting',
          'Investment advisory with Texas-wide 1031 buyer network — SA cap rates outperform Austin/Houston for comparable product',
          'Direct broker access at any size deal — same senior team across $500K and $50M',
        ],
        relatedInsights: [
          {
            slug: 'texas-industrial-warehouse-leasing-2026',
            category: 'Tenant Strategy',
            title:
              'Texas Industrial Warehouse Leasing 2026: What Tenants Should Pay, Push For, and Walk Away From',
          },
          {
            slug: 'multi-property-owner-strategy',
            category: 'Owner Strategy',
            title:
              'Multi-Property Owner Strategy: When to Hold, When to Sell, When to Reposition Your Texas Commercial Real Estate',
          },
          {
            slug: 'texas-1031-exchange-strategy',
            category: 'Investment',
            title:
              '1031 Exchange Strategy for Texas Commercial Property Owners: Timing, Sourcing, and the Mistakes That Cost You',
          },
        ],
        propertyLinks: [
          {
            label: 'Industrial / warehouse for lease',
            href: '/texas-industrial-property-for-lease',
            description:
              'Modern bulk distribution, manufacturing, flex, and special-use industrial across the South Side, Schertz/Cibolo, and the I-35 corridor.',
          },
          {
            label: 'Office space for lease — Texas',
            href: '/texas-office-space-for-lease',
            description:
              'Class A office in Stone Oak and Westover Hills, creative office at the Pearl, and Class B value across downtown San Antonio.',
          },
          {
            label: 'Retail space for lease',
            href: '/texas-retail-space-for-lease',
            description:
              'San Antonio retail — Stone Oak strip and power centers, Pearl-area street retail, Riverwalk inline, and master-planned community pad sites.',
          },
          {
            label: 'Commercial property for sale',
            href: '/texas-commercial-property-for-sale',
            description:
              'San Antonio commercial property for sale — investment, owner-user, and 1031 replacement opportunities across every asset class.',
          },
        ],
        quickAnswer:
          "San Antonio is the 2nd-largest city in Texas and one of the fastest-growing US metros, with a disciplined commercial real estate market: industrial on the South Side and in Schertz/Cibolo, Class A office in Stone Oak and Westover Hills, medical around the South Texas Medical Center, and tourism retail on the Riverwalk. CRECO is headquartered in San Antonio and represents tenants, owners, and investors building-by-building.",
        faqs: [
          {
            q: 'Is commercial real estate cheaper in San Antonio than Austin?',
            a: "For comparable product, San Antonio cap rates frequently run 75–150 basis points higher than Austin — better yield for investors and, often, lower occupancy costs for tenants. San Antonio's market is also less distorted by speculative capital, so pricing tends to track real cash flow and demand. That spread is a major reason Austin and Houston 1031 buyers look to San Antonio for replacement property.",
          },
          {
            q: 'What are the main commercial real estate submarkets in San Antonio?',
            a: 'The most active are Stone Oak / North Central (Class A office, retail, and medical along the 1604/281 corridor), the South Texas Medical Center (medical office), Westover Hills (corporate campuses on the Far West Side), the Pearl (creative office and lifestyle retail), Downtown / Riverwalk (tourism retail and legacy office), the South Side / Toyota corridor (advanced manufacturing and industrial), and Schertz / Cibolo (modern bulk distribution). Each has very different rents, tenant profiles, and dynamics.',
          },
          {
            q: "Where is San Antonio's industrial and warehouse growth concentrated?",
            a: 'Two corridors lead absorption: the South Side around the Toyota Texas plant and its supplier network, and the Schertz/Cibolo corridor along I-35 northeast — the fastest-absorbing industrial submarket in Greater San Antonio, with multiple 500,000+ SF distribution deliveries underway. Both serve the combined San Antonio–Austin market along the I-35 spine.',
          },
        ],
      }}
    />
  );
}
