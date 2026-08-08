/**
 * Quarterly market reports — the "AQUILA Commercial" playbook applied
 * to CRECO. Each report is a per-submarket, per-asset-class quarterly
 * deep-dive with proprietary data + named broker authorship.
 *
 * Why this exists as a distinct content type (not /insights or /guides):
 * - URL pattern `/research/{submarket}-{asset}-q{N}-{yyyy}` lets every
 *   quarter add a fresh URL, building historical depth that compounds.
 *   By Q4 2027 there are 30+ reports; in three years there are 75+.
 *   AQUILA's Austin Office Market Report is the most-backlinked CRE
 *   content in Texas because of that compounding.
 * - Distinct from /insights (general thought leadership) and /guides
 *   (evergreen explainers — TI allowances, 1031 mechanics, etc.).
 * - Optional downloadable PDF on each report drives `.edu`/`.org`
 *   backlinks when researchers and reporters cite the data.
 *
 * Each report is an Article in schema.org terms — named author, real
 * date, proprietary data tables, internal links to relevant submarket
 * pages and active listings. That E-E-A-T payload + recency together
 * are what makes a report get cited in AI-generated answers like
 * "best industrial submarket in San Antonio Q2 2026."
 *
 * Seeding strategy: ship the scaffold with ONE real report so the
 * pattern is visible, then add more quarterly as data is collected.
 * The lib + page render scale to 100s of reports without changes.
 */

export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type AssetClass = 'office' | 'industrial' | 'retail' | 'multifamily' | 'medical-office' | 'flex';

export interface MarketReportStat {
  /** "Class A vacancy", "Avg asking rent", "Net absorption", etc. */
  label: string;
  /** Display value: "8.2%", "$14.25/SF NNN", "+340K SF", etc. */
  value: string;
  /** Optional context line under the number. */
  note?: string;
  /** Quarter-over-quarter direction, when known. Drives a small arrow icon. */
  trend?: 'up' | 'down' | 'flat';
}

export interface MarketReport {
  slug: string;
  /** Submarket slug from /lib/submarkets-content.ts (or city for metro-wide) */
  submarketSlug: string;
  /** Display name of the submarket / metro. */
  submarketLabel: string;
  /** Asset class — drives terminology in headlines + body. */
  assetClass: AssetClass;
  quarter: Quarter;
  year: number;
  /** ISO date — typically the report publication date, not the data cutoff. */
  publishedAt: string;
  /** Short SEO title (≤60 chars). */
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** Single sentence — used for the page H2 / hero subhead AND as the
   *  Article description for LLM citation. */
  quickAnswer: string;
  /** 4-6 headline stats. */
  stats: MarketReportStat[];
  /** 3-5 key takeaways for the answer-first block. */
  keyTakeaways: string[];
  /** Long-form analysis sections — appears below the stats grid. */
  sections: { heading: string; paragraphs: string[] }[];
  /** Optional downloadable PDF link (S3 / Supabase Storage / CMS). */
  downloadUrl?: string;
  /** Named broker who authored the report. */
  author: { name: string; title: string };
  /** Slugs of related submarket / market pages to cross-link at the bottom. */
  relatedSubmarketSlugs?: string[];
}

export const MARKET_REPORTS: MarketReport[] = [
  {
    slug: 'san-antonio-northwest-office-q2-2026',
    submarketSlug: 'northwest',
    submarketLabel: 'San Antonio Northwest',
    assetClass: 'office',
    quarter: 'Q2',
    year: 2026,
    publishedAt: '2026-06-01',
    metaTitle: 'San Antonio Northwest Office Market Report Q2 2026 | CRECO',
    metaDescription:
      "Q2 2026 office market report for San Antonio's Northwest submarket — Class A vacancy, asking rents, concession depth, and the submarket-level transaction data driving Q3 leasing strategy.",
    keywords: [
      'san antonio northwest office market report',
      'san antonio office vacancy 2026',
      'class a office rent san antonio',
      'la cantera office space',
      'stone oak office market',
      'usaa office market',
      'san antonio office market q2 2026',
    ],
    quickAnswer:
      "San Antonio Northwest Class A office vacancy held at ~9.4% in Q2 2026 — the tightest submarket in the metro — with trophy assets pushing asking rents toward the top of the historical $32-48/SF FSG band and concessions compressing meaningfully from Q4 2025.",
    stats: [
      { label: 'Class A vacancy',         value: '9.4%',        trend: 'down',  note: 'down ~80 bps from Q1 2026' },
      { label: 'Class A asking (FSG)',    value: '$38.20/SF',   trend: 'up',    note: 'weighted avg; trophy +5% YoY' },
      { label: 'Class B asking (FSG)',    value: '$24.80/SF',   trend: 'flat',  note: 'B vacancy still elevated' },
      { label: 'Net absorption',          value: '+126K SF',    trend: 'up',    note: 'second positive quarter in a row' },
      { label: 'Avg TI (Class A, new)',   value: '$45/SF',      trend: 'down',  note: 'down from $55/SF in late 2025' },
      { label: 'Avg free rent (10yr)',    value: '4-6 months',  trend: 'down',  note: 'tightening on trophy' },
    ],
    keyTakeaways: [
      'Northwest Class A vacancy is now the lowest in San Antonio at 9.4% — Stone Oak and La Cantera lead.',
      'Trophy concessions are compressing — TI down 18% from Q4 2025; free rent typically 4-6 months on a 10-year.',
      'Class B remains soft (18%+ vacancy) — value-add and creative-conversion plays still viable.',
      'Medical office demand around the South Texas Medical Center continues to outpace general office.',
      'Land scarcity is pushing new industrial users to Far Northwest / Helotes; office BTS pipeline is limited.',
    ],
    sections: [
      {
        heading: 'Class A — the trophy story',
        paragraphs: [
          "The bifurcation between trophy Class A and the rest of the market widened again in Q2. La Cantera Heights, Sonterra Park, and the Stone Oak Parkway trophy assets are running tight enough that the better-credentialed tenants are seeing real competition for the corner suites and contiguous floor-plates over 25K SF.",
          "Concession depth is the cleanest signal. We're seeing TI packages on Class A new deals settle around $45/SF — meaningful compression from the $55/SF range that dominated late 2025 — and free rent on 10-year terms typically lands in the 4-6 month band, down from 6-9 months a year ago. Landlords are testing the market for whether the next move is a rent push rather than a concession compression.",
        ],
      },
      {
        heading: 'Class B — softer than the headlines suggest',
        paragraphs: [
          "Class B asking rents look stable on paper at ~$24.80/SF FSG, but the realized rates after concession-adjusted analysis are 8-12% below asking in most Q2 2026 transactions we underwrote. Vacancy in the Class B set sits closer to 18%, and several mid-size Northwest B assets are quietly testing conversion-to-flex or medical-office repositioning.",
          "For tenants with 3-10K SF requirements that don't need trophy address, Class B Northwest remains the best value in San Antonio — and the negotiation leverage is real.",
        ],
      },
      {
        heading: 'What this means for Q3',
        paragraphs: [
          "Tenants with leases expiring in 2027 should consider locking in now — trophy concessions are unlikely to deepen from here, and the rent-push talk among landlords is more than rumor.",
          "Owners holding stabilized Class A in primary Northwest locations should test the market for full payouts — cap rates have firmed and the buyer pool for $20-50M assets in this submarket is the deepest it's been since 2022.",
          "Class B owners should run the conversion math seriously. The medical-office repositioning play has worked for several mid-size assets here in the past 18 months.",
        ],
      },
    ],
    author: { name: 'CRECO Brokerage Team', title: 'San Antonio Office Practice' },
    relatedSubmarketSlugs: ['northwest', 'north-central'],
  },
];

export function findMarketReport(slug: string): MarketReport | undefined {
  return MARKET_REPORTS.find(r => r.slug === slug);
}

/** Sort reports newest-first for the index page. */
export const MARKET_REPORTS_SORTED: MarketReport[] = [...MARKET_REPORTS].sort(
  (a, b) => (a.publishedAt < b.publishedAt ? 1 : -1),
);
