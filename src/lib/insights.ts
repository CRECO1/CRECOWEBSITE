/**
 * CRECO Insights — Texas Commercial Real Estate market analysis and thought leadership.
 *
 * Posts are stored as structured data here (rather than DB or MDX) so:
 *  - Content is version-controlled in git alongside the site
 *  - Adding a post is a single PR
 *  - SEO meta is tightly coupled to the post content
 *
 * To add a new post: append a new entry to the POSTS array. The /insights index
 * and /insights/[slug] detail pages auto-render from this list.
 */

export interface InsightSection {
  /** H2 heading on the post page */
  heading: string;
  /** Body paragraphs (rendered as <p>) */
  paragraphs: string[];
  /** Optional bullet list under the heading */
  bullets?: string[];
}

export interface InsightPost {
  slug: string;
  title: string;
  /** SEO meta title (often the same as title or slightly different for keyword targeting) */
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** Short tagline shown on the index card and the post hero */
  excerpt: string;
  /** ISO date — used for sitemap and "Published" display */
  publishedAt: string;
  /** Article author */
  author: string;
  /** Time-to-read in minutes (computed manually) */
  readingMinutes: number;
  /** Article category for filtering and breadcrumbs */
  category: 'Market Outlook' | 'Owner Strategy' | 'Tenant Strategy' | 'Investment' | 'Regulation';
  /** Lead paragraphs that appear above the section list */
  intro: string[];
  /** Body sections — H2 + paragraphs */
  sections: InsightSection[];
  /** Closing paragraph(s) */
  conclusion: string[];
  /** Slugs of related posts to link from the bottom of this post */
  relatedSlugs?: string[];
}

export const POSTS: InsightPost[] = [
  {
    slug: 'texas-commercial-real-estate-outlook-2026',
    title: 'Texas Commercial Real Estate Outlook: What Owners and Tenants Should Watch in 2026',
    metaTitle: 'Texas Commercial Real Estate Outlook 2026 | Market Analysis | CRECO',
    metaDescription:
      'A 2026 outlook on Texas commercial real estate — retail, industrial, and office market trends, cap rates, leasing fundamentals, and the major themes shaping decisions for owners and tenants statewide.',
    keywords: [
      'texas commercial real estate market outlook 2026',
      'texas commercial real estate trends',
      'texas industrial real estate outlook',
      'texas retail real estate outlook',
      'texas office real estate outlook',
      'cap rates texas',
      'commercial real estate cap rates 2026',
    ],
    excerpt:
      'A practical overview of the major Texas commercial real estate themes for 2026 — what we are seeing across retail, industrial, and office, what is changing, and what owners and tenants should plan for.',
    publishedAt: '2026-04-29',
    author: 'CRECO',
    readingMinutes: 9,
    category: 'Market Outlook',
    intro: [
      'Texas commercial real estate enters 2026 in a more interesting position than headlines suggest. Yes, cap rates have moved out from 2022 lows. Yes, office faces real questions. But beneath those well-known stories, the on-the-ground market across San Antonio, Austin, Houston, and Dallas–Fort Worth is more nuanced — and in some segments, more opportunity-rich — than at any point since 2015.',
      'This piece walks through what we are seeing on the ground at CRECO, what we expect to play out over the next 12-18 months, and what we are recommending to clients across our retail, industrial, and office practice areas. It is not a forecast. It is a synthesis of the conversations we are having with Texas commercial real estate owners, tenants, lenders, and investors every day.',
    ],
    sections: [
      {
        heading: 'Texas industrial: still the strongest property type, but specs increasingly matter',
        paragraphs: [
          'Industrial remains the most fundamentally sound asset class in Texas commercial real estate. DFW, Houston, and San Antonio rank among the top 10 industrial markets in the United States by absorption. The I-35 corridor between San Antonio and Dallas is seeing record activity. Houston Ship Channel adjacency continues to drive logistics demand. The Austin/Round Rock chip-and-EV manufacturing corridor is generating its own industrial demand center.',
          'But not all industrial is created equal. The bifurcation between modern, high-spec distribution buildings (32+ ft clear, ESFR sprinkler, abundant trailer parking, 277/480V three-phase power) and older Class B/C industrial is widening. Modern bulk distribution can lease at $9-12/SF NNN with concessions; older Class C buildings in the same submarket can struggle to get $6-7/SF NNN.',
          'For tenants, this means specs are a bigger lever than rent. Two warehouses at the same nominal $/SF rate can be wildly different deals once you factor power capacity, dock-door ratio, sprinkler class, and yard area into your operating cost. For owners, modernizing existing industrial through targeted capex (LED lighting, ESFR sprinkler upgrade, dock-door additions, yard expansion) often unlocks meaningful rent uplift.',
        ],
      },
      {
        heading: 'Texas retail: stronger than the headlines, with submarket selectivity',
        paragraphs: [
          'The "retail apocalypse" narrative continues to wildly oversimplify what is happening on the ground. Well-located Texas retail centers in growth submarkets are seeing strong demand and tenant retention. The categories driving leasing — quick-service restaurants, fitness, medical, specialty retail, services — are categories that survived e-commerce and have nowhere else to go.',
          'Where retail is weak: oversupplied secondary submarkets, second-generation big boxes without anchor replacement, and centers with declining demographics. Where retail is strong: signalized intersections in growth corridors, walkable urban districts, dense Texas suburbs with daytime traffic, and centers with the right tenant mix.',
          'Cap rates for stabilized retail have moved out 75-150 bps from 2022 lows. We are seeing 6.5-8.5% on solid Texas retail strip centers, with single-tenant net-lease investment-grade tenants (Walgreens, McDonald\'s ground leases) at 5-6%. For value-add buyers, this is a meaningfully better entry point than 2021-2022.',
        ],
      },
      {
        heading: 'Texas office: bifurcation is the story',
        paragraphs: [
          'Office is the most polarizing Texas commercial real estate category in 2026. The pessimistic narrative — vacancy is up, sublease space is plentiful, hybrid work is permanent — is real. The optimistic narrative — Class A trophy office is in tight supply, top buildings are commanding premium rents, Texas is a net beneficiary of corporate relocations — is also real. Both can be true at the same time because the office market is bifurcated.',
          'Class A trophy office in Austin\'s Domain, Houston\'s Galleria, and the Dallas Uptown / Frisco corridor: tight supply, rents holding or growing, tenant attraction strong. Class B suburban office in secondary submarkets: oversupplied, generous concessions, tenant negotiation leverage at multi-year highs.',
          'For tenants, this is the best Class B office market in 15 years. Tenant improvement allowances of $40-80/SF, free rent of 6-12 months on a 7-year deal, rent abatement during buildout — all on the table for the right tenant. For owners of Class B office, the playbook is clear: meaningful capex investment to modernize, tenant retention focus, and patience. The capital markets are punishing distressed Class B office; well-managed Class B office is a different story.',
        ],
      },
      {
        heading: 'Cap rates have moved out — but not uniformly',
        paragraphs: [
          'The 2022 cap-rate trough is well behind us. 10-year Treasuries at 4.0-4.5% have repriced commercial real estate across the board. But not uniformly. Industrial cap rates have moved least (50-75 bps wider). Retail and office have moved more (100-150 bps wider, with office wider still in some submarkets). Multifamily has moved 75-125 bps wider depending on submarket.',
          'For investors with patient capital, this is a meaningfully better buying environment than 2021-2022. We are seeing well-located Texas commercial real estate trade at 7-8.5% caps on stabilized cash flow — vs 5-6% in 2021. For sellers, the lesson is that 2022-pricing comps are no longer relevant. Underwriting against current Texas market caps is the only honest way to price.',
        ],
      },
      {
        heading: 'Themes to watch for the rest of 2026',
        paragraphs: [
          'A few themes we are tracking carefully:',
        ],
        bullets: [
          'Insurance costs in Texas continue to rise — particularly in coastal and tornado-prone submarkets. This is increasingly a meaningful line item that shifts effective NOI and pricing.',
          'Property tax appeals are more important than ever. Texas appraisal districts are aggressive on commercial property valuations; well-executed appeals routinely save 5-15% off property tax bills.',
          'Insurance markets and lender requirements are converging on climate risk disclosure. Owners who can document mitigation and resilience increasingly get better terms.',
          '1031 exchange volume remains strong — patient exchangers who can move within the 45-day window are finding good Texas replacement opportunities at the new wider cap rates.',
          'Owner-user financing (SBA 504) remains a powerful tool for entrepreneurs acquiring their own buildings. Long amortization, fixed rates, low down payments — economics that lease comparisons increasingly favor.',
        ],
      },
    ],
    conclusion: [
      'The honest summary: 2026 is a more nuanced year than the headlines. Industrial fundamentals are strong with growing spec sensitivity. Retail is stronger than the pessimistic narrative if you focus on the right submarkets. Office is bifurcated — Class A is fine, Class B is a tenant\'s market, both deserve careful underwriting.',
      'For owners: focus on submarket selection, asset modernization, and disciplined hold/sell decisions on each individual asset. For tenants: take advantage of negotiating leverage in the segments where it exists (Class B office, Class C industrial, secondary retail). For investors: cap rates have moved out, off-market deal flow is real, and 1031 timing is favorable.',
      'If you want to talk through how any of this applies to your specific Texas commercial real estate situation, get in touch. CRECO\'s practice spans every major Texas market and every property type — and we are happy to share our perspective without expectation, even if you don\'t end up engaging us.',
    ],
    relatedSlugs: ['lease-vs-buy-texas-business', 'multi-property-owner-strategy'],
  },

  {
    slug: 'lease-vs-buy-texas-business',
    title: 'Lease vs Buy: How Texas Business Owners Should Think About Their Commercial Real Estate',
    metaTitle: 'Lease vs Buy Commercial Real Estate Texas | Decision Framework | CRECO',
    metaDescription:
      'A practical decision framework for Texas business owners weighing leasing vs buying commercial real estate. SBA 504, owner-user economics, cash-flow tradeoffs, and when each path makes the most sense.',
    keywords: [
      'lease vs buy commercial real estate texas',
      'sba 504 texas',
      'owner user commercial real estate texas',
      'buy commercial property for my business texas',
      'commercial property financing texas',
      'commercial real estate decision texas',
    ],
    excerpt:
      'A practical framework for Texas business owners deciding between leasing and buying their commercial real estate — with the actual math, financing options, and the questions that should drive the decision.',
    publishedAt: '2026-04-29',
    author: 'CRECO',
    readingMinutes: 8,
    category: 'Tenant Strategy',
    intro: [
      'Every Texas business owner who has signed a third or fourth commercial lease eventually asks the question: should I just buy this building? The answer matters because it locks up real capital and changes the financial profile of your business — but most owners we talk to make the decision based on instinct rather than analysis.',
      'There is a clear framework for thinking through lease-vs-buy on Texas commercial real estate, and it applies whether you are a single-location operator, a multi-location concept, or a service business needing dedicated space. This piece walks through the framework — including the SBA 504 financing path that makes ownership accessible to Texas businesses with as little as 10% down — and the questions that should actually drive the decision.',
    ],
    sections: [
      {
        heading: 'The honest economics: leasing vs owning',
        paragraphs: [
          'Leasing trades capital flexibility for predictability. You write a check every month, the landlord owns the asset, and you walk away at lease end with no equity. The advantage: minimal upfront capital, no maintenance liability, and full deductibility of rent.',
          'Owning trades capital lock-up for equity build, depreciation tax shelter, and long-term cost predictability. With SBA 504 financing — the dominant Texas owner-user financing path — you can buy a building with 10% down (vs 20-30% for conventional), 25-year amortization, and a fixed rate on the SBA piece for 25 years. The math often favors ownership when your time horizon is 7+ years.',
          'A simple rule of thumb: if your business will occupy the same property for 10+ years and you have or can finance 10-20% down payment, ownership economics typically beat leasing. If your time horizon is uncertain or your capital is better deployed in your operating business, leasing usually wins.',
        ],
      },
      {
        heading: 'How SBA 504 changes the calculus',
        paragraphs: [
          'SBA 504 is the most powerful Texas commercial real estate financing tool that most business owners don\'t fully understand. It\'s a three-piece structure: a conventional first lien (50% LTV) from your bank, a second lien (40% LTV) from a Certified Development Company (CDC) backed by the SBA, and your equity (10% down).',
          'The CDC piece is fixed for 25 years at a rate typically 50-150 bps below conventional commercial rates. The bank first lien is also typically 25 years amortization, fixed for the first 5-10 years. Combined, your blended cost of capital on an SBA 504 deal is meaningfully lower than conventional — sometimes 100-200 bps lower over the life of the loan.',
          'Eligibility: your business must occupy 51%+ of the building (you can lease excess space to other tenants), be a for-profit operating business, and meet SBA size standards (most Texas businesses qualify). The deal must be a Texas commercial real estate purchase, ground-up construction for your business, or major renovation. Capital allocation rules: building must remain owner-occupied for the term of the SBA loan.',
        ],
      },
      {
        heading: 'The right questions to ask before buying',
        paragraphs: [
          'A handful of questions cut through the analysis:',
        ],
        bullets: [
          'How long will my business need this exact location? If under 7 years, leasing usually wins. If 10+, ownership is increasingly attractive.',
          'Do I have or can I source 10-20% down without straining my operating business? If down payment requires draining your operating reserves, leasing is safer.',
          'Will I outgrow this building? If headcount or operations are likely to require 50%+ more space within 5 years, ownership of the current footprint may be a trap.',
          'How much excess space could I lease to outside tenants? Owner-user buildings with 49% leased to outside tenants generate cash flow that subsidizes your own occupancy — a major advantage of owning.',
          'What\'s my submarket appreciation thesis? Texas growth corridors (Austin, Houston, DFW) have shown strong long-term appreciation; secondary submarkets are more variable.',
          'Can I deploy this capital better in my operating business? If your business returns 30-40% on invested capital, owning real estate at 8-12% returns may be a poor allocation.',
        ],
      },
      {
        heading: 'Signs leasing is the right path for now',
        paragraphs: [
          'Some businesses should clearly lease for the foreseeable future:',
        ],
        bullets: [
          'High-growth companies where headcount could double in 3 years',
          'Businesses with high return on invested capital where capital is best deployed in operations',
          'Pre-stable businesses (under 3 years operating, uncertain location requirements)',
          'Specialty operations where the right building rarely comes up for sale (cold storage, cleanrooms, specialized restaurant)',
          'Owners with cash-flow seasonality where fixed monthly rent is easier than mortgage + capex management',
        ],
      },
      {
        heading: 'Signs ownership is worth pursuing',
        paragraphs: [
          'On the other side, signals that ownership likely makes sense:',
        ],
        bullets: [
          'Your business has been in the same submarket for 5+ years and isn\'t leaving',
          'Your headcount and footprint are stable or slow-growing',
          'You have or can source 10-20% down without straining the business',
          'You\'re paying $6,000-$30,000+ per month in rent (the Texas commercial real estate sweet spot for SBA 504)',
          'You\'re tired of landlord buildouts, restrictions, and eventual lease renegotiations',
          'You want to build long-term wealth in tax-advantaged real estate alongside your operating business',
        ],
      },
      {
        heading: 'The hybrid path: build-to-suit lease with purchase option',
        paragraphs: [
          'For Texas businesses where neither pure lease nor pure purchase fits, build-to-suit lease structures with eventual purchase options can be the right answer. A developer builds the property to your specs, leases it to you long-term (typically 10-15 years), and includes a purchase option (often at fair market value or pre-set escalation schedule) that you can exercise after year 5 or year 10.',
          'This structure de-risks the upfront capital commitment, lets your business stabilize before the ownership decision, and preserves flexibility if your trajectory changes. CRECO has structured several of these for Texas operators — they require careful negotiation of the purchase option pricing and lease economics, but they can be a great middle path.',
        ],
      },
    ],
    conclusion: [
      'The lease-vs-buy decision is rarely close on the math when you do the analysis carefully. For most Texas businesses with stable operations and a 10+ year time horizon, ownership through SBA 504 generates meaningfully better long-term economics than leasing. For high-growth, capital-constrained, or uncertain businesses, leasing remains the right call.',
      'CRECO advises Texas businesses through this decision frequently — including coordinating SBA 504 lender introductions, evaluating candidate buildings, structuring purchase contracts, and managing the closing process. If you\'re weighing the question for your business, get in touch.',
    ],
    relatedSlugs: ['multi-property-owner-strategy', 'texas-commercial-real-estate-outlook-2026'],
  },

  {
    slug: 'multi-property-owner-strategy',
    title: 'Multi-Property Owner Strategy: When to Hold, When to Sell, When to Reposition Your Texas Commercial Real Estate',
    metaTitle: 'Multi-Property Owner Strategy Texas | Hold Sell Reposition | CRECO',
    metaDescription:
      'A strategic framework for Texas commercial property owners with multi-property portfolios. When to hold, sell, or reposition each asset. 1031 timing, repositioning ROI, and disposition strategy across 5-50+ property portfolios.',
    keywords: [
      'multi property owner strategy texas',
      'commercial real estate portfolio strategy texas',
      'commercial real estate hold sell analysis',
      'reposition commercial property texas',
      '1031 exchange strategy texas',
      'texas commercial property portfolio',
      'family office commercial real estate texas',
    ],
    excerpt:
      'A framework for Texas commercial property owners with portfolios — how to think about each individual asset (hold, sell, reposition), when timing matters, and how to coordinate decisions across 5 to 50+ properties.',
    publishedAt: '2026-04-29',
    author: 'CRECO',
    readingMinutes: 10,
    category: 'Owner Strategy',
    intro: [
      'Most Texas commercial real estate owners with multi-property portfolios operate on inertia. They acquired the assets over time, the properties throw off cash, and the day-to-day operations consume enough attention that strategic decisions never get made. The result: portfolios that should have been actively managed sit static for 5, 10, 20 years — accumulating capex backlog, missing repositioning opportunities, and forgoing 1031 cycles that could have meaningfully grown the portfolio.',
      'The owners who compound wealth through Texas commercial real estate are not the ones who buy and hold passively. They are the ones who treat their portfolio as a living book — actively making hold/sell/reposition decisions on each asset based on submarket fundamentals, asset condition, tenant credit, capex requirements, and capital deployment alternatives. This piece walks through the framework we use at CRECO to advise multi-property Texas commercial real estate owners.',
    ],
    sections: [
      {
        heading: 'Step one: a written hold/sell/reposition recommendation on every asset',
        paragraphs: [
          'The single highest-leverage activity for any multi-property Texas commercial real estate owner is a written, asset-by-asset recommendation on hold, sell, or reposition — refreshed annually. This sounds obvious. Most owners have never done it.',
          'A good asset-level recommendation considers: current cash flow yield on market value, projected NOI growth (or contraction) over a 5-year hold, capex backlog and required capital, tenant credit and lease rollover risk, submarket fundamentals (vacancy trend, supply pipeline, demographic trajectory), and alternative deployments for the capital tied up in the asset. Each asset gets a recommendation: hold, sell, or reposition — with reasoning.',
          'The discipline of writing this down forces clarity. Owners often find that 2-4 of their 15 properties are clear sell candidates, 1-3 are clear reposition candidates, and the rest are clear holds. The portfolio quality goes up dramatically when the bottom-quartile assets get sold and the proceeds redeployed.',
        ],
      },
      {
        heading: 'When to hold',
        paragraphs: [
          'Hold candidates share a few characteristics:',
        ],
        bullets: [
          'Stable or growing NOI with reasonable rollover risk',
          'Submarket fundamentals supporting demand (population growth, supply discipline, employer base)',
          'Asset condition acceptable — major capex behind you, normal capex going forward',
          'Tenant credit acceptable — long lease term remaining or strong renewal probability',
          'Tax basis low enough that selling triggers significant capital gains and depreciation recapture',
          'No alternative deployment of capital that would meaningfully outperform the current asset\'s expected return',
        ],
      },
      {
        heading: 'When to sell',
        paragraphs: [
          'Sell candidates show some combination of:',
        ],
        bullets: [
          'NOI declining or flat with no clear path to growth',
          'Submarket fundamentals deteriorating (oversupply, demographic decline, employer base shrinking)',
          'Major capex backlog requiring capital that won\'t earn an acceptable return',
          'Tenant credit risk concentration (one tenant whose departure tanks NOI)',
          'Capital better deployed elsewhere — alternative Texas opportunities, exchange into a stronger asset',
          'Estate planning or generational transfer considerations',
          'You\'ve owned the asset 7+ years and the pro forma you bought on has played out',
        ],
      },
      {
        heading: 'When to reposition',
        paragraphs: [
          'Reposition is the right call when the asset has clear upside but requires capital and active intervention to unlock it. Common Texas reposition scenarios:',
        ],
        bullets: [
          'Class B retail center with anchor turnover — replace anchor with stronger tenant, refresh facade, push smaller-tenant rents',
          '1980s-1990s industrial building — LED lighting, ESFR sprinkler upgrade, dock-door additions, yard expansion',
          '1990s-era Class B office — modernize lobby and common areas, capex into the building amenities, push rents toward Class A territory',
          'Vacant or under-leased property — focused leasing campaign with sublease, direct, and creative financing options',
          'Mixed-use property with tenant mix problems — rebalance toward higher-credit, longer-term tenants',
        ],
      },
      {
        heading: 'Coordinating the portfolio: timing matters',
        paragraphs: [
          'Once you have asset-level recommendations, the next discipline is coordinating execution across the portfolio. This is where most owners go wrong — they sell one property and have no plan for the proceeds, or they reposition multiple assets simultaneously and exhaust capacity.',
          'A good coordinated plan considers: 1031 timing (you have 45 days from sale closing to identify replacement, 180 days to close), capital sequencing (which dispositions fund which acquisitions or repositions), debt strategy (when refinancings come up, can you bundle), and operational capacity (your team and your property management firm can only execute so many simultaneous changes).',
          'For owners with 10+ properties, we typically build a 24-month rolling plan: which assets sell in months 1-6, which capital deploys in months 4-9, which reposition projects start in months 6-12, etc. The plan flexes based on market conditions, but having it written down keeps decisions intentional rather than reactive.',
        ],
      },
      {
        heading: '1031 timing: the underused tool',
        paragraphs: [
          'The 1031 like-kind exchange is the most powerful tax-deferral tool in Texas commercial real estate, and most owners use it inefficiently. The basic mechanic: sell a property, defer the capital gains and depreciation recapture taxes by buying a "like-kind" replacement property within 180 days. If you keep doing this throughout your career, you defer taxes indefinitely. On death, your heirs get a stepped-up basis and the deferred tax liability evaporates.',
          'Sophisticated multi-property owners do 1031s as part of a coordinated strategy — selling weakest assets, exchanging into strongest opportunities, upgrading portfolio quality without paying tax friction. The 45-day identification window is the rate-limiter; this is where having an active broker network identifying replacement options pays off enormously. CRECO\'s Texas-wide network and off-market deal flow is specifically valuable for 1031 buyers within their 45-day window.',
        ],
      },
      {
        heading: 'When to add CRECO\'s owner services',
        paragraphs: [
          'Multi-property Texas commercial real estate owners eventually outgrow generic property management. Once you cross 5 properties — and certainly by 10 — strategy becomes as important as operations. CRECO\'s owner services practice is built for that transition.',
          'We provide quarterly portfolio reviews with asset-level hold/sell/reposition recommendations, off-market deal flow for acquisitions and 1031 replacement, day-to-day property management with institutional-quality reporting, and direct broker access — every engagement led by a senior CRECO broker who knows every asset.',
        ],
      },
    ],
    conclusion: [
      'The compounding owners are the ones who treat their Texas commercial real estate portfolio as an active book, not a passive collection. Annual asset-level reviews. Coordinated capital deployment across hold, sell, and reposition decisions. Disciplined 1031 cycles. Active asset management to extract every basis point of NOI growth.',
      'If you\'re managing a Texas multi-property portfolio and want a thinking partner — not a salesperson — CRECO is happy to start with a no-obligation portfolio review. We tour your assets, audit the rent rolls, and deliver a written strategy memo within two weeks. From there, you decide whether to engage us further.',
    ],
    relatedSlugs: ['lease-vs-buy-texas-business', 'texas-commercial-real-estate-outlook-2026'],
  },
];

/** Sort posts newest-first for the index page. */
export const SORTED_POSTS = [...POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

export function findPost(slug: string): InsightPost | undefined {
  return POSTS.find(p => p.slug === slug);
}
