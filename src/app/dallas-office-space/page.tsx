// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;


import type { Metadata } from 'next';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: 'Dallas–Fort Worth Office Space for Lease | Uptown, Legacy, Las Colinas | CRECO',
  description:
    'Dallas–Fort Worth office space for lease — trophy Class A in Uptown, corporate campuses in Legacy/Frisco, Las Colinas and the Telecom Corridor, and deep Class B value across the Metroplex. Asking rents, vacancy by submarket, and tenant representation from CRECO.',
  keywords: [
    'dallas office space for lease',
    'dfw office space for lease',
    'office space dallas',
    'uptown dallas office',
    'legacy frisco office space',
    'las colinas office space',
    'plano office space',
    'fort worth office space',
    'dallas office market',
    'dallas office vacancy',
    'cost to lease office space dallas',
    'dallas office rent',
    'dallas office broker',
    'dallas tenant representation',
  ],
  alternates: { canonical: 'https://www.crecotx.com/dallas-office-space' },
  openGraph: {
    title: 'Dallas–Fort Worth Office Space for Lease | CRECO',
    description:
      'Trophy Class A in Uptown, corporate campuses in Legacy/Frisco, Las Colinas and the Telecom Corridor, and Class B value across the Metroplex. DFW office — tenant rep, submarket by submarket.',
    url: 'https://www.crecotx.com/dallas-office-space',
    type: 'website',
  },
};

export default function DallasOfficeSpacePage() {
  return (
    <CityAssetPage
      config={{
        canonicalPath: '/dallas-office-space',
        city: 'Dallas–Fort Worth',
        asset: 'office',
        heroEyebrow: 'Texas Office Market · Dallas–Fort Worth',
        quickAnswer:
          'Dallas–Fort Worth office is a bifurcated, tenant-favorable market: trophy Class A in Uptown and the Legacy/Frisco corporate corridor holds tenancy at $45-65+/SF with sub-20% vacancy, while commodity Class A and the Class B set sit in the high 20s to low 30s with the deepest concessions the Metroplex has offered in a decade. Relocations from higher-cost states keep the north end structurally stronger than the national office narrative.',
        stats: [
          { label: 'Trophy Class A vacancy',    value: '~15-20%',       note: 'Uptown + Legacy trophy; the rest is weaker' },
          { label: 'Trophy Class A asking',     value: '$45-65+/SF',    note: 'Uptown highrises lead the band' },
          { label: 'Overall Class A vacancy',   value: '~25-28%',       note: 'commodity A weighs on the average' },
          { label: 'Class B vacancy',           value: '~28-33%',       note: 'deep value-add / conversion territory' },
          { label: 'Class B asking',            value: '$24-34/SF',     note: 'realized rates 10-15% below ask' },
          { label: 'TI on Class A (10yr)',      value: '$60-100/SF',    note: 'historically deep concessions' },
          { label: 'Free rent (10yr Class A)',  value: '6-12 months',   note: 'tenant-favorable cycle' },
          { label: 'Stabilized cap rate',       value: '7.0-8.5%',      note: 'trophy tighter; commodity wider' },
        ],
        keyTakeaways: [
          'DFW is one of the most active office markets in the country for corporate relocations — Toyota, JPMorgan, Liberty Mutual, Charles Schwab and others built campuses in the north, and that inbound demand keeps Legacy/Frisco structurally tighter than the national office story.',
          'The market is sharply bifurcated. Trophy Class A in Uptown and the Legacy corridor holds tenancy and rents; commodity Class A and Class B carry vacancy in the high 20s to low 30s with concessions to match.',
          'Uptown / Turtle Creek is the premier walkable, amenity-rich submarket — the flight-to-quality winner where tenants pay up for new, amenitized trophy space.',
          'Las Colinas (Irving) offers large, central corporate floor plates near DFW Airport at a discount to Uptown — the pragmatic choice for big headcount that does not need an Uptown address.',
          'For tenants, this is a rare window: TI packages on Class A 10-year deals run $60-100/SF with 6-12 months of free rent, and Class B leverage is deeper still. Right-sizing into better space at a lower net cost is on the table across most of the Metroplex.',
        ],
        marketContext: [
          'Dallas–Fort Worth spent the last decade as the premier corporate-relocation destination in the US, and that is the single most important fact about its office market. Company after company moved headquarters or built major campuses in the northern suburbs — the Legacy/Frisco corridor in particular — pulling high-credit tenancy into new trophy product. That inbound demand is why DFW office, despite carrying real vacancy, has a structurally stronger demand base than most large US office markets.',
          'That said, the market is bifurcated to a degree tenants should understand before they tour. Trophy Class A — new, amenitized, well-located in Uptown or the Legacy corridor — holds tenancy and pricing power. The rest of the market, commodity Class A and the broad Class B set, carries vacancy in the high 20s to low 30s, and landlords there are competing hard on TI, free rent, and rent abatement. The gap between the two tiers is the widest it has been in this cycle.',
          'For a tenant, DFW right now is a flight-to-quality market you can actually afford. The concession environment means the economics of upgrading — into newer, more amenitized space with better parking and a stronger address — often pencil close to renewing in place. The judgment calls are which trophy landlords are pushing versus pragmatic, where hidden contiguous blocks exist, and whether a Class B conversion or repricing story changes the calculus on a building you are considering.',
        ],
        servicesIntro: [
          'CRECO covers Dallas–Fort Worth as part of a Texas-wide office practice. In a bifurcated market, the tenant rep\'s job is to make the two-tier structure work for you — benchmarking trophy concessions against what is actually being signed, and surfacing the commodity and Class B options where the leverage is deepest if the address matters less than the economics.',
          'Tenant rep on Class A here typically produces 8-15% better economics than a single-building negotiation, and on Class B the spread is larger — we are seeing realized rates 10-15% below asking with TI packages well above landlords\' opening offers. For requirements weighing DFW against Austin, Houston, or San Antonio, we run the total-occupancy-cost comparison across all four Texas metros.',
          'For owners and investors, we run hold-versus-sell-versus-reposition analysis at the asset level, with Texas-wide 1031 buyer flow and direct submarket sourcing. In a market with this much commodity vacancy, the reposition and conversion questions are live on a lot of assets, and we underwrite them honestly.',
        ],
        submarkets: [
          {
            name: 'Uptown / Turtle Creek',
            characterization: 'Trophy, top-of-market',
            description: 'The premier walkable, amenity-rich office submarket in DFW. New trophy highrises, the tightest Class A vacancy, and the rents to match. The flight-to-quality winner.',
            href: '/dallas-commercial-real-estate',
          },
          {
            name: 'Legacy / Frisco / Plano',
            characterization: 'Corporate relocation corridor',
            description: 'The north-suburban campus corridor — Toyota, JPMorgan, Liberty Mutual, Legacy West. Structurally tighter than the metro average on the back of inbound HQ demand.',
          },
          {
            name: 'Las Colinas (Irving)',
            characterization: 'Central corporate floor plates',
            description: 'Large, central corporate space near DFW Airport at a discount to Uptown. The pragmatic choice for big headcount that does not need an Uptown address.',
          },
          {
            name: 'Dallas CBD / Downtown',
            characterization: 'Bifurcated; conversion plays',
            description: 'Trophy holds tenancy; older Class B and C carry heavy vacancy. Among the most active office-to-residential conversion pipelines in the country.',
          },
          {
            name: 'Preston Center / North Dallas',
            characterization: 'Affluent boutique',
            description: 'Tight, high-rent boutique submarket serving affluent North Dallas. Small blocks, strong tenancy, limited availability — a landlord\'s pocket in a tenant\'s market.',
          },
          {
            name: 'Fort Worth CBD / Cultural District',
            characterization: 'Stable, distinct market',
            description: 'A separate office economy anchored by energy, defense, and legacy Fort Worth business. Steadier and smaller than Dallas; the Cultural District adds a boutique layer.',
          },
        ],
        whyBullets: [
          'Texas-wide office practice — we compare DFW against Austin, Houston, and San Antonio on total occupancy cost',
          'Fluent in the trophy-vs-commodity bifurcation that defines DFW office leverage',
          'Senior broker leads every engagement, from a 3,000 SF suite to a full-floor corporate requirement',
          'Concession benchmarking from deals actually being signed across Uptown, Legacy, and Las Colinas',
          'We surface hidden contiguous blocks and quiet reposition/conversion stories before you commit',
          'Full-service representation — tenants, landlords/owners, and investors; tenant rep is typically paid by the landlord',
          'Hold-vs-sell-vs-reposition underwriting for owners, with Texas-wide 1031 buyer flow',
        ],
        listingsLink: {
          label: 'See Dallas–Fort Worth office listings →',
          href: '/listings?city=dallas&type=office',
        },
        cityHubLink: {
          label: 'Dallas–Fort Worth market overview',
          href: '/dallas-commercial-real-estate',
        },
        breadcrumbs: [
          { label: 'Texas CRE', href: '/markets' },
          { label: 'Dallas–Fort Worth', href: '/dallas-commercial-real-estate' },
          { label: 'Office space' },
        ],
      }}
    />
  );
}
