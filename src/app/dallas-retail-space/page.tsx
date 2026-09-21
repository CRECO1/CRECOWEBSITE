// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;


import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: 'Dallas–Fort Worth Retail Space for Lease | CRECO',
  description:
    'Dallas–Fort Worth retail space for lease — mixed-use and power centers in Frisco, Plano, and the Collin County growth corridor, lifestyle retail in Southlake and Clearfork, and urban retail in Uptown and Bishop Arts. Rents, vacancy, and tenant + landlord rep from CRECO.',
  keywords: [
    'dallas retail space for lease',
    'dfw retail space for lease',
    'retail space dallas',
    'frisco retail space',
    'plano retail space',
    'legacy west retail',
    'southlake retail space',
    'dallas strip center for lease',
    'dfw retail market',
    'dallas retail vacancy',
    'dallas retail rent',
    'dallas retail broker',
    'nnn retail dallas',
    'dfw retail leasing',
  ],
  alternates: { canonical: 'https://www.crecotx.com/dallas-retail-space' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Dallas–Fort Worth Retail Space for Lease | CRECO',
    description:
      'Mixed-use + power centers in Frisco, Plano, and Collin County, lifestyle retail in Southlake and Clearfork, and urban retail in Uptown and Bishop Arts. DFW retail — tenant + landlord rep.',
    url: 'https://www.crecotx.com/dallas-retail-space',
    type: 'website',
  },
};

export default function DallasRetailSpacePage() {
  return (
    <CityAssetPage
      config={{
        sourcesAsOf: 'September 2026',
        canonicalPath: '/dallas-retail-space',
        city: 'Dallas–Fort Worth',
        asset: 'retail',
        heroEyebrow: 'Texas Retail Market · Dallas–Fort Worth',
        quickAnswer:
          'Dallas–Fort Worth retail is one of the strongest and fastest-growing markets in the country: metro vacancy runs ~5-6%, and the explosive population and corporate growth of the Collin County corridor (Frisco, Plano, McKinney) keeps mixed-use and power-center demand ahead of supply. Asking rents span ~$25-45/SF NNN, with Legacy West-tier lifestyle retail well above.',
        stats: [
          { label: 'Metro vacancy',            value: '~5-6%',         note: 'tight; strong net absorption' },
          { label: 'Power center asking',      value: '$25-45/SF NNN', note: 'Collin County + suburban nodes' },
          { label: 'Grocery-anchored strip',   value: '$22-38/SF NNN', note: 'inline; endcaps price higher' },
          { label: 'Mixed-use / lifestyle',    value: '$45-80+/SF NNN',note: 'Legacy West, Southlake, Clearfork' },
          { label: 'Pad / QSR ground lease',   value: 'Strong bid',    note: 'hard corners on growth corridors' },
          { label: 'Single-tenant NNN cap',    value: '5.5-6.5%',      note: 'credit tenant; varies by term' },
          { label: 'Multi-tenant strip cap',   value: '7.0-8.0%',      note: 'local/regional tenancy' },
          { label: 'Collin County growth',     value: 'Top-tier US',   note: 'among fastest-growing US counties' },
        ],
        keyTakeaways: [
          'DFW retail is powered by the same corporate-relocation and population boom that drives its office and industrial markets — the difference is retail vacancy stays tight (mid-single digits) because rooftops and incomes keep outrunning supply.',
          'Collin County (Frisco, Plano, McKinney, Allen) is the epicenter — Legacy West, The Star, and a wave of mixed-use development have made the northern suburbs one of the highest-demand retail corridors in the US.',
          'Mixed-use and lifestyle retail (Legacy West, Southlake Town Square, Clearfork) is a distinct high-rent tier — walkable, experiential, and merchandised for affluent trade areas, with economics that look nothing like commodity strip.',
          'Urban Dallas — Uptown, Knox-Henderson, Bishop Arts, Deep Ellum — is the experiential, F&B-driven street-retail market, separate from the suburban power-center story.',
          'Hard-corner pads and QSR ground leases on the growth corridors command a premium; national-credit tenants continue to expand aggressively across the Metroplex.',
        ],
        marketContext: [
          'Dallas–Fort Worth is one of the premier retail growth markets in the United States, and it is riding the same engine as its office and industrial sectors: relentless corporate relocation and population growth. But where DFW office is bifurcated and industrial is working through a supply wave, retail has stayed consistently tight — metro vacancy in the mid-single digits — because household formation and income growth keep demand ahead of new centers. For a national or regional tenant, the constraint in DFW is competition for the best corners, not distressed availability.',
          'The growth is concentrated in the north. Collin County — Frisco, Plano, McKinney, Allen — has become one of the most dynamic retail corridors in the country, anchored by corporate campuses (the Legacy/Frisco relocation wave), master-planned affluence, and marquee mixed-use like Legacy West and The Star. Southlake and the Mid-Cities add another affluent, low-vacancy layer, and Fort Worth\'s Clearfork and West 7th give the western metro its own lifestyle nodes. Urban Dallas — Uptown, Bishop Arts, Deep Ellum, Knox-Henderson — is the experiential, dining-led street-retail market.',
          'For landlords and developers, the picture supports rent growth on well-merchandised centers and premium pad pricing. For tenants, the tight, fast-moving market rewards a broker who knows which mixed-use and power-center projects have real upcoming availability, how co-tenancy and exclusives are trading in the hot corridors, and where the next phase of rooftop growth will support a store before competitors commit.',
        ],
        servicesIntro: [
          'CRECO covers Dallas–Fort Worth retail as part of a Texas-wide practice, working both tenant/franchise representation and landlord leasing. In a market moving as fast as Collin County, the value is knowing where demand is actually heading — which mixed-use phase, which suburban node\'s next grocery anchor — and positioning a client before the trade area is fully built out.',
          'For retail tenants and franchisees, we run site selection against real rooftop, traffic-count, and trade-area data, then negotiate TI, free rent, co-tenancy, exclusive use, and options with the landlord\'s position in view. For a multi-unit rollout across the Metroplex, we build the pipeline across the growth corridors so you are not chasing one space at a time.',
          'For retail owners and developers, we handle merchandising strategy, landlord leasing, pad-site disposition, and single-tenant NNN sale execution with Texas-wide 1031 buyer flow. DFW is deep institutional and private-capital retail territory, and we know where the credit-tenant NNN and multi-tenant strip buyers are.',
        ],
        submarkets: [
          {
            name: 'Frisco / Legacy West / The Star',
            characterization: 'The growth epicenter',
            description: 'The highest-demand retail corridor in DFW — Legacy West, The Star, and Frisco Station. Corporate campuses, master-planned affluence, and marquee mixed-use driving national-tenant competition.',
            href: '/dallas-commercial-real-estate',
          },
          {
            name: 'Plano / Allen / McKinney (Collin County)',
            characterization: 'Affluent power-center belt',
            description: 'Fast-growing, high-income Collin County suburbs — Watters Creek, Fairview, and a deep power-center and grocery-anchored base. Low vacancy and steady rent growth.',
          },
          {
            name: 'Southlake / Grapevine (Mid-Cities)',
            characterization: 'Affluent lifestyle',
            description: 'Southlake Town Square anchors one of the wealthiest trade areas in Texas. Lifestyle and specialty retail with waitlist-level demand and premium rents.',
          },
          {
            name: 'Uptown / Knox-Henderson / Bishop Arts',
            characterization: 'Urban + experiential',
            description: 'Dense, walkable Dallas street retail driven by dining and specialty tenancy. High rent-per-SF experiential corridors distinct from the suburban power-center market.',
          },
          {
            name: 'Fort Worth / Clearfork / West 7th',
            characterization: 'West-metro lifestyle',
            description: 'Fort Worth\'s lifestyle and urban retail nodes — Clearfork\'s upscale mixed-use and the West 7th entertainment district serving a growing, distinct western trade area.',
          },
          {
            name: 'Arlington / Mid-Cities',
            characterization: 'Entertainment + power centers',
            description: 'The central entertainment district (the stadiums, the district around them) plus established power-center retail serving the dense mid-cities population between Dallas and Fort Worth.',
          },
        ],
        whyBullets: [
          'Texas-wide retail practice — tenant, franchise, and landlord representation under one roof',
          'Site selection grounded in real rooftop, traffic-count, and trade-area data',
          'Fluent in co-tenancy, exclusive-use, and anchor dynamics that make or break a retail deal',
          'Multi-unit and franchise rollout pipelines built across the Collin County growth corridors',
          'Landlord leasing, pad-site disposition, and single-tenant NNN execution in-house',
          'Texas-wide 1031 and NNN buyer flow when it is time to sell a center or pad',
          'The landlord typically pays tenant-rep commission — no out-of-pocket cost for the tenant',
        ],
        listingsLink: {
          label: 'See Dallas–Fort Worth retail listings →',
          href: '/listings?city=dallas&type=retail',
        },
        cityHubLink: {
          label: 'Dallas–Fort Worth market overview',
          href: '/dallas-commercial-real-estate',
        },
        breadcrumbs: [
          { label: 'Texas CRE', href: '/markets' },
          { label: 'Dallas–Fort Worth', href: '/dallas-commercial-real-estate' },
          { label: 'Retail space' },
        ],
      }}
    />
  );
}
