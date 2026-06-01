import type { Metadata } from 'next';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: 'San Antonio Office Space for Lease | Class A, B, Medical | CRECO',
  description:
    'San Antonio office space for lease — Class A in Stone Oak and the Medical Center, creative office at the Pearl, Class B value across downtown. Asking rents, vacancy by submarket, and tenant rep from CRECO, headquartered in San Antonio.',
  keywords: [
    'san antonio office space for lease',
    'office space san antonio',
    'class a office san antonio',
    'stone oak office space',
    'medical center office san antonio',
    'westover hills office space',
    'downtown san antonio office',
    'the pearl office san antonio',
    'medical office building san antonio',
    'san antonio office market',
    'san antonio office vacancy',
    'class a office rent san antonio',
    'san antonio office broker',
    'san antonio tenant representation',
  ],
  alternates: { canonical: 'https://www.crecotx.com/san-antonio-office-space' },
  openGraph: {
    title: 'San Antonio Office Space for Lease | CRECO',
    description:
      'Class A in Stone Oak + Medical Center, creative office at the Pearl, Class B value downtown. San Antonio office market — tenant rep, submarket-by-submarket coverage.',
    url: 'https://www.crecotx.com/san-antonio-office-space',
    type: 'website',
  },
};

export default function SanAntonioOfficeSpacePage() {
  return (
    <CityAssetPage
      config={{
        city: 'San Antonio',
        asset: 'office',
        heroEyebrow: 'Texas Office Market · San Antonio · HQ',
        quickAnswer:
          "San Antonio's office market is bifurcated: trophy Class A in Stone Oak, the Medical Center, and Westover Hills runs ~8-12% vacancy with asking rents in the $32-48/SF FSG range, while older Class B downtown and along Loop 410 sits closer to 20%+ vacancy with meaningful concession depth on the table.",
        stats: [
          { label: 'Class A vacancy',           value: '~9-12%',           note: 'Stone Oak / Northwest tightest' },
          { label: 'Class A asking (FSG)',      value: '$32-48/SF',        note: 'trophy at the top of the band' },
          { label: 'Class B vacancy',           value: '~18-22%',          note: 'value-add and conversion plays viable' },
          { label: 'Class B asking (FSG)',      value: '$22-30/SF',        note: 'realized rates often 8-12% below ask' },
          { label: 'Medical office vacancy',    value: '~5-9%',            note: 'Medical Center the tightest in TX' },
          { label: 'TI on Class A (10yr deal)', value: '$40-55/SF',        note: 'compressing from late 2025 peaks' },
          { label: 'Free rent (10yr Class A)',  value: '4-6 months',       note: 'down from 6-9 months a year ago' },
          { label: 'Stabilized cap rate',       value: '7.0-8.0%',         note: 'Class A; trades below for trophy' },
        ],
        keyTakeaways: [
          'Stone Oak / Northwest is the highest-rent and tightest Class A submarket in San Antonio — trophy concessions are compressing meaningfully.',
          'The South Texas Medical Center has the tightest medical-office vacancy in Texas; new MOB development pipeline is light.',
          'Westover Hills (JPMorgan campus + 1604 corridor) is the strongest suburban Class A submarket and the best build-to-suit option in San Antonio.',
          'Downtown is bifurcated — trophy holds tenancy, but Class B and C downtown face 25%+ vacancy in places. Conversion math is interesting.',
          'The Pearl / Tobin Hill is the premium creative-office submarket; rents per SF here look more like Austin East Side than typical SA.',
        ],
        marketContext: [
          "San Antonio's office market has been the most disciplined major Texas office market through the 2023-2026 cycle. Without the speculative supply pipeline that pushed Austin and Dallas-Fort Worth into 25%+ vacancy on Class A in late 2024, San Antonio held trophy vacancy in the high single digits through the entire cycle. The result is a quieter market where the trophy Class A story has been remarkably resilient — and concessions are now compressing earlier than other Texas metros.",
          "The economic drivers are durable: USAA at headquarters scale, the South Texas Medical Center as one of the largest medical concentrations in the US, military-tech contractors around Joint Base San Antonio, and a growing biosciences and advanced-manufacturing base. None of these is in cyclical retreat. The result is steady tenant demand across multiple uncorrelated industries — the worst submarket year in San Antonio is rarely worse than other Texas metros' average.",
          "Two areas that warrant tenant attention: the Class B set, where vacancy is genuinely elevated and landlords are competitive on TI, free rent, and rent abatement; and the medical office subset around the Medical Center, where vacancy is tighter than published numbers suggest and renewing tenants are seeing real rent pushes for the first time since 2020.",
        ],
        servicesIntro: [
          "CRECO is headquartered in San Antonio. We've toured these buildings — at La Cantera, in the Pearl, around the Medical Center, in Stone Oak, on Loop 410, downtown — and we know which landlords push aggressively, which ones are pragmatic, which Class B assets are quietly running conversion math, and which trophy floor plates have hidden contiguous space that hasn't hit the market yet.",
          "Tenant rep on Class A typically results in 6-12% better economics than a single-property negotiation produces — meaningful on a $30/SF, 10-year deal. On Class B, the leverage is larger: we're seeing realized rates 8-12% below asking in the deals we're closing this year, with TI packages 30-50% higher than the landlord's initial offer.",
          "For owners and investors, we run hold-vs-sell-vs-reposition analysis at the asset level, with Texas-wide 1031 buyer flow when it's time to sell and direct submarket sourcing when it's time to buy. The cap-rate arbitrage between San Antonio and Austin is real (~75-150 bps for comparable product) and a meaningful piece of the cross-Texas deal flow CRECO sees.",
        ],
        submarkets: [
          {
            name: 'Stone Oak / Northwest',
            characterization: 'Top-of-market Class A',
            description: "The highest-rent, tightest-vacancy Class A submarket in San Antonio. La Cantera, Sonterra, the Vineyard. Trophy concessions are compressing.",
            href: '/submarkets/northwest',
          },
          {
            name: 'South Texas Medical Center',
            characterization: 'Tightest medical office in TX',
            description: "One of the largest medical concentrations in the US. MOB vacancy in the high single digits; renewing tenants seeing first real rent pushes since 2020.",
          },
          {
            name: 'Westover Hills',
            characterization: 'Suburban Class A + BTS',
            description: "JPMorgan Chase campus + 1604 corridor. Best build-to-suit submarket in San Antonio; suburban Class A vacancy lower than downtown.",
          },
          {
            name: 'The Pearl / Tobin Hill',
            characterization: 'Creative office, premium rents',
            description: "Adaptive-reuse creative office at the Pearl Brewery. Rents per SF read more like Austin's East Side than typical SA. Walkable density.",
            href: '/markets/the-pearl',
          },
          {
            name: 'Downtown / Riverwalk',
            characterization: 'Trophy holds, B & C struggles',
            description: "Bifurcated. Trophy keeps tenancy; Class B and C face 25%+ vacancy. Conversion math is interesting for older B assets.",
          },
          {
            name: 'Loop 410 / North Central',
            characterization: 'Class B value belt',
            description: "Class B value opportunity. Asking rents look stable; realized rates 8-12% below asking on most Q2 2026 deals. TI 30-50% above initial offers.",
            href: '/submarkets/north-central',
          },
        ],
        whyBullets: [
          "CRECO is headquartered in San Antonio — we know the buildings and the landlords by name",
          "Senior broker leads every engagement, from a 2,000 SF medical practice to a 50,000 SF HQ",
          "Off-market floor-plate inventory across Stone Oak, the Medical Center, Westover Hills, the Pearl, and downtown",
          "Landlord pays our commission — no out-of-pocket cost for the tenant",
          "Direct relationships with the Class A landlord rep teams across the major San Antonio office assets",
          "Concession benchmarking from the deals CRECO is actually closing each quarter, not aggregated marketplace data",
          "Texas-wide network for tenants with multi-city footprints",
        ],
        listingsLink: {
          label: 'See San Antonio office listings →',
          href: '/listings?city=san-antonio&type=office',
        },
        cityHubLink: {
          label: 'San Antonio market overview',
          href: '/san-antonio-commercial-real-estate',
        },
        breadcrumbs: [
          { label: 'Texas CRE', href: '/markets' },
          { label: 'San Antonio', href: '/san-antonio-commercial-real-estate' },
          { label: 'Office space' },
        ],
      }}
    />
  );
}
