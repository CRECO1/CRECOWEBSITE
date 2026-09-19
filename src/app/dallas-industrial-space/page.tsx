// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;


import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: 'DFW Industrial Space for Lease | CRECO',
  description:
    'Dallas–Fort Worth industrial space for lease — bulk distribution in South Dallas, AllianceTexas, the Great Southwest district, and DFW Airport infill.',
  keywords: [
    'dallas industrial space for lease',
    'dfw industrial space for lease',
    'dallas warehouse for lease',
    'industrial space dallas',
    'south dallas distribution',
    'alliance texas industrial',
    'great southwest industrial arlington',
    'dfw airport industrial',
    'dallas bulk distribution',
    'dfw industrial market',
    'dallas industrial vacancy',
    'dallas warehouse rent',
    'dallas industrial broker',
    'dfw industrial tenant representation',
  ],
  alternates: { canonical: 'https://www.crecotx.com/dallas-industrial-space' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Dallas–Fort Worth Industrial Space for Lease | CRECO',
    description:
      'Modern bulk in South Dallas / I-45, AllianceTexas + North Fort Worth intermodal, the Great Southwest district, and DFW Airport infill. One of the largest industrial markets in the US — tenant rep + owner services.',
    url: 'https://www.crecotx.com/dallas-industrial-space',
    type: 'website',
  },
};

export default function DallasIndustrialSpacePage() {
  return (
    <CityAssetPage
      config={{
        sourcesAsOf: 'September 2026',
        canonicalPath: '/dallas-industrial-space',
        city: 'Dallas–Fort Worth',
        asset: 'industrial',
        heroEyebrow: 'Texas Industrial Market · Dallas–Fort Worth',
        quickAnswer:
          'Dallas–Fort Worth is one of the two largest industrial markets in the US — roughly a billion SF of inventory that consistently leads the nation in both net absorption and new deliveries. A record construction wave pushed vacancy to ~9-11%, which means genuine tenant leverage on modern bulk, with asking rents in the ~$5-7.50/SF NNN range.',
        stats: [
          { label: 'Metro inventory',          value: '~1B+ SF',       note: 'a top-2 US industrial market' },
          { label: 'Metro vacancy',            value: '~9-11%',        note: 'supply-driven; strong absorption' },
          { label: 'Modern bulk asking',       value: '$5-7.50/SF NNN',note: 'South Dallas / Alliance corridors' },
          { label: 'Infill / shallow bay',     value: '$8-14/SF NNN',  note: 'DFW Airport + close-in districts' },
          { label: 'Net absorption',           value: 'Leads US',      note: 'routinely #1 nationally' },
          { label: 'Under construction',       value: 'Nation-leading',note: 'deliveries the driver of vacancy' },
          { label: 'Stabilized cap rate',      value: '5.5-6.5%',      note: 'institutional favorite; tight for credit' },
          { label: 'Intermodal / air',         value: 'UP + BNSF + DFW',note: 'dual intermodal + air cargo hub' },
        ],
        keyTakeaways: [
          'DFW is a top-two US industrial market by inventory and routinely the #1 market in the country for net absorption — for a tenant, that depth means options, and for the current cycle it means leverage.',
          'A nation-leading construction wave is the reason vacancy sits in the 9-11% range. That supply is the tenant\'s friend right now: modern bulk landlords are competing on free rent and TI in a way they were not two years ago.',
          'The market is really several distinct submarkets. South Dallas / I-45 (Lancaster, Wilmer, Hutchins) and AllianceTexas / North Fort Worth are the modern mega-distribution corridors; the Great Southwest district in Arlington/Grand Prairie is the central, established core; DFW Airport is the infill, service-and-e-commerce node.',
          'DFW\'s logistics infrastructure is a genuine differentiator — dual Class I intermodal (UP in South Dallas, BNSF at Alliance), DFW International air cargo, and interstate access in every direction. Location within the metro should follow your distribution geography, not just the lowest headline rent.',
          'Institutional capital treats DFW industrial as core — stabilized Class A bulk trades tight — so owner-users and investors are competing against well-capitalized buyers. Timing and sourcing matter more here than in shallower Texas markets.',
        ],
        marketContext: [
          'Dallas–Fort Worth has spent the last decade becoming one of the two deepest industrial markets in the country, rivaling the Inland Empire in scale. Central US location, an unmatched highway grid, two Class I railroads with intermodal terminals, and DFW International as a top air-cargo gateway make it the natural distribution hub for the southern half of the US. The result is roughly a billion square feet of inventory and a market that reliably tops national rankings for both absorption and new construction.',
          'That construction is the story of the current cycle. Developers delivered record speculative bulk into 2024-2025, and vacancy rose off historic lows into the 9-11% range — not because demand faltered (DFW still leads the country in absorption) but because supply outran it temporarily. For tenants, that is the opportunity: modern, well-located bulk with concessions on the table. The overhang is concentrated in big-box speculative product, so requirements above ~200K SF have the most leverage; shallow-bay and infill remain comparatively tight.',
          'Submarket selection is where a DFW industrial decision is really made. South Dallas and I-45 offer the newest big-box bulk and the UP intermodal; AllianceTexas gives you a master-planned, BNSF-served logistics ecosystem in North Fort Worth; the Great Southwest district splits the difference geographically and is the established central core; and the DFW Airport / Las Colinas / Coppell node is the infill answer for last-mile, air-cargo-adjacent, and shallow-bay users who need to be close in. The right answer depends on where your goods come from and where they go.',
        ],
        servicesIntro: [
          'CRECO covers Dallas–Fort Worth as part of a Texas-wide industrial practice. For a market this large, the value of a tenant rep is filtering: DFW has thousands of buildings and hundreds of thousands of square feet coming online every quarter, and the job is to narrow that to the handful that fit your clear height, power, dock and trailer needs, distribution geography, and timeline — before you spend a week touring.',
          'For tenants, the current supply cycle is a window. We benchmark concessions against the deals actually being signed, push landlords competing for occupancy on free rent and TI, and structure options and expansion rights so a growing operation is not boxed in. For requirements weighing DFW against Houston, San Antonio, or Austin, we run the total-occupancy-cost and distribution-reach comparison across all four.',
          'For owners and investors, DFW industrial is core institutional product, and we advise accordingly — disposition timed to the capital markets, buyer sourcing across institutional and 1031 channels, and honest hold-versus-sell analysis given where cap rates and the supply pipeline sit.',
        ],
        submarkets: [
          {
            name: 'South Dallas / I-45 (Lancaster–Wilmer–Hutchins)',
            characterization: 'Modern mega-distribution',
            description: 'The metro\'s primary new big-box bulk corridor, anchored by the UP Dallas intermodal. 500K-1M+ SF product, newest inventory, and where much of the tenant leverage in this cycle sits.',
            href: '/dallas-commercial-real-estate',
          },
          {
            name: 'AllianceTexas / North Fort Worth',
            characterization: 'Master-planned intermodal',
            description: 'Hillwood\'s master-planned logistics ecosystem on the BNSF Alliance intermodal, with air cargo at Alliance Airport. Deep e-commerce and 3PL tenancy; a self-contained distribution environment.',
          },
          {
            name: 'Great Southwest (Arlington / Grand Prairie)',
            characterization: 'Central established core',
            description: 'One of the largest and most centrally located industrial districts in the US. Mid-cities location splits DFW geographically; a mix of legacy and modern product with reliable demand.',
          },
          {
            name: 'DFW Airport / Las Colinas / Coppell',
            characterization: 'Infill + air cargo',
            description: 'The close-in, shallow-bay and last-mile node adjacent to DFW International. Tight vacancy and higher rents; the answer for air-cargo-adjacent and time-sensitive distribution.',
          },
          {
            name: 'Northeast Dallas (Garland / Mesquite)',
            characterization: 'Infill light industrial',
            description: 'Established infill light industrial and flex serving the eastern metro. Smaller bays, service-industrial and local-distribution tenancy, and comparatively steady occupancy.',
          },
          {
            name: 'East / I-20 & I-30 (Forney / Terrell / Mesquite)',
            characterization: 'Newer bulk runway',
            description: 'The eastern growth path for new big-box development — land availability and newer inventory at a discount to the core corridors for tenants with eastern distribution geography.',
          },
        ],
        whyBullets: [
          'Texas-wide industrial practice — we compare DFW against Houston, San Antonio, and Austin on total occupancy cost',
          'We filter a billion-SF market to the handful of buildings that fit your specs before you tour',
          'Senior broker leads every engagement, from shallow-bay flex to big-box bulk requirements',
          'Concession benchmarking from deals actually being signed, not aggregated marketplace data',
          'We qualify buildings on clear height, power, dock/trailer, and distribution geography up front',
          'Full-service representation — tenants, landlords/owners, and investors; tenant rep is typically paid by the landlord',
          'Owner-side disposition timed to the institutional capital markets, with 1031 buyer flow',
        ],
        listingsLink: {
          label: 'See Dallas–Fort Worth industrial listings →',
          href: '/listings?city=dallas&type=industrial',
        },
        cityHubLink: {
          label: 'Dallas–Fort Worth market overview',
          href: '/dallas-commercial-real-estate',
        },
        breadcrumbs: [
          { label: 'Texas CRE', href: '/markets' },
          { label: 'Dallas–Fort Worth', href: '/dallas-commercial-real-estate' },
          { label: 'Industrial space' },
        ],
      }}
    />
  );
}
