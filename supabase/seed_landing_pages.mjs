/**
 * Seeds the landing_pages table with the current hardcoded content from each
 * landing page file. Idempotent — re-running upserts the same rows.
 *
 * Usage: node --env-file=.env.local supabase/seed_landing_pages.mjs
 */
import pg from 'pg';
const { Client } = pg;

const PAGES = [
  // ─── /texas-retail-space-for-lease ──────────────────────────────────────
  {
    slug: 'texas-retail-space-for-lease',
    title: 'Texas Retail Space for Lease',
    meta_title: 'Retail Space for Lease in Texas | CRECO',
    meta_description: 'Retail space for lease across Texas — strip centers, freestanding restaurants, urban storefronts, mixed-use, and shopping center inline space. CRECO connects retail tenants and franchisees with vetted Texas locations across San Antonio, Austin, Houston, Dallas–Fort Worth, and beyond.',
    eyebrow: 'Texas Commercial Real Estate · Retail',
    h1: 'Retail Space for Lease in Texas',
    subhead: "Strip centers, freestanding restaurants, urban storefronts, mixed-use, and shopping-center inline space — all across the major Texas markets. Whether you're a single-location operator scouting your first space or a franchise developer rolling out 20 locations, CRECO brings vetted Texas retail real estate options that match your concept, traffic counts, demographics, and budget.",
    intro_paragraphs: [],
    market_bullets: [
      { title: 'Texas retail demand is strong.', body: 'Population growth, daytime traffic, and disposable-income trends across Texas — particularly the I-35 corridor between San Antonio and Dallas — are driving sustained retail leasing activity. Vacancy rates in well-located centers remain in the single digits.' },
      { title: 'Submarket fundamentals matter more than ever.', body: 'The right retail location is determined by traffic counts, demographics, co-tenancy, and signage visibility — not just price per SF. CRECO underwrites every site against your specific concept and target customer.' },
      { title: 'Lease structures are negotiable.', body: 'Tenant improvement allowances, free rent, percentage rent, exclusivity clauses, and CAM caps all move with the right negotiator. We close the gap between asking rent and effective rent.' },
    ],
    why_bullets: [
      'Tenant-side representation — we never represent the landlord on the same deal',
      'Traffic-count, demographic, and co-tenancy analysis on every shortlist site',
      'LOI and lease negotiation focused on tenant improvement allowances, free rent, and exclusivity',
      'Buildout coordination from architect to grand opening',
      'Multi-location rollout strategy for franchisees and growing concepts',
    ],
    faqs: [
      { q: 'How much does retail space cost per square foot in Texas?', a: 'Retail rates in Texas typically range from $18 to $55 per SF per year on a triple-net (NNN) basis, depending heavily on submarket, center class, and visibility. Class A power centers in Austin or DFW can exceed $60/SF NNN; secondary submarkets and older inline space can be found at $18-25/SF NNN. Always factor in NNN charges (typically $6-12/SF) and tenant improvement allowance when comparing offers.' },
      { q: 'How long is a typical retail lease in Texas?', a: 'Initial retail leases in Texas are typically 5 to 10 years, often with renewal options. Restaurants and franchisees typically commit to longer terms (7-10 years) in exchange for buildout allowances; pop-up and short-term tenants can sometimes negotiate 1-3 year terms in soft submarkets.' },
      { q: 'What is "NNN" and how does it affect my retail rent?', a: "Triple-net (NNN) means the tenant pays a base rent plus their proportional share of the property's taxes, insurance, and common area maintenance (CAM) — typically $6-12/SF/yr in Texas centers. Always ask the landlord for the actual NNN figure (not just an estimate) and request CAM reconciliations from prior years before signing." },
      { q: 'Can CRECO help with restaurant space specifically?', a: 'Yes. Restaurant deals require special diligence — grease trap, hood ventilation, parking ratios, alcohol licensing zoning, drive-thru permitting, and patio rights all matter. We work with multiple Texas restaurant operators and franchise developers and know what to negotiate.' },
      { q: 'I have an existing Texas retail lease — can you help me renew or relocate?', a: 'Absolutely. Renewal-vs-relocation analysis is one of the highest-leverage CRECO services. We benchmark your current rent against the market, identify alternative options, and use that competitive tension to negotiate a stronger renewal — or move you somewhere better.' },
    ],
  },

  // ─── /texas-industrial-property-for-lease ──────────────────────────────
  {
    slug: 'texas-industrial-property-for-lease',
    title: 'Texas Industrial / Warehouse for Lease',
    meta_title: 'Industrial & Warehouse Property for Lease in Texas | CRECO',
    meta_description: 'Industrial property and warehouse for lease across Texas — distribution, light manufacturing, flex-industrial, last-mile logistics, and cold storage. CRECO works the I-35 corridor, Houston Ship Channel, DFW industrial submarkets, and beyond.',
    eyebrow: 'Texas Commercial Real Estate · Industrial & Warehouse',
    h1: 'Industrial & Warehouse Property for Lease in Texas',
    subhead: 'Distribution centers, light and heavy manufacturing, flex-industrial, last-mile logistics, cold storage, and bulk warehouse — across all the major Texas industrial submarkets. Whether you need 10,000 SF for a regional service business or 250,000 SF for a Texas distribution hub, CRECO brings vetted options with the right clear height, dock-door count, power, parking, and yard.',
    intro_paragraphs: [],
    market_bullets: [
      { title: 'Texas is the #1 industrial market in the U.S.', body: 'DFW, Houston, and San Antonio rank among the top 10 industrial markets nationally by absorption. The I-35 corridor between San Antonio and Dallas, the Houston Ship Channel, and the Austin/Round Rock chip-and-EV corridor are seeing record industrial demand.' },
      { title: 'Specs matter more than rent.', body: 'Two warehouses at the same $/SF rate can be wildly different deals. Clear height, dock-door ratios, trailer parking, power capacity (480V vs 277/480V three-phase), sprinkler systems (ESFR vs standard), and yard area all drive your operating cost. CRECO benchmarks every site on these specs.' },
      { title: 'Concessions are still on the table.', body: 'Even in tight markets, the right tenant — credit, term length, expansion path — can negotiate free rent, tenant improvement allowances for racking and office buildout, and rent escalators that beat market.' },
    ],
    why_bullets: [
      'Detailed property-spec underwriting (clear height, doors, power, sprinkler class, parking)',
      'Submarket comp analysis for honest rent benchmarking',
      'Free-rent and TI-allowance negotiation for racking, office, and buildout',
      'Multi-site rollout strategy for distribution and last-mile expansion',
      'Texas-wide reach: I-35, Houston Ship Channel, DFW, El Paso, Austin/Round Rock',
    ],
    faqs: [
      { q: 'What does industrial space cost per square foot in Texas?', a: 'Industrial lease rates in Texas typically range from $6 to $14 per SF per year on a triple-net (NNN) basis, depending on submarket, building class, and clear height. Older Class C distribution can be found at $5-7/SF NNN; modern Class A bulk distribution in DFW or Houston can exceed $10-12/SF NNN. Class A flex/industrial with office buildout often runs $11-18/SF NNN.' },
      { q: 'What clear height should I look for?', a: 'For typical Texas distribution, 24-32 ft clear height is standard. 18-24 ft is common in older or Class C industrial. Modern bulk distribution centers built since 2018 are often 32-40 ft clear, accommodating 5-6 levels of pallet racking. The right clear height depends on your storage profile — if you stack 4 levels of pallet racking, 24 ft is the minimum; for narrow-aisle automation, 36+ ft is preferred.' },
      { q: 'How many dock doors do I need?', a: 'A common rule of thumb is 1 dock door per 5,000-10,000 SF, but it depends on throughput. High-velocity distribution and cross-dock operations may need 1 door per 2,000-3,000 SF. Service or storage operations may only need 1 door per 15,000-20,000 SF. Always confirm whether dock doors are dock-high (typical) or grade-level (drive-in) — they serve different purposes.' },
      { q: 'Where are the best Texas industrial submarkets?', a: 'San Antonio: Northeast (I-35 corridor), Far Northwest (Loop 1604/I-10). Austin: Northeast, Round Rock, Pflugerville. Houston: Northwest (290/Beltway 8), Northeast (East Sam Houston Tollway), Southwest (290/Hwy 6). DFW: South Dallas, GSW Industrial, Alliance, Arlington, North Fort Worth, Mesquite. We work them all.' },
      { q: 'Can CRECO help with cold storage or specialized industrial?', a: 'Yes. Cold storage, food-grade, hazmat-rated, biotech/lab, manufacturing with heavy power requirements (1000+ amps), and refrigerated distribution all require specialized site selection. We have placed clients into all of these and know which Texas submarkets and buildings actually meet specs vs claim to.' },
    ],
  },

  // ─── /texas-office-space-for-lease ─────────────────────────────────────
  {
    slug: 'texas-office-space-for-lease',
    title: 'Texas Office Space for Lease',
    meta_title: 'Office Space for Lease in Texas | CRECO',
    meta_description: 'Office space for lease across Texas — Class A, B, and C, medical office, professional suites, executive office, and creative office. CRECO places companies into the right Texas office submarkets in San Antonio, Austin, Houston, and DFW.',
    eyebrow: 'Texas Commercial Real Estate · Office',
    h1: 'Office Space for Lease in Texas',
    subhead: "Class A, B, and C office, medical office, professional suites, executive office, and creative space — across San Antonio, Austin, Houston, DFW, and the rest of the Texas office market. Whether you're a 5-person startup looking for executive suites or a 200-person company anchoring a Class A floor, CRECO matches your team size, growth path, and culture to the right Texas office building.",
    intro_paragraphs: [],
    market_bullets: [
      { title: 'Texas office is bifurcating.', body: 'Class A trophy office with modern amenities is in tight supply and commanding premium rents. Class B and older Class A space is over-supplied — meaning generous concessions for the right tenant. Knowing which side of the market you want to play on is half the battle.' },
      { title: 'Submarkets vary widely.', body: 'Stone Oak is not Downtown San Antonio. The Domain is not South Congress. Galleria is not Energy Corridor. Each Texas office submarket has different rent benchmarks, parking ratios, demographics of nearby talent, and amenity profiles. We help you pick the right one.' },
      { title: 'Tenant improvement is everything.', body: 'Class A landlords routinely offer $30-80/SF in TI allowance plus free rent for the right tenant. That can fund a full custom buildout. The asking rent only tells half the story — the effective rent after concessions is the real number.' },
    ],
    why_bullets: [
      'Tenant-rep representation across San Antonio, Austin, Houston, and DFW office submarkets',
      'Class A/B/C, medical office, executive suites, and creative office expertise',
      'Effective rent analysis — comparing offers net of TI allowance, free rent, and amenities',
      'Buildout coordination from space planning to move-in',
      'Renew vs. relocate analysis to maximize leverage at lease expiration',
    ],
    faqs: [
      { q: 'What does office space cost per square foot in Texas?', a: "Office rates in Texas typically range from $20 to $55 per SF per year on a Full Service Gross basis (rent includes operating expenses). Class A trophy office in Austin's Domain or Houston's Galleria can exceed $50/SF FSG; suburban Class B office in San Antonio or Fort Worth submarkets can be found at $20-28/SF FSG. Always compare effective rent — net of free-rent months and tenant improvement allowance — not just the asking rate." },
      { q: "What's the difference between Class A, B, and C office?", a: 'Class A: newer construction (typically post-2000), high-end finishes, modern amenities (fitness, conferencing, on-site food, structured parking), prime submarkets, top rents. Class B: well-maintained older buildings (typically 1990s-2000s), functional space, reasonable amenities, good submarkets, mid-market rents. Class C: older buildings (pre-1990s), basic finishes, limited amenities, secondary submarkets, lowest rents. Class B is often the sweet spot for value.' },
      { q: 'How much parking should I expect with Texas office space?', a: 'Parking ratios are quoted per 1,000 SF leased. Suburban Texas office typically offers 4:1000 (4 spaces per 1,000 SF), which works for most companies. Urban / downtown towers often have 2-3:1000 with paid structured parking. Medical office and call centers may need 5-7:1000. Always confirm in writing — parking ratio is one of the most-disputed lease items.' },
      { q: 'Can I sublease Texas office space?', a: 'Yes — sublease can be a great way to save 20-40% off direct lease rates, especially for terms under 3 years. Texas office subleases come from companies that over-leased and need to offload space. CRECO tracks sublease availability across all Texas major markets and can shortlist sublease options alongside direct leases.' },
      { q: 'What is "Full Service Gross" vs "NNN" for office leases?', a: 'Full Service Gross (FSG) means the landlord covers operating expenses (taxes, insurance, utilities, janitorial, CAM) within the quoted rent — though tenants pay increases above a base year. NNN (less common in Class A office) means tenant pays a base rent plus their share of expenses. FSG is the dominant office structure in Texas; medical office and some industrial-flex office runs NNN.' },
    ],
  },

  // ─── /texas-commercial-property-for-sale ───────────────────────────────
  {
    slug: 'texas-commercial-property-for-sale',
    title: 'Texas Commercial Property for Sale',
    meta_title: 'Commercial Property for Sale in Texas | CRECO',
    meta_description: 'Commercial property for sale across Texas — retail centers, industrial buildings, office buildings, mixed-use, and land. CRECO advises investors and owner-users on Texas CRE acquisitions in San Antonio, Austin, Houston, DFW, and statewide.',
    eyebrow: 'Texas Commercial Real Estate · For Sale',
    h1: 'Commercial Property for Sale in Texas',
    subhead: "Retail centers, industrial buildings, office buildings, mixed-use, and commercial land — investment-grade and owner-user opportunities across the major Texas markets. Whether you're acquiring your first asset, executing a 1031 exchange, or building a multi-property Texas portfolio, CRECO underwrites every deal with institutional rigor and brings off-market opportunities our network sees first.",
    intro_paragraphs: [],
    market_bullets: [
      { title: 'Texas is in a transition cycle.', body: 'Cap rates have moved out from 2022 lows, creating buying opportunities for patient capital. Stabilized assets in the right Texas submarkets are pricing 50-150 bps wider than two years ago — meaningful entry points for investors who can hold through the next cycle.' },
      { title: 'Off-market matters.', body: "The best Texas commercial deals never hit LoopNet or CoStar. Family offices, generational owners, and institutional players move properties through broker relationships. CRECO's Texas network surfaces opportunities our clients see before the market does." },
      { title: '1031 exchanges and depreciation matter.', body: 'Smart commercial investors structure acquisitions around 1031 exchange timing, cost segregation studies, bonus depreciation, and Opportunity Zone qualification. We coordinate with your CPA and qualified intermediary to time deals correctly.' },
    ],
    why_bullets: [
      'Underwriting and pro forma modeling on every deal we bring to you',
      'Off-market deal flow through our Texas owner and broker network',
      '1031 exchange identification with up- and down-leg coordination',
      'Cost-segregation, depreciation, and Opportunity Zone strategy',
      'Owner-user and investor representation across all Texas markets',
    ],
    faqs: [
      { q: 'What cap rates can I expect for Texas commercial property?', a: "Texas cap rates vary by asset type, submarket, and tenant credit. As of recent quarters: stabilized retail typically trades at 6.5-8.5% cap; industrial at 6-7.5%; multi-tenant office at 7-9.5%; net-lease investment-grade tenants (Walgreens, McDonald's ground leases) at 5-6%. Submarket and credit risk drive significant variance — secondary submarkets and B/C tenants can push 1-2% wider." },
      { q: "What's the typical due diligence period in Texas?", a: 'Texas commercial transactions typically allow 30-60 days for inspection / due diligence after contract execution, followed by another 30-45 days to close. Diligence covers physical condition, environmental (Phase I and sometimes Phase II), title, survey, lease audit, financial verification, and zoning/entitlement confirmation. We coordinate the full diligence team — attorney, lender, environmental, surveyor, inspector.' },
      { q: 'Can CRECO help with 1031 exchanges?', a: 'Absolutely. 1031 exchanges have strict timing rules: 45 days from closing the relinquished property to identify replacement property, 180 days to close. We work in lockstep with your qualified intermediary to identify suitable Texas replacement properties (up-leg) within the 45-day window — including off-market opportunities that match your basis and DSCR requirements.' },
      { q: 'How do I evaluate a multi-tenant retail or office acquisition?', a: 'Beyond cap rate and price-per-SF: tenant credit and lease term remaining (weighted average lease term or WALT), rent rollover risk concentration, operating expense recovery (NNN vs gross leases), capital reserve requirements, market rent vs in-place rent (mark-to-market upside), and submarket vacancy trends. CRECO underwrites every shortlist deal on these factors before you spend due-diligence budget.' },
      { q: 'What about owner-user deals — buying a building for my own business?', a: 'Owner-user CRE acquisitions are often more affordable than leasing equivalent space when you factor SBA 504 financing (low down payment, long amortization), tax-deductible depreciation, and equity build-up. We help owner-users compare buy vs lease economics, secure SBA-eligible properties, and structure leases to outside tenants if you have excess space.' },
    ],
  },

  // ─── /owner-services ──────────────────────────────────────────────────
  {
    slug: 'owner-services',
    title: 'Owner Services (Multi-Property Portfolio)',
    meta_title: 'Texas Commercial Property Owner Services | Multi-Property Portfolio | CRECO',
    meta_description: 'Owner services for Texas commercial property investors with multi-property portfolios. Hold/sell analysis, repositioning strategy, 1031 exchange, tenant mix optimization, property management, and asset management — built for owners with 5 to 100+ Texas commercial properties.',
    eyebrow: 'Texas Commercial Real Estate · Owner Services',
    h1: 'Built for Texas commercial property owners with portfolios.',
    subhead: 'Hold/sell analysis. Repositioning strategy. 1031 exchange identification. Tenant mix optimization. Property management with institutional-quality reporting at boutique-firm responsiveness. CRECO is the operating partner Texas commercial property owners trust to grow NOI across portfolios of 5 to 100+ properties.',
    intro_paragraphs: [
      'When you owned one or two properties, a basic management firm was enough. But once you cross 5 — and certainly by 10 — properties, you start needing strategy, not just operations. Which assets are dragging your portfolio? When should you sell vs reposition? Where can you push rents? Are your tenants the right ones? When does a 1031 make sense?',
      "These are not questions a property manager answers. They are questions a principal-level commercial real estate firm answers — and that's what CRECO is built to be.",
      'We sit in your seat. Every quarter, we walk your full Texas portfolio and tell you: keep, reposition, or sell. We make the case with hard numbers — submarket comps, tenant credit analysis, mark-to-market upside — and we execute the recommendations through our leasing, sales, and management teams.',
    ],
    market_bullets: [],
    why_bullets: [
      'Principal-level relationship — every engagement is led by a senior CRECO broker',
      'Quarterly portfolio strategy reviews with actionable recommendations',
      'Texas-wide coverage: San Antonio, Austin, Houston, DFW, and beyond',
      'Institutional reporting (monthly financials, leasing pipeline, capex tracking)',
      'Off-market deal flow for acquisitions and 1031 up-legs',
      'Direct broker access — no junior-associate handoffs',
    ],
    faqs: [
      { q: 'How is CRECO different from a national property management firm?', a: 'National firms typically excel at managing single large institutional assets. CRECO is built for the multi-property Texas owner — entrepreneurs, family offices, and private investors with 5 to 100 commercial properties. You get principal-level attention on strategy and a tight property-management team that knows every asset, instead of being one of 10,000 buildings on a national platform.' },
      { q: 'What size portfolio does CRECO work with?', a: 'We work with Texas commercial property owners ranging from 3 properties to 75+. Our sweet spot is 10-50 property portfolios with mixed asset types (retail, industrial, office, mixed-use) where strategy across the portfolio matters as much as managing any single building. Smaller owners (1-5 properties) often engage us for advisory + leasing rather than full management.' },
      { q: 'What does CRECO charge for owner services?', a: 'Property management fees typically run 3-5% of effective gross income, depending on portfolio size and asset mix — multi-property engagements are tiered down. Leasing commissions follow market convention (typically 4-6% of total lease value, paid 50% on lease execution / 50% on tenant occupancy). Strategic advisory and acquisition / disposition is engagement-fee or success-fee based, structured per assignment.' },
      { q: 'Do you handle properties outside San Antonio?', a: 'Yes — CRECO is a Texas-wide owner services firm. We actively manage and advise on properties across San Antonio, Austin, Houston, DFW, El Paso, Corpus Christi, and the Hill Country. For owners with multi-market Texas portfolios, having one firm coordinating across all of them simplifies reporting, leasing strategy, and disposition timing.' },
      { q: 'Can I keep my existing property manager and just engage CRECO for strategy?', a: 'Absolutely. Many owners engage CRECO purely for strategic advisory — quarterly portfolio reviews, hold/sell calls on individual assets, tenant repositioning recommendations, disposition timing — while keeping their current PM in place for day-to-day operations. We work in whatever role the engagement requires.' },
      { q: 'How quickly can you take over property management for an existing portfolio?', a: 'Onboarding a new owner with an established Texas portfolio typically takes 30-60 days. We tour every asset, audit existing leases and rent rolls, transition vendor contracts, set up financial reporting in our system, and meet every tenant. The first 90 days post-onboarding includes a full portfolio review and a strategy memo recommending immediate wins.' },
    ],
  },
];

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
for (const p of PAGES) {
  await client.query(
    `insert into public.landing_pages
     (slug, title, meta_title, meta_description, eyebrow, h1, subhead,
      intro_paragraphs, market_bullets, why_bullets, faqs)
     values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb)
     on conflict (slug) do update set
       title=excluded.title, meta_title=excluded.meta_title,
       meta_description=excluded.meta_description, eyebrow=excluded.eyebrow,
       h1=excluded.h1, subhead=excluded.subhead,
       intro_paragraphs=excluded.intro_paragraphs,
       market_bullets=excluded.market_bullets,
       why_bullets=excluded.why_bullets, faqs=excluded.faqs,
       updated_at=now()`,
    [
      p.slug, p.title, p.meta_title, p.meta_description, p.eyebrow, p.h1, p.subhead,
      JSON.stringify(p.intro_paragraphs),
      JSON.stringify(p.market_bullets),
      JSON.stringify(p.why_bullets),
      JSON.stringify(p.faqs),
    ]
  );
  console.log('  ✓ ' + p.slug);
}
const { rows } = await client.query("select slug, title from public.landing_pages order by slug");
console.log('\nLanding pages in DB:');
rows.forEach(r => console.log('  - /' + r.slug + ' (' + r.title + ')'));
await client.end();
