/**
 * Answer-first pages: one question per page, a short direct answer, the sourced figures behind it, and links
 * to the original reports.
 *
 * Pages without a `period` still carry Q2 2026 data lifted from the published Q2 2026 Market Brief
 * (src/app/market-brief/BriefContent.tsx) or src/lib/answers.ts (today: the medical office page, until Matthews
 * publishes Q3, and the Fair Oaks Ranch how-to). Bump BRIEF_UPDATED only when the Brief itself is revised.
 *
 * Pages with their own `period` / `updated` (Q3 2026 and later) cite named reports directly. Each figure was read
 * on the publisher's own page or PDF; do NOT add a number you have not read in the source you cite, name the
 * report, quarter and publication date, and say plainly when a source does not publish something.
 * `reviewed: false` means the named broker has not read the page yet: it says "Prepared by CRECO" instead of
 * "Reviewed by", and the schema omits reviewedBy. Flip it to true only after he has.
 */
export interface SourceLink { label: string; url?: string }
export interface AnswerTable {
  caption: string;
  columns: string[];
  rows: string[][];
  /** Small print under the table: basis, caveats. */
  note?: string;
}
export interface AnswerFaq { q: string; a: string }
export interface AnswerPage {
  slug: string;
  question: string;
  /** 1-3 sentences, the direct answer. Also used as the meta description and the FAQPage answer. */
  answer: string;
  /** Short title for index cards and breadcrumbs. */
  short: string;
  points: string[];
  sources: SourceLink[];
  related: { label: string; href: string }[];
  /** Data period shown under the answer, e.g. "Q3 2026". Defaults to "Q2 2026" (the first Market Brief edition). */
  period?: string;
  /** ISO date this page's figures were last checked. Defaults to BRIEF_UPDATED. Also the sitemap lastmod. */
  updated?: string;
  /** False = not yet reviewed by the named broker (see header). Default true. */
  reviewed?: boolean;
  /** Overline scope. Defaults to San Antonio & Hill Country; set for statewide pages. */
  scope?: string;
  /** Comparison tables under the answer; they scroll sideways on a phone. */
  tables?: AnswerTable[];
  /** CRECO's own view, shown in a labelled box so it is never read as data. */
  opinion?: string;
  /** Follow-up questions in the words people actually ask; rendered as an FAQ and in FAQPage JSON-LD. */
  faqs?: AnswerFaq[];
}

const MATTHEWS = 'https://www.matthews.com/insights/san-antonio-medical-office-q2-2026';
const BRIEF = { label: 'San Antonio & Hill Country Market Brief', href: '/market-brief' };

// Q3 2026 sources (read directly on the publisher's page or PDF, 2026-11-10).
const MATTHEWS_SA_RETAIL = 'https://www.matthews.com/insights/san-antonio-retail-q3-2026';
const MATTHEWS_AUSTIN_RETAIL = 'https://www.matthews.com/insights/austin-retail-q3-2026';
const MATTHEWS_DFW_RETAIL = 'https://www.matthews.com/insights/dallas-fort-worth-retail-market-report-q3-2026';
const MATTHEWS_DFW_RETAIL_Q2 = 'https://www.matthews.com/insights/dallas-fort-worth-retail-market-report-q2-2026';
const MATTHEWS_HOUSTON_RETAIL_Q2 = 'https://www.matthews.com/insights/houston-retail-market-report-q2-2026';
const LEE_HOUSTON_RETAIL = 'https://www.lee-associates.com/wp-content/uploads/2026/10/2026-Q3-Houston-TX-Retail.pdf';
const MM_RETAIL_MIDYEAR = 'https://www.marcusmillichap.com/research/research-brief/2026/08/research-brief-midyear-retail-outlook';
const CBRE_OFF_Q3 = 'https://www.cbre.com/insights/figures/san-antonio-office-figures-q3-2026';
const CW_OFF_Q3 = 'https://www.cushmanwakefield.com/en/united-states/insights/us-marketbeats/san-antonio-marketbeats/office';
const P_OFF_Q3 = 'https://partnersrealestate.com/research/san-antonio-office-q3-2026-quarterly-market-report/';
const CBRE_IND_Q3 = 'https://www.cbre.com/insights/figures/san-antonio-industrial-figures-q3-2026';
const CW_IND_Q3 = 'https://www.cushmanwakefield.com/en/united-states/insights/us-marketbeats/san-antonio-marketbeats/industrial';
const P_IND_Q3 = 'https://partnersrealestate.com/research/san-antonio-industrial-q3-2026-quarterly-market-report/';
const P_RET_Q3 = 'https://partnersrealestate.com/research/san-antonio-retail-q3-2026-quarterly-market-report/';

export const ANSWER_PAGES: AnswerPage[] = [
  {
    slug: 'texas-retail-cap-rates',
    short: 'Texas retail cap rates',
    question: 'What are retail cap rates in Texas in Q3 2026?',
    answer: 'Texas retail cap rates averaged 6.53% in Austin, 6.66% in San Antonio, 6.86% in Dallas–Fort Worth and 7.30% in Houston in Q3 2026. These are metro-wide averages for all retail (Matthews; Lee & Associates for Houston), not strip-center or grocery-anchored figures.',
    period: 'Q3 2026',
    updated: '2026-11-10',
    reviewed: false,
    scope: 'Texas commercial real estate',
    tables: [
      {
        caption: 'Average retail cap rate by Texas metro, Q3 2026',
        columns: ['Metro', 'Avg. cap rate', 'Vacancy', 'Price/SF', 'Direction', 'Source'],
        rows: [
          ['Austin', '6.53%', '3.6%', '$365', 'Up 16 straight quarters', 'Matthews, Oct 28 2026'],
          ['San Antonio', '6.66%', '4.0%', '$271', 'Up 13 straight quarters', 'Matthews, Nov 4 2026'],
          ['Dallas–Fort Worth', '6.86%', '5.1%', '$295', 'Down 5 straight quarters', 'Matthews, Oct 26 2026'],
          ['Houston', '7.30%', '5.4%', '$255', 'Unchanged since Q4 2025', 'Lee & Associates, Q3 2026'],
        ],
        note: 'Cap rate is net operating income divided by price, so a higher rate means a lower price for the same income. "Up" means cap rates are rising (softer pricing). The firms define markets and count sales differently, so compare a metro with its own history rather than across firms.',
      },
    ],
    points: [
      'Direction differs by metro. Matthews has San Antonio cap rates up for 13 straight quarters (27 bps above the Q2 2023 low of 6.40%) and Austin up for 16 (61 bps above the Q3 2022 low of 5.92%), while Dallas–Fort Worth is down for five straight quarters.',
      'Houston has held at 7.30% since Q4 2025 in Lee & Associates\' series (7.40% a year earlier). Matthews reported a 7.3% Houston average for Q2 2026.',
      'Price per square foot: Austin $365 (higher for 8 consecutive years), San Antonio $271 (17 consecutive years), Dallas–Fort Worth a record $295, Houston $255.',
      'Trailing-12-month retail sales volume (Matthews): Dallas–Fort Worth $4.0B (+54%), Austin $1.1B (+75%), San Antonio $0.8B (+42%).',
      'None of these reports publishes a cap rate for strip centers, grocery-anchored centers or single-tenant net lease in Texas. Matthews\' Q2 2026 Houston and Dallas–Fort Worth reports say grocery-anchored centers drew the strongest buyer interest, without giving a number.',
      'National context, not like-for-like: Marcus & Millichap\'s August 2026 midyear outlook put multi-tenant retail at an average 7.3% cap rate over the past year and single-tenant retail near 6.6%.',
    ],
    opinion: 'A metro average is a midpoint, not a price for your building. A strip center with short leases and local tenants usually trades at a wider spread than a grocery-anchored center with a long lease. Use these figures to sanity-check an offer or a valuation, then price the actual rent roll.',
    faqs: [
      {
        q: 'What is the cap rate for strip malls in Houston?',
        a: 'No report we found breaks out strip centers. The Houston-wide average for all retail was 7.30% in Q3 2026 (Lee & Associates) and 7.3% in Q2 2026 (Matthews). Strip centers are part of that average, and where one lands depends on its leases, tenants and age.',
      },
      {
        q: 'What is the retail cap rate in San Antonio?',
        a: 'Matthews put the San Antonio average at 6.66% in Q3 2026, up for 13 straight quarters and 27 bps above the Q2 2023 low of 6.40%, with 4.0% vacancy and pricing of $271/SF.',
      },
      {
        q: 'What is the retail cap rate in Dallas–Fort Worth?',
        a: 'Matthews put the Dallas–Fort Worth average at 6.86% in Q3 2026, down for five straight quarters, with 5.1% vacancy and a record $295/SF.',
      },
      {
        q: 'Are Texas retail cap rates rising or falling?',
        a: 'It depends on the metro. San Antonio and Austin cap rates have risen for 13 and 16 straight quarters in Matthews\' series, Dallas–Fort Worth has fallen for five, and Houston has been flat at 7.30% since Q4 2025 in Lee & Associates\' series.',
      },
      {
        q: 'What cap rate should I use to value a retail center in Texas?',
        a: 'Treat the metro average as a starting point only, then adjust for tenant credit, remaining lease term, building age and location. For a specific property, ask CRECO for a broker opinion of value built on closed comparable sales and the actual leases.',
      },
    ],
    sources: [
      { label: 'Matthews, Austin Retail Market Report Q3 2026 (Oct 28 2026)', url: MATTHEWS_AUSTIN_RETAIL },
      { label: 'Matthews, San Antonio Retail Market Report Q3 2026 (Nov 4 2026)', url: MATTHEWS_SA_RETAIL },
      { label: 'Matthews, Dallas–Fort Worth Retail Market Report Q3 2026 (Oct 26 2026)', url: MATTHEWS_DFW_RETAIL },
      { label: 'Lee & Associates, Houston Retail Market Overview Q3 2026', url: LEE_HOUSTON_RETAIL },
      { label: 'Matthews, Houston Retail Market Report Q2 2026 (Aug 18 2026)', url: MATTHEWS_HOUSTON_RETAIL_Q2 },
      { label: 'Matthews, Dallas–Fort Worth Retail Market Report Q2 2026 (Aug 6 2026)', url: MATTHEWS_DFW_RETAIL_Q2 },
      { label: 'Marcus & Millichap, Midyear Retail Outlook (Aug 2026)', url: MM_RETAIL_MIDYEAR },
    ],
    related: [
      { label: 'Houston retail space', href: '/houston-retail-space' },
      { label: 'San Antonio retail space', href: '/san-antonio-retail-space' },
      { label: 'Dallas retail space', href: '/dallas-retail-space' },
      { label: 'Austin retail space', href: '/austin-retail-space' },
      { label: 'What cap rate does a freestanding H-E-B trade at?', href: '/answers/heb-freestanding-grocery-cap-rate' },
      { label: 'San Antonio and Hill Country retail vacancy', href: '/answers/san-antonio-retail-vacancy-rate' },
      { label: 'What is my commercial property worth?', href: '/property-valuation' },
    ],
  },
  {
    slug: 'heb-freestanding-grocery-cap-rate',
    short: 'H-E-B and grocery cap rates',
    question: 'What cap rate does a freestanding H-E-B trade at?',
    answer: 'No free market report publishes an H-E-B-specific cap rate, so we cannot quote one. The closest published benchmark is national: single-tenant retail traded near 6.6% in Marcus & Millichap\'s August 2026 outlook, from about 7.4% with five years or less of lease left to 5.9% with more than 15 years left.',
    period: 'Q3 2026',
    updated: '2026-11-10',
    reviewed: false,
    scope: 'Texas commercial real estate',
    tables: [
      {
        caption: 'Single-tenant retail cap rate by remaining lease term (national, August 2026)',
        columns: ['Remaining lease term', 'Cap rate'],
        rows: [
          ['5 years or less', 'About 7.4%'],
          ['5 to 15 years', '6.7%'],
          ['More than 15 years', '5.9%'],
          ['All single-tenant retail', 'About 6.6%'],
        ],
        note: 'National figures from Marcus & Millichap. They are not Texas-specific and not H-E-B-specific.',
      },
    ],
    points: [
      'Texas metro retail averages for Q3 2026 were 6.53% (Austin), 6.66% (San Antonio), 6.86% (Dallas–Fort Worth) and 7.30% (Houston). They cover all retail, not grocery stores or single-tenant net lease.',
      'Matthews\' Q2 2026 Houston and Dallas–Fort Worth reports say grocery-anchored centers drew the strongest buyer interest. Neither gives a cap rate for them.',
      'Read across the table: the longer the lease left, the lower the cap rate, which means a higher price for the same rent.',
      'What moves a single-tenant net lease cap rate: remaining lease term, lease structure (ground, absolute net or NNN), rent escalations, tenant credit and guarantor, and location.',
      'A number for one store needs closed comparable sales and the lease itself. Neither is in a free market report.',
    ],
    faqs: [
      {
        q: 'What is the cap rate on a grocery-anchored shopping center in Texas?',
        a: 'None of the Q3 2026 Texas reports we read publishes one. Metro averages for all retail ran from 6.53% (Austin) to 7.30% (Houston), and Matthews says grocery-anchored centers drew the strongest buyer interest in Houston and Dallas–Fort Worth in Q2 2026.',
      },
      {
        q: 'Does lease length change a net lease cap rate?',
        a: 'Yes. Nationally, Marcus & Millichap shows about 7.4% for five years or less remaining, 6.7% for five to 15 years and 5.9% for more than 15 years.',
      },
      {
        q: 'Can CRECO tell me what my single-tenant property is worth?',
        a: 'Yes. CRECO prices retail from closed comparable sales and the actual lease. Use the free valuation tool, or call or text the office.',
      },
    ],
    sources: [
      { label: 'Marcus & Millichap, Midyear Retail Outlook (Aug 2026)', url: MM_RETAIL_MIDYEAR },
      { label: 'Matthews, Houston Retail Market Report Q2 2026 (Aug 18 2026)', url: MATTHEWS_HOUSTON_RETAIL_Q2 },
      { label: 'Matthews, Dallas–Fort Worth Retail Market Report Q2 2026 (Aug 6 2026)', url: MATTHEWS_DFW_RETAIL_Q2 },
      { label: 'Matthews, Austin Retail Market Report Q3 2026 (Oct 28 2026)', url: MATTHEWS_AUSTIN_RETAIL },
      { label: 'Matthews, San Antonio Retail Market Report Q3 2026 (Nov 4 2026)', url: MATTHEWS_SA_RETAIL },
      { label: 'Matthews, Dallas–Fort Worth Retail Market Report Q3 2026 (Oct 26 2026)', url: MATTHEWS_DFW_RETAIL },
      { label: 'Lee & Associates, Houston Retail Market Overview Q3 2026', url: LEE_HOUSTON_RETAIL },
    ],
    related: [
      { label: 'Texas retail cap rates by metro', href: '/answers/texas-retail-cap-rates' },
      { label: 'Free property valuation', href: '/property-valuation' },
      { label: 'Texas commercial property for sale', href: '/texas-commercial-property-for-sale' },
    ],
  },
  {
    slug: 'san-antonio-class-a-office-rent',
    short: 'San Antonio Class A office rent',
    question: 'What is Class A office rent in San Antonio, Q3 2026?',
    answer: 'In Q3 2026 San Antonio Class A office space asked $32.02/SF (Cushman & Wakefield), $33.02/SF (Partners) or $36.56/SF (CBRE), all full service. Downtown (CBD) Class A asked $31.66 to $34.31/SF, and overall office asked $28.67 to $29.86/SF.',
    period: 'Q3 2026',
    updated: '2026-11-10',
    reviewed: false,
    tables: [
      {
        caption: 'San Antonio office, Q3 2026: three reports side by side (rents in $/SF per year, full service)',
        columns: ['Measure', 'Cushman & Wakefield', 'Partners', 'CBRE'],
        rows: [
          ['Class A rent', '$32.02', '$33.02', '$36.56'],
          ['Class B rent', '—', '$26.32', '$26.50'],
          ['Overall rent', '$28.67', '$29.86', '$29.33'],
          ['CBD Class A rent', '$31.66', '$32.21', '$34.31'],
          ['Overall vacancy', '15.2%', '16.6%', '17.8%'],
          ['Class A vacancy', '—', '18.5%', '18.4%'],
          ['CBD vacancy', '18.8%', '23.4%', '25.0%'],
          ['Space surveyed', '49.9M SF', '43.5M SF', '34.3M SF'],
        ],
        note: 'Rents are asking rents on a full-service (gross) basis, per square foot per year. CBD is the central business district (downtown). A dash (—) means the report we read does not publish that figure. The firms survey different sets of buildings (Partners counts Class A and B only; CBRE counts non-owner-occupied, non-medical buildings of 20,000 SF or more), so use the spread as the range.',
      },
      {
        caption: 'Class A rent by submarket, Q3 2026 ($/SF per year, full service)',
        columns: ['Submarket', 'Cushman & Wakefield', 'Partners', 'CBRE'],
        rows: [
          ['CBD (downtown)', '$31.66', '$32.21', '$34.31'],
          ['North Central', '$29.60', '$31.25', '$31.49'],
          ['Northwest', '$33.03', '$35.18', '$41.85'],
          ['Northeast', '$27.72', '$38.00', '$29.63'],
          ['South', '$39.63', '—', '$34.45'],
          ['Far North Central', '$35.31', '—', '$40.71'],
          ['Far West', '$32.59', '—', '$30.83'],
          ['Far Northwest', '$40.90', '—', '—'],
          ['Midtown', '—', '—', '$45.04'],
        ],
        note: 'A dash (—) means the report we read does not publish that figure. Submarket boundaries differ by firm: Partners covers five submarkets (CBD, North Central, Northeast, Northwest, South) to the others\' eight. A Class A average built from a few buildings can swing, so treat single-submarket figures as indicative.',
      },
    ],
    points: [
      'Rents are rising. Cushman & Wakefield has Class A asking rent up 8.0% year over year to $32.02 and overall asking rent up 4.1% to $28.67. Partners has overall rent up 1.5% for the quarter to $29.86.',
      'Class A vacancy was 18.5% (Partners) and 18.4% (CBRE, up 120 bps year over year), above Class B in both reports (15.0% and 18.0%).',
      'Highest Class A asking rents in CBRE\'s data: Midtown at $45.04 and Northwest at $41.85. Cushman & Wakefield has Far Northwest at $40.90 and South at $39.63.',
      'Downtown has the metro\'s highest vacancy in all three reports: 18.8% (Cushman & Wakefield), 23.4% (Partners) and 25.0% (CBRE).',
      'No new supply: no office space is under construction in any of the three reports, and none was delivered in Q3.',
      'Net absorption disagrees on direction: +28,000 SF (CBRE), +13,816 SF (Partners), about -65,000 SF (Cushman & Wakefield). Leasing: about 497,000 SF (Cushman & Wakefield), 478,668 SF (Partners), 244,000 SF (CBRE).',
      'Partners revised its Q2 2026 net absorption to -194,053 SF from the -85,357 SF it first reported, so compare a report with itself over time.',
    ],
    opinion: 'Asking rent is what a landlord lists, not what a tenant ends up paying. With vacancy above 15% in every report and nothing under construction, tenants have room to negotiate free rent and improvement allowances. The tightest pockets leave less room: Cushman & Wakefield shows Far Northwest at 8.3% vacant and Far West at 8.1%.',
    faqs: [
      {
        q: 'What is the average Class A office lease rate in downtown San Antonio?',
        a: 'Downtown (CBD) Class A asking rent in Q3 2026 was $31.66/SF at Cushman & Wakefield, $32.21 at Partners and $34.31 at CBRE, all full service. Downtown is also the most vacant submarket in each report: 18.8%, 23.4% and 25.0%.',
      },
      {
        q: 'What is the office vacancy rate in north San Antonio?',
        a: 'North Central office vacancy in Q3 2026 was 15.7% (Cushman & Wakefield), 16.1% (Partners) and 16.7% (CBRE). Far North Central was 13.4% (Cushman & Wakefield) and 14.4% (CBRE); Partners does not break it out.',
      },
      {
        q: 'What submarket is San Antonio International Airport in?',
        a: 'None of the three Q3 2026 reports lists an airport submarket, and each draws its boundaries differently. Partners uses five submarkets (CBD, North Central, Northeast, Northwest, South); Cushman & Wakefield and CBRE use eight. The airport is at Loop 410 and US-281, north of downtown. For space near it, ask which submarket a given building is assigned to in the report you are reading, or search by address.',
      },
      {
        q: 'Are San Antonio office rents going up?',
        a: 'Yes, modestly. Cushman & Wakefield reports overall asking rent up 4.1% year over year and Class A up 8.0%. Partners reports overall rent up 1.5% for the quarter to $29.86. CBRE puts marketwide asking rent up 11.7% over the five years to Q3 2026, to $29.33.',
      },
      {
        q: 'How much does it cost to lease office space in San Antonio?',
        a: 'Overall asking rent averaged $28.67 to $29.86/SF full service in Q3 2026. Class B asked $26.32 to $26.50 and Class A $32.02 to $36.56; CBRE shows Class C at $20.39. What you pay depends on the building, the submarket and the concessions you negotiate.',
      },
    ],
    sources: [
      { label: 'CBRE, San Antonio Office Figures Q3 2026 (Oct 9 2026)', url: CBRE_OFF_Q3 },
      { label: 'Cushman & Wakefield, MarketBeat San Antonio Office Q3 2026', url: CW_OFF_Q3 },
      { label: 'Partners Real Estate, San Antonio Office Q3 2026 (Nov 2 2026)', url: P_OFF_Q3 },
    ],
    related: [
      { label: 'San Antonio office space', href: '/san-antonio-office-space' },
      { label: 'San Antonio office vacancy', href: '/answers/san-antonio-office-vacancy-rate' },
      { label: 'Why market reports show different vacancy rates', href: '/answers/why-market-reports-show-different-vacancy' },
      { label: 'San Antonio medical office vacancy', href: '/answers/san-antonio-medical-office-vacancy' },
      BRIEF,
    ],
  },
  {
    slug: 'san-antonio-office-vacancy-rate',
    short: 'San Antonio office vacancy',
    question: 'What is the office vacancy rate in San Antonio?',
    answer: 'In Q3 2026 San Antonio office vacancy was 15.2% (Cushman & Wakefield), 16.6% (Partners) or 17.8% (CBRE). The brokerages measure different sets of buildings, so the rates differ. Average asking rent was $28.67 to $29.86/SF full service.',
    period: 'Q3 2026',
    updated: '2026-11-11',
    reviewed: false,
    points: [
      'Vacancy: 17.8% CBRE (down 20 bps from Q2, its lowest since a Q1 2025 peak of 19.7%), 15.2% Cushman & Wakefield (160 bps better than a year ago), 16.6% Partners (99 bps better than a year ago).',
      'Average asking rent (full service): $29.33 CBRE, $28.67 Cushman & Wakefield, $29.86 Partners.',
      'Net absorption disagrees on direction: +28,000 SF (CBRE), about -65,000 SF (Cushman & Wakefield), +13,816 SF (Partners, which revised Q2 to -194,053 SF from the -85,357 SF it first reported).',
      'By class: Class A vacancy was 18.4% (CBRE) and 18.5% (Partners); Class B was 18.0% (CBRE) and 15.0% (Partners).',
      'The far-west and far-northwest corridors are far tighter than the metro: Cushman & Wakefield has Far West at 8.1% and Far Northwest at 8.3% vacant, and CBRE has Far West at 8.7%. Downtown is the loosest: 18.8% (Cushman & Wakefield), 23.4% (Partners), 25.0% (CBRE).',
      'Northwest submarket vacancy: 15.4% (CBRE), 16.0% (Cushman & Wakefield), 15.3% (Partners).',
      'Under construction: none in any of the three reports, and none was delivered in Q3.',
    ],
    sources: [{ label: 'CBRE, San Antonio Office Figures Q3 2026 (Oct 9 2026)', url: CBRE_OFF_Q3 }, { label: 'Cushman & Wakefield, MarketBeat San Antonio Office Q3 2026', url: CW_OFF_Q3 }, { label: 'Partners Real Estate, San Antonio Office Q3 2026 (Nov 2 2026)', url: P_OFF_Q3 }],
    related: [{ label: 'San Antonio office space', href: '/san-antonio-office-space' }, { label: 'Class A office rent, Q3 2026', href: '/answers/san-antonio-class-a-office-rent' }, { label: 'Why market reports show different vacancy rates', href: '/answers/why-market-reports-show-different-vacancy' }, BRIEF],
  },
  {
    slug: 'san-antonio-industrial-vacancy-rate',
    short: 'San Antonio industrial vacancy',
    question: 'What is the industrial vacancy rate in San Antonio?',
    answer: 'In Q3 2026 San Antonio industrial vacancy was 10.3% (CBRE), 10.6% (Cushman & Wakefield) or 11.5% (Partners), with average asking rents of $8.81 to $9.26/SF on a net basis.',
    period: 'Q3 2026',
    updated: '2026-11-11',
    reviewed: false,
    points: [
      'Vacancy: 10.3% CBRE (direct 9.7%), 10.6% Cushman & Wakefield (down 110 bps from Q2), 11.5% Partners (direct 10.7%, up 19 bps from Q2).',
      'Average asking rent: $8.81 NNN (CBRE, up 5.0% year over year), $8.85 net (Cushman & Wakefield, up 3.1%), $9.26 NNN (Partners, up 0.4% for the quarter).',
      'Net absorption for the quarter: 796,000 SF (CBRE), about 310,000 SF (Cushman & Wakefield), 391,242 SF (Partners).',
      'Leasing: 2.91M SF (CBRE), 2.3M SF (Cushman & Wakefield), 2.35M SF (Partners). Cushman & Wakefield lists PepsiCo\'s 708,000 SF lease at Foster Commerce Center 6 in the South submarket among the quarter\'s key leases.',
      'Under construction: 2.44M SF (CBRE), about 2.33M SF (Cushman & Wakefield), 3.79M SF (Partners), concentrated in the South submarket (1.5M SF at CBRE and Partners), where CBRE lists JCB\'s 1.0M SF plant and Toyota\'s 500,000 SF Rear Axle facility.',
      'Size matters: CBRE shows 14.8% vacancy at 100K to 249,999 SF and 15.4% at 250K to 499,999 SF, versus 6.6% below 50K SF.',
      'Northwest industrial vacancy was 7.9% (Partners), 8.7% (CBRE) and 8.9% (Cushman & Wakefield). The Northeast is the loosest: 12.6% (CBRE), 17.7% (Cushman & Wakefield) and 18.2% (Partners).',
    ],
    sources: [{ label: 'CBRE, San Antonio Industrial Figures Q3 2026 (Oct 9 2026)', url: CBRE_IND_Q3 }, { label: 'Cushman & Wakefield, MarketBeat San Antonio Industrial Q3 2026', url: CW_IND_Q3 }, { label: 'Partners Real Estate, San Antonio Industrial Q3 2026 (Nov 8 2026)', url: P_IND_Q3 }],
    related: [{ label: 'San Antonio industrial space', href: '/san-antonio-industrial-space' }, { label: 'Texas industrial property for lease', href: '/texas-industrial-property-for-lease' }, { label: 'Small-bay flex rent and vacancy', href: '/answers/san-antonio-flex-space-rent' }, BRIEF],
  },
  {
    slug: 'san-antonio-flex-space-rent',
    short: 'San Antonio flex rent and vacancy',
    question: 'What does small-bay flex space cost in San Antonio?',
    answer: 'In Q3 2026 San Antonio small-bay flex space asked about $12.61 to $13.79/SF on a net basis, with vacancy of 7.9% to 8.1% depending on the brokerage.',
    period: 'Q3 2026',
    updated: '2026-11-11',
    reviewed: false,
    points: [
      'Vacancy: 8.0% (CBRE R&D/Flex), 7.9% (Cushman & Wakefield Office Service/Flex), 8.1% (Partners Flex).',
      'Asking rent (net): $13.79 CBRE (NNN), $12.61 Cushman & Wakefield, $12.76 Partners (NNN). Partners splits its flex rent further: R&D $14.75 and Service $9.32/SF NNN.',
      'Net absorption was positive in all three: +96,000 SF (CBRE R&D/Flex), +57,041 SF (Cushman & Wakefield), +61,350 SF (Partners).',
      'For comparison, overall San Antonio industrial vacancy was 10.3% to 11.5% with average asking rents of $8.81 to $9.26/SF on a net basis.',
    ],
    sources: [{ label: 'CBRE, San Antonio Industrial Figures Q3 2026 (Oct 9 2026)', url: CBRE_IND_Q3 }, { label: 'Cushman & Wakefield, MarketBeat San Antonio Industrial Q3 2026', url: CW_IND_Q3 }, { label: 'Partners Real Estate, San Antonio Industrial Q3 2026 (Nov 8 2026)', url: P_IND_Q3 }],
    related: [{ label: 'San Antonio industrial vacancy', href: '/answers/san-antonio-industrial-vacancy-rate' }, BRIEF],
  },
  {
    slug: 'san-antonio-retail-vacancy-rate',
    short: 'San Antonio and Hill Country retail vacancy',
    question: 'What is the retail vacancy rate in San Antonio and the Hill Country?',
    answer: 'In Q3 2026 San Antonio metro retail vacancy was 4.3% with asking rent of $19.58/SF NNN (Partners); Matthews put it at 4.0%. The Hill Country is tighter: 3.2% in Kendall County (Boerne) at $22.65/SF NNN and 2.7% in Comal County (New Braunfels) at $27.85/SF NNN.',
    period: 'Q3 2026',
    updated: '2026-11-11',
    reviewed: false,
    points: [
      'Metro (Partners): 4.3% vacancy, up 10 bps from Q2 (itself revised to 4.2% from 4.1%); net absorption 32,095 SF, down from 266,714 SF in Q2 (revised from 94,972 SF); asking rent $19.58/SF NNN, up 0.7% for the quarter and 2.4% year over year.',
      'Matthews (Nov 4 2026) put metro vacancy at 4.0% and asking rent at $24.12/SF, a record. It does not state its rent basis, so the two rents are not directly comparable.',
      'Kendall County (Boerne): 3.2% vacancy, -16,769 SF absorbed, 80,366 SF under construction, $22.65/SF NNN.',
      'Comal County (New Braunfels): 2.7% vacancy, +8,487 SF absorbed, 59,200 SF under construction, $27.85/SF NNN.',
      'Northwest San Antonio: 4.3% vacancy, +148,835 SF absorbed (the metro\'s strongest), 313,969 SF under construction, $16.48/SF NNN.',
      'About 1.0M SF of retail was under construction metro-wide, roughly 65% pre-leased; 114,306 SF was delivered. The largest projects were a 163,745 SF Home Depot in Schertz, a 125,000 SF H-E-B at 10137 I-10 E in Converse and the 58,250 SF Stone Oak Mercantile.',
    ],
    sources: [{ label: 'Partners Real Estate, San Antonio Retail Q3 2026 (Oct 19 2026)', url: P_RET_Q3 }, { label: 'Matthews, San Antonio Retail Market Report Q3 2026 (Nov 4 2026)', url: MATTHEWS_SA_RETAIL }],
    related: [{ label: 'San Antonio retail space', href: '/san-antonio-retail-space' }, { label: 'Texas retail cap rates, Q3 2026', href: '/answers/texas-retail-cap-rates' }, { label: 'Boerne market', href: '/answers/boerne-commercial-real-estate-market' }, { label: 'New Braunfels market', href: '/answers/new-braunfels-commercial-real-estate-market' }, BRIEF],
  },
  {
    slug: 'san-antonio-medical-office-vacancy',
    short: 'San Antonio medical office vacancy',
    question: 'What is the medical office vacancy rate in San Antonio?',
    answer: 'In July 2026 Matthews reported 12.27% medical office vacancy in the San Antonio metro, asking rent of $29.99/SF and 80,128 SF under construction.',
    points: [
      'Vacancy 12.27%, asking rent $29.99/SF, 80,128 SF under construction (Matthews, Jul 2026).',
      'Demand is concentrated along Loop 1604 and I-10, in Far West/Westover Hills and Far Northwest.',
      'In Boerne, Baptist Health System\'s first acute-care hospital plus a medical office building, on 23 acres at I-10 and SH-46, was scheduled to begin construction in 2026 with no completion date announced (Community Impact, Dec 2025).',
    ],
    sources: [{ label: 'Matthews, San Antonio Medical Office Q2 2026 (Jul 21 2026)', url: MATTHEWS }, { label: 'Community Impact, Building Boerne: Baptist site work begins (Dec 19 2025)' }],
    related: [{ label: 'San Antonio medical office space', href: '/san-antonio-medical-office-space' }, BRIEF],
  },
  {
    slug: 'boerne-commercial-real-estate-market',
    short: 'Boerne commercial market',
    question: 'How tight is the Boerne commercial real estate market?',
    answer: 'Tight for retail: Kendall County retail vacancy was 3.2% in Q3 2026 with asking rent of $22.65/SF NNN (Partners), below the metro\'s 4.3%, and the county grew 20.3% in population from 2020 to 2025.',
    period: 'Q3 2026',
    updated: '2026-11-11',
    reviewed: false,
    points: [
      'Kendall County retail Q3 2026: 3.2% vacancy, 6.2% availability, -16,769 SF absorbed, 80,366 SF under construction, $22.65/SF NNN (Partners).',
      'Population: Kendall County grew from 44,568 (2020) to 53,289 (2025), +20.3% (Census data via Community Impact and FRED).',
      'Medical: Baptist Health System\'s first Boerne hospital and a medical office building at I-10 and SH-46 was scheduled to begin construction in 2026. Wellness Plaza at Boerne, 37,000 SF off Herff Rd, targeted a spring 2026 groundbreaking.',
      'Retail pipeline: Scenic Loop Retail, three shell buildings totaling 30,572 SF at 31905 I-10, is scheduled Oct 2026 to Sep 2027. Buc-ee\'s is capped at a 54,000 SF store under the October 2025 revised agreement.',
      'CRECO\'s opinion, not data: with Kendall County vacancy still below the metro\'s, tenants should start searches 9 to 12 months ahead.',
    ],
    sources: [{ label: 'Partners Real Estate, San Antonio Retail Q3 2026 (Oct 19 2026)', url: P_RET_Q3 }, { label: 'Community Impact, Dec 2025 and Sep 2025 Boerne development coverage' }, { label: 'FRED / U.S. Census Bureau, Resident Population in Kendall County, TX' }],
    related: [{ label: 'Boerne commercial real estate', href: '/boerne-commercial-real-estate' }, { label: 'Fair Oaks Ranch commercial real estate', href: '/fair-oaks-ranch-commercial-real-estate' }, BRIEF],
  },
  {
    slug: 'new-braunfels-commercial-real-estate-market',
    short: 'New Braunfels commercial market',
    question: 'How is the New Braunfels commercial real estate market doing?',
    answer: 'Retail is tight and growing: Comal County retail vacancy was 2.7% in Q3 2026 at $27.85/SF NNN asking (Partners), and the county\'s population grew 27.8% from 2020 to 2025.',
    period: 'Q3 2026',
    updated: '2026-11-11',
    reviewed: false,
    points: [
      'Comal County retail Q3 2026: 2.7% vacancy, +8,487 SF absorbed, 59,200 SF under construction, $27.85/SF NNN (Partners).',
      'Comal County industrial Q3 2026: 11.8% vacancy, -100,495 SF absorbed, 636,617 SF under construction, $10.23/SF NNN (Partners); 11.3% vacancy, -105,495 SF absorbed, 311,343 SF under construction (Cushman & Wakefield).',
      'Population: 163,608 (2020) to 209,166 (2025), +27.8% (Community Impact).',
      'Notable leases: Terry Black\'s Barbecue, 8,649 SF at 1310 E. Common St (Partners). Cushman & Wakefield\'s Q3 key leases include Hollingsworth Logistics Group\'s new 340,090 SF lease at Park 35 in Comal County.',
      'Projects: The Neue, $27M and 72,000 SF of condos with ground-floor commercial downtown (broke ground Sep 29 2026, completion expected Nov 2027); Latitude, 65,000 SF of for-sale office/warehouse bays at 710 N. Walnut Ave (groundbreaking expected Q2 2027); Corridor Commercial Center Phase 2, 35,000 SF of flex/retail in spaces of 1,800 to 11,900 SF.',
    ],
    sources: [{ label: 'Partners Real Estate, San Antonio Retail Q3 2026 (Oct 19 2026)', url: P_RET_Q3 }, { label: 'Partners Real Estate, San Antonio Industrial Q3 2026 (Nov 8 2026)', url: P_IND_Q3 }, { label: 'Cushman & Wakefield, MarketBeat San Antonio Industrial Q3 2026', url: CW_IND_Q3 }, { label: 'Community Impact: Comal County population (Apr 8 2026), The Neue (Sep 30 2026), GBMC Communities (Sep 15 2026), Corridor Commercial Center (Jul 29 2026)' }],
    related: [{ label: 'New Braunfels market page', href: '/markets/new-braunfels' }, BRIEF],
  },
  {
    slug: 'why-market-reports-show-different-vacancy',
    short: 'Why vacancy rates differ by report',
    question: 'Why do brokerage market reports show different vacancy rates?',
    answer: 'They count different buildings. For San Antonio office, inventory is 34.3M SF at CBRE, 43.5M SF at Partners (Class A and B only) and 49.9M SF at Cushman & Wakefield, so vacancy and absorption differ even in the same quarter.',
    period: 'Q3 2026',
    updated: '2026-11-11',
    reviewed: false,
    points: [
      'Q3 2026 San Antonio office vacancy: 17.8% (CBRE), 16.6% (Partners), 15.2% (Cushman & Wakefield).',
      'Q3 2026 office net absorption disagrees on direction: CBRE +28,000 SF and Partners +13,816 SF, Cushman & Wakefield about -65,000 SF.',
      'Industrial differs too: Q3 net absorption was 796,000 SF at CBRE, 391,242 SF at Partners and about 310,000 SF at Cushman & Wakefield, more than a 2.5x spread, and space under construction was 3.79M SF at Partners against about 2.33M SF at Cushman & Wakefield.',
      'Reports also revise themselves: Partners moved its Q2 2026 office net absorption to -194,053 SF from the -85,357 SF it first reported, and its Q2 retail net absorption to 266,714 SF from 94,972 SF.',
      'Use the spread as the range, and compare a report with itself over time rather than across brokerages.',
    ],
    sources: [{ label: 'CBRE, San Antonio Office Figures Q3 2026', url: CBRE_OFF_Q3 }, { label: 'Cushman & Wakefield, MarketBeat San Antonio Office Q3 2026', url: CW_OFF_Q3 }, { label: 'Partners Real Estate, San Antonio Office Q3 2026', url: P_OFF_Q3 }, { label: 'CBRE, San Antonio Industrial Figures Q3 2026', url: CBRE_IND_Q3 }, { label: 'Cushman & Wakefield, MarketBeat San Antonio Industrial Q3 2026', url: CW_IND_Q3 }, { label: 'Partners Real Estate, San Antonio Industrial Q3 2026', url: P_IND_Q3 }, { label: 'Partners Real Estate, San Antonio Retail Q3 2026', url: P_RET_Q3 }],
    related: [{ label: 'San Antonio office vacancy', href: '/answers/san-antonio-office-vacancy-rate' }, BRIEF],
  },
  {
    slug: 'how-to-lease-commercial-space-fair-oaks-ranch',
    short: 'Leasing commercial space in Fair Oaks Ranch',
    question: 'How do I lease commercial space in Fair Oaks Ranch?',
    answer: 'Tell CRECO what you need (use, size, budget, timing) at crecotx.com/get-started or call (210) 817-3443. CRECO shortlists available space, including off-market options, tours it with you, and negotiates the letter of intent and lease. A focused search usually takes about 30 to 90 days to a signed lease.',
    points: [
      'CRECO\'s own Fair Oaks Ranch space includes the retail bays and executive office suites at 8000 Fair Oaks Plaza (8000 Fair Oaks Pkwy) and the Elkhorn Point retail center (8923 Dietz Elkhorn Rd), which is pre-leasing.',
      'For a tenant, representation is typically free because the landlord pays the commission.',
      'CRECO is a d/b/a of its licensed brokerage entity under TREC #9014367; broker and founder Zachary Stovall (TREC #691174).',
    ],
    sources: [],
    related: [{ label: 'Fair Oaks Ranch commercial real estate', href: '/fair-oaks-ranch-commercial-real-estate' }, { label: 'Fair Oaks Ranch retail space', href: '/fair-oaks-ranch-retail-space' }, { label: 'Fair Oaks Ranch office space', href: '/fair-oaks-ranch-office-space' }, { label: 'Get started', href: '/get-started' }],
  },
];

export const findAnswer = (slug: string) => ANSWER_PAGES.find(p => p.slug === slug);
