/**
 * CRECO Lead Magnets — gated guides downloaded in exchange for an email.
 *
 * Each guide is structured content (intro, sections, takeaways) rendered
 * inline on the /guides/[slug] page after email capture. We avoid PDFs
 * because:
 *   - HTML guides are SEO-indexable above the fold (teaser + outline)
 *   - Updates are git-tracked, no asset re-uploads
 *   - Copy / paste / share works the same as a PDF
 *
 * To add a guide: append an entry. The /guides index and /guides/[slug]
 * pages auto-render from this list.
 */

export interface GuideSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface Guide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  /** Card / hero subtitle */
  excerpt: string;
  /** "Tenant", "Owner", "Investor" — who this is written for */
  audience: 'Tenant' | 'Owner' | 'Investor' | 'Owner-User';
  /** Approximate length so users know what they're getting */
  pageCount: number;
  readingMinutes: number;
  /** What the reader will walk away with — bullets shown above the email gate */
  outcomes: string[];
  /** Above-the-fold preview — visible without email */
  teaser: string[];
  /** Full content — only rendered after email capture */
  sections: GuideSection[];
  conclusion: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: 'texas-tenant-lease-negotiation-playbook',
    title: 'The Texas Tenant Lease Negotiation Playbook',
    metaTitle: 'Texas Tenant Lease Negotiation Playbook | CRECO',
    metaDescription:
      "A practical playbook for Texas businesses negotiating commercial leases — TI allowances, rent abatement, expense pass-throughs, exit options, and the deal points that actually move money. Free download from CRECO.",
    keywords: [
      'texas commercial lease negotiation',
      'tenant lease negotiation texas',
      'texas commercial tenant playbook',
      'commercial lease tips texas',
      'tenant improvement allowance texas',
      'texas warehouse lease negotiation',
      'texas office lease negotiation',
    ],
    excerpt:
      "Twelve deal points that actually move money on a Texas commercial lease — and the language to use when negotiating each one. Written for tenants signing 5,000 to 100,000 SF.",
    audience: 'Tenant',
    pageCount: 18,
    readingMinutes: 22,
    outcomes: [
      'Know exactly which lease clauses move the most economics — and which are mostly cosmetic',
      'Use specific Texas-market benchmark numbers for TI, abatement, and renewal terms',
      'Get red-flag language to watch for in landlord drafts (and how to push back)',
      'Build a negotiation sequence that compounds wins instead of trading one for another',
    ],
    teaser: [
      'Most Texas commercial tenants leave six figures on the table at lease signing — not because they negotiated badly, but because they negotiated the wrong things. Tenant improvement allowances, rent abatement, and expense pass-throughs move real money. Pet provisions and parking ratios mostly don\'t.',
      'This playbook covers the 12 deal points that, in our experience signing hundreds of Texas commercial leases, actually decide whether a tenant got a good deal. For each point we give: what the typical Texas-market range looks like in 2026, what landlord-friendly language to push back on, and the specific counter-language that has worked for our clients.',
      "It's written for businesses signing 5,000 to 100,000 SF — too big for a generic shop-around-and-pick-the-cheapest approach, too small to have an in-house real estate team. If that's you, this is the document I wish I could hand every tenant we represent before they start negotiating.",
    ],
    sections: [
      {
        heading: '1. Tenant Improvement Allowance (TIA) — the single biggest dollar lever',
        paragraphs: [
          "Tenant improvement allowance is dollars per square foot the landlord contributes toward your buildout. On a 20,000 SF Texas warehouse at $40/SF TIA, that's $800,000 of construction cost the landlord is paying — typically amortized into your rent over the lease term.",
          "Texas-market 2026 ranges we're seeing: Class A office: $60-90/SF on a 7-year deal. Class B office: $40-65/SF on a 7-year deal (going to $70+ in slow submarkets). Industrial: $5-25/SF for warehouse, $15-40/SF for flex with office buildout. Retail: $30-60/SF for inline space, $50-100+/SF for end-cap restaurants.",
          "What to push: TIA scales with lease term. A 10-year deal should get meaningfully more TIA than a 5-year deal. Push for unused TIA to convert to rent abatement at a 1:1 dollar ratio — most landlords will agree if pushed.",
        ],
        bullets: [
          'Push back on: "Landlord will deliver in shell condition with $X/SF TIA, payable upon completion of work" — payable upon completion can become payable after multiple inspections that delay your reimbursement',
          'Counter with: "Landlord will fund TI on a draw basis, with payments made within 30 days of lien-waiver-supported draw requests"',
          'Always negotiate: TI cap doesn\'t include landlord-required work (roof, HVAC, structural, code compliance for the shell)',
        ],
      },
      {
        heading: '2. Rent abatement — free rent that actually flows to your P&L',
        paragraphs: [
          "Rent abatement (also called free rent) is months of rent the landlord waives. Unlike TIA, abatement flows directly to your P&L as cash savings, with no asset to depreciate or capex to deploy.",
          "Texas-market 2026 ranges: Class A office: 6-9 months on a 7-year deal. Class B office: 9-15 months on a 7-year deal. Industrial: 2-4 months on a 5-year deal, 4-8 months on a 7-10 year deal. Retail: typically minimal (1-3 months) unless the space has been on market 12+ months.",
        ],
        bullets: [
          'Always negotiate: abatement applies to base rent only OR base + operating expenses (the latter is meaningfully more valuable)',
          'Push for: front-loaded abatement (months 1-X free) rather than spread across the term — better cash flow value',
          'Watch for: "abatement subject to no event of default" — fine in principle, but make sure the cure period is reasonable',
        ],
      },
      {
        heading: '3. Operating expense pass-throughs — where landlords smuggle in extra rent',
        paragraphs: [
          "In NNN leases, you reimburse the landlord for taxes, insurance, and CAM (common area maintenance). The legitimate pass-throughs are well-defined; the dishonest ones are where landlords try to charge you for things that should be capital expenditures.",
          "Standard exclusions to negotiate into your lease: capital expenditures (other than amortized over useful life), structural repairs, roof replacement (vs roof maintenance), landlord administrative overhead beyond a capped management fee, costs caused by landlord negligence, costs related to other tenants' unique uses.",
        ],
        bullets: [
          'Always cap controllable expenses at 5% annual increases',
          'Always require: detailed annual reconciliation with right to audit at landlord\'s expense if a 5%+ overcharge is found',
          'Push to exclude: management fee in excess of 3-4% of gross rents (some landlord drafts say 5%+ which is a hidden rent increase)',
          'Push to exclude: depreciation, amortization of leasing commissions, ground rent, and capital repairs',
        ],
      },
      {
        heading: '4. Renewal options — value or trap depending on the language',
        paragraphs: [
          "Renewal options give you the right (but not obligation) to extend your lease at a pre-specified rent or at fair market value. They sound great in theory. In practice, badly-drafted renewals are worth less than they appear and can lock you into bad outcomes.",
          'A "fair market rent" renewal with no floor or cap means the landlord can demand whatever rent the market supports — useful only as a placeholder, not a real economic option. A "fair market rent with a cap of CPI+2% or 95% of comparable buildings" gives you actual downside protection.',
        ],
        bullets: [
          'Negotiate at minimum 2 renewal options of 5 years each',
          'Negotiate caps and floors on renewal rent — never accept open-ended FMV',
          'Push for: "Tenant\'s renewal rent shall be 95% of fair market rent for comparable buildings, capped at then-current rent + CPI"',
          'Always negotiate: notice period. 6-9 months is reasonable. Watch for landlord drafts requiring 12-18 months notice — that forces you to commit before you have full information about your business trajectory',
        ],
      },
      {
        heading: '5. Exit options: termination, contraction, expansion',
        paragraphs: [
          "The right to leave, shrink, or grow within your lease is often more valuable than rent reductions. Most tenants don't ask for these because they assume they're impossible. They're not.",
          "Termination right (or kick-out): the right to end the lease early, typically after a stated date, in exchange for a penalty. Common Texas-market penalty: unamortized TIA + leasing commissions + 3-6 months rent. This option is hugely valuable for tenants whose business trajectory might require relocation.",
          "Contraction right: the right to give back a portion of the space (typically 25-50%) at a stated date, with a penalty. Useful for tenants worried about over-committing.",
          "Expansion right (Right of First Offer or Right of First Refusal): the right to lease adjacent space if it becomes available. ROFO requires the landlord to offer first; ROFR requires the landlord to offer matching of any third-party offer.",
        ],
      },
      {
        heading: '6. Personal guarantees — the leverage you have to push back',
        paragraphs: [
          "Texas landlords routinely demand personal guarantees from business owners. For owner-operated businesses, this is a serious commitment — your personal assets are on the line if the business defaults.",
          "Most landlords will negotiate guarantees down to: a burn-down (full guarantee year 1, decreases annually until $0 by year 5-7), a capped guarantee ($X amount cap, regardless of total damages), or a good-guy guarantee (limited to liability for damages occurring before tenant vacates the space and returns keys).",
        ],
        bullets: [
          'Always push for: burn-down or capped, never open-ended',
          'Good-guy guarantee is the gold standard — landlord can\'t pursue you for future rent if you leave the keys',
          'Push for: removal of guarantee at 50% reduction in business risk (e.g., business doubles in size, raises significant equity, etc.)',
        ],
      },
      {
        heading: '7. Use clause and exclusivity',
        paragraphs: [
          "Your use clause defines what you can do in the space. Tight use clauses (\"office for accounting services only\") limit your flexibility for sublease and assignment. Broad use clauses (\"any lawful office use\") preserve flexibility.",
          "For retail tenants, exclusivity clauses prevent the landlord from leasing space in the same center to a competitor. Standard Texas-market: yes for restaurants (specific cuisine type), yes for fitness, yes for medical specialty, mostly no for general retail.",
        ],
      },
      {
        heading: '8. Assignment and sublease rights',
        paragraphs: [
          "The right to assign your lease (transfer to a new tenant) or sublease (rent to a third party while remaining responsible) is critical for any business that might be acquired, restructured, or downsize.",
          "Standard landlord drafts say \"Tenant may not assign or sublease without Landlord's prior written consent, which may be withheld in Landlord's sole discretion.\" Negotiate to: \"...consent shall not be unreasonably withheld, conditioned, or delayed.\" Add: \"deemed consent if Landlord does not respond within 30 days.\"",
          "Push for: \"Tenant may assign or sublease without Landlord's consent to: any affiliate, any successor by merger or acquisition, any entity controlling, controlled by, or under common control with Tenant.\" This carve-out preserves your flexibility for routine corporate transactions.",
        ],
      },
      {
        heading: '9. Holdover rent — a clause that can devastate you',
        paragraphs: [
          "Holdover rent is what you pay if you stay in the space past lease expiration without signing a renewal. Standard landlord drafts often say 150-200% of base rent. That's a punishing rate.",
          "Push to: 125% of last month\'s rent for first 60 days, then 150% thereafter. The economic logic: if you're holding over briefly because of a delayed move, you should pay a premium but not a triple-rent penalty. If you're holding over indefinitely, the higher rate kicks in.",
        ],
      },
      {
        heading: '10. Maintenance and repair — clarify who pays for what',
        paragraphs: [
          "In NNN leases, you typically maintain everything inside your space. The landlord maintains the roof, structure, exterior walls, parking lot, and common areas. The grey area: HVAC, plumbing under-slab, electrical above-ceiling.",
          "Negotiate: \"Tenant maintains HVAC subject to a $X annual cap on capital repairs (above the cap, Landlord pays).\" Without this, a single chiller replacement on a Class B office can hit you for $50K-$150K.",
          "Negotiate: \"Landlord warrants HVAC, electrical, and plumbing systems to be in good working order at delivery, with a 12-month warranty period during which Landlord bears repair cost.\"",
        ],
      },
      {
        heading: '11. Insurance and indemnification',
        paragraphs: [
          "Standard tenant insurance: $2M general liability, $5M umbrella, replacement-cost contents, business interruption, plate glass. Negotiate the dollar limits to your actual exposure — landlord drafts often specify $5M+ which is overkill for smaller tenants.",
          "Push for: \"Tenant's indemnification obligation excludes Landlord's negligence, gross negligence, or willful misconduct.\" Standard landlord drafts indemnify for everything; you want a clean carve-out for landlord fault.",
          "Always require: waiver of subrogation between Landlord and Tenant. This prevents your insurer from suing the landlord (or vice versa) over claims paid out — it streamlines the relationship and is industry-standard.",
        ],
      },
      {
        heading: '12. The negotiation sequence that compounds',
        paragraphs: [
          "The sequence in which you raise points matters as much as the points themselves. Texas commercial landlords typically have a sequence of \"things they're willing to give\" and a sequence of \"things they hold firm on.\" Your job is to ask for the give-aways early, save your high-priority items for the leverage points, and never trade one win for another.",
          "Our standard sequence: Round 1 — TIA, rent abatement, expense exclusions, audit rights, OpEx caps. Round 2 — renewal options, exit rights, assignment language. Round 3 — guarantee structure, holdover, maintenance carve-outs, indemnification. By the time you're discussing guarantee structure, you've already locked in TIA and abatement — and the landlord has invested too much in the deal to walk away.",
        ],
      },
    ],
    conclusion: [
      "Negotiating a Texas commercial lease is asymmetric: the landlord does this 50 times a year, you do it once every 5-10. That asymmetry is what tenant representation exists to correct. Whether you use this playbook on your own or alongside a tenant rep broker, the key insight is that lease negotiation is a structured exercise — not a vibe-based haggle. The points above are where the dollars actually live.",
      "If you'd like CRECO to walk through your specific lease draft and identify the priority items for your negotiation, that's exactly what we do for Texas tenant clients. There's no charge for the initial review — landlords pay tenant rep commissions in 99% of cases.",
    ],
  },

  {
    slug: 'texas-owner-disposition-strategy-guide',
    title: 'The Texas Commercial Property Owner\'s Disposition Strategy Guide',
    metaTitle: "Texas Commercial Property Disposition Strategy Guide | CRECO",
    metaDescription:
      "A strategic guide for Texas commercial property owners deciding when and how to sell — pricing strategy, marketing approach, 1031 timing, and the questions that matter before listing. Free download from CRECO.",
    keywords: [
      'texas commercial property disposition',
      'sell commercial property texas',
      'texas commercial property pricing strategy',
      '1031 exchange texas',
      'commercial real estate sale texas',
      'texas commercial property owner guide',
    ],
    excerpt:
      'How to think about selling a Texas commercial property — pricing, marketing, timing, 1031 strategy, and the diligence that determines whether you get full value or a discount. Written for owners with 1 to 50+ properties.',
    audience: 'Owner',
    pageCount: 16,
    readingMinutes: 19,
    outcomes: [
      'A clear framework for deciding when an asset is ready to sell vs reposition vs hold',
      'Pricing strategy that gets you full value without scaring off the most likely buyer',
      'Marketing approach matched to property type and buyer pool — institutional, private, or 1031',
      '1031 timing tactics — including off-market deal flow networks for the 45-day window',
    ],
    teaser: [
      "Most Texas commercial property dispositions happen on a 12-week timeline. Most should happen on a 6-month timeline — with a 4-month preparation phase that doubles the eventual sale price. The difference between owners who routinely hit the high end of comp ranges and owners who routinely close 5-10% under is almost entirely in that preparation phase.",
      "This guide walks through the disposition decision and execution process from the perspective of the owner — pricing, marketing, buyer-pool selection, 1031 timing, and the diligence work that prevents last-minute price reductions. It's written for owners with anywhere from one property to a fifty-property portfolio, because the strategic principles are the same; the operational complexity scales.",
      "If you're considering selling a Texas commercial property — or you've sold before and want a more disciplined process next time — this is the document we'd hand you before our first conversation.",
    ],
    sections: [
      {
        heading: 'Step 1: Confirm the asset is actually ready to sell',
        paragraphs: [
          "Before you list, run an honest hold-vs-sell analysis. Many owners sell prematurely because cash flow has slowed, then realize they sold before completing the easy NOI optimizations that would have raised the sale price by 10-20%.",
          "The questions to answer: Is the rent roll optimized — are tenants paying market rent, are leases on appropriate terms, is occupancy at the achievable level? Is operating expense control optimized — has property tax been appealed, are vendor contracts at market, has the management fee been audited? Is the asset's physical condition show-ready — are deferred capex items addressed, does the property show well to a buyer's broker on first walk?",
          "If any of those answers are \"not really,\" you have 6-12 months of optimization work ahead before listing. That work routinely raises sale price by more than the income you'd give up by waiting.",
        ],
      },
      {
        heading: 'Step 2: Pick the buyer pool, then design backwards from it',
        paragraphs: [
          "Different Texas commercial properties attract different buyers. Single-tenant net-lease industrial buildings attract 1031 exchange buyers and small institutional capital. Multi-tenant retail strip centers attract private investors and family offices. Class A office buildings attract institutional capital. Older industrial buildings attract owner-users.",
          "Identify your most-likely buyer pool first. Then design pricing, marketing, and diligence package for that pool. A 1031 buyer needs different information than an owner-user. Pricing strategy that works for institutional capital may scare off private buyers and vice versa.",
        ],
        bullets: [
          'Single-tenant NNN industrial: cap-rate-driven, 1031 buyer-heavy, marketed via cap-rate-sorted email blasts',
          'Multi-tenant retail: NOI growth narrative + tenant credit story, marketed via private investor networks',
          'Class A office: institutional-grade OM with full diligence pack, marketed via institutional broker network',
          'Older industrial / flex: owner-user economics + value-add story, marketed locally to operators',
        ],
      },
      {
        heading: 'Step 3: Pricing strategy — and how to avoid the broker over-promise trap',
        paragraphs: [
          "Brokers compete for listings. Many do so by quoting the highest possible price during the listing pitch — knowing that the inevitable price cut will happen later, by which time they've already won the listing. This is the most common reason Texas commercial properties trade below their potential.",
          "The right pricing approach: anchor on the actual replacement cost / income / cap-rate evidence, model 3-4 buyer scenarios at different cap-rate / IRR assumptions, set the asking price at the high end of the realistic range with explicit walk-away math at each level, and avoid the over-promise that destroys credibility when reality hits.",
          "Texas-market practical: as of 2026, stabilized industrial trades at 6.5-8.5%, retail at 6.5-8.5%, Class B office at 8-10%+. If your broker is quoting cap rates well outside these ranges, ask them to walk you through the specific comparable transactions justifying their number.",
        ],
      },
      {
        heading: 'Step 4: Marketing — the diligence pack matters more than the OM',
        paragraphs: [
          "The Offering Memorandum (OM) is what brokers love to talk about. The diligence pack is what actually closes the deal. A well-prepared diligence pack — full rent roll with backups, 24-month operating statements, capex history, tax appeal history, environmental reports, title work, survey, insurance loss runs — speeds up due diligence by 30-60 days and eliminates the late-stage price renegotiation that comes from \"surprises.\"",
          "Owners who prepare diligence packs before listing routinely close at higher prices on faster timelines. Owners who scramble through diligence after going under contract routinely give up 3-7% on price reductions during the diligence period.",
        ],
        bullets: [
          'Full rent roll with lease document copies and amendments',
          'Trailing 24-month operating statements with bank reconciliations',
          'Five-year capex history and vendor contracts',
          'Property tax appeal history and current valuation',
          'Phase I environmental (refresh if older than 6 months)',
          'Survey, title commitment, ALTA insurance',
          'Insurance loss runs and current premium',
          'Service contracts (HVAC, landscaping, security)',
          'Tenant estoppels (collected pre-listing if possible)',
        ],
      },
      {
        heading: 'Step 5: The 1031 angle — most disposition decisions are also acquisition decisions',
        paragraphs: [
          "Most Texas commercial property sellers have a tax bill waiting on them — typically 25-35% of the gain when you combine federal capital gains, depreciation recapture, and Texas-state implications (no state income tax, but federal still applies). 1031 exchange defers all of it.",
          "If you might 1031, plan the disposition and acquisition simultaneously. The 45-day identification window after sale closing is fast. Owners who start identification work in the 60 days before closing routinely identify higher-quality replacement properties than owners who scramble within the 45 days.",
          "The key 1031 strategic decisions: equal or greater value (otherwise partial taxable boot), like-kind real estate (Texas commercial swaps for any commercial — across property types, across geographies), reverse exchange (acquire first, sell after — useful when the right replacement appears before you've sold), and Delaware Statutory Trust (DST) options (passive investment in fractional commercial real estate — useful as a backup if you can't identify a direct property).",
        ],
      },
      {
        heading: 'Step 6: Negotiation and closing — the price that matters is net to seller',
        paragraphs: [
          "Headline sale price is not what you pocket. Closing costs, broker commissions, prorations, escrow, and seller-paid concessions all reduce net proceeds. Two offers at the same headline price can have meaningfully different net-to-seller dollars.",
          "Things that move net-to-seller: free rent landlord-paid through closing (reduces buyer's pro forma), tenant lease commissions on new leases signed pre-closing (often seller-paid), escrows for tenant improvements not yet complete, holdback for environmental cure, repair credits negotiated in due diligence.",
          "The discipline: model net-to-seller on each offer, not just headline. A higher gross offer with bigger seller credits is sometimes worse than a lower gross offer with cleaner terms.",
        ],
      },
      {
        heading: 'Step 7: Closing the loop — post-disposition portfolio review',
        paragraphs: [
          "Selling one property is a tactical decision. Selling within a portfolio is a strategic one. After every disposition, the disciplined multi-property owner runs a portfolio-level review: did this disposition trigger reallocation needs across the rest of the portfolio? Has the proceeds redeployment opened new strategic options? Should the next 12-24 months include additional dispositions or repositions to compound the strategic shift?",
          "Owners who run this review systematically tend to compound portfolio quality faster than owners who treat each transaction as an island. CRECO does this for clients automatically as part of our owner services engagement, but the principle applies whether or not you have outside advisory.",
        ],
      },
    ],
    conclusion: [
      "Texas commercial property disposition is a high-stakes, infrequent activity for most owners. Sellers who treat it as a structured strategic exercise — preparation, pricing, marketing, diligence, 1031 coordination, net-to-seller modeling — routinely capture more value than sellers who treat it as a transaction to get through.",
      "If you're considering a disposition, CRECO is happy to walk through the specific economics of your asset and the right approach. We routinely engage on a no-obligation review basis — owners use the analysis to decide whether and when to list, and we earn the listing engagement when the work is right.",
    ],
  },

  {
    slug: 'q3-2026-texas-industrial-market-report',
    title: 'Q3 2026 Texas Industrial Market Report',
    metaTitle: 'Q3 2026 Texas Industrial Market Report | Warehouse & Flex Cap Rates, Rents | CRECO',
    metaDescription:
      "CRECO's Q3 2026 quarterly market report for Texas industrial real estate — warehouse and flex rents by submarket, cap rate trends, absorption, vacancy, and the deals closing across San Antonio, Austin, Dallas-Fort Worth, and Houston.",
    keywords: [
      'texas industrial market report 2026',
      'texas warehouse rents q3 2026',
      'industrial cap rates texas',
      'texas industrial vacancy',
      'san antonio industrial market',
      'dfw industrial market',
      'houston industrial market',
      'austin flex space',
      'texas industrial absorption',
    ],
    excerpt:
      "CRECO's Q3 2026 read on Texas industrial — where absorption is decelerating, where small-bay is still tight, and where institutional capital has quietly re-entered the bulk-distribution trade.",
    audience: 'Investor',
    pageCount: 14,
    readingMinutes: 17,
    outcomes: [
      'Q3 2026 rents by submarket — small-bay warehouse, large distribution, and flex',
      'Cap rate evidence from Q3 2026 closed transactions across the four metros',
      'Vacancy and absorption data, with commentary on the deceleration story',
      'Construction pipeline by metro — how deep the supply collapse has gone',
      'Where the tenant leverage window has closed and where it is still wide open',
    ],
    teaser: [
      "Texas industrial in Q3 2026 is finally starting to show the effects of the pipeline collapse we flagged in the Q2 report. Absorption decelerated again but stayed positive, vacancy ticked up modestly to 7.6% statewide, and — for the first time in six quarters — cap rates on Class A small-bay compressed slightly as institutional capital returned to the trade.",
      "Bulk distribution remains the loose end of the market, but even here the tone has shifted. Speculative bulk in DFW Alliance and Houston Northwest saw the first meaningful backfill activity of the cycle in Q3. The bid-ask spread on bulk trades has narrowed by roughly 75 bps since Q2, and a handful of large portfolio trades closed at the tighter end of buyer expectations.",
      "This report walks through Q3 2026 rent, cap rate, vacancy, absorption, and pipeline data metro-by-metro, with commentary on the deals CRECO has been in the room for this quarter. The headline read: the bifurcation story is intact, but the gap is narrowing on both sides.",
    ],
    sections: [
      {
        heading: 'Executive summary — Q3 2026 in five numbers',
        paragraphs: [
          "Texas industrial fundamentals at the end of Q3 2026 are converging modestly toward the middle. Trophy small-bay softened a hair; bulk firmed a hair; the extreme divergence that defined the first half of the year has begun to compress. Read the numbers below at the submarket level, not the metro level — the range is still wider than the average suggests.",
        ],
        bullets: [
          'Statewide industrial vacancy: 7.6% (up 20 bps QoQ, up 40 bps YoY) — range across submarkets 3.4% to 14.2%',
          'YTD net absorption: 24.1M SF across the four metros, tracking to ~32M SF full-year vs 38M in 2025',
          'Small-bay warehouse (20K-60K SF) asking rent: $11.60/SF NNN primary, $9.30/SF secondary — up 1-2% QoQ in primary',
          'Bulk distribution (200K+ SF) asking rent: $6.90/SF NNN, essentially flat QoQ after six quarters of decline',
          'Cap rates on stabilized Class A industrial: 6.4%-7.3% primary (~10 bps tighter QoQ), 7.4%-8.4% secondary (flat QoQ)',
        ],
      },
      {
        heading: 'Rents by submarket and product type',
        paragraphs: [
          "Small-bay warehouse (20K-60K SF) remains the strongest segment and the only one where landlords pushed asking rents meaningfully in Q3. Distributor, e-commerce 3PL, food service, and building-products tenants remain in growth mode. Primary infill submarkets are seeing 1-3% QoQ asking-rent increases and effective rents are holding.",
          "Bulk distribution (200K+ SF) rents stopped declining in Q3 for the first time in the cycle. Effective rents remain 8-12% below asking through TI and abatement, but landlords have stopped extending concession packages on new deals. Deal count on bulk backfill picked up meaningfully — DFW Alliance in particular saw three sub-lease-to-direct conversions during the quarter.",
          "Flex with quality office buildout remains the tightest segment. New flex product delivering in Austin Northeast and San Antonio NE has pre-leased at 60-80% of RBA before completion — a level of pre-lease activity not seen since 2022.",
        ],
        bullets: [
          'San Antonio NW small-bay: $11.70-$12.60/SF NNN, vacancy 4.6%',
          'New Braunfels / Schertz mid-size (60K-150K SF): $9.40-$10.40/SF NNN, vacancy 6.0%',
          'DFW Alliance bulk (200K+ SF): $6.50-$7.40/SF NNN, vacancy 10.8% (first sub-11% reading in five quarters)',
          'Houston Northwest bulk: $6.30-$7.10/SF NNN, vacancy 13.2%',
          'Austin Northeast flex: $15.20-$17.60/SF NNN (premium for office buildout), vacancy 4.8%',
          'San Antonio Southside large warehouse (100K-200K SF): $7.90-$8.90/SF NNN, vacancy 8.0%',
          'Houston Ship Channel adjacent: $9.60-$11.40/SF NNN, vacancy 4.2%',
        ],
      },
      {
        heading: 'Cap rates — what actually traded in Q3 2026',
        paragraphs: [
          "The story of Q3 2026 in Texas industrial capital markets is the return of institutional core capital to small-bay. Two large-portfolio trades closed in DFW and San Antonio at cap rates 20-30 bps inside where comparable product traded in Q1. The buyers were core open-end funds and insurance company separate accounts — the same investors who sat out most of 2023-2024.",
          "Bulk distribution cap rates were more mixed. Portfolio trades of stabilized bulk in primary submarkets held around 7.4-7.8%. Individual-asset trades with re-leasing risk or short WALT continued to price in the 8.4-9.4% range. The bid-ask spread narrowed by ~75 bps versus Q2 as sellers accepted the reset and buyers accepted that the pipeline collapse limits their upside on further discounting.",
        ],
        bullets: [
          'Single-tenant NNN industrial, long WALT, primary submarket: 6.2-6.7% (10-20 bps tighter QoQ)',
          'Multi-tenant small-bay portfolio, primary submarket: 6.7-7.3% (10 bps tighter QoQ)',
          'Multi-tenant industrial, secondary submarket: 7.4-8.2% (flat QoQ)',
          'Stabilized bulk distribution, primary submarket, long WALT: 7.4-7.8% (flat)',
          'Value-add / short-WALT bulk: 8.4-9.4% (25-50 bps tighter at the low end)',
          'Owner-user small-bay (10K-40K SF) with SBA buyer: pricing more on $/SF than cap rate — $190-260/SF depending on submarket',
        ],
      },
      {
        heading: 'Absorption and the construction pipeline',
        paragraphs: [
          "Net absorption across the four metros came in at positive 6.8M SF in Q3 2026 — the softest quarterly absorption since 2020, and roughly 25% below the Q2 figure. That's not a panic reading; it's the tail end of a demand-side deceleration that most operators had already priced in.",
          "The construction pipeline continued its collapse. DFW under-construction industrial is now down roughly 65% from the 2023 peak. Houston is down 60%. San Antonio down 45%. Austin started under 1.5M SF in Q3 — the lowest quarter since 2017. New starts across the state are running at roughly a third of the 2022-23 pace.",
          "The math points where it pointed in Q2: with absorption at ~30M SF annualized and new deliveries about to fall below that level by mid-2027, vacancy is set up to inflect meaningfully lower in the back half of 2027. Investors underwriting to that inflection have started buying — the Q3 institutional trades confirm they're no longer sitting on the sidelines waiting.",
        ],
      },
      {
        heading: 'Metro-by-metro commentary',
        paragraphs: [
          "**San Antonio** remains the most balanced Texas industrial market. Vacancy at 6.3% is below the state average, small-bay in the NW and NE corridors is genuinely tight, and the Southside large-distribution corridor is showing early signs of firming. New Braunfels / Schertz continues to be the sleeper submarket — mid-size industrial demand is deeper than the numbers suggest. Hill Country submarkets (Boerne, Fair Oaks, Bulverde) see steady demand for owner-user product with limited quality supply.",
          "**Austin** is the tightest Texas industrial market and the one where the pipeline collapse is most extreme. Under-construction pipeline is at a decade low, tech-adjacent and semiconductor-supply-chain demand is intact, and flex with office buildout in East Austin and Northeast Austin is genuinely undersupplied. This is the metro where the 2027-28 setup looks best.",
          "**DFW** remains the most fragmented story but is finally moving in the right direction. Alliance saw its first quarter of positive absorption in three quarters. South Dallas remains soft but has stopped getting softer. The I-635 inner-loop small-bay submarkets are the tightest in the metro. Frisco/Prosper flex demand remains strong.",
          "**Houston** improved most on the bulk side and remains exceptional on the Ship Channel side. Petrochemical-driven demand held up better than most industrial sub-segments through 2024-25 and continues to deliver reliable absorption. Outer submarkets (Katy West, Waller, Baytown far east) still have supply overhang but the lease-up trajectory has stabilized.",
        ],
      },
      {
        heading: 'What we\'re telling clients',
        paragraphs: [
          "For tenants: the aggressive-terms window on bulk distribution is closing faster than most tenants realize. If you're planning a bulk lease in the next 12-18 months, execute now rather than waiting. Six to eight months ago we were pushing landlords for 10-14 months abatement; today that's 6-9 months on the same product. TI budgets have compressed similarly. The small-bay and flex windows haven't opened at all — those remain landlord markets.",
          "For owners with bulk product: the tone has shifted enough that dispositions can happen at defensible cap rates. If you were waiting for the bid-ask spread to narrow before selling, we're there. Deal count in bulk is meaningfully higher than Q2, and sellers who accepted 25-50 bps of cap rate widening from 2022 pricing are transacting cleanly.",
          "For owners with small-bay: 2026 is still the peak-pricing window. Institutional capital is back, 1031 buyers remain persistent, and the demographic setup for small-bay industrial (long-tenured tenants, low turnover, favorable lease structure) resonates with the buyers who are deploying. If you're within 24 months of a natural sale decision, consider pulling it forward.",
          "For investors with capital deploying now: the highest-conviction trade is still value-add bulk in primary submarkets bought below replacement cost at 8.5%+ caps. Second-highest: trophy small-bay infill at 6.5-6.8% caps — expensive but the demand story is strongest. Least attractive: passive stabilized product where the return depends on cap-rate compression that has largely already happened.",
        ],
      },
    ],
    conclusion: [
      "Texas industrial in Q3 2026 is a market where the bifurcation story is intact but narrowing. Small-bay and flex remain landlord markets; bulk distribution has stopped getting softer. Institutional capital re-entered the trade in Q3 — the earliest signal that the cycle bottom for cap rates may already be behind us. Owners who read the metro-level average as the whole story continue to miss the submarket-level nuance that decides which deals actually work.",
      "This is the analysis CRECO does for clients quarterly across the four metros. If you'd like a more specific read on your submarket or your asset, the initial conversation is no-cost — we tell you what the data says and where the leverage sits, and we'd love to engage if there's a transaction in your future.",
    ],
  },

  {
    slug: 'q3-2026-texas-retail-market-report',
    title: 'Q3 2026 Texas Retail Market Report',
    metaTitle: 'Q3 2026 Texas Retail Market Report | Shop Rents, Cap Rates, Anchor Tenants | CRECO',
    metaDescription:
      "CRECO's Q3 2026 quarterly market report for Texas retail real estate — strip center, power center, single-tenant NNN cap rates and rents by metro, anchor leasing trends, and the deals that closed across San Antonio, Austin, DFW, and Houston.",
    keywords: [
      'texas retail market report q3 2026',
      'texas retail rents 2026',
      'strip center cap rates texas',
      'single tenant nnn texas',
      'texas anchor tenant leasing',
      'san antonio retail market',
      'dfw retail market',
      'austin retail market',
      'houston retail vacancy',
    ],
    excerpt:
      "Texas retail keeps quietly outperforming — vacancy hit a 25-year low, rent push accelerated in Q3, and the new-supply pipeline is the thinnest since the 1990s. Where the pricing power is, and where soft pockets still remain.",
    audience: 'Investor',
    pageCount: 13,
    readingMinutes: 16,
    outcomes: [
      'Q3 2026 shop and anchor rents by submarket — primary vs secondary vs tertiary',
      'Cap rate evidence from Q3 2026 retail trades — single-tenant NNN, strip, power center',
      'Anchor tenant expansion plans and category strength heading into 2027',
      'Vacancy by category — grocery-anchored, power center, lifestyle, inline',
      'Where the rent-push window is now realistically open — and where it isn\'t',
    ],
    teaser: [
      "Texas retail delivered its strongest quarter of the cycle in Q3 2026. Statewide vacancy fell to 4.4% — the lowest reading since data collection standardized in the late 1990s — and asking rents on grocery-anchored shop space finally pushed through the range where they've been stuck since 2024. Restaurant space is functionally sold out in primary growth submarkets, second-generation endcaps are trading at multiple-bid asking rents, and the new-construction pipeline remains the thinnest of any Texas CRE asset class.",
      "The consensus narrative on retail (\"structurally challenged, headed for slow decline\") has not survived contact with the Texas market. What we're actually seeing on the ground: HEB, Aldi, Cava, Dutch Bros, and a lengthening list of expansion-mode tenants are competing for the same limited-supply endcap and shop space, and the landlords who bought retail at 8%+ caps two years ago are printing significant NOI growth on renewals.",
      "This report walks through Q3 2026 rent, cap rate, vacancy, and tenant demand data across the four major Texas metros, with commentary on what's actually closing — and where the value-add plays still live.",
    ],
    sections: [
      {
        heading: 'Executive summary — Q3 2026 retail in five numbers',
        paragraphs: [
          "The story below is the strongest retail print we've seen in Texas since we started publishing this report. It's not one metric — the whole picture reads together.",
        ],
        bullets: [
          'Statewide retail vacancy: 4.4% (down 20 bps QoQ, down 50 bps YoY) — the tightest reading in 25+ years',
          'New retail construction starts: 5.6M SF YTD across Texas — tracking to lowest full-year total since 1998',
          'Average asking rent for grocery-anchored shop space: $33.60/SF NNN primary, $25.40/SF secondary — up 3-4% QoQ',
          'Single-tenant NNN cap rates (investment-grade credit, 10-15 yr WALT): 5.3%-6.2% (10-20 bps tighter QoQ)',
          'Strip center cap rates (multi-tenant, grocery or power anchored, primary submarket): 6.1%-7.2% (10 bps tighter at tight end)',
        ],
      },
      {
        heading: 'Rents and demand by category',
        paragraphs: [
          "Grocery-anchored centers are the strongest retail product in Texas and the segment where landlords pushed rents most aggressively in Q3. HEB-anchored shop rents in growth submarkets pushed through $36-38/SF NNN on new leases — a level that would have seemed aspirational two years ago. Kroger-, Aldi-, and Walmart Neighborhood Market-anchored centers moved similarly, 10-15% behind HEB pricing but with meaningful catch-up in the quarter.",
          "Restaurant space is the tightest sub-category, full stop. Second-generation endcap space with existing hood, grease, and patio is trading at $46-58/SF NNN in primary submarkets — a 5-10% jump from Q2 asking rents. The wave of fast-casual expansion (Cava, Sweetgreen, Chipotle new-format, Salata) plus drive-thru coffee (Dutch Bros, Black Rock, Scooter's, 7 Brew) has functionally exhausted available primary-market endcaps in Q3.",
          "Power center anchor space (big-box 20K-40K SF) remained the area of relative weakness but improved incrementally. A handful of former bankrupt-box locations backfilled in Q3 (Hobby Lobby, Burlington, Ross, and a Marshalls conversion) — a healthier pace than the year prior. Landlord capex to subdivide remains the fastest path to backfill.",
        ],
        bullets: [
          'San Antonio NW grocery-anchored shop space: $34-38/SF NNN, vacancy 2.6%',
          'Austin Domain inline retail: $50-68/SF NNN, vacancy 2.8%',
          'DFW Frisco/Plano power center anchors: $15-20/SF NNN, vacancy 7.8%',
          'Houston Heights endcap restaurant space: $48-58/SF NNN, functionally sold out',
          'Hill Country small-format retail (Boerne, Fair Oaks, Bulverde): $26-34/SF NNN, vacancy 3.8%',
          'DFW Prosper / Celina growth-corridor shops: $30-36/SF NNN, pre-leasing before delivery',
          'Fort Worth 7th Street inline: $36-46/SF NNN, vacancy 3.6%',
        ],
      },
      {
        heading: 'Cap rates — what actually traded',
        paragraphs: [
          "Single-tenant NNN with investment-grade credit compressed 10-20 bps in Q3 as 1031 demand intensified. The tightest deals of the quarter — long-WALT drug store and QSR trades in primary submarkets — traded in the 5.3-5.5% range. Product with 12+ years of WALT and rent escalators traded at the tight end; sub-7-year WALT still traded 100-150 bps wider.",
          "Multi-tenant strip centers traded actively. Grocery-anchored in primary submarkets: 6.1-6.9%. Power-anchored with strong WALT: 6.6-7.4%. Unanchored inline in primary submarkets: 7.2-8.2%. The bid-ask spread that lingered on centers with anchor rollover risk narrowed meaningfully in Q3 — buyers underwrote the re-leasing risk against a tighter market and paid up.",
          "Deal volume is up roughly 20% YoY on the multi-tenant retail side. Private buyers remain the dominant force; institutional core capital is starting to return to grocery-anchored specifically. Family offices continue to be selective but active.",
        ],
      },
      {
        heading: 'Anchor tenant expansion — who\'s growing',
        paragraphs: [
          "Category strength in Q3 tracks close to Q2 but with a few notable shifts. Fast-casual restaurant expansion cooled slightly from the peak pace of 2025 — Cava and Sweetgreen slowed new-store guidance for 2027 modestly. Drive-thru coffee accelerated. Discount grocery (Aldi in particular) accelerated. Medical retail (urgent care, dental service organizations, ophthalmology) continues aggressive expansion.",
          "Categories still net-contracting: mid-tier department stores, traditional big-box electronics, full-service casual dining, and traditional fitness. This list is largely unchanged from Q2 — but the individual store-count declines are shallow enough that the retail supply picture isn't disrupted meaningfully.",
        ],
        bullets: [
          'HEB: 14+ new Texas locations announced 2026-27, expansion-heavy in SA, Austin, Hill Country, and DFW north',
          'Aldi: 20+ new Texas locations, primarily second-tier submarkets — accelerated from Q2 guidance',
          'Cava: 25+ new Texas locations still on the plan though 2027 pace slightly moderated',
          'Dutch Bros, Black Rock, Scooter\'s, 7 Brew: aggressive drive-thru coffee expansion across all four metros',
          'Discount apparel and home (Burlington, Ross, TJ Maxx, Five Below): steady 3-5 stores per banner per quarter',
          'Medical retail (urgent care, DSOs, imaging centers): 60+ new Texas locations across all major operators',
        ],
      },
      {
        heading: 'Metro-by-metro commentary',
        paragraphs: [
          "**San Antonio** retail is performing exceptionally — vacancy at 4.0% is the tightest in the state, construction pipeline is minimal, and the Hill Country gateway corridor (Fair Oaks, Boerne, Bulverde, Stone Oak) continues to be the standout submarket. HEB's 2026-27 pipeline is heavily weighted to SA metro; the ripple effect on shop-space rents in HEB-anchored centers is meaningful.",
          "**Austin** retail continues to be the most expensive in the state. The Domain, South Congress, East Austin, and Mueller submarkets command premium rents; suburbs (Pflugerville, Round Rock, Cedar Park, Leander) are the strongest new-store absorption story. The move-out risk from cost-of-living-driven population churn that concerned some operators has not materialized in the numbers — traffic counts and per-store sales are up YoY at most operators.",
          "**DFW** retail is the most diverse story. North Dallas (Frisco, Plano, Allen, Prosper) is fully tight — Prosper and Celina in particular are absorbing new retail as fast as it delivers. Fort Worth improved further in Q3 and is now competing with north Dallas on shop rents for the first time. South Dallas and Mesquite remain the softest DFW submarkets but are stable.",
          "**Houston** retail is fully recovered from the 2017-2020 oil-cycle softness. Inner Loop neighborhoods (Heights, Montrose, Rice Village, Memorial) are functionally full. Galleria-area is at its tightest since 2013. Energy corridor and Westchase are balanced. Katy suburbs remain strong absorption stories. Cinco Ranch and Sugar Land Center pre-leasing on new deliveries is running at 70-80%.",
        ],
      },
      {
        heading: 'What we\'re telling clients',
        paragraphs: [
          "For retail landlords: the rent-push window is now, and it's real. Tenant demand for quality space is the strongest since 2017-2018, supply additions are minimal, and tenants signing 5-year deals at Q3 2026 rents will look like bargains by 2028-29. Push rents, push CPI escalators, push expense recovery. The market supports it — and Q3 confirmed that pushing has actually worked.",
          "For retail tenants: this is the tightest market you have seen in a decade. If you need space in a primary growth submarket, plan 12-18 months ahead — pipeline is empty and speculation is minimal. Second-generation space is dramatically more valuable than shell space and worth paying up for. Make decisions early; the cost of delay compounds quickly.",
          "For retail investors: single-tenant NNN at 5.3-6.2% caps is fully priced and only makes sense for 1031 buyers needing income immediately. The interesting plays continue to be: value-add multi-tenant strip (acquire below replacement, re-tenant weak inline, market in 36 months at re-stabilized NOI), grocery-anchored development sites in growth submarkets, and short-WALT centers in primary submarkets where the re-leasing risk is real but the rent-reset opportunity is now demonstrably capturable.",
          "For developers: 2027 is the earliest realistic year that Texas retail development pencils broadly again. Exceptions in 2026: pad sites in established centers (where land basis is absorbed), small-format build-to-suit for credit tenants on long leases, and grocery-anchored development in genuinely undersupplied growth corridors (Hill Country gateway, north DFW growth-belt, west Houston, north Austin). Inline speculative development still doesn't work at current rents and construction costs.",
        ],
      },
    ],
    conclusion: [
      "Texas retail in Q3 2026 is a market that continues to defy the broader CRE narrative. Fundamentals are exceptional, tenant demand is deep and diversified, and the supply pipeline is thinner than at any point in the 25 years we have data for. The question for most owners and investors isn't whether Texas retail is healthy; it's how to participate without overpaying for the obvious deals.",
      "CRECO has been deep in Texas retail leasing and investment sales for years. If you'd like a more specific read on a submarket or an asset, we'd love to engage. There's no charge for the initial conversation, and most of our retail clients started exactly that way.",
    ],
  },

  {
    slug: 'q3-2026-texas-office-market-report',
    title: 'Q3 2026 Texas Office Market Report',
    metaTitle: 'Q3 2026 Texas Office Market Report | Office Rents, Cap Rates, Sublease | CRECO',
    metaDescription:
      "CRECO's Q3 2026 quarterly market report for Texas office — Class A and B rents, sublease inventory, cap rate spreads, conversion economics, and the segments of office that are actually leasing well.",
    keywords: [
      'texas office market report q3 2026',
      'texas office vacancy 2026',
      'office cap rates texas',
      'texas sublease office',
      'office conversion texas',
      'class a office rents texas',
      'austin office market',
      'dfw office market',
      'houston office market',
    ],
    excerpt:
      "Texas office in Q3 2026 — trophy Class A vacancy tightened again, sublease inventory declined for the seventh consecutive quarter, and office-to-residential conversions finally started breaking ground at scale. Where the bright spots are and where the pain persists.",
    audience: 'Investor',
    pageCount: 13,
    readingMinutes: 16,
    outcomes: [
      'Q3 2026 Class A vs Class B office rents by metro and submarket',
      'Cap rate evidence — the still-widening spread between trophy and commodity office',
      'Sublease inventory trends and what the seven-quarter decline signals',
      'Office-to-residential and office-to-medical conversion economics with 2026 project examples',
      'Where the remaining office bright spots are — and where the avoidance zones remain',
    ],
    teaser: [
      "Texas office at the end of Q3 2026 continues the pattern we've been flagging all year: trophy is quietly getting better, commodity is quietly getting worse, and the blended metrics obscure how divergent those two markets have become. Statewide office vacancy improved for the third straight quarter to 21.4% — but that number contains trophy Class A vacancy near 8% in Austin and Class C vacancy above 36% in commodity submarkets.",
      "Sublease inventory declined for the seventh consecutive quarter to 26.9M SF — down from a mid-2024 peak of ~34M SF. Trophy Class A sublease has largely cleared; Class B/C sublease remains stubbornly elevated. The message is consistent: the flight to quality has stopped being a story and has become the market structure.",
      "This report walks through Q3 2026 office metro-by-metro, with cap rate evidence from closed trades, sublease data, and CRECO's commentary on where the real opportunities exist — both for tenants seeking upgrade deals and for investors making non-consensus long-hold bets.",
    ],
    sections: [
      {
        heading: 'Executive summary — Q3 2026 office in five numbers',
        paragraphs: [
          "Texas office headline numbers keep improving. The improvement is not evenly distributed. Read these five as the top-line snapshot; the sections below unpack where the improvement is real and where it is a statistical artifact of trophy improvement dragging the blended average down.",
        ],
        bullets: [
          'Statewide office vacancy: 21.4% (down 40 bps QoQ, third consecutive quarterly improvement)',
          'Trophy Class A vacancy in primary submarkets: 7-11% (down ~100 bps QoQ)',
          'Class B office vacancy in primary submarkets: 22-27% (essentially flat QoQ)',
          'Texas office sublease inventory: 26.9M SF — down 1.5M SF QoQ, seventh straight quarterly decline',
          'Cap rate spread between trophy Class A and Class B: ~275 bps (widened 25 bps QoQ)',
        ],
      },
      {
        heading: 'Rents by class and submarket',
        paragraphs: [
          "Trophy Class A rents pushed higher again in Q3. Austin Domain, Houston Galleria, Dallas Uptown, Frisco's Star District, and select downtown submarkets all saw asking rents up 1-3% QoQ, and effective rents (net of concessions) held or improved. Tenants relocating from Class B+/A- product into trophy Class A continued to pay premium — the flight-to-quality trade remains the dominant office-leasing story.",
          "Class B rents are flat to modestly weaker. Effective rents are still under pressure through elevated concessions — 12-18 months abatement and $80-120/SF TI remain the standard on new 7-10 year deals. Face rents have largely held; the gap between face and effective rent is now the widest we've measured.",
          "Class C is the structurally challenged segment. Q3 saw the first concentrated wave of Class C dispositions of the cycle — several downtown Class C buildings in Houston, Dallas, and San Antonio sold to conversion-play buyers at sub-$70/SF. Class C rents are less meaningful than the transaction basis for these buildings; the operating question is whether they get demolished, converted, or slowly wound down.",
        ],
        bullets: [
          'Austin Domain trophy Class A: $60-72/SF gross, vacancy 7.8%',
          'Houston Galleria trophy Class A: $46-56/SF gross, vacancy 10.4%',
          'Dallas Uptown trophy Class A: $50-60/SF gross, vacancy 8.8%',
          'Frisco Star trophy Class A: $54-62/SF gross, vacancy 8.6%',
          'San Antonio NW Class A: $32-38/SF gross, vacancy 18.0%',
          'DFW commodity Class B: $24-30/SF asking, $18-24/SF effective, vacancy 27%+',
          'Houston Energy Corridor Class B: $22-28/SF asking, $16-22/SF effective, vacancy 29%+',
        ],
      },
      {
        heading: 'Cap rates and capital markets',
        paragraphs: [
          "Texas office cap rates continued to bifurcate in Q3. Trophy Class A in primary submarkets — newly built, fully leased to credit tenants — traded at 7.2-8.2% (10-20 bps tighter QoQ). That's still wider than 2019 but continues to compress toward historical norms as the trophy story becomes consensus.",
          "Class B office widened further. Well-occupied Class B in stable submarkets traded at 9.2-10.8% in Q3, and Class B with meaningful vacancy or near-term rollover traded at 11-15% cap rates on in-place income. Several Class B trades closed at sub-$95/SF, and a handful of conversion-play trades closed at sub-$70/SF where the value was in the land and structure, not the office use.",
          "Institutional core capital selectively returned to trophy office in Q3 — a shift from Q2 when they were still holdouts. Family offices and HNW buyers with patient capital continued to buy distressed Class B. Distressed-debt funds bought active portfolios of office mortgages from banks that needed to clear inventory.",
        ],
      },
      {
        heading: 'Sublease — the seventh quarterly decline',
        paragraphs: [
          "Texas office sublease inventory peaked at ~34M SF in mid-2024 and has now declined for seven straight quarters. Q3 2026 reading of 26.9M SF represents ~21% total reduction from peak. The decline continues to be driven by lease expirations, not sublease leasing activity — sublease terms roll off, space converts back to direct, and much of it backfills with new direct tenants.",
          "Trophy Class A sublease has largely cleared — most trophy sublease inventory has already re-absorbed. Class B and C sublease is where the remaining inventory sits, and it will burn off through natural lease expirations over the next 24-36 months. Investors underwriting a bulk-office recovery should note: the sublease decline is a mechanical wind-down of a specific vintage of tenant give-back, not evidence of new office demand strengthening broadly.",
        ],
      },
      {
        heading: 'Office conversion — the projects that broke ground in Q3',
        paragraphs: [
          "Office-to-residential conversion transitioned from concept to construction at meaningful scale in Q3 2026. Six Texas conversion projects broke ground in the quarter — the largest single-quarter total we've tracked. Three in downtown Dallas, two in downtown Houston, one in downtown San Antonio. Total conversion pipeline in Texas is now ~4.5M SF across roughly 20 announced projects.",
          "The economics work in narrow circumstances: floor plates 12K-22K SF (or larger with light-well retrofit), walkable / transit-adjacent location, acquisition basis sub-$120/SF (many recent conversion acquisitions closed sub-$90/SF), a market with genuine residential demand, and — critically — cost-share or property tax abatement from the municipality. Dallas and Houston have both leaned into abatement programs; San Antonio's 2026 program helped unlock the Alamo Plaza conversion.",
          "Medical office conversion is quieter but consistent. Class B office in medical-adjacent submarkets (near hospitals, ambulatory surgery centers, or high-density residential) continues to be a viable use-conversion. Several 2025 conversion projects delivered in Q3 with pre-lease over 60%.",
        ],
      },
      {
        heading: 'Metro-by-metro commentary',
        paragraphs: [
          "**Austin** is the strongest Texas office market and by Q3 the trophy segment is arguably tight. Trophy Class A vacancy sub-8%, tech-tenant return-to-office fully honored, and Domain/East Austin/Downtown corridor commanding premium rents. Suburban Austin office (Round Rock, Cedar Park) remains soft but stable. Class B in the Austin submarket is challenged but has a clearer post-2028 recovery narrative than any other metro.",
          "**Houston** office polarization continues. Galleria and downtown trophy improved further in Q3; energy corridor Class B remains the softest large office submarket in Texas. Energy-tenant footprint rationalization has largely completed — the sector is now a source of stable demand at reduced-per-tenant footprints rather than a source of ongoing giveback.",
          "**Dallas** trophy submarkets (Uptown, Preston Center, Frisco Star) continue to improve. Suburban commodity office (Las Colinas, Plano Class B, Richardson) remains the challenging story. Fort Worth trophy has quietly become one of the strongest sub-narratives in Texas office — new deliveries in Fort Worth are pre-leasing at 50-70%.",
          "**San Antonio** office remains structurally smaller and less competitive than the other three metros. NW corridor has the most demand; downtown has significant Class B/C inventory that will only clear through conversion, demolition, or long-cycle attrition. The Q3 downtown conversion project starting construction is a genuinely positive signal for the medium term.",
        ],
      },
      {
        heading: 'What we\'re telling clients',
        paragraphs: [
          "For office tenants: 2026 remains an exceptional window for Class B tenants to upgrade to trophy Class A. Concessions on trophy remain elevated by historical standards, and the economics of moving from Class B+ to trophy can be margin-neutral over a 10-year hold once you factor in productivity, retention, and amenity benefits. If your lease ends in 2027-28, start exploring in Q4.",
          "For office tenants staying in Class B: leverage remains very much yours. 12-18 months abatement, $80-120/SF TI, 5-7 year terms with 3% caps, expansion rights, and full assignment are achievable in most Texas commodity Class B submarkets. Don't sign renewals at face rates without serious negotiation.",
          "For office owners: if you own trophy Class A in a primary submarket, the value trajectory has turned decisively positive. Cap rates compressed in Q3, rents pushed, and tenant demand is real. Don't oversell into a still-thin investor pool — hold and compound. If you own commodity Class B/C, your decision matrix is hold-and-modernize, attempt-conversion, or accept-disposition-at-replacement-discount. The wrong answer is still to do nothing.",
          "For office investors: trophy Class A at 7.2-8.2% caps with creditworthy tenants and 8+ year WALT is now demonstrably compressing and defensible as a 5-7 year long-hold. Distressed Class B at sub-$95/SF in walkable submarkets with eventual conversion optionality is still the most asymmetric opportunity in Texas CRE — and the Q3 conversion-project groundbreakings validate the thesis. Both trades are becoming less non-consensus; the window narrows from here.",
        ],
      },
    ],
    conclusion: [
      "Texas office is not one market and probably never will be again. The trophy-commodity divide widened further in Q3, and the conversion economics that were theoretical in early 2026 are actually breaking ground now. Owners, tenants, and investors who internalize the bifurcation continue to make better decisions than those still pricing the asset class as a single segment.",
      "If you're considering an office transaction — leasing, sale, repositioning, or acquisition — CRECO is happy to walk through the specifics. We've stayed actively involved in Texas office through every phase of this cycle and have a clear view of who's transacting and where the realistic deal terms live.",
    ],
  },

  {
    slug: 'q3-2026-texas-investment-outlook-report',
    title: 'Q3 2026 Texas CRE Investment Outlook',
    metaTitle: 'Q3 2026 Texas Commercial Real Estate Investment Outlook | CRECO',
    metaDescription:
      "CRECO's Q3 2026 cross-asset investment outlook for Texas commercial real estate — where capital is actually deploying, current cap rate spreads, deal flow commentary, 1031 demand, and our high-conviction calls across industrial, retail, office, multifamily, and land.",
    keywords: [
      'texas commercial real estate investment q3 2026',
      'texas cre cap rates 2026',
      'texas commercial real estate outlook',
      '1031 exchange texas 2026',
      'texas cre capital markets',
      'texas commercial real estate forecast',
      'texas real estate investment trends',
    ],
    excerpt:
      "A cross-asset investment outlook for Texas CRE — where capital is actually deploying in Q3 2026, current cap rates and deal dynamics, 1031 pressure, institutional core capital's return, and CRECO's high-conviction calls by asset class heading into 2027.",
    audience: 'Investor',
    pageCount: 15,
    readingMinutes: 18,
    outcomes: [
      'Q3 2026 cap rate ranges across industrial, retail, office, multifamily, and land',
      'Where capital is genuinely deploying vs where the market is talking but not transacting',
      '1031 buyer behavior and the persistent supply / demand imbalance for replacement properties',
      'High-conviction calls by asset class heading into 2027',
      'The Texas-specific demographic and economic context that should inform a 5-10 year underwriting view',
    ],
    teaser: [
      "Texas commercial real estate in Q3 2026 is the most transactable it's been since 2021. Deal volume is up meaningfully across every asset class, the bid-ask spread that paralyzed 2023-2024 has narrowed to essentially nothing on most stabilized product, and institutional core capital selectively returned to the market in the quarter. Cap rates compressed at the tight end of industrial and retail; the trophy-office trade began to firm.",
      "What's different in Q3 versus the run-up of 2018-2021: the cheap-money lift is still gone and unlikely to return. Returns come from operational alpha, asset selection, and disciplined underwriting — not from cap-rate compression. The buyers who won in the last cycle are not always the buyers winning now, and the funds that built playbooks around 2021 assumptions have mostly been quiet.",
      "This outlook walks through where Texas CRE capital is actually deploying in Q3 2026 — by asset class, by buyer type, by submarket — and CRECO's high-conviction calls for owners and investors positioning into 2027. It's the same view we share with our institutional and private investor relationships on quarterly outlook calls.",
    ],
    sections: [
      {
        heading: 'The macro setup for Texas CRE into 2027',
        paragraphs: [
          "Texas continues to outpace national CRE on demographic and economic fundamentals. Statewide population growth was 1.4% in 2025 and looks similar YTD 2026 — roughly 3x the national average. Major-metro employment growth is 2.0-2.2% in 2026. Texas remains the #1 state for corporate relocations, the #1 state for new business formation, and the #2 state by total GDP.",
          "These tailwinds matter for a 5-10 year CRE hold. At moderated growth rates, Texas metros still add new residents and businesses faster than CRE supply can respond — and the supply response has decelerated further across most asset classes. Submarkets that look fully priced in 2026 may look like bargains by 2030.",
          "The risks: interest rates remain elevated relative to the 2010s, construction costs are 30%+ above 2019 baseline, certain sectors (commodity office, oversupplied bulk industrial) still face genuine cyclical or structural headwinds, and expectations of 2027 rate cuts are pushing some capital to sit on the sidelines. The macro tailwinds don't make every asset class attractive — they make Texas a structurally favorable backdrop for disciplined acquisitions.",
        ],
      },
      {
        heading: 'Cross-asset cap rate landscape — Q3 2026',
        paragraphs: [
          "Texas cap rates continue to stabilize with modest compression at the tight end of each range. Industrial and retail moved tighter in Q3; office trophy moved tighter while office Class B moved slightly wider; multifamily was flat. The ranges below represent stabilized assets in primary Texas submarkets with reasonable WALT and conventional financing — value-add and short-WALT pricing extends 100-300 bps wider.",
        ],
        bullets: [
          'Industrial — stabilized, primary submarket: 6.2%-7.3% trophy (10-20 bps tighter QoQ), 7.4%-8.4% Class B (flat)',
          'Retail — single-tenant NNN credit: 5.3%-6.2% (10-20 bps tighter QoQ); multi-tenant strip primary: 6.1%-7.2% (10 bps tighter)',
          'Office — trophy Class A primary: 7.2%-8.2% (10-20 bps tighter QoQ); Class B primary: 9.2%-10.8% (10-30 bps wider); Class C: 11-15%+',
          'Multifamily — stabilized core: 5.4%-6.4% (flat); value-add: 6.4%-7.4% (flat)',
          'Self-storage — stabilized: 5.8%-6.8% (flat)',
          'Medical office — stabilized: 6.4%-7.4% (flat)',
          'Land — yields deal-specific; entitlement-rich land in growth submarkets remains the most-bid product',
        ],
      },
      {
        heading: 'Who\'s actually buying in Q3 2026',
        paragraphs: [
          "**1031 exchange buyers** remain the dominant private capital force in Texas CRE. They drive demand at the tight end of the cap rate range for any product with credit, WALT, and NNN structure. 1031 demand intensified further in Q3 as long-held Texas real estate continued to enter the disposition pool — boomer-aged owner sales are running at multi-year highs. The DST product market grew ~15% YoY as replacement-property scarcity forced 1031 buyers into fractionalized options.",
          "**Family offices and HNW buyers** were the most consistently active discretionary capital in Q3. Family office buying continues to favor 7-8%+ cap rate product with operational story — value-add multifamily, multi-tenant strip retail, small-bay industrial, and select distressed office. These buyers can be patient and disciplined; they are also the most willing to underwrite the 3-5 year recovery in office and bulk industrial that institutional core hasn't yet.",
          "**Institutional core capital** re-entered selectively in Q3. Insurance companies, pension funds, and core open-end funds closed two large trophy-industrial portfolios and one grocery-anchored retail portfolio in the quarter — the first meaningful institutional deployment in Texas CRE since mid-2023. The criteria remain tight: trophy quality, primary submarkets, credit tenants, sub-8-year WALT preferred.",
          "**Opportunistic and value-add funds** stayed active in Class B office, value-add industrial, and bridge-distressed multifamily. 5-7 year holds with stabilization business plans; underwriting to 14-18% net IRRs. The strategies that work best target genuine operational alpha — re-tenanting, capex-led rent push, expense optimization — not cap-rate compression bets.",
          "**Owner-users** continue to acquire industrial and flex product, particularly small-bay (10K-40K SF) in growth submarkets. SBA financing remains available with reasonable terms. Owner-user pricing pushed higher in Q3 as small-bay supply tightened.",
        ],
      },
      {
        heading: '1031 demand and replacement-property supply',
        paragraphs: [
          "The 1031 dynamic in Texas continues to support cap rate compression at the tight end of every asset class, and Q3 saw it intensify. Owner exits — particularly long-held single-tenant industrial, retail centers, and small-bay industrial — created the largest quarterly volume of disposition-side inventory of the year, and 1031 buyer demand absorbed it at essentially full pricing.",
          "Available product matching 1031 buyer criteria (long WALT, NNN, credit tenant, manageable basis) remains structurally undersupplied. Deal count in the sub-$5M single-tenant NNN category ran at multi-year highs, but replacement-property inventory relative to demand remained tight.",
          "What this means for sellers: if your asset matches the 1031 buyer profile — long lease, credit or near-credit tenant, NNN structure, primary submarket — you have access to a buyer pool with structural disposal pressure on their side. Market specifically to this pool and you can capture cap rates at the tight end of your asset class range. This has never been more true than in Q3 2026.",
          "What this means for 1031 buyers: continue to be prepared for compromise. The textbook 1031 candidate property (long WALT, top-tier credit, primary submarket, sub-6% cap) is dramatically harder to source than the demand implies. Have a Plan B ready — DST options, fractional ownership, secondary-submarket equivalents — before your 45-day clock starts.",
        ],
      },
      {
        heading: 'High-conviction calls by asset class heading into 2027',
        paragraphs: [
          "**Industrial — high-conviction buy: small-bay infill in growth submarkets.** Supply pipeline has collapsed further, demand remains structural, cap rates compressed slightly in Q3 as institutional capital returned. Small-bay in the San Antonio NW/NE corridor, the East Austin / Northeast Austin corridor, the inner-loop DFW small-bay submarkets, and Houston northwest and Ship Channel adjacent remain our highest-conviction submarket calls.",
          "**Industrial — high-conviction buy: distressed bulk in primary submarkets.** Q3 confirmed that the bulk-distribution cycle bottom has passed for pricing. Class A bulk in primary submarkets bought below replacement cost at 8.0%+ caps remains one of the most asymmetric trades in Texas CRE. The window is narrower than it was in Q1-Q2; execute if your capital is ready.",
          "**Retail — high-conviction buy: grocery-anchored strip in growth submarkets.** Tenant demand is exceptional, supply additions are minimal, the rent push is now demonstrably capturable. Sub-7% cap rates are full pricing but defensible given the trajectory. 7%+ caps on quality grocery-anchored in primary submarkets are increasingly rare — buy them when they're available.",
          "**Retail — selective buy: value-add strip with weak inline tenancy.** Multi-tenant strip in primary submarkets with under-market rents and replaceable inline tenants offers genuine operational alpha — re-tenant, push rent, exit at compressed cap. Requires real operational involvement. 2026-27 is the window; by 2028 the value creation opportunity narrows meaningfully.",
          "**Office — non-consensus selective buy: distressed Class B in walkable submarkets with conversion optionality.** Sub-$95/SF basis on Class B in submarkets where conversion economics are now demonstrably working (downtown Dallas, downtown Houston, downtown San Antonio select buildings, inner-loop Fort Worth) remains the most asymmetric long-hold Texas play. Q3 groundbreakings validate the thesis. Requires long horizon and willingness to absorb negative cash flow for 24-48 months.",
          "**Office — high-conviction buy (new for Q3): trophy Class A in primary submarkets.** Q3 compression confirms trophy office has passed its cycle bottom. Trophy Class A at 7.2-8.2% caps with creditworthy tenants and 8+ year WALT is a compelling 5-7 year long-hold with meaningful compression upside as institutional core capital continues to return.",
          "**Office — avoid: commodity Class B/C in suburban submarkets.** No path to recovery, no realistic conversion optionality, structural headwinds intact. Even at deep discounts to replacement cost, these remain liquidity traps rather than opportunities.",
          "**Multifamily — selective buy: value-add 80s-90s vintage in growth submarkets.** Stabilized core multifamily is fully priced at sub-6% caps. Value-add 80s-90s product, well-located in growth submarkets, bought at 7%+ caps with credible operational lift, offers some of the most reliable 14-16% IRR returns in Texas CRE. Deal flow in this segment picked up meaningfully in Q3 as more owners came off the sidelines.",
          "**Land — selective buy: entitlement-rich land in growth-corridor paths.** Texas continues to suburbanize. Land in the growth path of any major Texas metro (north DFW, west Houston, north and west San Antonio, east and north Austin, Hill Country corridor) with reasonable entitlements and a 5-10 year horizon remains compelling. Skip raw unentitled land unless you have the patience and capital to drive entitlements yourself.",
        ],
      },
      {
        heading: 'The mistakes we see investors making in Q3 2026',
        paragraphs: [
          "Mistake 1: waiting for 2027 rate cuts before deploying. The most-cited reason capital has stayed sidelined in Q3 is anticipated rate relief in 2027. This is a bad bet on two levels: cap rates in Texas have already re-priced to reflect the higher-for-longer regime, and if rate cuts do materialize they'll compress cap rates further — which raises the price of the assets you're waiting to buy. Investors who deployed in Q1-Q3 2026 got in ahead of that compression.",
          "Mistake 2: anchoring on 2021 cap rates. The cheap-money cycle is over. Underwriting that requires further cap-rate compression to hit return targets is unrealistic. Underwriting that earns returns through NOI growth and operational alpha is the right approach.",
          "Mistake 3: avoiding the soft spots. The most attractive Texas CRE returns in 2026-27 continue to come from asset classes and submarkets that look unattractive today — distressed Class B office, value-add bulk industrial, weak-inline strip retail. The consensus avoidance is exactly what creates the asymmetry.",
          "Mistake 4: 1031 panic decisions. Buyers entering 45-day identification windows without a Plan B make bad acquisitions. The discipline: have a Plan B (DST, lower-quality property at conservative basis, or partial taxable disposition) before the 45-day clock starts.",
          "Mistake 5: underwriting Texas as a uniform market. Texas metros are increasingly divergent. The submarket-level read is what matters; the metro-level read is dangerously incomplete.",
          "Mistake 6: ignoring operational discipline. In a world where pure cap-rate compression isn't the primary return source, operational discipline — leasing velocity, expense control, capex timing, tenant retention — drives outperformance.",
        ],
      },
    ],
    conclusion: [
      "Texas CRE in Q3 2026 is fundamentally a story of disciplined asset selection in a structurally attractive macro backdrop, with the additional Q3 development that institutional core capital has selectively returned to the market. The pure cap-rate trade is gone. What's left is what professional real estate has always been about: the right asset at the right basis, operated well, held long enough for fundamentals to compound. Texas remains the best macro environment in the country for that approach.",
      "CRECO's investor relationships span 1031 buyers, family offices, institutional acquirers, and value-add operators across the four major Texas metros. If you'd like to talk through deployment strategy for the balance of 2026 and 2027 — whether that's identifying replacement properties for a 1031, sourcing value-add product in a specific submarket, or building a Texas portfolio from scratch — we'd love to engage. The initial conversation is no-cost.",
    ],
  },

  {
    slug: 'q2-2026-texas-industrial-market-report',
    title: 'Q2 2026 Texas Industrial Market Report',
    metaTitle: 'Q2 2026 Texas Industrial Market Report | Warehouse & Flex Cap Rates, Rents | CRECO',
    metaDescription:
      "CRECO's Q2 2026 quarterly market report for Texas industrial real estate — warehouse and flex rents by submarket, cap rate trends, absorption, vacancy, construction pipeline, and the deals actually closing across San Antonio, Austin, Dallas-Fort Worth, and Houston.",
    keywords: [
      'texas industrial market report 2026',
      'texas warehouse rents 2026',
      'industrial cap rates texas',
      'texas industrial vacancy',
      'san antonio industrial market',
      'dfw industrial market',
      'houston industrial market',
      'austin flex space',
      'texas industrial absorption',
    ],
    excerpt:
      "CRECO's quarterly read on Texas industrial — warehouse and flex rents, cap rates, vacancy, and the absorption story across the four major metros. Where the market is tight, where it's softening, and what's actually closing in Q2 2026.",
    audience: 'Investor',
    pageCount: 14,
    readingMinutes: 17,
    outcomes: [
      'Current rents by submarket — small-bay warehouse, large distribution, and flex',
      'Cap rate evidence from Q2 2026 closed transactions across the four metros',
      'Vacancy and absorption data, with commentary on what it means for pricing',
      'Construction pipeline by metro — where new supply is about to land, where it isn\'t',
      'A practical view of where owners and tenants have the leverage right now',
    ],
    teaser: [
      "Texas industrial entered 2026 in the longest absorption cycle in state history — and Q2 results confirm that cycle is decelerating but not breaking. Net absorption across the four major metros came in positive but soft, vacancy ticked up modestly, and the deals that are closing are increasingly bifurcated: trophy infill sub-100K SF blocks are still tight, while bulk distribution in outlying submarkets is the loosest it's been in five years.",
      "This report walks through the rent, cap rate, vacancy, and absorption numbers metro-by-metro, with commentary on the deals CRECO has been in the room for this quarter. It's the same view we share with our institutional and private investor clients on quarterly calls.",
      "Headline reads: small-bay warehouse remains a landlord market in primary infill submarkets; bulk distribution has flipped to a tenant market in outlying submarkets; flex with quality office buildout is the most-sought product across all four metros.",
    ],
    sections: [
      {
        heading: 'Executive summary — Q2 2026 in five numbers',
        paragraphs: [
          "Texas industrial fundamentals at the end of Q2 2026 are best described as bifurcated. Trophy small-bay and infill product remains tight; bulk and outlying product is soft and softening. The blended numbers obscure the divergence — read them at the submarket level, not the metro level.",
        ],
        bullets: [
          'Statewide industrial vacancy: 7.4% (up 60 bps YoY) — but range across submarkets is 3.2% to 14.8%',
          'YoY net absorption: positive 38M SF across the four metros, down from 52M SF in 2025',
          'Average asking rent for small-bay warehouse (20K-60K SF): $11.40/SF NNN in primary submarkets, $9.20/SF in secondary',
          'Average asking rent for bulk distribution (200K+ SF): $6.80/SF NNN, down from $7.20/SF a year ago',
          'Cap rates on stabilized Class A industrial: 6.5%-7.5% in primary, 7.5%-8.5% in secondary, with bid-ask spread still wider than 2024 levels',
        ],
      },
      {
        heading: 'Rents by submarket and product type',
        paragraphs: [
          "Small-bay warehouse (20K-60K SF) remains the strongest segment. Tenants in this size range — distributors, e-commerce 3PLs, building products, food service supply — are still expansion-mode. Asking rents in primary infill submarkets are flat to up 2-3% YoY, and concessions remain limited.",
          "Bulk distribution (200K+ SF) is the weakest segment. Speculative bulk delivered in 2024-25 is still absorbing slowly; outlying submarkets where most of that supply landed are seeing 8-15% effective rent reductions through generous TI and abatement packages.",
          "Flex with office buildout is the sleeper segment. Tenants need clean, modern flex (15-40% office) and are willing to pay above small-bay rates for it. Supply is genuinely tight — most existing flex was built in the 90s and shows it.",
        ],
        bullets: [
          'San Antonio NW small-bay: $11.50-$12.50/SF NNN, vacancy 4.8%',
          'New Braunfels / Schertz mid-size (60K-150K SF): $9.20-$10.20/SF NNN, vacancy 6.2%',
          'DFW Alliance bulk (200K+ SF): $6.40-$7.40/SF NNN, vacancy 11.4%',
          'Houston Northwest bulk: $6.20-$7.00/SF NNN, vacancy 13.6%',
          'Austin Northeast flex: $14.80-$17.20/SF NNN (premium for office buildout), vacancy 5.4%',
          'San Antonio Southside large warehouse (100K-200K SF): $7.80-$8.80/SF NNN, vacancy 8.4%',
        ],
      },
      {
        heading: 'Cap rates — what actually traded in Q2 2026',
        paragraphs: [
          "Texas industrial cap rate data is noisy because of the bifurcation. Reported metro-average cap rates around 7.2% obscure the spread: stabilized trophy traded at 6.4-6.8%, second-tier stabilized traded at 7.4-8.0%, and value-add or short-WALT trades pushed into 8.5-9.5% range.",
          "The closed-transaction story this quarter: institutional buyers came back into Texas industrial after sitting on the sidelines for two quarters. Several large portfolio trades closed in DFW and Houston, with cap rate evidence on the tighter end. Private buyers remained selective — most of the private-buyer cap rate evidence was for sub-$10M trades in secondary submarkets.",
        ],
        bullets: [
          'Single-tenant NNN industrial, long WALT, primary submarket: 6.4-6.8%',
          'Multi-tenant small-bay portfolio, primary submarket: 6.8-7.4%',
          'Multi-tenant industrial, secondary submarket: 7.4-8.2%',
          'Value-add / short-WALT industrial: 8.4-9.4%',
          'Land at industrial sites with entitlements: yielding ~5.5-7.0% on pro forma cap rate (cap rate methodology not really applicable — comps and replacement cost dominate)',
        ],
      },
      {
        heading: 'Absorption and the construction pipeline',
        paragraphs: [
          "Net absorption across the four metros came in at positive 9.2M SF in Q2 2026 — meaningful, but the lowest quarterly absorption since 2020. That's not a panic number; it's a deceleration from a multi-year high.",
          "The construction pipeline tells the more important story. New starts have collapsed from the 2022-23 peak. DFW under-construction industrial is down 60% from 2023 peak. Houston is down 55%. San Antonio is down 40%. Austin started fewer than 2M SF in Q2 — the lowest quarter since 2018.",
          "What this means: the current soft patch in bulk distribution is supply-driven, not demand-driven. With the construction pipeline collapsing, the absorption curve catches up to supply by mid-to-late 2027. Owners willing to underwrite that re-tightening can buy 2026 vintage product at a discount to where it will sell in 2028.",
        ],
      },
      {
        heading: 'Metro-by-metro commentary',
        paragraphs: [
          "**San Antonio** is the most balanced of the four metros. Vacancy is below the state average (6.4%), absorption is positive, and the construction pipeline is modest. The small-bay segment, particularly NW and NE, is genuinely tight. The Southside corridor (large distribution near 410/I-37) has more supply but reasonable absorption. Hill Country submarkets — Boerne, Fair Oaks, Schertz — see steady demand for owner-user product.",
          "**Austin** is the most landlord-friendly metro for industrial right now. Construction starts have collapsed, demand remains strong from tech-adjacent operations and e-commerce, and the East Austin / Northeast corridor is genuinely tight. Flex with office buildout in Austin commands premium rents — $15-17+/SF NNN.",
          "**DFW** is the most fragmented story. Alliance and South Dallas are heavily oversupplied with bulk product; the I-30/Mesquite corridor is balanced; the I-635 inner-loop submarkets are tight on small-bay. Treat DFW as five micro-markets, not one.",
          "**Houston** is the softest metro for bulk distribution and the strongest for energy-corridor flex. Ship Channel industrial remains exceptional — tied to petrochemical and import volumes that don't soften with rate cycles. Outlying north and northwest submarkets have the most supply and the longest lease-up timelines.",
        ],
      },
      {
        heading: 'What we\'re telling clients',
        paragraphs: [
          "For tenants: this is the best window to push aggressive terms on bulk distribution since 2019. Landlords are still in denial about reduced effective rents — push for 8-12 months abatement on bulk deals, full TI fund on draws not completion, and CPI-capped renewal language. The narrow window is small-bay and flex — landlords there have leverage and aren't compromising.",
          "For owners with bulk product: don't sell into this soft patch unless you have to. The pipeline collapse means 2027-28 rents and cap rates should be meaningfully better than current. If you need liquidity, prefer refinance over sale. If you must sell, market specifically to long-hold institutional capital that can underwrite the re-tightening — not to short-hold opportunistic buyers expecting a quick exit.",
          "For owners with small-bay: this is the moment to optimize NOI and consider disposition. Cap rates on quality small-bay portfolios remain compressed, buyer demand from 1031 and private investors is strong, and the supply pipeline isn't going to flood your submarket the way it flooded bulk. Selling small-bay into 2026 cap rates may be selling at peak.",
          "For investors with capital deploying now: trophy small-bay infill at sub-7% caps is fully priced. Value-add bulk in primary submarkets, bought below replacement cost from owners who need liquidity, at 8.5%+ caps with conservative re-leasing pro forma — that's the most interesting play in the state right now.",
        ],
      },
    ],
    conclusion: [
      "Texas industrial in Q2 2026 is not a single market. It's two markets moving in opposite directions, blended into a metro-level average that obscures the real opportunity. Owners and tenants who understand the bifurcation are positioned to either capture the tight end or exploit the soft end. Owners and tenants who read the metro average and react to that are likely to get the strategy wrong.",
      "This is the analysis CRECO does for clients quarterly across the four metros. If you'd like a more specific read on your submarket or your asset, the conversation is no-cost — we tell you what the data says, and we'd love to engage if there's a transaction in your future.",
    ],
  },

  {
    slug: 'q2-2026-texas-retail-market-report',
    title: 'Q2 2026 Texas Retail Market Report',
    metaTitle: 'Q2 2026 Texas Retail Market Report | Shop Rents, Cap Rates, Anchor Tenants | CRECO',
    metaDescription:
      "CRECO's Q2 2026 quarterly market report for Texas retail real estate — strip center, power center, single-tenant NNN cap rates and rents by metro, anchor leasing trends, and the deals that closed across San Antonio, Austin, DFW, and Houston.",
    keywords: [
      'texas retail market report 2026',
      'texas retail rents 2026',
      'strip center cap rates texas',
      'single tenant nnn texas',
      'texas anchor tenant leasing',
      'san antonio retail market',
      'dfw retail market',
      'austin retail market',
      'houston retail vacancy',
    ],
    excerpt:
      "Retail across Texas remains the strongest fundamentals story in commercial real estate — low vacancy, positive absorption, and rents that have held through every other CRE softening. Q2 2026 numbers, deal flow, and what we're telling investor clients.",
    audience: 'Investor',
    pageCount: 13,
    readingMinutes: 16,
    outcomes: [
      'Shop space and anchor rents by submarket — primary vs secondary vs tertiary',
      'Cap rate evidence from Q2 2026 retail trades — single-tenant NNN, strip, power center',
      'Anchor tenant expansion plans and what category strength looks like in 2026',
      'Vacancy by category — grocery-anchored, power center, lifestyle, inline',
      'Where Texas retail is genuinely tight and where the soft pockets remain',
    ],
    teaser: [
      "Texas retail has quietly become the most fundamentally healthy commercial real estate segment in the state. Statewide retail vacancy is at 4.6% — the lowest since the early 2000s — and the new-supply pipeline is the thinnest in 25 years. Grocery-anchored centers are full, second-generation restaurant space gets multiple offers, and quality strip centers in growth submarkets are trading at sub-7% caps to private buyers who can't find better income product.",
      "The story isn't uniform. Class C inline space in tertiary submarkets continues to struggle. Big-box vacancy from 2020-2022 tenant losses hasn't fully recovered. And new retail development is muted because rents can't yet justify replacement-cost construction in most submarkets.",
      "This report walks through Q2 2026 rent, cap rate, vacancy, and tenant demand data across the four major Texas metros, with commentary on what's actually closing — and where the value-add plays live.",
    ],
    sections: [
      {
        heading: 'Executive summary — Q2 2026 retail in five numbers',
        paragraphs: [
          "Texas retail's headline metrics tell a coherent story for the first time in several years — and it's a positive one. Below are the five numbers that anchor the rest of this report.",
        ],
        bullets: [
          'Statewide retail vacancy: 4.6% (down 30 bps YoY) — the tightest reading in 25+ years',
          'New retail construction starts: 3.8M SF YTD across Texas — the lowest year-over-year volume since 1998',
          'Average asking rent for grocery-anchored shop space: $32.40/SF NNN in primary submarkets, $24.60/SF in secondary',
          'Single-tenant NNN cap rates (investment-grade credit, 10-15 yr WALT): 5.4%-6.4%',
          'Strip center cap rates (multi-tenant, grocery or power anchored, primary submarket): 6.2%-7.4%',
        ],
      },
      {
        heading: 'Rents and demand by category',
        paragraphs: [
          "Grocery-anchored centers are the strongest retail product in Texas — full, no concessions, multiple-bid leasing on shop space. HEB-anchored centers in growth submarkets command shop rents 15-25% above market average. Kroger, Walmart Neighborhood Market, and Aldi anchored centers follow closely.",
          "Restaurant space — especially second-generation with existing hood, grease, and patio — is the tightest sub-category. Tenants like Torchy's, Chick-fil-A, Cava, and the wave of fast-casual concepts are paying $40-50+/SF NNN for quality endcaps in primary submarkets, with 24-month build-out timelines compressed to 4-6 months.",
          "Power center anchor space (big-box 20K-40K SF) is the area of weakness. Backfilling former bankrupt boxes (Bed Bath & Beyond, Tuesday Morning, etc.) has been slow. Successful backfills usually involve subdividing into 2-4 smaller boxes — expensive landlord capex, but the only way to get the space leased.",
        ],
        bullets: [
          'San Antonio NW grocery-anchored shop space: $32-36/SF NNN, vacancy 2.8%',
          'Austin Domain inline retail: $48-65/SF NNN, vacancy 3.2%',
          'DFW Frisco/Plano power center anchors: $14-18/SF NNN, vacancy 8.4%',
          'Houston Heights endcap restaurant space: $44-52/SF NNN, multiple-bid market',
          'Hill Country small-format retail (Boerne, Fair Oaks): $24-32/SF NNN, vacancy 4.4%',
        ],
      },
      {
        heading: 'Cap rates — what actually traded',
        paragraphs: [
          "Single-tenant NNN with investment-grade credit traded in the 5.4-6.4% range in Q2 2026 — flat from late 2025. The product is well-bid by 1031 buyers, who continue to dominate this end of the market. Properties with 12+ years of WALT and rent escalators trade at the tight end; properties with under 7 years WALT trade 100-150 bps wider.",
          "Multi-tenant strip centers traded in a wider range. Grocery-anchored in primary submarkets: 6.2-7.0%. Power-anchored with strong WALT: 6.8-7.6%. Unanchored / inline in primary submarkets: 7.4-8.4%. Centers with anchor rollover risk in the next 24-36 months traded 100+ bps wider as buyers underwrote re-leasing risk.",
          "The bid-ask spread that defined retail trading in 2023-24 has narrowed. Sellers no longer expect 2021 cap rates, and buyers have accepted that 2020-era cheap money isn't coming back. Deal volume is up YoY, primarily on the private-buyer side.",
        ],
      },
      {
        heading: 'Anchor tenant expansion — who\'s growing',
        paragraphs: [
          "Several categories are in active Texas expansion mode in 2026. Grocery (HEB, Aldi, regional independents), discount apparel (Burlington, Ross, TJ Maxx), off-price home goods (HomeGoods, Five Below), fast-casual restaurants (Cava, Chipotle, Sweetgreen, Cava, Salata), drive-thru coffee (Dutch Bros, Black Rock, Scooter's), and medical retail (urgent care, dental, ophthalmology) lead the list.",
          "Several categories are net-contracting. Mid-tier department stores (Macy's, Nordstrom Rack underperforming locations), big-box electronics (Best Buy footprint compression), traditional fitness (Gold's, LA Fitness), and full-service casual dining are all closing more than they're opening in Texas in 2026.",
        ],
        bullets: [
          'HEB: 12+ new Texas locations announced for 2026-27, expansion-heavy in San Antonio, Austin, and Hill Country',
          'Aldi: 15+ new Texas locations, primarily second-tier submarkets',
          'Cava: 25+ new Texas locations including DFW and Houston expansion',
          'Crumbl, Sweetgreen, Dutch Bros: aggressive expansion across all four metros',
          'Discount apparel and home: steady 3-5 stores per banner per quarter',
        ],
      },
      {
        heading: 'Metro-by-metro commentary',
        paragraphs: [
          "**San Antonio** retail is performing exceptionally — vacancy is 4.2% (below the state average), construction pipeline is tight, and growth submarkets (NW, NE, far W, Bulverde/Stone Oak) continue to absorb new product faster than it can be built. The Hill Country gateway corridor (Fair Oaks, Boerne) is a structurally undersupplied retail submarket and rents reflect that.",
          "**Austin** retail is the most expensive in the state by a meaningful margin. The Domain, South Congress, East Austin, and Mueller submarkets all command premium rents. The story has shifted from explosive growth (2018-2022) to disciplined expansion as the cost-of-living headwinds have moderated some tenant demand. Suburbs (Pflugerville, Round Rock, Cedar Park) remain the strongest absorption story.",
          "**DFW** retail is the most diverse story. North Dallas (Frisco, Plano, Allen) is a tight, high-rent market. South Dallas and Mesquite are the softest. Inner-loop neighborhoods (Bishop Arts, Deep Ellum, Lower Greenville) command premium rents for character retail. Fort Worth is the strongest under-the-radar story — strong absorption, tight vacancy, and rents that have caught up to Dallas comparables.",
          "**Houston** retail has fully recovered from the 2017-2020 oil-cycle softness. Inner Loop neighborhoods (Heights, Montrose, Rice Village, Memorial) are tight. Galleria-area retail is competitive but tighter than at any point since 2014. Energy corridor and Westchase are balanced. Outer-loop and Katy submarkets still have isolated soft pockets but absorption has been positive for six consecutive quarters.",
        ],
      },
      {
        heading: 'What we\'re telling clients',
        paragraphs: [
          "For retail landlords: the rent push window is now. Tenant demand for quality space is the strongest it's been in 8+ years, supply additions are minimal, and tenants signing 5-year deals at 2026 rents will look like bargains by 2028-29. Push rents, push CPI escalators, push expense recovery. The market supports it.",
          "For retail tenants: this is the tightest market you've seen. If you need space in a primary growth submarket, plan 12+ months ahead. Second-generation space (existing tenant improvements you can use) is dramatically more valuable than shell space. Make decisions early; the cost of delay is real.",
          "For retail investors: single-tenant NNN at 6%+ caps is fully priced and only makes sense if you need the income immediately (1031 buyers). The interesting plays are: value-add multi-tenant strip (acquire below replacement, re-tenant the weak tenants, market in 36 months at re-stabilized NOI), grocery-anchored development sites in growth submarkets, and short-WALT centers in primary submarkets where the re-leasing risk is real but the rent reset opportunity is substantial.",
          "For developers: most submarkets still don't pencil for new construction at current rents and construction costs. The exceptions are pad sites in established centers (where land cost is already absorbed), small-format build-to-suit for credit tenants on long leases, and grocery-anchored development in genuinely undersupplied growth corridors (Hill Country, far north DFW, west Houston). Speculative inline retail development is mostly a 2027-28 story.",
        ],
      },
    ],
    conclusion: [
      "Texas retail is in a moment that the broader CRE narrative — \"retail is in trouble, retail is dying\" — hasn't caught up to. The fundamentals are exceptional, the supply pipeline is empty, tenant demand is real. The question for most owners and investors isn't whether Texas retail is healthy; it's how to participate without overpaying for the obvious deals.",
      "CRECO has been deep in Texas retail leasing and investment sales for years. If you'd like a more specific read on a submarket or an asset, we'd love to engage. There's no charge for the initial conversation, and most of our retail clients started exactly that way.",
    ],
  },

  {
    slug: 'q2-2026-texas-office-market-report',
    title: 'Q2 2026 Texas Office Market Report',
    metaTitle: 'Q2 2026 Texas Office Market Report | Office Rents, Cap Rates, Sublease | CRECO',
    metaDescription:
      "CRECO's Q2 2026 quarterly market report for Texas office — Class A and B rents, sublease inventory, cap rate spreads, conversion plays, and the only segment of office that's actually leasing well.",
    keywords: [
      'texas office market report 2026',
      'texas office vacancy 2026',
      'office cap rates texas',
      'texas sublease office',
      'office conversion texas',
      'class a office rents texas',
      'austin office market',
      'dfw office market',
      'houston office market',
    ],
    excerpt:
      "Texas office in Q2 2026 — bifurcated between trophy buildings still attracting flight-to-quality demand and Class B/C buildings facing existential questions. Rents, cap rates, sublease data, and where the value plays actually exist.",
    audience: 'Investor',
    pageCount: 13,
    readingMinutes: 16,
    outcomes: [
      'Class A vs Class B office rents by metro and submarket',
      'Cap rate evidence — the widening spread between trophy and commodity office',
      'Sublease inventory trends and what it signals for direct rents',
      'Office-to-residential and office-to-medical conversion economics',
      'Where the remaining office bright spots are — and where the avoidance zones are',
    ],
    teaser: [
      "Texas office at the end of Q2 2026 is two markets that don't really overlap. Trophy Class A buildings in primary submarkets — newly built or recently renovated, full amenities, walkable, transit-adjacent — are leasing at premium rents with limited concessions. Class B and C buildings in the same submarkets are competing with deep concessions, struggling to backfill tenant losses, and trading at cap rates that would have seemed impossible in 2019.",
      "The blended Texas office vacancy number (~22%) doesn't tell that story. Trophy Class A vacancy is closer to 9%. Class B is 24%. Class C is 35%+. Direct-vs-sublease inventory tells the same story — sublease is increasingly concentrated in older buildings, and direct vacancy in trophy buildings keeps coming down.",
      "This report walks through the bifurcated office picture metro-by-metro, with cap rate evidence from Q2 2026 closed trades, sublease data, and CRECO's commentary on where the genuine opportunities exist — both for tenants seeking deals and for investors willing to make non-consensus bets.",
    ],
    sections: [
      {
        heading: 'Executive summary — Q2 2026 office in five numbers',
        paragraphs: [
          "The headline office statistics for Q2 2026 mask the bifurcation that defines the segment today. Read these five numbers as a top-line snapshot — the rest of the report unpacks the divergence.",
        ],
        bullets: [
          'Statewide office vacancy: 21.8% (down 40 bps YoY for first sustained improvement since 2019)',
          'Trophy Class A vacancy in primary submarkets: 8-12%',
          'Class B office vacancy in primary submarkets: 22-28%',
          'Texas office sublease inventory: 28.4M SF — down from 34M SF peak in mid-2024',
          'Cap rate spread between trophy Class A and Class B: ~250 bps (widest in modern Texas office market history)',
        ],
      },
      {
        heading: 'Rents by class and submarket',
        paragraphs: [
          "Trophy Class A rents are not just holding — they're up modestly. Austin Domain, Houston Galleria, Dallas Uptown, Frisco's Star District, and similar premier submarkets are seeing direct asking rents up 3-5% YoY for the newest, most amenitized buildings. Tenants relocating from Class B+/A- buildings into newly delivered trophy Class A are paying meaningful premiums for the upgrade.",
          "Class B rents are still under pressure but have stabilized. Effective rents (after concessions including TI, abatement, and parking) are flat to down 2-4% YoY. Asking rents are technically higher but the gap between asking and effective has widened to historic levels — landlords give 12+ months abatement and $80+/SF TI to maintain face rents.",
          "Class C is the structurally challenged segment. Many Class C buildings in primary submarkets are functionally obsolete — they can't compete with trophy on amenities and can't compete with newer Class B on infrastructure. The most realistic path for many Class C assets is conversion (residential, medical, hospitality) or eventual demolition.",
        ],
        bullets: [
          'Austin Domain trophy Class A: $58-68/SF gross, vacancy 8.6%',
          'Houston Galleria trophy Class A: $44-54/SF gross, vacancy 11.2%',
          'Dallas Uptown trophy Class A: $48-58/SF gross, vacancy 9.4%',
          'San Antonio NW Class A: $32-38/SF gross, vacancy 18.4%',
          'DFW commodity Class B: $24-30/SF gross asking, $18-24/SF effective, vacancy 28%+',
          'Houston Energy Corridor Class B: $22-28/SF asking, $16-22/SF effective, vacancy 30%+',
        ],
      },
      {
        heading: 'Cap rates and capital markets',
        paragraphs: [
          "Texas office cap rates are still adjusting. Trophy Class A in primary submarkets — newly built, fully leased to credit tenants — traded at 7.4-8.4% in Q2 2026. That's wider than 2019 (when comparable product traded at 5.5-6.5%) but tighter than the 2023 distress trades.",
          "Class B office is bifurcated. Well-occupied Class B in stable submarkets traded at 9.0-10.5%. Class B with significant vacancy or near-term rollover traded at 11-14% cap rates on in-place income — and many trades closed at sub-$100/SF per square foot in 2026, well below replacement cost.",
          "The most active capital is value-add and opportunistic. Institutional core capital remains tepid on office; family offices and high-net-worth buyers with no-debt patient capital are buying Class B distressed deeply discounted, betting on long-cycle stabilization or eventual conversion plays. Distressed-debt funds are buying mortgages where banks need to clear inventory.",
        ],
      },
      {
        heading: 'Sublease — the receding tide',
        paragraphs: [
          "Texas office sublease inventory peaked at ~34M SF in mid-2024 and has steadily declined since. As of Q2 2026, the number is 28.4M SF — still elevated relative to history, but trending down. The decline is driven by lease expirations (sublease leases roll off and the space converts back to direct or backfills with new tenants), not by sublease leasing activity.",
          "What's notable: trophy Class A sublease has declined fastest. Class B and C sublease remains stubbornly high. The implication: trophy buildings are absorbing their sublease overhang; commodity buildings are not, and that's structural rather than cyclical.",
        ],
      },
      {
        heading: 'Office conversion — does it actually pencil?',
        paragraphs: [
          "Office-to-residential conversion is the most-discussed alternative for Class B/C office. It works in narrow circumstances: floor plates 12K-20K SF (smaller floor plates convert more easily into apartments with windowed bedrooms), good location (walkable, transit-adjacent), reasonable acquisition basis (sub-$120/SF), and a market that needs residential supply.",
          "Most Texas Class B office doesn't meet all four. Floor plates are typically 22K-35K SF, which require expensive light wells or interior loft floor plans. Many suburban office buildings sit in business parks that don't work for residential. Even with acquisition at sub-$100/SF, conversion costs of $150-250/SF on top mean total basis often approaches new-construction residential.",
          "The conversions that have penciled in Texas: downtown buildings in Austin, Dallas, Houston, and Fort Worth where land value alone supports the basis even before residential pro forma; medical office conversions where existing office infrastructure (HVAC, electrical, parking) maps onto medical needs with moderate retrofit cost; and hospitality conversions of select downtown towers near convention centers.",
        ],
      },
      {
        heading: 'Metro-by-metro commentary',
        paragraphs: [
          "**Austin** is the strongest Texas office market — relatively. Trophy Class A vacancy is genuinely tight, tech-tenant return-to-office mandates have been honored, and the Domain / East Austin / Downtown corridor commands premium rents. Class B vacancy is also high here, but the trophy story is real.",
          "**Houston** is the most polarized. Galleria and downtown trophy are tight; energy corridor Class B is the softest large office submarket in the state. Energy-sector tenant rationalization continues — even with oil prices supportive, the trend toward smaller footprints persists.",
          "**Dallas** has the deepest commodity Class B and C inventory and the slowest absorption. Uptown and Preston Center are healthy; suburban submarkets (Las Colinas, Plano commodity B, Richardson) remain challenging. Frisco continues to be a bright spot — trophy Class A built specifically for relocating corporate tenants.",
          "**San Antonio** office is genuinely smaller than the other three metros and traditionally less competitive. The NW corridor has the most demand; downtown has more Class B/C inventory than the city can absorb without conversion plays.",
        ],
      },
      {
        heading: 'What we\'re telling clients',
        paragraphs: [
          "For office tenants: 2026 is one of the best windows for Class B tenants seeking trophy Class A upgrade in 30 years. The economics of moving from Class B+ to trophy A — once factoring in concessions — can be margin-neutral or even margin-positive on a 10-year analysis. If your team would benefit from a trophy upgrade and you're at lease end in the next 18-30 months, start exploring now.",
          "For office tenants staying in Class B: you have leverage. 12-18 months free rent, $80-120/SF TI, and 5-7 year terms with 3% caps and full assignment rights are achievable in most Texas commodity Class B submarkets. Don't sign your renewal at face rates without a serious negotiation.",
          "For office owners: if you own trophy Class A in a primary submarket, you have one of the most resilient real assets in the state. Don't oversell into a still-thin investor pool. If you own commodity Class B/C and your basis is high relative to today's market, your decision matrix is hold-and-modernize, attempt-conversion, or accept-disposition-at-replacement-discount. The wrong answer is to do nothing and watch occupancy slowly leak.",
          "For office investors: trophy Class A at 7.5-8.5% caps with creditworthy tenants and 8+ year WALT is a defensible long-hold investment that may compress meaningfully over a 5-7 year hold. Distressed Class B at sub-$80/SF in walkable submarkets, bought with eventual conversion optionality in mind, is the most asymmetric opportunity in Texas CRE today. Both are non-consensus right now — which is exactly why the returns can be there.",
        ],
      },
    ],
    conclusion: [
      "Texas office is not one market. The trophy / commodity divide is real, durable, and probably widening. Owners, tenants, and investors who internalize that bifurcation make better decisions than those still pricing the asset class as a single segment. Most of the 2024-2025 distress in Texas office is now visible in the cap rate spread; whether the next 24-36 months bring more distress or stabilization depends almost entirely on how aggressively commodity-office owners adjust their basis expectations.",
      "If you're considering an office transaction — leasing, sale, repositioning, or acquisition — CRECO is happy to walk through the specifics. We've stayed actively involved in Texas office through every phase of this cycle and have a clear view of who's transacting and where the realistic deal terms live.",
    ],
  },

  {
    slug: 'q2-2026-texas-investment-outlook-report',
    title: 'Q2 2026 Texas CRE Investment Outlook',
    metaTitle: 'Q2 2026 Texas Commercial Real Estate Investment Outlook | CRECO',
    metaDescription:
      "CRECO's Q2 2026 cross-asset investment outlook for Texas commercial real estate — where capital is actually deploying, current cap rate spreads, deal flow commentary, 1031 demand, and our high-conviction calls across industrial, retail, office, multifamily, and land.",
    keywords: [
      'texas commercial real estate investment 2026',
      'texas cre cap rates 2026',
      'texas commercial real estate outlook',
      '1031 exchange texas 2026',
      'texas cre capital markets',
      'texas commercial real estate forecast',
      'texas real estate investment trends',
    ],
    excerpt:
      "A cross-asset investment outlook for Texas commercial real estate — where capital is actually deploying in Q2 2026, current cap rates and bid-ask dynamics, 1031 demand, and CRECO's high-conviction calls by asset class.",
    audience: 'Investor',
    pageCount: 15,
    readingMinutes: 18,
    outcomes: [
      'Current cap rate ranges across industrial, retail, office, multifamily, and land',
      'Where capital is genuinely deploying vs where the market is talking but not transacting',
      '1031 buyer behavior and the supply / demand imbalance for replacement properties',
      'High-conviction calls by asset class — what we\'d buy, hold, and sell in 2026',
      'Texas-specific demographic and economic context that should inform a 5-10 year underwriting view',
    ],
    teaser: [
      "Texas commercial real estate in Q2 2026 is more transactable than it's been since early 2022. Cap rates have largely reset, the bid-ask spread that paralyzed 2023 has narrowed, and deal volume across most asset classes is up year-over-year. The cycle isn't over — but the worst of the dislocation appears to be behind us.",
      "What's different in 2026 compared to the run-up of 2018-2021: the cheap-money lift is gone. Returns now come from operational alpha, asset selection, and disciplined underwriting — not from cap-rate compression. The buyers who win in this cycle look different from the buyers who won in the last one.",
      "This outlook walks through where Texas CRE capital is actually deploying right now — by asset class, by buyer type, by submarket — and CRECO's high-conviction calls for owners and investors planning their 2026-27 deployment. It's the same view we share with our institutional and private investor relationships on quarterly outlook calls.",
    ],
    sections: [
      {
        heading: 'The macro setup for Texas CRE in 2026',
        paragraphs: [
          "Texas continues to outpace national CRE on demographic and economic fundamentals. Statewide population growth ran 1.4% in 2025 — roughly 3x the national average. Major-metro employment growth was 2.1%, also well above national. Texas remains the #1 state for corporate relocations, the #1 state for new business formation, and the #2 state by total GDP.",
          "These tailwinds matter for a 5-10 year CRE hold. Even at moderated growth rates, Texas metros add new residents and businesses faster than CRE supply can respond. Submarkets that look fully priced in 2026 may look like bargains in 2030.",
          "The risks: interest rates remain elevated relative to the 2010s, construction costs are 30%+ higher than 2019 baseline, and certain sectors (commodity office, oversupplied bulk industrial) face genuine cyclical or structural headwinds. The macro tailwinds don't make every asset class or every submarket attractive — they make Texas a structurally favorable backdrop for disciplined acquisitions.",
        ],
      },
      {
        heading: 'Cross-asset cap rate landscape — Q2 2026',
        paragraphs: [
          "Texas cap rates have widened materially from 2021 lows but appear to have stabilized in most asset classes. The current ranges below represent stabilized assets in primary Texas submarkets with reasonable WALT and conventional financing — value-add and short-WALT pricing extends 100-300 bps wider.",
        ],
        bullets: [
          'Industrial — stabilized, primary submarket: 6.4%-7.4% trophy, 7.4%-8.4% Class B',
          'Retail — single-tenant NNN credit: 5.4%-6.4%; multi-tenant strip primary: 6.2%-7.4%',
          'Office — trophy Class A primary: 7.4%-8.4%; Class B primary: 9.0%-10.5%; Class C: 11%-14%+',
          'Multifamily — stabilized core: 5.4%-6.4%; value-add: 6.4%-7.4%',
          'Self-storage — stabilized: 5.8%-6.8%',
          'Medical office — stabilized: 6.4%-7.4%',
          'Land — yields are deal-specific; entitlement-rich land in growth submarkets is the most-bid product',
        ],
      },
      {
        heading: 'Who\'s actually buying in 2026',
        paragraphs: [
          "**1031 exchange buyers** remain the dominant private capital force in Texas CRE. They drive demand at the tight end of the cap rate range for any product with credit, WALT, and NNN structure. 1031 demand is structurally elevated because the volume of long-held Texas real estate now in disposition consideration (boomer-aged owners considering exit) creates persistent replacement-property need.",
          "**Family offices and HNW buyers** are increasingly active. With public-market alternatives offering meaningful yields, the CRE bar for institutional comparison has risen. Family office buying tends to favor 8%+ cap rate product with operational story (multi-tenant, value-add, or stable cash-flow strip retail). These buyers can be patient and disciplined — which means they're more selective than 1031 buyers but more willing to pay for quality than distress-only opportunistic capital.",
          "**Institutional core capital** is partially back after 2-3 years of restraint. Insurance companies, pension funds, and core open-end funds are deploying again, but with significantly tighter criteria — trophy quality, primary submarkets, credit tenants. They're not chasing yield down the quality curve the way they did 2018-2021.",
          "**Opportunistic and value-add funds** are the most active acquirers of Class B office, value-add industrial, and bridge-distressed multifamily. They're underwriting 5-7 year holds with stabilization business plans, expecting 14-18% IRRs net of fees. The strategies that work best target genuine operational alpha — re-tenanting, capex-led rent push, expense optimization — not pure cap-rate compression bets.",
          "**Owner-users** continue to acquire industrial and flex product, particularly small-bay (10K-40K SF) in growth submarkets. SBA financing remains available with reasonable terms, and the small-bay product owners want is generally undersupplied at current rents.",
        ],
      },
      {
        heading: '1031 demand and replacement-property supply',
        paragraphs: [
          "The 1031 dynamic in Texas continues to support cap rate compression at the tight end of every asset class. Owner exits — particularly long-held single-tenant industrial, retail centers, and multifamily — create predictable need for replacement properties. Available product matching 1031 buyer criteria (long WALT, NNN, credit tenant, manageable basis) is structurally undersupplied.",
          "What this means for sellers: if your asset matches the 1031 buyer profile — long lease, credit or near-credit tenant, NNN structure, primary submarket — you have access to a buyer pool with structural disposal pressure on their side. Market specifically to this pool and you can capture cap rates at the tight end of your asset class range.",
          "What this means for 1031 buyers: be prepared for compromise. The textbook 1031 candidate property (long WALT, top-tier credit, primary submarket, sub-7% cap) is dramatically harder to find than the funded demand implies. Have a Plan B ready — DST options, fractional ownership, secondary-submarket equivalents — before your 45-day clock starts.",
        ],
      },
      {
        heading: 'High-conviction calls by asset class',
        paragraphs: [
          "**Industrial — high-conviction buy: small-bay infill in growth submarkets.** Supply pipeline has collapsed, demand remains structural, cap rates are reasonable given the bifurcation story. Within Texas, our highest-conviction submarkets are the SA NW/NE corridor, the East Austin / Northeast Austin corridor, the inner-loop DFW small-bay submarkets, and the Houston northwest and ship-channel adjacent areas.",
          "**Industrial — selective buy: distressed bulk in primary submarkets.** Class A bulk distribution in primary submarkets bought below replacement cost at 8.5%+ cap rates is one of the most asymmetric trades in Texas CRE. The thesis: supply collapses, demand stays positive, and cap rates and rents both recover meaningfully over a 5-7 year hold.",
          "**Retail — high-conviction buy: grocery-anchored strip in growth submarkets.** Tenant demand is strong, supply additions are minimal, and the rent push window is real. Sub-7% cap rates are full pricing but defensible. 7%+ caps on quality grocery-anchored in primary submarkets are increasingly hard to find — buy them when they're available.",
          "**Retail — selective buy: value-add strip with weak inline tenancy.** Multi-tenant strip in primary submarkets with under-market rents and replaceable inline tenants offers genuine operational alpha — re-tenant, push rent, exit at compressed cap. Requires real operational involvement.",
          "**Office — non-consensus selective buy: distressed Class B in walkable submarkets.** Sub-$100/SF basis on Class B in submarkets with eventual conversion optionality (downtown San Antonio, downtown Fort Worth, inner-loop Houston, downtown Austin select buildings) is the most asymmetric long-hold Texas play. Most institutional capital won't touch it; that's exactly why the returns can be there for patient capital. Requires long horizon and willingness to absorb negative cash flow for 24-48 months.",
          "**Office — avoid: commodity Class B/C in suburban submarkets.** No path to recovery, no conversion optionality, structural headwinds intact. Even at deep discounts to replacement cost, these are typically liquidity traps rather than opportunities.",
          "**Multifamily — selective buy: value-add 80s-90s vintage in growth submarkets.** Stabilized core multifamily is fully priced at sub-6% caps. Value-add 80s-90s product, well-located in growth submarkets, bought at 7%+ caps with credible operational lift, offers some of the most reliable 14-16% IRR returns in Texas CRE.",
          "**Land — selective buy: entitlement-rich land in growth-corridor paths.** Texas continues to suburbanize. Land in the growth path of any major Texas metro (north DFW, west Houston, north and west San Antonio, east and north Austin, Hill Country corridor) with reasonable entitlements and a 5-10 year horizon remains compelling. Skip raw unentitled land unless you have the patience and capital to drive entitlements yourself.",
        ],
      },
      {
        heading: 'The mistakes we see investors making in 2026',
        paragraphs: [
          "Mistake 1: anchoring on 2021 cap rates. The cheap-money cycle is over. Underwriting that requires further cap-rate compression to hit return targets is increasingly unrealistic. Underwriting that doesn't require any compression — and earns its returns through NOI growth and operational alpha — is the right approach.",
          "Mistake 2: avoiding the soft spots. The most attractive Texas CRE returns in 2026-27 are likely to come from asset classes and submarkets that look unattractive today. Distressed Class B office, value-add bulk industrial, weak-inline strip retail. The consensus avoidance is exactly what creates the asymmetry.",
          "Mistake 3: 1031 panic decisions. Buyers entering 45-day identification windows without a Plan B make bad acquisitions — overpaying for marginal properties simply to defer tax. The discipline: have a Plan B (DST, lower-quality property at conservative basis, or partial taxable disposition) before the 45-day clock starts.",
          "Mistake 4: underwriting Texas as a uniform market. Texas metros are increasingly divergent. The submarket-level read is what matters; the metro-level read is dangerously incomplete.",
          "Mistake 5: ignoring operational discipline. In a world where pure cap-rate compression isn't the return source, operational discipline — leasing velocity, expense control, capex timing — drives returns. Owners and investors who run their assets the way the best operators do meaningfully outperform.",
        ],
      },
    ],
    conclusion: [
      "Texas CRE in 2026 is fundamentally a story of disciplined asset selection in a structurally attractive macro backdrop. The pure cap-rate trade is gone. What's left is what professional real estate has always been about: finding the right asset at the right basis, operating it well, and holding it long enough for fundamentals to compound. Texas remains the best macro environment in the country for that approach.",
      "CRECO's investor relationships span 1031 buyers, family offices, institutional acquirers, and value-add operators across the four major Texas metros. If you'd like to talk through deployment strategy for 2026-27 — whether that's identifying replacement properties for a 1031, sourcing value-add product in a specific submarket, or building a Texas portfolio from scratch — we'd love to engage. The initial conversation is no-cost.",
    ],
  },
];

export const SORTED_GUIDES = [...GUIDES];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find(g => g.slug === slug);
}
