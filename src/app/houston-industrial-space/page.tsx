import type { Metadata } from 'next';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: 'Houston Industrial Space for Lease | Warehouse, Distribution, Flex | CRECO',
  description:
    'Houston industrial space for lease — modern bulk distribution along Northwest 290, Ship Channel logistics, Southwest fulfillment, and Energy Corridor flex. Asking rents, vacancy by submarket, and tenant rep from CRECO.',
  keywords: [
    'houston industrial space for lease',
    'houston warehouse for lease',
    'industrial space houston',
    'ship channel industrial houston',
    'northwest houston industrial',
    'southwest houston warehouse',
    'energy corridor flex space',
    'bulk distribution houston',
    'houston cold storage',
    'houston industrial market',
    'houston industrial vacancy',
    'houston industrial broker',
    'houston warehouse rent',
    'houston industrial tenant representation',
  ],
  alternates: { canonical: 'https://www.crecotx.com/houston-industrial-space' },
  openGraph: {
    title: 'Houston Industrial Space for Lease | CRECO',
    description:
      'Modern bulk distribution + Ship Channel logistics + Southwest fulfillment + Energy Corridor flex. Houston industrial — tenant rep + owner services across Greater Houston.',
    url: 'https://www.crecotx.com/houston-industrial-space',
    type: 'website',
  },
};

export default function HoustonIndustrialSpacePage() {
  return (
    <CityAssetPage
      config={{
        city: 'Houston',
        asset: 'industrial',
        heroEyebrow: 'Texas Industrial Market · Houston',
        quickAnswer:
          "Houston is the largest industrial market in Texas and one of the top 5 in the US — Northwest 290 and the Ship Channel anchor 700M+ SF of inventory, vacancy across the metro runs ~6-9% depending on submarket, and asking rents on modern bulk distribution land in the $8-12/SF NNN range.",
        stats: [
          { label: 'Total inventory',          value: '700M+ SF',     note: 'Greater Houston metro' },
          { label: 'Metro vacancy',            value: '~6-9%',        note: 'lower in modern bulk, higher in older Class B' },
          { label: 'Modern bulk asking',       value: '$8-12/SF NNN', note: 'Northwest + Southwest corridors' },
          { label: 'Ship Channel heavy industrial', value: '$10-14/SF NNN', note: 'reflects access premium' },
          { label: 'Flex / light industrial',  value: '$11-15/SF NNN', note: 'Energy Corridor + Northwest' },
          { label: 'Cold storage premium',     value: '+30-60%',      note: 'over comparable dry inventory' },
          { label: 'Net absorption (2025)',    value: 'Top 5 US',     note: 'one of the strongest US markets' },
          { label: 'Stabilized cap rate',      value: '6.0-7.0%',     note: 'Class A bulk; tighter for credit tenants' },
        ],
        keyTakeaways: [
          'Houston is one of the deepest industrial markets in the US — for tenants, that means there are almost always more options than time to evaluate.',
          'Northwest Houston (290 corridor) is the primary modern bulk distribution submarket; the Ship Channel is the heavy industrial / petrochemical-adjacent leader.',
          'Cold storage commands a 30-60% rent premium over comparable dry inventory, and the development pipeline is light relative to demand.',
          'Build-to-suit pencils across Northwest and Southwest corridors at 25 acres+ for credit tenants needing 250K SF or more.',
          'The Energy Corridor is the best flex / light industrial submarket — closer in, with better demographics for office-component buildouts.',
        ],
        marketContext: [
          "Houston is the largest industrial commercial real estate market in Texas and one of the top 5 in the US by absorption. The depth is the story: 700M+ SF of inventory means that almost any industrial requirement — modern bulk distribution, flex, cold storage, manufacturing, special-use — has multiple credible options. That depth also means the negotiating leverage on the tenant side is real if you know where to push.",
          "Submarket dynamics are distinct enough to matter. Northwest Houston (the 290 / Beltway 8 corridor) is the dominant modern bulk distribution submarket — strong absorption, deep landlord pool, the bulk of last-mile e-commerce activity. The Ship Channel is heavy industrial and petrochemical-adjacent logistics; it's the single most important industrial submarket in Texas by economic impact, and the rents reflect the access premium. Southwest Houston supports a mix of bulk distribution and food distribution. Energy Corridor flex is closer in with better demographics, often pulling double duty as light industrial / office-component for service businesses.",
          "For 2026 specifically: the bulk distribution pipeline that flooded the market in 2022-2023 has been absorbed; new construction starts are slower; and several Northwest assets that traded at thin cap rates in 2021-2022 are now in the secondary trade window. For investors, that's the opportunity. For tenants, the leverage is more in legacy Class B inventory where landlords are quietly running renovation / repositioning math.",
        ],
        servicesIntro: [
          "Tenant rep on Houston industrial is where the depth of the market pays. CRECO runs structured processes that filter the 50+ candidate properties down to the 4-5 that actually fit — right column spacing, right dock count, right clear height, right zoning, right truck court depth, right access to the rail or the highway the operation actually needs. Then we negotiate aggressively across that competitive set. Tenants close meaningfully better than the asking-rate average.",
          "For Houston industrial owners, our owner services practice covers hold/sell/reposition analysis, off-market deal flow for acquisition, and disposition strategy that leverages CRECO's Texas-wide investor network. Several recent assignments have closed with 1031 capital from Austin and San Antonio buyers — cross-Texas deal flow is one of the structural advantages of working with a Texas-wide broker.",
          "Investment advisory on Houston industrial works because the inventory is deep enough that there's always a credible angle — value-add on older bulk in a strengthening submarket, stabilized Class A as a yield play in a cap-rate-firming environment, or build-to-suit development with a pre-leased credit tenant. CRECO's role is to match the capital to the angle.",
        ],
        submarkets: [
          {
            name: 'Northwest Houston (290 corridor)',
            characterization: 'Modern bulk distribution',
            description: "Beltway 8 / 290 corridor — modern bulk distribution, big-box logistics, last-mile e-commerce. Strongest absorption in the metro. The default landing zone for new logistics requirements.",
          },
          {
            name: 'Ship Channel',
            characterization: 'Heavy industrial + port logistics',
            description: "Petrochemical-adjacent logistics, port-related distribution, special-use industrial. Highest economic impact submarket in Texas industrial — rents reflect the access premium.",
          },
          {
            name: 'Southwest Houston',
            characterization: 'Bulk + food distribution',
            description: "Bulk distribution + food distribution concentration. Slightly cheaper basis than Northwest with strong fundamentals. Solid mid-market value play.",
          },
          {
            name: 'Energy Corridor',
            characterization: 'Flex / light industrial',
            description: "Closer-in flex with better demographics. Often pulls double duty as light industrial + office-component. Lower clear heights, smaller bays — fits service businesses.",
            href: '/markets/energy-corridor',
          },
          {
            name: 'North Houston / The Woodlands',
            characterization: 'Suburban flex + R&D',
            description: "Suburban flex + light industrial supporting The Woodlands corporate base. R&D-adjacent industrial, medical-device manufacturing.",
            href: '/markets/the-woodlands',
          },
          {
            name: 'East Houston / Pasadena',
            characterization: 'Heavy industrial + value',
            description: "Heavy industrial concentration + Ship Channel-adjacent. Lower basis than the Ship Channel itself; opportunity for users needing rail access at value pricing.",
          },
        ],
        whyBullets: [
          "Industrial is one of CRECO's deepest practice areas — Texas-wide depth across bulk, flex, cold, and special-use",
          "Off-market inventory across Northwest, Ship Channel, Southwest, and the Energy Corridor",
          "Direct relationships with the institutional landlord rep teams on the major Houston industrial assets",
          "Tenant rep for Houston industrial users — landlord pays our commission",
          "Owner services for Houston industrial investors with institutional-quality reporting",
          "Cross-Texas 1031 buyer flow — Houston cap rates often outperform comparable Austin / San Antonio product",
          "Senior broker leads every engagement",
        ],
        listingsLink: {
          label: 'See Houston industrial listings →',
          href: '/listings?city=houston&type=industrial',
        },
        cityHubLink: {
          label: 'Houston market overview',
          href: '/houston-commercial-real-estate',
        },
        breadcrumbs: [
          { label: 'Texas CRE', href: '/markets' },
          { label: 'Houston', href: '/houston-commercial-real-estate' },
          { label: 'Industrial space' },
        ],
      }}
    />
  );
}
