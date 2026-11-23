// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;


import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { OUT_OF_MARKET_ROBOTS } from '@/lib/seo-meta';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  // Outside CRECO's San Antonio / Hill Country focus: live, but noindex.
  robots: OUT_OF_MARKET_ROBOTS,
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
        sourcesAsOf: 'November 2026',
        sources: [
          { label: 'CBRE, Dallas/Fort Worth Industrial Figures Q3 2026 (Oct 9 2026; full report PDF)', url: 'https://www.cbre.com/insights/figures/dallas-fort-worth-industrial-figures-q3-2026' },
          { label: 'Cushman & Wakefield, MarketBeat Dallas/Fort Worth Industrial Q3 2026', url: 'https://www.cushmanwakefield.com/en/united-states/insights/us-marketbeats/dallas-ft-worth-marketbeats/industrial' },
        ],
        canonicalPath: '/dallas-industrial-space',
        city: 'Dallas–Fort Worth',
        asset: 'industrial',
        heroEyebrow: 'Texas Industrial Market · Dallas–Fort Worth',
        quickAnswer:
          'Dallas–Fort Worth is one of the largest industrial markets in the US, about 1.05 billion SF of inventory (CBRE). In Q3 2026 vacancy fell to 7.8% (CBRE) or 7.3% (Cushman & Wakefield) as leasing hit about 23M SF, and asking rents reached $10.39/SF NNN (CBRE) or a record $9.76 net (Cushman & Wakefield). The market still leads the nation in new construction, 30.6M to 33.9M SF.',
        stats: [
          { label: 'Metro inventory',          value: '1.05B SF',        note: 'CBRE, Q3 2026' },
          { label: 'Metro vacancy',            value: '7.3–7.8%',        note: 'Cushman & Wakefield / CBRE; falling' },
          { label: 'Average asking rent',      value: '$9.76–$10.39/SF', note: 'net (Cushman, a record) / NNN (CBRE, a 3-year high)' },
          { label: 'DFW Airport asking',       value: '$12.69/SF NNN',   note: 'CBRE district average, 8.7% vacant' },
          { label: 'Net absorption (quarter)', value: '6.4–13.9M SF',    note: 'CBRE / Cushman & Wakefield, Q3 2026' },
          { label: 'Under construction',       value: '30.6–33.9M SF',   note: 'Cushman / CBRE; most in the nation (CBRE)' },
          { label: 'South Dallas asking',      value: '$5.41/SF NNN',    note: 'CBRE; the lowest-rent district' },
          { label: 'Intermodal / air',         value: 'UP + BNSF + DFW', note: 'dual intermodal + air cargo hub' },
        ],
        keyTakeaways: [
          'Vacancy has tightened for two years. CBRE has it at 7.8%, down from a 9.6% peak in Q2 2024 and 8.9% a year ago; Cushman & Wakefield has it at 7.3%, the lowest since Q3 2023. Leasing was 23.5M SF in CBRE\'s count, its highest quarter in three years.',
          'Rents are at their highest levels in each report\'s series. Cushman & Wakefield reports $9.76/SF net, a record and up 19.9% year over year; CBRE reports $10.39/SF NNN, up 5.3% and its highest in three years. The firms measure different building sets, so use the spread as the range.',
          'Size decides your leverage. CBRE shows the highest vacancy in the 100,000 to 249,999 SF (10.5%) and 250,000 to 499,999 SF (10.0%) ranges, versus 5.6% at 500,000 to 749,999 SF and 4.3% at 750,000+ SF. Cushman & Wakefield also finds 150,000 to 499,999 SF is its only double-digit segment (10.1%) and that vacant big-box space is the lowest in over 15 years.',
          'The market is really several distinct submarkets. CBRE shows vacancy from 4.7% in Southern DFW/287 and 5.6% in South Dallas up to 10.3% in Northwest Dallas and 10.4% in South Fort Worth, and asking rents from $5.41 in South Dallas to $13.70 in East Dallas. Location within the metro should follow your distribution geography, not just the lowest headline rent.',
          'DFW\'s logistics infrastructure is a genuine differentiator: dual Class I intermodal (UP in South Dallas, BNSF at Alliance), DFW International air cargo, and interstate access in every direction.',
          'Investors are active. CBRE counted $1.71B of industrial sales in Q3 2026 (up 25.7% from Q2) and $4.12B year to date, with private buyers 52.5% and institutional buyers 40.2% of the quarter.',
        ],
        marketContext: [
          'Dallas–Fort Worth is one of the deepest industrial markets in the country, with about 1.05 billion square feet of inventory (CBRE). Central US location, an unmatched highway grid, two Class I railroads with intermodal terminals, and DFW International as a top air-cargo gateway make it a natural distribution hub for the southern half of the US. Over the last three years CBRE describes a shift from rising vacancy and heavy deliveries to a more balanced market: vacancy peaked at 9.6% in Q2 2024 and was 7.8% in Q3 2026, while net absorption was 6.44M SF in Q3 (its peak was 10.09M SF in Q4 2025).',
          'New supply is rebuilding. CBRE has space under construction at 33.91M SF, up from 15.8M SF in Q3 2024, with the most in North Fort Worth (large logistics projects at Northlake 35, Alliance Westport and the DHL Northlake hub). Cushman & Wakefield counts 30.6M SF, 3.0% of inventory, 23.4M SF of it speculative, and expects vacancy near 6.6% by year-end 2026. Asking rents are at a record in Cushman & Wakefield\'s report and a three-year high in CBRE\'s. Both firms find the slack is in mid-size space (roughly 100,000 to 499,999 SF), while buildings of 500,000 SF and up are tight.',
          'Submarket selection is where a DFW industrial decision is really made. CBRE\'s Q3 leasing was heaviest in North Fort Worth (5.41M SF) and Northwest Dallas (4.17M SF), and its net absorption was led by the DFW Airport district (2.3M SF) and South Dallas (1.2M SF); Cushman & Wakefield, which draws its submarkets differently, has Alliance (3.6M SF), Far North/I-35 (2.1M SF) and South Dallas (1.8M SF) leading absorption. Large Q3 leases in CBRE\'s report include DSV Sea & Air, 1,122,000 SF in Northwest Dallas, and Celestica, 1,010,000 SF in North Fort Worth. The right answer depends on where your goods come from and where they go.',
        ],
        servicesIntro: [
          'CRECO covers Dallas–Fort Worth as part of a Texas-wide industrial practice. For a market this large, the value of a tenant rep is filtering: DFW has thousands of buildings and tens of millions of square feet under construction, and the job is to narrow that to the handful that fit your clear height, power, dock and trailer needs, distribution geography, and timeline, before you spend a week touring.',
          'For tenants, size is the lever. Users between about 100,000 and 500,000 SF have the most choice in today\'s data, while users above 500,000 SF are competing for a scarce supply of vacant space. We benchmark concessions against deals actually being signed, and structure options and expansion rights so a growing operation is not boxed in. For requirements weighing DFW against Houston, San Antonio, or Austin, we run the total-occupancy-cost and distribution-reach comparison across all four.',
          'For owners and investors, DFW industrial draws active capital, and we advise accordingly: disposition timed to the capital markets, buyer sourcing across institutional, private and 1031 channels, and honest hold-versus-sell analysis.',
        ],
        submarkets: [
          {
            name: 'South Dallas / I-45 (Lancaster–Wilmer–Hutchins)',
            characterization: 'Modern mega-distribution',
            description: 'The metro\'s primary new big-box bulk corridor, anchored by the UP Dallas intermodal. CBRE has South Dallas at 5.6% vacant with the lowest asking rent of any district ($5.41/SF NNN; SE Dallas/I-45 $4.76) and 1.2M SF absorbed in Q3. Tradepoint 45 Warehouse (1.35M SF) sold to Starwood Capital for $155M.',
            href: '/dallas-commercial-real-estate',
          },
          {
            name: 'AllianceTexas / North Fort Worth',
            characterization: 'Master-planned intermodal',
            description: 'Hillwood\'s master-planned logistics ecosystem on the BNSF Alliance intermodal. CBRE has North Fort Worth at 6.8% vacant, $8.39/SF NNN and the most space under construction (11.2M SF); Cushman & Wakefield has Alliance leading the metro in Q3 absorption at 3.6M SF. The two firms draw the boundary differently.',
          },
          {
            name: 'Great Southwest (Arlington / Grand Prairie)',
            characterization: 'Central established core',
            description: 'One of the largest and most centrally located industrial districts in the US, about 125M SF in CBRE\'s count. 7.7% vacant at $8.84/SF NNN, with 2.66M SF leased in Q3.',
          },
          {
            name: 'DFW Airport / Las Colinas / Coppell',
            characterization: 'Infill + air cargo',
            description: 'The close-in and last-mile node adjacent to DFW International. CBRE has the district at 8.7% vacant and $12.69/SF NNN, with the metro\'s highest Q3 net absorption (2.3M SF).',
          },
          {
            name: 'Northeast Dallas (Garland / Mesquite)',
            characterization: 'Infill light industrial',
            description: 'Established infill light industrial and flex serving the eastern metro. CBRE has NE Dallas/Garland at 7.3% vacant and $9.77/SF NNN, and East Dallas/Mesquite at 7.3% and $9.31.',
          },
          {
            name: 'East / I-20 & I-30 (Forney / Terrell)',
            characterization: 'Newer bulk runway',
            description: 'The eastern growth path for new big-box development. CBRE has Forney/Terrell at 10.8% vacant with 514,000 SF absorbed in Q3 and 1.06M SF under construction; it does not publish an asking rent there.',
          },
        ],
        faqs: [
          {
            q: 'What is the industrial vacancy rate in Dallas–Fort Worth?',
            a: 'In Q3 2026, 7.8% according to CBRE and 7.3% according to Cushman & Wakefield. CBRE has it down from 8.2% in Q2 2026 and 8.9% a year earlier, and 180 bps below its mid-2024 peak of 9.6%.',
          },
          {
            q: 'What are industrial rents in Dallas–Fort Worth?',
            a: 'In Q3 2026, average asking rent was $10.39/SF NNN per year at CBRE and $9.76/SF net at Cushman & Wakefield (a record) and the highest in CBRE\'s three-year series. By district, CBRE shows $5.41 in South Dallas, $8.39 in North Fort Worth, $8.84 in Great Southwest/Arlington and $12.69 at DFW Airport.',
          },
          {
            q: 'Is Dallas–Fort Worth still building new industrial space?',
            a: 'Yes. CBRE counts 33.91M SF under construction and Cushman & Wakefield 30.6M SF (3.0% of inventory), the most of any US market in CBRE\'s ranking. Cushman & Wakefield expects 33.1M SF or less to be completed in 2026.',
          },
          {
            q: 'Is it easier to lease a small or a large warehouse in DFW?',
            a: 'Mid-size space has the most availability. CBRE shows 10.5% vacancy at 100,000 to 249,999 SF and 10.0% at 250,000 to 499,999 SF, against 6.4% below 50,000 SF, 5.6% at 500,000 to 749,999 SF and 4.3% at 750,000 SF and up.',
          },
        ],
        whyBullets: [
          'Texas-wide industrial practice — we compare DFW against Houston, San Antonio, and Austin on total occupancy cost',
          'We filter a billion-SF market to the handful of buildings that fit your specs before you tour',
          'Our team works every engagement directly, from shallow-bay flex to big-box bulk requirements',
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
