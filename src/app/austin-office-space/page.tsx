import type { Metadata } from 'next';
import { CityAssetPage } from '@/components/marketing/CityAssetPage';

export const metadata: Metadata = {
  title: 'Austin Office Space for Lease | Class A, Creative, East Side | CRECO',
  description:
    'Austin office space for lease — trophy Class A in the CBD and the Domain, creative office in East Austin, Class B value in North and South Austin. Asking rents, vacancy by submarket, and tenant rep from CRECO.',
  keywords: [
    'austin office space for lease',
    'office space austin',
    'class a office austin',
    'the domain office space',
    'east austin creative office',
    'downtown austin office',
    'north austin office space',
    'south austin office',
    'austin office market',
    'austin office vacancy',
    'cost to lease office space austin',
    'austin office broker',
    'austin office rent',
    'austin tenant representation',
  ],
  alternates: { canonical: 'https://www.crecotx.com/austin-office-space' },
  openGraph: {
    title: 'Austin Office Space for Lease | CRECO',
    description:
      'Trophy Class A in the CBD and the Domain, creative office in East Austin, Class B value across the metro. Austin office market — tenant rep, submarket-by-submarket.',
    url: 'https://www.crecotx.com/austin-office-space',
    type: 'website',
  },
};

export default function AustinOfficeSpacePage() {
  return (
    <CityAssetPage
      config={{
        city: 'Austin',
        asset: 'office',
        heroEyebrow: 'Texas Office Market · Austin',
        quickAnswer:
          "Austin's office market is the most bifurcated in Texas — trophy Class A in the CBD and the Domain holds tenancy at $55-75/SF FSG with sub-15% vacancy, while non-trophy Class A and the Class B set sit at 25-35% vacancy with concession depth a tenant hasn't seen in this market in a decade.",
        stats: [
          { label: 'Trophy Class A vacancy',      value: '~12-15%',           note: 'CBD + Domain trophy; the rest of A is weaker' },
          { label: 'Trophy Class A asking',       value: '$55-75/SF FSG',     note: 'CBD highrises lead the band' },
          { label: 'Overall Class A vacancy',     value: '~25-30%',           note: 'non-trophy weighing on the average' },
          { label: 'Class B vacancy',             value: '~28-35%',           note: 'deep value-add opportunity' },
          { label: 'Class B asking (FSG)',        value: '$30-45/SF',         note: 'realized rates 10-15% below ask' },
          { label: 'TI on Class A (10yr deal)',   value: '$80-120/SF',        note: 'historically deep concessions' },
          { label: 'Free rent (10yr Class A)',    value: '8-15 months',       note: 'reflects the tenant-favorable cycle' },
          { label: 'Sublease availability',       value: 'Elevated',          note: 'Class A sublease ~4M SF active' },
        ],
        keyTakeaways: [
          'Austin is the most tenant-favorable major Texas office market — TI packages on Class A 10-year deals are running $80-120/SF with 8-15 months of free rent.',
          'Trophy Class A in the CBD and the Domain is a distinct micro-market from the rest of Austin office — vacancy under 15% and rents pushing the top of the historical band.',
          'East Austin creative office is the highest-demand non-trophy submarket; rents per SF often exceed comparable space in the Domain.',
          'Class B is where the realized leverage is — vacancy in the high 20s / low 30s, realized rates 10-15% below asking, conversion-to-residential math under active review on several assets.',
          'Sublease inventory remains elevated (~4M SF Class A sublease). For 5-15K SF requirements, subleases often beat direct deals on economics — but watch the term-remaining.',
        ],
        marketContext: [
          "Austin overbuilt office through 2020-2023 and is now working through the resulting oversupply. The result is the most tenant-favorable major Texas office market — TI packages, free rent, and effective rents all reflect a cycle that's deeply favorable to tenants who can move now. Class A 10-year deals routinely close with $80-120/SF TI and 8-15 months of free rent in 2026 — historic numbers in any market, and historic specifically for Austin.",
          "The bifurcation is the critical detail. Trophy Class A in the CBD (the highrises) and the Domain (the West Lake / North Austin trophy set) operates as a distinct micro-market: vacancy under 15%, asking rents at the top of the historical $55-75/SF FSG band, and tenant credit quality high enough that landlords can still be selective. Non-trophy Class A — everything one step down — runs ~25-30% vacancy and is fully in tenant-favorable territory.",
          "East Austin creative office is a separate story. The adaptive-reuse warehouses and small-floorplate creative assets in East Austin have held demand from the design / tech-services / agency set; rents per SF on these assets often exceed comparable space in the Domain. The math reflects neighborhood preference, not the underlying market dynamics.",
          "For 2026 specifically: tenants with leases expiring 2027 should be in the market now — the concession depth is unlikely to deepen from here as the worst of the oversupply absorbs, and rent pushes are starting to appear on the trophy floor plates. For investors, the Class B conversion-to-residential plays are starting to pencil where they didn't in 2023; expect transaction volume in the Class B set to pick up through year-end.",
        ],
        servicesIntro: [
          "Tenant rep on Austin office is where the leverage is most extreme right now. CRECO runs structured processes that take the most realistic 6-10 candidate properties — across trophy, non-trophy, and quality sublease — and put them in direct competition. The result is typically TI 15-25% above the landlord's initial offer, free rent at the top of the band, and effective rents that compound those advantages over a 7-10 year hold.",
          "For Austin office owners, our owner services practice runs hold-vs-sell-vs-reposition analysis with cold-eyed honesty about the bifurcation. Trophy holds: the market is selectively recovering and the bid for the right asset is real. Non-trophy Class A: more often the right answer is hold-and-stabilize through the cycle. Class B: the conversion math is becoming credible on more assets than it was a year ago.",
          "Investment advisory on Austin office in 2026 is opportunity-driven. The transactions that work are value-add buys at meaningfully discounted basis with a credible repositioning story — or trophy buys at firmed cap rates from sellers who didn't underwrite the cycle. CRECO's role is to find the angles the public marketplaces don't surface.",
        ],
        submarkets: [
          {
            name: 'Downtown / CBD',
            characterization: 'Trophy highrise + premium rents',
            description: "The CBD trophy highrises operate as a distinct micro-market — sub-15% vacancy, asking $55-75/SF FSG, deep tenant credit. The non-trophy CBD is materially softer.",
          },
          {
            name: 'The Domain',
            characterization: 'Trophy mixed-use, North Austin',
            description: "Master-planned trophy mixed-use in North Austin. Holds tenancy; comparable economics to CBD trophy. Walkable density + retail + multifamily-adjacent.",
            href: '/markets/the-domain',
          },
          {
            name: 'East Austin',
            characterization: 'Creative office + adaptive reuse',
            description: "Adaptive-reuse warehouses and small-floorplate creative office. Rents per SF often exceed the Domain. Highest-demand non-trophy submarket in Austin.",
          },
          {
            name: 'Northwest / Arboretum',
            characterization: 'Class A value, suburban',
            description: "Suburban Class A north of the river. Tenant-favorable economics; some of the deepest concessions in Austin. Value play for budget-conscious tenants.",
          },
          {
            name: 'South Austin',
            characterization: 'Class A, mixed-use growth',
            description: "South Lamar + East Riverside corridors. Growing mixed-use trophy set; concessions still tenant-favorable. Walkable to growing residential base.",
          },
          {
            name: 'Round Rock / Pflugerville',
            characterization: 'Class A suburban + BTS',
            description: "Suburban Class A north of the metro. Build-to-suit opportunities for 50K SF+ users. Lower basis than the Domain with comparable building quality.",
            href: '/markets/round-rock',
          },
        ],
        whyBullets: [
          "Austin office concession data from the deals CRECO is actually closing each quarter — not aggregated marketplace summaries",
          "Direct landlord-rep relationships across the CBD trophy set + Domain + East Austin creative",
          "Knowledge of the trophy contiguous floor plates that aren't yet on the market",
          "Tenant rep for Austin businesses — landlord pays our commission",
          "Cold-eyed sublease evaluation — many subleases beat direct deals on economics, but term-remaining matters",
          "Texas-wide network for tenants with Austin + multi-city footprints",
          "Senior broker leads every engagement",
        ],
        listingsLink: {
          label: 'See Austin office listings →',
          href: '/listings?city=austin&type=office',
        },
        cityHubLink: {
          label: 'Austin market overview',
          href: '/austin-commercial-real-estate',
        },
        breadcrumbs: [
          { label: 'Texas CRE', href: '/markets' },
          { label: 'Austin', href: '/austin-commercial-real-estate' },
          { label: 'Office space' },
        ],
      }}
    />
  );
}
