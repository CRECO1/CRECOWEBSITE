import type { Metadata } from 'next';
import { CityHubPage } from '@/components/marketing/CityHubPage';

export const metadata: Metadata = {
  title: 'Dallas–Fort Worth Commercial Real Estate | DFW Office, Industrial, Retail | CRECO',
  description:
    'Dallas–Fort Worth commercial real estate — DFW office, industrial, retail, and flex space for lease and sale across the Metroplex. Tenant representation, owner services, and investment advisory from CRECO.',
  keywords: [
    'dallas commercial real estate',
    'fort worth commercial real estate',
    'dfw commercial real estate',
    'dfw industrial real estate',
    'dallas office space for lease',
    'dallas warehouse for lease',
    'dallas retail space for lease',
    'commercial property for sale dallas',
    'frisco office space',
    'dfw airport corridor industrial',
    'uptown dallas office',
  ],
  alternates: { canonical: 'https://www.crecotx.com/dallas-commercial-real-estate' },
  openGraph: {
    title: 'Dallas–Fort Worth Commercial Real Estate | CRECO',
    description:
      'DFW commercial real estate — office, industrial, retail. Tenant representation and owner services across Dallas, Fort Worth, Frisco, Plano, and the DFW Airport corridor.',
    url: 'https://www.crecotx.com/dallas-commercial-real-estate',
    type: 'website',
  },
};

export default function DallasPage() {
  return (
    <CityHubPage
      config={{
        canonicalPath: '/dallas-commercial-real-estate',
        city: 'Dallas–Fort Worth',
        cityShort: 'DFW',
        heroEyebrow: 'Texas Commercial Real Estate · DFW',
        heroTitle: 'DFW commercial real estate — the largest CRE market in Texas, served end-to-end.',
        heroSubhead:
          "Office, industrial, retail, flex, and land across the Dallas–Fort Worth Metroplex — Uptown Dallas, Frisco, Plano, the DFW Airport corridor, Mesquite, Lancaster, downtown Fort Worth, Alliance, and beyond. CRECO's Texas-wide practice brings tenant representation, owner services, and investment advisory to one of the deepest commercial real estate markets in the United States.",
        marketStats: [
          { label: 'CRE inventory', value: 'Largest', context: 'commercial market in Texas' },
          { label: 'Industrial absorption', value: 'Top 3', context: 'US industrial markets' },
          { label: 'Class A office', value: '#1 in Texas', context: 'concentration, particularly Uptown + Frisco' },
          { label: 'Population (metro)', value: '8M+', context: '4th largest US metro' },
        ],
        marketIntro: [
          "Dallas–Fort Worth is the largest commercial real estate market in Texas and one of the top 5 in the United States. The depth of the DFW market is its defining characteristic — across every property type and almost every submarket, the inventory is meaningful, the buyer/tenant pool is deep, and there are credible options for almost any commercial real estate need.",
          "Industrial in particular drives DFW. The DFW Airport corridor, Mesquite, Lancaster, and Alliance generate some of the strongest industrial absorption in the United States, supported by the geographic centrality of DFW for distribution to the entire central US, the major rail and highway infrastructure, and the absence of state income tax for the corporate operations that staff these facilities. Office is bifurcated like most major US markets — Uptown Dallas, Frisco, and the Plano corporate corridor support strong Class A demand; secondary suburban Class B has tenant leverage at multi-year highs.",
          "CRECO's DFW practice covers tenant rep, owner services, and investment advisory across the Metroplex. From our Fair Oaks Ranch headquarters we work with a network of DFW-based brokers, attorneys, lenders, contractors, and capital partners that we've built through years of cross-Texas activity. The depth of the market means our work focuses on filtering rapidly, running competitive processes, and using the breadth of available options as negotiating leverage.",
        ],
        servicesIntro: [
          "DFW's scale means tenant rep done right is a structured filter-and-compete exercise. Hundreds of candidate properties on paper become 8-10 viable candidates against a tenant's specific specs, become 4-5 that warrant tour and LOI, become 2-3 that compete at the LOI/lease stage. CRECO runs that funnel for tenants signing 5,000 to 200,000+ SF across the Metroplex.",
          "For DFW commercial property owners, our owner services practice provides asset-level hold/sell/reposition strategy, off-market deal flow, day-to-day property management, and disposition coordination when the time comes. The strategic discipline that's particularly valuable in a deep market — where small percentage moves translate into meaningful absolute dollars.",
          "Investment advisory leverages CRECO's Texas-wide network — DFW is a frequent destination for 1031 buyers from San Antonio, Austin, and Houston looking for the depth of replacement options the Metroplex provides. We coordinate disposition and acquisition across our client base regularly.",
        ],
        submarkets: [
          {
            name: 'Uptown Dallas',
            characterization: 'Trophy office + lifestyle',
            description: "Trophy office, walkable urban core, premium retail, and high-density mixed-use. Texas's strongest concentration of Class A office demand.",
          },
          {
            name: 'Frisco',
            characterization: 'Corporate-relocation magnet',
            description: "DFW's premier corporate-relocation suburb. The Star, PGA HQ, Toyota North America. Class A office holds value, retail premium across Stonebriar and Frisco Square.",
            href: '/markets/frisco',
          },
          {
            name: 'Plano',
            characterization: 'Mature corporate-office anchor',
            description: "Legacy West, the Toyota corridor, JPMorgan campus. 40M+ SF of suburban office — Texas's most-mature corporate-office submarket.",
            href: '/markets/plano',
          },
          {
            name: 'Allen & McKinney',
            characterization: 'North Collin growth wave',
            description: 'The next growth wave north of Frisco/Plano — Watters Creek lifestyle retail, McKinney Town Center, strong demographic-driven demand.',
            href: '/markets/allen-mckinney',
          },
          {
            name: 'Las Colinas / DFW Airport',
            characterization: 'Industrial + corporate office',
            description: 'The corporate-office and logistics crossroads of the Metroplex. Class A Urban Center office plus 200M+ SF of airport-corridor industrial.',
            href: '/markets/las-colinas',
          },
          {
            name: 'Alliance / North Fort Worth',
            characterization: 'Industrial + corporate',
            description: 'Master-planned industrial corridor with rail, highway, and air infrastructure. Driving meaningful Texas-side absorption.',
          },
          {
            name: 'Mesquite & Lancaster',
            characterization: 'Bulk distribution',
            description: "DFW's southeast/south industrial corridors — strong second-generation bulk distribution and growing modern delivery. Generally lower rents than the airport corridor.",
          },
          {
            name: 'Downtown Fort Worth',
            characterization: 'Office + Sundance Square retail',
            description: "Mature urban Class A office, Sundance Square premium retail, and an active adaptive-reuse pipeline. The strongest urban submarket in Tarrant County.",
            href: '/markets/fort-worth-downtown',
          },
        ],
        whyBullets: [
          'Texas-wide reach with deep DFW market knowledge',
          'Industrial expertise — particularly DFW Airport, Alliance, and Mesquite/Lancaster corridors',
          'Off-market deal flow across DFW office, industrial, and retail submarkets',
          'Tenant rep for DFW businesses — landlord pays our commission',
          'Owner services for DFW-area investors and property owners',
          'Investment advisory with Texas-wide 1031 coordination',
          'Direct broker access — every engagement led by a senior CRECO broker',
        ],
        relatedInsights: [
          {
            slug: 'texas-commercial-real-estate-outlook-2026',
            category: 'Market Outlook',
            title: 'Texas Commercial Real Estate Outlook: What Owners and Tenants Should Watch in 2026',
          },
          {
            slug: 'texas-retail-leasing-fundamentals-2026',
            category: 'Market Outlook',
            title: 'Texas Retail Leasing Fundamentals 2026: What Strong Centers Have, What Weak Centers Don\'t',
          },
          {
            slug: 'multi-property-owner-strategy',
            category: 'Owner Strategy',
            title: 'Multi-Property Owner Strategy: When to Hold, When to Sell, When to Reposition Your Texas Commercial Real Estate',
          },
        ],
        propertyLinks: [
          { label: 'Industrial / warehouse for lease', href: '/texas-industrial-property-for-lease', description: 'Modern bulk distribution and flex across DFW Airport, Alliance, and Mesquite/Lancaster corridors.' },
          { label: 'Office space for lease — Texas', href: '/texas-office-space-for-lease', description: 'Uptown Dallas trophy, Frisco corporate, and Class B value office across the Metroplex.' },
          { label: 'Retail space for lease', href: '/texas-retail-space-for-lease', description: 'DFW retail — master-planned community centers, urban retail, and pad sites across the Metroplex.' },
          { label: 'Commercial property for sale', href: '/texas-commercial-property-for-sale', description: 'Texas commercial property for sale — investment, owner-user, and 1031 replacement opportunities.' },
        ],
      }}
    />
  );
}
