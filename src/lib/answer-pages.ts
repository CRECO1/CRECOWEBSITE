/**
 * Answer-first pages: one question per page, a short direct answer, the sourced figures behind it, and links
 * to the original reports. Every number here is lifted from the published Q2 2026 Market Brief
 * (src/app/market-brief/BriefContent.tsx) or src/lib/answers.ts. Do NOT add a figure that is not already
 * sourced there; when the next brief edition lands, update these together and bump BRIEF_UPDATED.
 */
export interface SourceLink { label: string; url?: string }
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
}

const CBRE_IND = 'https://www.cbre.com/insights/figures/san-antonio-industrial-figures-q2-2026';
const CBRE_OFF = 'https://www.cbre.com/insights/figures/san-antonio-office-figures-q2-2026';
const CW_IND = 'https://assets.cushmanwakefield.com/-/media/cw/marketbeat-pdfs/2026/q2/us-reports/industrial/sanantonio_americas_marketbeat_industrial_q22026.pdf';
const CW_OFF = 'https://assets.cushmanwakefield.com/-/media/cw/marketbeat-pdfs/2026/q2/us-reports/office/san-antonio_americas_marketbeat_office_q22026.pdf';
const P_IND = 'https://partnersrealestate.com/research/san-antonio-industrial-q2-2026-quarterly-market-report/';
const P_OFF = 'https://partnersrealestate.com/research/san-antonio-office-q2-2026-quarterly-market-report/';
const P_RET = 'https://partnersrealestate.com/research/san-antonio-retail-q2-2026-quarterly-market-report/';
const MATTHEWS = 'https://www.matthews.com/insights/san-antonio-medical-office-q2-2026';
const BRIEF = { label: 'San Antonio & Hill Country Market Brief', href: '/market-brief' };

export const ANSWER_PAGES: AnswerPage[] = [
  {
    slug: 'san-antonio-office-vacancy-rate',
    short: 'San Antonio office vacancy',
    question: 'What is the office vacancy rate in San Antonio?',
    answer: 'In Q2 2026 San Antonio office vacancy was 15.2% (Cushman & Wakefield), 16.9% (Partners) or 17.6% (CBRE). The brokerages measure different sets of buildings, so the rates differ. Average asking rent was $27.97 to $29.76/SF full service.',
    points: [
      'Vacancy: 17.6% CBRE, 15.2% Cushman & Wakefield, 16.9% Partners.',
      'Average asking rent (full service): $29.76 CBRE, $27.97 Cushman & Wakefield, $29.54 Partners.',
      'Net absorption disagrees on direction: -43,950 SF (CBRE), +283,787 SF (Cushman & Wakefield), -85,357 SF (Partners).',
      'The I-10/1604 gateway is far tighter than the metro: Cushman & Wakefield put Far Northwest office vacancy at 9.2%, with $40.41/SF asking and +306,704 SF absorbed in Q2.',
      'Northwest submarket vacancy: 16.8% (CBRE), 16.7% (Cushman & Wakefield), 15.1% (Partners).',
      'Under construction: 30,400 SF (CBRE), 0 SF (Cushman & Wakefield), 60,000 SF (Partners), including The Rock Medical and Research Pavilion, 58% pre-leased.',
    ],
    sources: [{ label: 'CBRE, San Antonio Office Figures Q2 2026 (Jul 9 2026)', url: CBRE_OFF }, { label: 'Cushman & Wakefield, MarketBeat San Antonio Office Q2 2026', url: CW_OFF }, { label: 'Partners Real Estate, San Antonio Office Q2 2026 (Aug 11 2026)', url: P_OFF }],
    related: [{ label: 'San Antonio office space', href: '/san-antonio-office-space' }, { label: 'Why market reports show different vacancy rates', href: '/answers/why-market-reports-show-different-vacancy' }, BRIEF],
  },
  {
    slug: 'san-antonio-industrial-vacancy-rate',
    short: 'San Antonio industrial vacancy',
    question: 'What is the industrial vacancy rate in San Antonio?',
    answer: 'In Q2 2026 San Antonio industrial vacancy was 10.3% (CBRE), 11.1% (Cushman & Wakefield) or 11.3% (Partners), with average asking rents of $8.52 to $9.22/SF NNN.',
    points: [
      'Vacancy: 10.3% CBRE, 11.1% Cushman & Wakefield, 11.3% Partners.',
      'Average asking rent: $8.52 NNN (CBRE), $8.83 overall net (Cushman & Wakefield), $9.22 (Partners).',
      'Net absorption for the quarter: 252,059 SF (CBRE), 357,376 SF (Cushman & Wakefield), 873,488 SF (Partners).',
      'Under construction: 2.9M SF (CBRE), 2.70M SF (Cushman & Wakefield), 4.0M SF (Partners), concentrated in manufacturing including JCB\'s 1.0M SF plant and Toyota\'s 500,000 SF Rear Axle facility (CBRE).',
      'Size matters: CBRE shows 15.9% vacancy in the 100K to 250K SF range versus 6.1% below 50K SF.',
      'Northwest industrial vacancy was 7.1% to 7.6% across all three sources.',
    ],
    sources: [{ label: 'CBRE, San Antonio Industrial Figures Q2 2026 (Jul 9 2026)', url: CBRE_IND }, { label: 'Cushman & Wakefield, MarketBeat San Antonio Industrial Q2 2026', url: CW_IND }, { label: 'Partners Real Estate, San Antonio Industrial Q2 2026 (Aug 1 2026)', url: P_IND }],
    related: [{ label: 'San Antonio industrial space', href: '/san-antonio-industrial-space' }, { label: 'Texas industrial property for lease', href: '/texas-industrial-property-for-lease' }, BRIEF],
  },
  {
    slug: 'san-antonio-flex-space-rent',
    short: 'San Antonio flex rent and vacancy',
    question: 'What does small-bay flex space cost in San Antonio?',
    answer: 'In Q2 2026 San Antonio small-bay flex space asked about $12.49 to $12.85/SF NNN, with vacancy of 8.0% to 8.7% depending on the brokerage.',
    points: [
      'Vacancy: 8.6% (CBRE R&D/Flex), 8.0% (Cushman & Wakefield Office Service/Flex), 8.7% (Partners Flex).',
      'Asking rent (NNN): $12.59 CBRE, $12.49 Cushman & Wakefield, $12.85 Partners.',
      'Net absorption: -25,000 SF (CBRE), -45,103 SF (Cushman & Wakefield), +238,700 SF (Partners).',
      'For comparison, San Antonio warehouse vacancy was 10.3% to 11.3% with average asking rents of $8.52 to $9.22/SF NNN.',
    ],
    sources: [{ label: 'CBRE, San Antonio Industrial Figures Q2 2026', url: CBRE_IND }, { label: 'Cushman & Wakefield, MarketBeat San Antonio Industrial Q2 2026', url: CW_IND }, { label: 'Partners Real Estate, San Antonio Industrial Q2 2026', url: P_IND }],
    related: [{ label: 'San Antonio industrial vacancy', href: '/answers/san-antonio-industrial-vacancy-rate' }, BRIEF],
  },
  {
    slug: 'san-antonio-retail-vacancy-rate',
    short: 'San Antonio and Hill Country retail vacancy',
    question: 'What is the retail vacancy rate in San Antonio and the Hill Country?',
    answer: 'In Q2 2026 San Antonio metro retail vacancy was 4.1% with asking rent of $19.27/SF NNN (Partners). The Hill Country is tighter: 2.4% in Kendall County (Boerne) at $22.85/SF NNN and 2.6% in Comal County (New Braunfels) at $28.16/SF NNN.',
    points: [
      'Metro: 4.1% vacancy; net absorption 94,972 SF, down from 405,772 SF in Q1; asking rent $19.27/SF NNN, down 2.5% year over year.',
      'Kendall County (Boerne): 2.4% vacancy, +15,068 SF absorbed, 70,271 SF under construction, $22.85/SF NNN.',
      'Comal County (New Braunfels): 2.6% vacancy, +13,396 SF absorbed, 62,700 SF under construction, $28.16/SF NNN.',
      'Northwest San Antonio: 4.6% vacancy, 270,034 SF under construction, $15.74/SF NNN.',
      '833,294 SF of retail was under construction metro-wide, about 59% pre-leased; 162,514 SF was delivered.',
      'Partners is the only free Q2 2026 retail source we found, so these figures have no second source to cross-check.',
    ],
    sources: [{ label: 'Partners Real Estate, San Antonio Retail Q2 2026 (Aug 17 2026)', url: P_RET }],
    related: [{ label: 'San Antonio retail space', href: '/san-antonio-retail-space' }, { label: 'Boerne market', href: '/answers/boerne-commercial-real-estate-market' }, { label: 'New Braunfels market', href: '/answers/new-braunfels-commercial-real-estate-market' }, BRIEF],
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
    answer: 'Very tight for retail: Kendall County retail vacancy was 2.4% in Q2 2026 with asking rent of $22.85/SF NNN, and the county grew 20.3% in population from 2020 to 2025.',
    points: [
      'Kendall County retail Q2 2026: 2.4% vacancy, +15,068 SF absorbed, 70,271 SF under construction, $22.85/SF NNN (Partners).',
      'Population: Kendall County grew from 44,568 (2020) to 53,289 (2025), +20.3% (Census data via Community Impact and FRED).',
      'Medical: Baptist Health System\'s first Boerne hospital and a medical office building at I-10 and SH-46 was scheduled to begin construction in 2026. Wellness Plaza at Boerne, 37,000 SF off Herff Rd, targeted a spring 2026 groundbreaking.',
      'Retail pipeline: Scenic Loop Retail, three shell buildings totaling 30,572 SF at 31905 I-10, is scheduled Oct 2026 to Sep 2027. Buc-ee\'s is capped at a 54,000 SF store under the October 2025 revised agreement.',
      'CRECO\'s opinion, not data: with so little vacant, tenants should start searches 9 to 12 months ahead.',
    ],
    sources: [{ label: 'Partners Real Estate, San Antonio Retail Q2 2026', url: P_RET }, { label: 'Community Impact, Dec 2025 and Sep 2025 Boerne development coverage' }, { label: 'FRED / U.S. Census Bureau, Resident Population in Kendall County, TX' }],
    related: [{ label: 'Boerne commercial real estate', href: '/boerne-commercial-real-estate' }, { label: 'Fair Oaks Ranch commercial real estate', href: '/fair-oaks-ranch-commercial-real-estate' }, BRIEF],
  },
  {
    slug: 'new-braunfels-commercial-real-estate-market',
    short: 'New Braunfels commercial market',
    question: 'How is the New Braunfels commercial real estate market doing?',
    answer: 'Retail is tight and growing: Comal County retail vacancy was 2.6% in Q2 2026 at $28.16/SF NNN asking, and the county\'s population grew 27.8% from 2020 to 2025.',
    points: [
      'Comal County retail Q2 2026: 2.6% vacancy, +13,396 SF absorbed, 62,700 SF under construction, $28.16/SF NNN (Partners).',
      'Comal County industrial: 11.3% vacancy, +239,313 SF absorbed, $12.14/SF asking (Partners); 10.0% vacancy, +82,543 SF absorbed (Cushman & Wakefield).',
      'Population: 163,608 (2020) to 209,166 (2025), +27.8% (Community Impact).',
      'Notable leases: Crunch Fitness, 42,763 SF at New Braunfels Marketplace. Cushman & Wakefield\'s largest Comal industrial deal was a new 173,447 SF lease at 2633 Goodwin Ln, Bldg A.',
      'Projects: The Neue, $27M and 72,000 SF of condos with ground-floor commercial downtown (broke ground Sep 29 2026, completion expected Nov 2027); Latitude, 65,000 SF of for-sale office/warehouse bays at 710 N. Walnut Ave (groundbreaking expected Q2 2027); Corridor Commercial Center Phase 2, 35,000 SF of flex/retail in spaces of 1,800 to 11,900 SF.',
    ],
    sources: [{ label: 'Partners Real Estate, San Antonio Retail Q2 2026', url: P_RET }, { label: 'Partners Real Estate, San Antonio Industrial Q2 2026', url: P_IND }, { label: 'Cushman & Wakefield, MarketBeat San Antonio Industrial Q2 2026', url: CW_IND }, { label: 'Community Impact: Comal County population (Apr 8 2026), The Neue (Sep 30 2026), GBMC Communities (Sep 15 2026), Corridor Commercial Center (Jul 29 2026)' }],
    related: [{ label: 'New Braunfels market page', href: '/markets/new-braunfels' }, BRIEF],
  },
  {
    slug: 'why-market-reports-show-different-vacancy',
    short: 'Why vacancy rates differ by report',
    question: 'Why do brokerage market reports show different vacancy rates?',
    answer: 'They count different buildings. For San Antonio office, inventory is 34.3M SF at CBRE, 43.7M SF at Partners and 50.3M SF at Cushman & Wakefield, so vacancy and absorption differ even in the same quarter.',
    points: [
      'Q2 2026 San Antonio office vacancy: 17.6% (CBRE), 16.9% (Partners), 15.2% (Cushman & Wakefield).',
      'Q2 2026 net absorption for office disagrees on direction: Cushman & Wakefield reports positive, CBRE and Partners negative.',
      'Industrial absorption differs by more than 3x: Partners 873,488 SF versus CBRE 252,059 SF.',
      'Use the spread as the range, and compare a report with itself over time rather than across brokerages.',
    ],
    sources: [{ label: 'CBRE, San Antonio Office Figures Q2 2026', url: CBRE_OFF }, { label: 'Cushman & Wakefield, MarketBeat San Antonio Office Q2 2026', url: CW_OFF }, { label: 'Partners Real Estate, San Antonio Office Q2 2026', url: P_OFF }],
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
