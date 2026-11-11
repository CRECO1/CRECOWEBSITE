// 30-min ISR — the page embeds live CRECO inventory (table + ItemList + FAQ).
export const revalidate = 1800;


import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: 'San Antonio Office Space for Lease | CRECO',
  description:
    'San Antonio office space for lease — Class A in Stone Oak and the Medical Center, creative office at the Pearl, Class B value across downtown.',
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
    images: [DEFAULT_OG_IMAGE],
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
        sourcesAsOf: 'November 2026',
        canonicalPath: '/san-antonio-office-space',
        city: 'San Antonio',
        asset: 'office',
        heroEyebrow: 'Texas Office Market · San Antonio · HQ',
        quickAnswer:
          "San Antonio office vacancy was 15.2% to 17.8% in Q3 2026 depending on the report, with Class A asking $32.02 to $36.56/SF full service and no new office under construction. The market splits by submarket: Far West and Far Northwest run about 8% vacant, while downtown runs 18.8% to 25.0%.",
        stats: [
          { label: 'Overall vacancy',                value: '15.2–17.8%',        note: 'Cushman 15.2% · Partners 16.6% · CBRE 17.8%' },
          { label: 'Class A vacancy',                value: '18.4–18.5%',        note: 'CBRE 18.4% · Partners 18.5%' },
          { label: 'Class B vacancy',                value: '15.0–18.0%',        note: 'Partners 15.0% · CBRE 18.0%' },
          { label: 'Class A asking, $/SF full service', value: '$32.02–36.56',   note: 'Cushman $32.02 · Partners $33.02 · CBRE $36.56' },
          { label: 'Class B asking, $/SF full service', value: '$26.32–26.50',   note: 'Partners $26.32 · CBRE $26.50' },
          { label: 'Downtown (CBD) vacancy',         value: '18.8–25.0%',        note: 'highest submarket in all three reports' },
          { label: 'Tightest submarkets',            value: '8.1–8.7% vacant',   note: 'Far West and Far Northwest' },
          { label: 'Office under construction',      value: 'None',              note: 'in all three reports, Q3 2026' },
        ],
        keyTakeaways: [
          'Vacancy depends on the report: 15.2% (Cushman & Wakefield), 16.6% (Partners) or 17.8% (CBRE) in Q3 2026. CBRE has it at the lowest since a Q1 2025 peak of 19.7%.',
          'Nothing is under construction in any of the three reports, so new supply is not adding to vacancy.',
          'Class A is not the tight class: vacancy was 18.4% (CBRE) and 18.5% (Partners), above Class B in both. Class A rents are still rising: Cushman & Wakefield has them up 8.0% year over year.',
          'The tight pockets are Far West (8.1% to 8.7% vacant) and Far Northwest (8.3%, Cushman & Wakefield). CBRE has Midtown and the Northwest at the highest Class A rents: $45.04 and $41.85/SF.',
          'Downtown is the weak spot: 18.8% (Cushman & Wakefield), 23.4% (Partners) and 25.0% (CBRE) vacant, with Partners showing 27.9% in downtown Class A.',
        ],
        marketContext: [
          "San Antonio's office market is recovering slowly from elevated vacancy. In Q3 2026 CBRE had vacancy at 17.8%, its lowest since a 19.7% peak in Q1 2025; Cushman & Wakefield had it at 15.2%, 160 bps better than a year earlier; Partners had it at 16.6%, 99 bps better. With no office space under construction in any of the three reports, new supply is not adding to vacancy, and leasing is steady: about 497,000 SF in Q3 at Cushman & Wakefield, 478,668 SF at Partners and 244,000 SF at CBRE.",
          "The economic drivers are durable: USAA at headquarters scale, the South Texas Medical Center as one of the largest medical concentrations in the US, military-tech contractors around Joint Base San Antonio, and a growing biosciences and advanced-manufacturing base. None of these is in cyclical retreat. The result is steady tenant demand across multiple uncorrelated industries — the worst submarket year in San Antonio is rarely worse than other Texas metros' average.",
          "Two areas warrant tenant attention. Downtown and Midtown carry the heaviest vacancy (CBD 18.8% to 25.0%; Midtown 24.1% at CBRE), and landlords in the emptiest buildings compete on improvement allowances and free rent. Medical office is a separate market: Matthews put metro medical office vacancy at 12.27% in Q2 2026 (its Q3 report was not yet published), and properties near the South Texas Medical Center command a premium.",
        ],
        servicesIntro: [
          "CRECO is headquartered in San Antonio. We've toured these buildings — at La Cantera, in the Pearl, around the Medical Center, in Stone Oak, on Loop 410, downtown — and we know which landlords push aggressively, which ones are pragmatic, which Class B assets are quietly running conversion math, and which trophy floor plates have hidden contiguous space that hasn't hit the market yet.",
          "Tenant rep on Class A typically results in 6-12% better economics than a single-property negotiation produces — meaningful on a $30/SF, 10-year deal. On Class B, the leverage is larger: we're seeing realized rates 8-12% below asking in the deals we're closing this year, with TI packages 30-50% higher than the landlord's initial offer.",
          "For owners and investors, we run hold-vs-sell-vs-reposition analysis at the asset level, with Texas-wide 1031 buyer flow when it's time to sell and direct submarket sourcing when it's time to buy. The cap-rate arbitrage between San Antonio and Austin is real (~75-150 bps for comparable product) and a meaningful piece of the cross-Texas deal flow CRECO sees.",
        ],
        submarkets: [
          {
            name: 'Northwest / Far Northwest',
            characterization: 'Largest submarket',
            description: "The largest office submarket in all three reports, including La Cantera and Summit at the Rim (Cushman & Wakefield counts both in Far Northwest). Northwest vacancy was 15.3% to 16.0% in Q3 2026; Far Northwest was 8.3% vacant with Class A asking $40.90/SF (Cushman & Wakefield). Northwest Class A asked $33.03 to $41.85/SF depending on the report.",
            href: '/submarkets/northwest',
          },
          {
            name: 'South Texas Medical Center',
            characterization: 'Premium medical office',
            description: "One of the largest medical concentrations in the US. Metro medical office vacancy was 12.27% in Q2 2026 (Matthews; Q3 not yet published), with 80,128 SF under construction, and properties near the South Texas Medical Center command a premium.",
            href: '/san-antonio-medical-office-space',
          },
          {
            name: 'Westover Hills / Far West',
            characterization: 'Among the tightest',
            description: "Far West was 8.1% vacant at Cushman & Wakefield and 8.7% at CBRE in Q3 2026, the lowest in CBRE's data, with +209,000 SF absorbed at CBRE. CBRE notes AT&T's move from Midtown into new space in Westover Hills; Partners notes AvalonBay's 34,741 SF move into One51 Office Centre.",
          },
          {
            name: 'The Pearl / Midtown',
            characterization: 'Highest rents, high vacancy',
            description: "Adaptive-reuse creative office at the Pearl Brewery. CBRE's Midtown submarket, next to downtown, posts the metro's highest asking rents ($42.68 overall, $45.04 Class A) alongside 24.1% vacancy and -389,000 SF of net absorption in Q3; CBRE cites AT&T's move out of its Midtown office.",
          },
          {
            name: 'Downtown / Riverwalk',
            characterization: 'Highest vacancy in the metro',
            description: "CBD vacancy was 18.8% (Cushman & Wakefield), 23.4% (Partners) and 25.0% (CBRE) in Q3 2026, the highest in every report. Partners shows 27.9% vacancy in downtown Class A and 17.1% in Class B; downtown Class A asked $31.66 to $34.31/SF.",
          },
          {
            name: 'Loop 410 / North Central',
            characterization: 'Class B value belt',
            description: "North Central vacancy was 15.7% (Cushman & Wakefield), 16.1% (Partners) and 16.7% (CBRE) in Q3 2026. Class B asked $25.09/SF (Partners, gross) and Class A $29.60 to $31.49. In CRECO's recent deals, realized Class B rents often run 8-12% below asking, with TI 30-50% above the landlord's first offer.",
            href: '/submarkets/north-central',
          },
        ],
        whyBullets: [
          "CRECO is headquartered in San Antonio — we know the buildings and the landlords by name",
          "You work directly with the people doing the deal, from a 2,000 SF medical practice to a 50,000 SF HQ",
          "Off-market floor-plate inventory across Stone Oak, the Medical Center, Westover Hills, the Pearl, and downtown",
          "Full-service representation — tenants, landlords/owners, and investors; tenant rep is typically paid by the landlord",
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
        answerLinks: [
          { label: 'Class A office rent in San Antonio, Q3 2026 (three reports)', href: '/answers/san-antonio-class-a-office-rent' },
          { label: 'San Antonio office vacancy rate', href: '/answers/san-antonio-office-vacancy-rate' },
        ],
        sources: [
          { label: 'CBRE, San Antonio Office Figures Q3 2026 (Oct 9 2026)', url: 'https://www.cbre.com/insights/figures/san-antonio-office-figures-q3-2026' },
          { label: 'Cushman & Wakefield, MarketBeat San Antonio Office Q3 2026', url: 'https://www.cushmanwakefield.com/en/united-states/insights/us-marketbeats/san-antonio-marketbeats/office' },
          { label: 'Partners Real Estate, San Antonio Office Q3 2026 (Nov 2 2026)', url: 'https://partnersrealestate.com/research/san-antonio-office-q3-2026-quarterly-market-report/' },
          { label: 'Matthews, San Antonio Medical Office Q2 2026 (Jul 21 2026)', url: 'https://www.matthews.com/insights/san-antonio-medical-office-q2-2026' },
        ],
        breadcrumbs: [
          { label: 'Texas CRE', href: '/markets' },
          { label: 'San Antonio', href: '/san-antonio-commercial-real-estate' },
          { label: 'Office space' },
        ],
      }}
    />
  );
}
