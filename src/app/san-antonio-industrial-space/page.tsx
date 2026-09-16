import type { Metadata } from 'next';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: 'San Antonio Industrial Space for Lease | Warehouse, Distribution, Flex | CRECO',
  description:
    'San Antonio industrial space for lease — modern bulk distribution along the I-35 near-shoring corridor and Schertz, Toyota-anchored South Side manufacturing, Port San Antonio advanced industry, and infill flex. Asking rents, vacancy by submarket, and tenant rep from CRECO, headquartered in San Antonio.',
  keywords: [
    'san antonio industrial space for lease',
    'san antonio warehouse for lease',
    'industrial space san antonio',
    'schertz industrial space',
    'i-35 distribution san antonio',
    'port san antonio industrial',
    'south side manufacturing san antonio',
    'near-shoring san antonio',
    'san antonio flex space',
    'san antonio industrial market',
    'san antonio industrial vacancy',
    'san antonio warehouse rent',
    'san antonio industrial broker',
    'san antonio industrial tenant representation',
  ],
  alternates: { canonical: 'https://www.crecotx.com/san-antonio-industrial-space' },
  openGraph: {
    title: 'San Antonio Industrial Space for Lease | CRECO',
    description:
      'Modern bulk on the I-35 near-shoring corridor + Schertz, Toyota-anchored South Side manufacturing, Port San Antonio advanced industry, and infill flex. San Antonio industrial — tenant rep + owner services.',
    url: 'https://www.crecotx.com/san-antonio-industrial-space',
    type: 'website',
  },
};

export default function SanAntonioIndustrialSpacePage() {
  return (
    <CityAssetPage
      config={{
        canonicalPath: '/san-antonio-industrial-space',
        city: 'San Antonio',
        asset: 'industrial',
        heroEyebrow: 'Texas Industrial Market · San Antonio · HQ',
        quickAnswer:
          'San Antonio industrial is a near-shoring winner: the I-35 corridor toward Mexico and the Schertz/Northeast submarket anchor modern bulk distribution, metro vacancy runs ~8-11% after a 2023-2025 supply wave that is now absorbing, and asking rents on modern bulk land in the $6-8/SF NNN range — a real discount to Dallas-Fort Worth and Houston.',
        stats: [
          { label: 'Metro inventory',          value: '~130M+ SF',    note: 'growing fast off near-shoring demand' },
          { label: 'Metro vacancy',            value: '~8-11%',       note: 'elevated post supply wave, absorbing' },
          { label: 'Modern bulk asking',       value: '$6-8/SF NNN',  note: 'Northeast / I-35 corridor' },
          { label: 'Flex / light industrial',  value: '$9-13/SF NNN', note: 'infill, smaller-bay product' },
          { label: 'Manufacturing / BTS',      value: 'Active',       note: 'Toyota + Navistar supplier base' },
          { label: 'Cold storage premium',     value: '+30-50%',      note: 'over comparable dry inventory' },
          { label: 'Stabilized cap rate',      value: '6.5-7.5%',     note: 'Class A bulk; discount to DFW' },
          { label: 'Rail / trade access',      value: 'UP + BNSF',    note: 'plus Port SA + Foreign Trade Zone' },
        ],
        keyTakeaways: [
          'San Antonio is the closest major US metro to Mexico on the I-35 NAFTA corridor — near-shoring and reshoring demand from cross-border supply chains is a structural tailwind other Texas markets do not share to the same degree.',
          'The Northeast / I-35 corridor (Schertz, Cibolo, New Braunfels) is the primary modern bulk distribution submarket — big-box 200K-1M SF, positioned between the Austin megaregion and the Laredo border crossing.',
          'The South Side is an advanced-manufacturing cluster anchored by Toyota (and its on-site supplier park) plus Navistar\'s newer plant — build-to-suit and manufacturing-flex demand here behaves differently from pure distribution.',
          'Port San Antonio (the former Kelly AFB) is a ~1,900-acre aerospace, advanced-manufacturing, and cyber campus with large-bay and hangar product you will not find elsewhere in the metro.',
          'For comparable modern product, San Antonio asking rents run a genuine discount to Dallas-Fort Worth and Houston — for tenants with Texas-Triangle flexibility, SA is frequently the lowest-occupancy-cost option in the state.',
        ],
        marketContext: [
          'San Antonio industrial rode a 2023-2025 development wave — speculative bulk delivered fastest along the I-35 Northeast corridor, pushing metro vacancy off its pandemic-era lows into the high single digits and low teens. Unlike the pure oversupply story in some markets, San Antonio\'s absorption has held up: the metro is one of the fastest-growing large cities in the country by population, and the near-shoring thesis keeps translating into real requirements rather than just headlines.',
          'The demand base is unusually diversified for a mid-size industrial market. Cross-border logistics (San Antonio is the first major distribution hub north of Laredo, the busiest US-Mexico land port), a durable manufacturing cluster (Toyota, Navistar, and their supplier ecosystems on the South Side), aerospace and advanced manufacturing at Port San Antonio, and everyday regional distribution serving 2.6M+ metro residents all pull on different tenant pools. That mix is why San Antonio industrial has been steadier through the cycle than markets levered to a single demand driver.',
          'Two things warrant tenant attention right now: modern bulk in the Northeast, where the supply wave means landlords are competitive on free rent and TI for the first time in years — real leverage for a tenant who can move; and cold storage, where the development pipeline remains light relative to grocery and food-distribution demand and the rent premium over dry product is holding.',
        ],
        servicesIntro: [
          'CRECO is headquartered in San Antonio. We have walked these parks — Schertz and the Tri-County corridor, the Brooks and South Side manufacturing belt, Port San Antonio, the I-10 East and Foster Road bulk, and the infill flex around Loop 410 and 1604 — and we know which developers are pragmatic on terms, which buildings have real trailer parking and power, and which planned deliveries are actually going to hit their timeline.',
          'For tenants, industrial tenant rep is where the leverage is clearest right now: with new bulk competing for occupancy, we are seeing free-rent and TI concessions on modern product that a single-building negotiation rarely surfaces. For requirements that need power, clear height, trailer storage, or FTZ status, we filter the metro to the handful of buildings that actually qualify before you spend a day touring.',
          'For owners and investors, we run hold-versus-sell analysis at the asset level and source both cross-border and Texas-Triangle buyer flow when it is time to trade. The cap-rate spread between San Antonio and the larger Texas metros is real, and it cuts both ways depending on whether you are buying yield or selling into institutional demand.',
        ],
        submarkets: [
          {
            name: 'Northeast / I-35 (Schertz–Cibolo)',
            characterization: 'Modern bulk distribution',
            description: 'The primary big-box corridor — Schertz, Cibolo, New Braunfels. Positioned between Austin and the Laredo border. Where most speculative bulk delivered and where the free-rent leverage now sits.',
            href: '/san-antonio-commercial-real-estate',
          },
          {
            name: 'South Side / Toyota / Brooks',
            characterization: 'Manufacturing + build-to-suit',
            description: 'Advanced-manufacturing belt anchored by Toyota\'s plant and supplier park plus Brooks. Manufacturing-flex and BTS demand distinct from distribution; heavy power and rail available.',
          },
          {
            name: 'Port San Antonio (Southwest)',
            characterization: 'Aerospace + advanced industry',
            description: 'The ~1,900-acre former Kelly AFB — aerospace, advanced manufacturing, cyber. Large-bay and hangar product, on-site rail, and tenant profiles you will not find in a typical distribution park.',
          },
          {
            name: 'East / I-10 East (Foster Road)',
            characterization: 'Emerging bulk corridor',
            description: 'Newer distribution growth east of the city toward Seguin along I-10. Newer inventory, competitive asking rents, and room to run on land relative to the built-out Northeast.',
          },
          {
            name: 'Northwest / 1604',
            characterization: 'Infill flex + light industrial',
            description: 'Smaller-bay flex and light industrial closer to the affluent North Side. Better demographics for showroom and service-industrial uses; tighter vacancy and higher rents per SF than bulk.',
          },
          {
            name: 'Far West / US-90 / Lackland',
            characterization: 'Value + growth runway',
            description: 'Value-oriented industrial along US-90 and the far Southwest. Lower occupancy cost, growing rooftop base, and land availability for owner-users and BTS.',
          },
        ],
        whyBullets: [
          'CRECO is headquartered in San Antonio — we know the parks, the developers, and the landlords by name',
          'Fluent in the near-shoring / cross-border logistics story that drives SA industrial demand',
          'Senior broker leads every engagement — from a 5,000 SF flex bay to a 300,000 SF distribution requirement',
          'We qualify buildings on power, clear height, trailer parking, and FTZ status before you tour',
          'Landlord pays our commission — no out-of-pocket cost for the tenant',
          'Concession benchmarking from the deals CRECO is actually closing each quarter, not aggregated marketplace data',
          'Texas-wide network for tenants weighing San Antonio against DFW, Houston, or Austin',
        ],
        listingsLink: {
          label: 'See San Antonio industrial listings →',
          href: '/listings?city=san-antonio&type=industrial',
        },
        cityHubLink: {
          label: 'San Antonio market overview',
          href: '/san-antonio-commercial-real-estate',
        },
        breadcrumbs: [
          { label: 'Texas CRE', href: '/markets' },
          { label: 'San Antonio', href: '/san-antonio-commercial-real-estate' },
          { label: 'Industrial space' },
        ],
      }}
    />
  );
}
