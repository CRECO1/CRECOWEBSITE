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
];

export const SORTED_GUIDES = [...GUIDES];

export function findGuide(slug: string): Guide | undefined {
  return GUIDES.find(g => g.slug === slug);
}
