import type { Metadata } from 'next';
import { CityHubPage } from '@/components/marketing/CityHubPage';

export const metadata: Metadata = {
  title: 'Houston Commercial Real Estate | Industrial, Office, Retail | CRECO',
  description:
    'Houston commercial real estate — industrial, office, retail, and flex space for lease and sale across Greater Houston. Tenant representation, owner services, and investment advisory from CRECO.',
  keywords: [
    'houston commercial real estate',
    'houston commercial property',
    'houston commercial real estate broker',
    'houston warehouse for lease',
    'houston industrial space',
    'houston office space for lease',
    'houston retail space for lease',
    'commercial property for sale houston',
    'galleria office space',
    'energy corridor houston',
    'ship channel industrial houston',
  ],
  alternates: { canonical: 'https://www.crecotx.com/houston-commercial-real-estate' },
  openGraph: {
    title: 'Houston Commercial Real Estate | CRECO',
    description:
      'Houston commercial real estate — industrial, office, retail. Tenant representation and owner services across Greater Houston and the Ship Channel.',
    url: 'https://www.crecotx.com/houston-commercial-real-estate',
    type: 'website',
  },
};

export default function HoustonPage() {
  return (
    <CityHubPage
      config={{
        city: 'Houston',
        cityShort: 'Houston',
        heroEyebrow: 'Texas Commercial Real Estate · Houston',
        heroTitle: 'Houston commercial real estate — the largest industrial market in Texas, with the depth to match.',
        heroSubhead:
          "Industrial, office, retail, flex, and land across Greater Houston — Northwest, Southwest, Ship Channel, Energy Corridor, Galleria, Sugar Land, The Woodlands, and beyond. CRECO covers Houston commercial real estate end-to-end with tenant representation, owner services, and investment advisory for businesses, investors, and multi-property owners.",
        marketStats: [
          { label: 'Industrial absorption', value: 'Top 5', context: 'US industrial markets by absorption' },
          { label: 'Total industrial inventory', value: '700M+ SF', context: 'Houston metro' },
          { label: 'Class A office vacancy', value: '~22%', context: 'with bifurcation by submarket' },
          { label: 'Population (metro)', value: '7.5M+', context: '4th largest US metro' },
        ],
        marketIntro: [
          "Houston is the largest industrial commercial real estate market in Texas and one of the top 5 in the United States. The Ship Channel, Northwest distribution corridor, and Southwest logistics submarkets generate consistent absorption that few US markets can match. The depth of the Houston industrial market means that almost any commercial real estate need — modern bulk distribution, flex, cold storage, manufacturing, special-use industrial — has multiple credible options.",
          "Beyond industrial, Houston has one of the most diverse commercial real estate markets in Texas. The Energy Corridor and Galleria support concentrations of professional services and corporate office. Master-planned communities like The Woodlands and Sugar Land have grown into significant retail, office, and medical submarkets in their own right. Downtown Houston has rebuilt as a mixed-use district with residential, office, and lifestyle retail.",
          "CRECO's Houston practice focuses on the disciplined work that the depth of the market makes possible — competitive tenant rep processes that genuinely use the breadth of available options, owner services that understand the specific submarket dynamics across Houston's many corridors, and investment advisory that leverages CRECO's Texas-wide network for sourcing, disposition, and 1031 coordination.",
        ],
        servicesIntro: [
          "Houston's depth means there are almost always more options than time to evaluate. CRECO's tenant rep practice runs structured processes that filter rapidly to the 4-5 candidate properties that genuinely fit the tenant's specs, then negotiate aggressively across that competitive set. The result: tenants close on the right space at terms meaningfully better than the asking-rate average.",
          "For Houston commercial property owners, our owner services practice provides asset-level hold/sell/reposition recommendations, off-market deal flow, day-to-day property management with institutional-quality reporting, and active disposition strategy when the time comes to sell. Multi-property Houston owners get the strategic discipline that's hard to maintain when operations consume daily attention.",
          "Investment advisory connects Houston buyers and sellers with our Texas-wide network — including 1031 buyers from across Texas looking for Houston replacement property and Houston sellers looking for acquisitions in San Antonio, Austin, or DFW. Cross-Texas deal flow is one of CRECO's structural advantages.",
        ],
        submarkets: [
          {
            name: 'Ship Channel',
            characterization: 'Heavy industrial + logistics',
            description: "Heavy industrial, petrochemical-adjacent logistics, and port-related distribution. The single most important industrial submarket in Texas.",
          },
          {
            name: 'Northwest Houston',
            characterization: 'Modern bulk distribution',
            description: 'Highway 290 / Beltway 8 corridor — modern bulk distribution, big-box logistics, last-mile e-commerce. Strong absorption.',
          },
          {
            name: 'Southwest Houston',
            characterization: 'Industrial + flex',
            description: 'Sugar Land / Highway 59 corridor industrial and flex space, with strong residential growth supporting service business demand.',
          },
          {
            name: 'Galleria / Uptown',
            characterization: 'Class A office + retail',
            description: "Houston's premier office and lifestyle district — high-density Class A office, premium retail, and a mature mixed-use environment.",
          },
          {
            name: 'Energy Corridor',
            characterization: 'Corporate office',
            description: 'I-10 corporate office concentration. Energy industry-anchored but increasingly diversified across professional services and engineering.',
          },
          {
            name: 'The Woodlands & Sugar Land',
            characterization: 'Suburban office + retail',
            description: "Master-planned commercial submarkets with strong demographics, growing healthcare and professional services, and active retail demand.",
          },
        ],
        whyBullets: [
          'Texas-wide reach with depth in Greater Houston specifically',
          'Industrial expertise — one of CRECO\'s strongest practice areas',
          'Off-market deal flow across the Ship Channel, Northwest, Southwest, and Energy Corridor submarkets',
          'Tenant rep for Houston businesses — landlord pays our commission',
          'Owner services for Houston-area investors and property owners',
          'Investment advisory with Texas-wide 1031 buyer network',
          'Direct broker access — every engagement led by a senior CRECO broker',
        ],
        relatedInsights: [
          {
            slug: 'texas-industrial-warehouse-leasing-2026',
            category: 'Tenant Strategy',
            title: 'Texas Industrial Warehouse Leasing 2026: What Tenants Should Pay, Push For, and Walk Away From',
          },
          {
            slug: 'multi-property-owner-strategy',
            category: 'Owner Strategy',
            title: 'Multi-Property Owner Strategy: When to Hold, When to Sell, When to Reposition Your Texas Commercial Real Estate',
          },
          {
            slug: 'texas-1031-exchange-strategy',
            category: 'Investment',
            title: '1031 Exchange Strategy for Texas Commercial Property Owners: Timing, Sourcing, and the Mistakes That Cost You',
          },
        ],
        propertyLinks: [
          { label: 'Industrial / warehouse for lease', href: '/texas-industrial-property-for-lease', description: 'Modern bulk distribution, flex, and special-use industrial across Houston corridors.' },
          { label: 'Office space for lease — Texas', href: '/texas-office-space-for-lease', description: 'Class A trophy office in Galleria, Energy Corridor, and Class B value across Houston.' },
          { label: 'Retail space for lease', href: '/texas-retail-space-for-lease', description: 'Houston retail — Galleria-area inline, master-planned community centers, and pad sites.' },
          { label: 'Commercial property for sale', href: '/texas-commercial-property-for-sale', description: 'Texas commercial property for sale — investment, owner-user, and 1031 replacement opportunities.' },
        ],
      }}
    />
  );
}
