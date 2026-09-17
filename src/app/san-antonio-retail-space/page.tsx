// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;


import type { Metadata } from 'next';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: 'San Antonio Retail Space for Lease | Power Centers, Grocery-Anchored, Pad Sites | CRECO',
  description:
    'San Antonio retail space for lease — power centers and grocery-anchored strip along the 1604 loop and Alamo Ranch, lifestyle retail at The Rim and La Cantera, urban retail at the Pearl and downtown, and high-growth pad sites on the Northeast and Southwest corridors. Rents, vacancy, and tenant + landlord rep from CRECO.',
  keywords: [
    'san antonio retail space for lease',
    'retail space san antonio',
    'san antonio strip center for lease',
    'alamo ranch retail space',
    'stone oak retail space',
    'the rim la cantera retail',
    'san antonio pad site',
    'grocery anchored retail san antonio',
    'san antonio retail market',
    'san antonio retail vacancy',
    'san antonio retail rent',
    'san antonio retail broker',
    'nnn retail san antonio',
    'san antonio retail leasing',
  ],
  alternates: { canonical: 'https://www.crecotx.com/san-antonio-retail-space' },
  openGraph: {
    title: 'San Antonio Retail Space for Lease | CRECO',
    description:
      'Power centers + grocery-anchored strip on the 1604 loop and Alamo Ranch, lifestyle retail at The Rim and La Cantera, urban retail at the Pearl, and high-growth pad sites. San Antonio retail — tenant + landlord rep.',
    url: 'https://www.crecotx.com/san-antonio-retail-space',
    type: 'website',
  },
};

export default function SanAntonioRetailSpacePage() {
  return (
    <CityAssetPage
      config={{
        canonicalPath: '/san-antonio-retail-space',
        city: 'San Antonio',
        asset: 'retail',
        heroEyebrow: 'Texas Retail Market · San Antonio · HQ',
        quickAnswer:
          'San Antonio retail is one of the tightest and most landlord-favorable markets in Texas: vacancy runs ~4-6% metro-wide, new supply is disciplined, and population growth on the 1604 loop and the far West and Northeast corridors keeps grocery-anchored and power-center demand ahead of deliveries. Asking rents span ~$20-45/SF NNN depending on center quality and location.',
        stats: [
          { label: 'Metro vacancy',            value: '~4-6%',        note: 'among the tightest in Texas' },
          { label: 'Power center asking',      value: '$22-35/SF NNN',note: '1604 loop + Alamo Ranch' },
          { label: 'Grocery-anchored strip',   value: '$20-30/SF NNN',note: 'inline; endcaps price higher' },
          { label: 'Lifestyle / trophy',       value: '$40-70+/SF NNN',note: 'The Rim, La Cantera, Pearl' },
          { label: 'Pad / QSR ground lease',   value: 'Strong bid',   note: 'hard corners on growth corridors' },
          { label: 'Single-tenant NNN cap',    value: '5.5-6.5%',     note: 'credit tenant; varies by term' },
          { label: 'Multi-tenant strip cap',   value: '7.0-8.0%',     note: 'local/regional tenancy' },
          { label: 'Population growth',         value: 'Top-tier US',  note: 'demand engine for new rooftops' },
        ],
        keyTakeaways: [
          'San Antonio retail is structurally landlord-favorable — metro vacancy in the mid-single digits, a disciplined construction pipeline, and one of the fastest-growing populations of any large US metro keep well-located space leased.',
          'The growth is directional: the far West (Alamo Ranch, US-90/1604), the Northeast (I-35 toward New Braunfels), and the far North (281/1604, Stone Oak) are where new rooftops and new retail demand concentrate.',
          'Hard-corner pad sites and QSR ground leases on the growth corridors trade at a premium — grocery-anchor and national-credit tenants are still expanding in San Antonio when they have paused in softer markets.',
          'Lifestyle and experiential retail (The Rim, La Cantera, the Pearl) is a distinct trophy micro-market with rents and tenancy that look nothing like commodity strip — waitlists, not vacancy.',
          'The Southwest and Southside corridors (toward Lytle and the I-35 South growth path) are earlier in their retail maturation — the value and development runway is here, and CRECO has direct ownership and development experience on this side of the metro.',
        ],
        marketContext: [
          'San Antonio has been one of the most consistent retail markets in the country. It never over-built the way some Sun Belt peers did, so it entered the current cycle with low vacancy and has kept it there — the metro routinely posts retail availability in the mid-single digits while absorbing new grocery-anchored and power-center space as fast as it delivers. For a national or regional tenant, that means the real constraint in San Antonio is finding the right space, not negotiating a distressed deal.',
          'The demand is rooftop-driven and geographically specific. San Antonio adds tens of thousands of residents a year, and the growth pushes northwest (Alamo Ranch, far West 1604), north (Stone Oak, 281/1604), and along the I-35 Northeast corridor toward New Braunfels. Grocers, medical retail, fitness, QSR, and service tenants chase those rooftops, and hard corners on the growth corridors see genuine competition. The urban core — the Pearl, Southtown, downtown — is a separate experiential story driven by tourism, density, and adaptive reuse.',
          'For landlords and developers, the disciplined supply picture supports rent growth on well-merchandised centers and premium pricing on pad sites. For tenants, the tight market rewards moving early and having a broker who knows which centers have real upcoming availability, which anchors are quietly re-tenanting, and where the next node of rooftop growth will support a new store before the competition commits.',
        ],
        servicesIntro: [
          'CRECO is headquartered in San Antonio, and retail is a discipline we practice as both broker and owner — we have developed and leased retail on the Hill Country and Southwest growth corridors ourselves. That owner-operator perspective shapes how we advise: we know what actually leases, what co-tenancy a grocer or QSR wants to see, and how a center pro-forma really pencils.',
          'For retail tenants and franchisees, we run site selection against real rooftop, traffic-count, and trade-area data, then negotiate the deal — TI, free rent, co-tenancy, exclusive use, and options — with the leverage that comes from knowing the landlord\'s position. For a multi-unit rollout, we build the pipeline across the growth corridors so you are not chasing one space at a time.',
          'For retail owners and developers, we handle merchandising strategy, landlord leasing, pad-site disposition, and single-tenant NNN sale execution with Texas-wide 1031 buyer flow. When it is time to sell a stabilized center or a completed pad, we know where the credit-tenant NNN and multi-tenant strip buyers are.',
        ],
        submarkets: [
          {
            name: 'Alamo Ranch / Far West (US-90 & 1604)',
            characterization: 'The growth engine',
            description: 'The metro\'s highest-velocity retail growth node — dense new rooftops, power centers, and grocery anchors. Pad sites and hard corners here see genuine national-tenant competition.',
          },
          {
            name: 'Stone Oak / Far North (281 & 1604)',
            characterization: 'Affluent, grocery + medical',
            description: 'High-income North Side trade area. Grocery-anchored strip, medical retail, and upscale service tenancy. Low vacancy and rent resilience through the cycle.',
            href: '/san-antonio-commercial-real-estate',
          },
          {
            name: 'The Rim / La Cantera (I-10 & 1604 NW)',
            characterization: 'Lifestyle + trophy retail',
            description: 'The metro\'s premier lifestyle and regional retail node. Experiential tenancy, waitlists over vacancy, and rents that read like a different asset class than commodity strip.',
          },
          {
            name: 'Pearl / Southtown / Downtown',
            characterization: 'Urban + experiential',
            description: 'Adaptive-reuse and street retail driven by tourism, walkable density, and food-and-beverage. A curated, high-rent-per-SF micro-market distinct from suburban strip.',
          },
          {
            name: 'I-35 Northeast (toward New Braunfels)',
            characterization: 'Exurban growth corridor',
            description: 'Fast-growing retail along the I-35 spine toward the Austin megaregion — Schertz, Cibolo, New Braunfels. Rooftops ahead of retail supply; strong pad and anchor demand.',
          },
          {
            name: 'Southwest / South (toward Lytle & I-35 South)',
            characterization: 'Value + development runway',
            description: 'Earlier-stage retail maturation on the Southwest and South growth path. Underserved trade areas, development runway, and where CRECO holds direct ownership and leasing experience.',
            href: '/15033-main-st-lytle',
          },
        ],
        whyBullets: [
          'CRECO is a San Antonio owner-operator, not just a broker — we develop and lease retail here ourselves',
          'Site selection grounded in real rooftop, traffic-count, and trade-area data',
          'Fluent in co-tenancy, exclusive-use, and anchor dynamics that make or break a retail deal',
          'Multi-unit and franchise rollout pipelines built across the growth corridors',
          'Landlord leasing, pad-site disposition, and single-tenant NNN execution under one roof',
          'Texas-wide 1031 and NNN buyer flow when it is time to sell a center or pad',
          'Direct development experience on the Hill Country and Southwest corridors',
        ],
        listingsLink: {
          label: 'See San Antonio retail listings →',
          href: '/listings?city=san-antonio&type=retail',
        },
        cityHubLink: {
          label: 'San Antonio market overview',
          href: '/san-antonio-commercial-real-estate',
        },
        breadcrumbs: [
          { label: 'Texas CRE', href: '/markets' },
          { label: 'San Antonio', href: '/san-antonio-commercial-real-estate' },
          { label: 'Retail space' },
        ],
      }}
    />
  );
}
