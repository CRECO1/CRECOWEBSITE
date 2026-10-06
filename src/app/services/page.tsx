import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import Link from 'next/link';
import { Briefcase, LineChart, Building2, Wrench, Layers, ArrowRight } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { InlineLeadForm } from '@/components/forms/InlineLeadForm';
import { PhoneCallText } from '@/components/marketing/PhoneCallText';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqSection } from '@/components/marketing/FaqSection';
import { BUSINESS, breadcrumbList, businessRef, webPage } from '@/lib/schema';

const SERVICES_FAQS = [
  {
    q: 'Does CRECO represent tenants or landlords?',
    a: 'Both — plus investors. CRECO is a full-service brokerage: tenant representation for businesses leasing space, landlord/owner representation for property owners leasing or selling, and investment sales for buyers and sellers of commercial property. When both parties authorize it in writing, CRECO can act as an intermediary under Texas law.',
  },
  {
    q: 'How much does tenant representation cost?',
    a: 'Typically nothing out of pocket. In Texas commercial leasing the landlord pays the brokerage commission under market convention, and that commission is usually built into the listing agreement whether or not the tenant has a broker.',
  },
  {
    q: 'What property types and markets does CRECO cover?',
    a: 'Retail (including restaurant space and pad sites), office (including medical office), industrial and warehouse, flex, land, and investment property — for lease and for sale — in San Antonio and the Texas Hill Country, including Fair Oaks Ranch, Boerne, Leon Springs, and the I-10 and I-35 corridors. If you are a tenant with a requirement elsewhere in Texas, we help there too.',
  },
  {
    q: 'Can CRECO manage my commercial property or help with a 1031 exchange?',
    a: 'Yes. CRECO provides commercial property management (operations, rent collection, CAM reconciliations, monthly reporting) and investment advisory including 1031 replacement-property identification within the 45-day window.',
  },
  {
    q: 'How do I start working with CRECO?',
    a: `Call ${BUSINESS.phoneDisplay}, email ${BUSINESS.email}, or submit the Get Started form. Our team responds personally. CRECO is licensed by the Texas Real Estate Commission, ${BUSINESS.trecLicenseDisplay}.`,
  },
];

export const metadata: Metadata = {
  title: 'San Antonio & Hill Country Commercial Real Estate Services | CRECO',
  description:
    'Tenant representation, investment advisory, leasing and sales, property management, and development from CRECO, in San Antonio and the Texas Hill Country.',
  keywords: [
    'commercial real estate services san antonio',
    'commercial real estate services texas hill country',
    'tenant representation san antonio',
    'commercial real estate services texas',
    'investment advisory commercial real estate',
    'commercial property management texas',
    'commercial real estate development texas',
    'commercial real estate broker texas',
    'CRECO services',
    'commercial real estate firm texas',
    'leasing and sales texas commercial',
  ],
  alternates: { canonical: 'https://www.crecotx.com/services' },
  // Per-page OG + Twitter overrides — root layout has decent defaults
  // but a /services-specific share card converts noticeably better in
  // social previews than the generic homepage one.
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'San Antonio & Hill Country Commercial Real Estate Services | CRECO',
    description:
      'Tenant representation, investment advisory, leasing & sales, property management, and development in San Antonio and the Texas Hill Country.',
    url: 'https://www.crecotx.com/services',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'San Antonio & Hill Country Commercial Real Estate Services | CRECO',
    description:
      'Full-service San Antonio & Hill Country CRE firm — tenant rep, investment advisory, leasing & sales, property management.',
  },
};

/**
 * SERVICES — central source of truth for service line metadata.
 * The detail pages at /services/[slug] read from this object too,
 * so adding or editing rich content here cascades to the detail page.
 */
export interface ServiceContent {
  slug: string;
  icon: any;
  title: string;
  shortDescription: string;
  /** SEO meta description for the detail page */
  metaDescription: string;
  /** Keyword tags for the detail page */
  keywords: string[];
  /** Hero subhead on the detail page */
  heroSubhead: string;
  /**
   * Optional one-line identity correction rendered directly under the hero,
   * above the intro narrative.
   *
   * Why it exists: a single-service page reads to an AI summarizer as the whole
   * firm. /services/tenant-representation was being quoted as evidence that
   * "CRECO is tenant-only" — the page never said that, but nothing on it said
   * the opposite in one liftable sentence either. This is that sentence.
   */
  positioningNote?: string;
  /** Intro narrative — 2-3 paragraphs, ~250 words */
  intro: string[];
  /** "What's included" bullet list */
  body: string[];
  /** Process or methodology — 4-step or 5-step explanation */
  process: { step: string; title: string; description: string }[];
  /** Use cases / "Who this is for" */
  useCases: { title: string; description: string }[];
  /** FAQs with FAQ schema */
  faqs: { q: string; a: string }[];
  /** Internal cross-links to related services */
  relatedSlugs: string[];
}

export const SERVICES: ServiceContent[] = [
  {
    slug: 'tenant-representation',
    icon: Briefcase,
    title: 'Tenant Representation',
    shortDescription: 'Site selection and lease negotiation for businesses leasing retail, restaurant, office, medical office, industrial, and flex space — one of CRECO\'s full-service lines alongside landlord representation and investment sales.',
    metaDescription: 'Tenant representation for retail, restaurant, office, medical, industrial, and flex tenants in San Antonio, Fair Oaks Ranch, and the Hill Country — from a full-service brokerage that also represents landlords, owners, and investors.',
    keywords: [
      'tenant representation texas',
      'commercial tenant rep texas',
      'tenant representation san antonio',
      'tenant representation austin',
      'tenant representation houston',
      'tenant representation dallas',
      'office tenant rep texas',
      'retail tenant rep texas',
      'industrial tenant rep texas',
    ],
    heroSubhead: 'Dedicated advocacy for tenants leasing retail, restaurant, office, medical, industrial, and flex space in San Antonio and the Texas Hill Country — from a full-service brokerage that also represents landlords, owners, and investors.',
    positioningNote:
      'CRECO is a full-service commercial real estate brokerage. This page covers tenant representation; CRECO also represents landlords, owners, sellers, and investors — for lease and for sale — across retail, office, industrial, flex, and land.',
    intro: [
      'Tenant representation is the most undervalued service in Texas commercial real estate. The landlord pays our commission per market convention, which means hiring CRECO as your tenant rep is typically free to your business — yet the right tenant rep can save your company $50,000 to $5,000,000 over the life of a lease through better terms, larger tenant improvement allowances, free rent, and stronger renewal language.',
      'When CRECO represents you as a tenant, our duty on that engagement is to your business. Because CRECO is a full-service brokerage — we also represent landlords, owners, and investors, and we own and lease our own centers — we know exactly how landlords underwrite a deal, and we use that to negotiate for you. If you want to see a property CRECO also represents for the owner, we disclose it up front; CRECO acts as an intermediary only if both you and the owner authorize it in writing, as Texas law requires.',
      'Our practice is centered on San Antonio and the Texas Hill Country — Fair Oaks Ranch, Boerne, Leon Springs and the I-10 corridor, Stone Oak, the Medical Center and Northwest San Antonio, and New Braunfels — and covers every property type: retail (strip centers, restaurants, freestanding), industrial (warehouse, distribution, flex), and office (Class A/B/C, medical, executive). If your requirement is elsewhere in Texas, we can help there too. Whether you are a first-time tenant looking for a single 2,500 SF office or a multi-location operator planning several units, the playbook is the same: rigorous site selection, financial benchmarking, aggressive negotiation, and clean-handoff buildout coordination.',
    ],
    body: [
      'Site selection across San Antonio and Hill Country submarkets and every property type — including off-market sublease opportunities our network sees first',
      'LOI strategy and lease negotiation focused on tenant-favorable terms (free rent, TI allowance, renewal options, exclusivity, expansion rights)',
      'Effective rent analysis comparing offers net of concessions, NNN, and amenity values',
      'Buildout coordination — architect, contractor, permitting — through tenant move-in',
      'Renewal vs. relocation analysis at lease expiration to maximize your leverage',
      'Multi-site rollout strategy for franchisees and growing concepts',
      'Sublease evaluation when direct lease isn\'t the best path',
      'Local market-rent benchmarking using current comparable transactions, not asking-rent surveys',
    ],
    process: [
      { step: '01', title: 'Discovery & Brief', description: 'We start by understanding your business — headcount, growth trajectory, work culture, customer profile, parking and access needs, technology requirements. The brief becomes the rubric we use to evaluate every site.' },
      { step: '02', title: 'Market Survey', description: 'We tour 15-30 candidate properties (depending on market and specs), narrow to a shortlist of 5-7, and provide a written comparison report — physical, financial, and locational analysis side-by-side.' },
      { step: '03', title: 'Negotiation', description: 'We draft your LOI, run multi-landlord competitive tension when possible, and negotiate the lease line-by-line. Your attorney reviews; we coordinate. The goal is the best total economic outcome, not just the lowest rent.' },
      { step: '04', title: 'Buildout & Move-In', description: 'We coordinate with your architect, GC, and IT teams. We monitor the landlord\'s delivery commitments, track the tenant improvement allowance disbursement, and sign off on the move-in checklist.' },
      { step: '05', title: 'Lifecycle Partnership', description: 'After move-in, we stay engaged. 12+ months ahead of your renewal, we re-survey the market and run a fresh renewal-vs-relocation analysis so you negotiate from leverage, not from inertia.' },
    ],
    useCases: [
      { title: 'Growing tenants', description: 'Companies hiring fast and outgrowing current space. We negotiate expansion options into your lease so growth doesn\'t mean relocation pain.' },
      { title: 'First-time leasers', description: 'Founders and small businesses signing their first commercial lease in Texas. We translate every clause and protect you from gotchas.' },
      { title: 'Multi-location rollouts', description: 'Franchisees and concept brands opening multiple locations. We standardize site criteria, lease templates, and rollout cadence.' },
      { title: 'Lease renewals', description: 'Existing tenants approaching renewal. We benchmark the market and create competitive tension to push the landlord into better terms.' },
      { title: 'Distress / restructure', description: 'Tenants needing to sublet, terminate, or restructure existing leases. We work with landlord and lender to find a path.' },
    ],
    faqs: [
      // These two lead the list deliberately. They are the questions an answer
      // engine is actually resolving when someone asks what CRECO does, and
      // FAQPage mainEntity order is read as priority. Both stay consistent with
      // the intro's conflict-of-interest passage: duty is scoped per engagement,
      // intermediary only on written consent from both sides.
      {
        q: 'Does CRECO represent landlords?',
        a: 'Yes. CRECO represents landlords and commercial property owners in San Antonio and the Texas Hill Country — listing and leasing their space, sourcing and qualifying tenants, and negotiating on the ownership side — alongside tenants, buyers, sellers, and investors. CRECO is a full-service brokerage, not a tenant-only firm; tenant representation is one service line among several, and CRECO also owns and leases its own centers. What is scoped to a single deal is the duty, not the firm: when CRECO represents you as a tenant, our duty on that engagement is to your business, and we do not also represent the landlord on that same transaction unless both parties authorize an intermediary relationship in writing.',
      },
      {
        q: 'Can CRECO represent both landlords and tenants?',
        a: 'Across its business, yes — CRECO runs landlord and owner assignments and tenant and buyer assignments at the same time. On one specific transaction, the two sides stay separate by default. If a tenant CRECO represents wants to see a property CRECO also lists for the owner, CRECO discloses that up front, and can act as an intermediary only if both the tenant and the owner authorize it in writing, as Texas law requires. That is a disclosed, mutually consented arrangement — never the default and never silent.',
      },
      {
        q: 'How much does tenant representation cost?',
        a: 'Tenant representation in Texas is typically free to the tenant. The landlord pays the tenant rep\'s commission as part of the deal — usually 4-6% of the total lease value, paid 50% on lease execution and 50% on tenant occupancy. This is market convention across virtually every Texas commercial deal. Tenants who try to "save" by going direct to landlord brokers almost always end up paying more in higher rent, smaller TI allowances, and worse renewal terms.',
      },
      {
        q: 'How is tenant representation different from a regular real estate agent?',
        a: 'Residential agents help families buy houses. Tenant reps are commercial real estate brokers who advocate for tenants in commercial leases. The skill sets, lease structures, market knowledge, and economic stakes are entirely different. CRECO is a licensed Texas commercial brokerage whose team works tenant, landlord, and investment assignments — commercial only, not residential.',
      },
      {
        q: 'Can I just respond to LoopNet listings myself?',
        a: 'You can — but you\'ll be at a disadvantage. LoopNet listings are landlord-marketed properties. The landlord\'s broker is incentivized to maximize the landlord\'s outcome, not yours. Even if you have a perfectly fair landlord broker on the other side, you won\'t see the off-market sublease, the building down the street that\'s about to lose a tenant, or the comparable that justifies your aggressive counter. Tenant reps see the full market, not just what\'s publicly listed.',
      },
      {
        q: 'How long does the tenant rep process take?',
        a: 'Typical timeline from engagement to lease execution is 60-120 days, depending on market conditions, your specs, and your decisiveness. Move-in adds another 30-90 days for buildout. Highly specific requirements (cold storage, cleanrooms, specialized restaurant) take longer. Simple flex-industrial or executive-suite leases can close in 30-45 days.',
      },
      {
        q: 'Do you only work with large tenants?',
        a: 'No. CRECO works tenant rep engagements from 1,500 SF executive suites up to 250,000 SF distribution centers. We don\'t cherry-pick by size. We do prioritize clients where we can add real value — which usually means leases worth $50K+ in total value (a typical 3-year office lease in Texas).',
      },
    ],
    relatedSlugs: ['leasing-sales', 'investment-advisory', 'property-management'],
  },
  {
    slug: 'investment-advisory',
    icon: LineChart,
    title: 'Investment Advisory',
    shortDescription: 'Underwriting, market analysis, and portfolio strategy for owners and investors in San Antonio and the Texas Hill Country.',
    metaDescription: 'Commercial real estate investment advisory in San Antonio and the Texas Hill Country. Underwriting, market analysis, portfolio strategy, and 1031 exchange guidance for owners and investors.',
    keywords: [
      'commercial real estate investment advisory texas',
      'commercial real estate investment texas',
      'cre underwriting texas',
      '1031 exchange texas',
      'opportunity zone texas',
      'commercial real estate broker opinion of value texas',
      'cre portfolio strategy texas',
      'commercial real estate investor san antonio',
    ],
    heroSubhead: 'Underwriting, market intelligence, and portfolio strategy for San Antonio and Hill Country commercial real estate investors — from first acquisition to multi-property portfolio.',
    intro: [
      'Smart Texas commercial real estate investors don\'t buy on cap rate alone. They buy on a defensible thesis built from current submarket comps, tenant credit analysis, mark-to-market upside, lease rollover risk, capex backlog, and disposition path. CRECO brings that level of underwriting rigor to every engagement, whether you are an entrepreneur evaluating your first acquisition or a family office pacing through your tenth deal.',
      'Our investment advisory practice covers every asset type in San Antonio and the Texas Hill Country. We work with private investors, family offices, real estate operators, and high-net-worth individuals deploying capital in commercial real estate here. Many of our clients have 5 to 50+ property portfolios, and we are deeply engaged in the strategic decisions that compound returns: which assets to hold, which to reposition, when to dispose, where to redeploy 1031 proceeds.',
      'We also bring deal flow. Through the San Antonio and Hill Country commercial real estate relationships our team has built — owners, brokers, attorneys, lenders, family offices, and operators — our network sees off-market acquisition opportunities that never hit LoopNet, CoStar, or Crexi, including family-office portfolio dispositions, owner-operator retirements, and quiet auction processes. When you engage CRECO as your investment advisor, you tap that network.',
    ],
    body: [
      'Acquisition underwriting and pro forma modeling on every property you evaluate',
      'Market and submarket comp analysis using current local transactions, not stale CoStar data',
      'Tenant credit and lease audit (rent roll review, mark-to-market analysis, expense recovery)',
      '1031 exchange identification within the 45-day window — including up-leg coordination',
      'Coordination with your CPA on tax-driven decisions like 1031 timing',
      'Hold/sell/reposition recommendations on existing portfolio assets',
      'Off-market deal sourcing through our San Antonio and Hill Country owner and broker network',
      'Disposition strategy: BOV, marketing, buyer targeting, negotiation to close',
    ],
    process: [
      { step: '01', title: 'Investment Thesis', description: 'We start with what you\'re trying to achieve — yield target, hold period, risk tolerance, asset-class preference, geographic preference. Without a thesis, "good deals" become noise.' },
      { step: '02', title: 'Sourcing', description: 'We surface acquisition opportunities matched to your thesis — both market listings and off-market through our local network. You see deals before they hit the broader market.' },
      { step: '03', title: 'Underwriting', description: 'For every shortlist deal, we deliver a written underwriting memo: pro forma cash flows, exit assumptions, sensitivity tables, key risks, and a buy/no-buy recommendation with reasoning.' },
      { step: '04', title: 'Diligence & Close', description: 'Once you\'re under contract, we coordinate the full diligence team: lender, attorney, environmental (Phase I/II), surveyor, inspector. We track every diligence deliverable through close.' },
      { step: '05', title: 'Asset Management', description: 'After close, we transition into ongoing asset management — quarterly portfolio reviews, lease administration, capex planning, and disposition timing analysis.' },
    ],
    useCases: [
      { title: 'First-time CRE investors', description: 'Buying your first commercial property — typically a small retail strip, office condo, or single-tenant net-lease. We\'ll underwrite the deal, walk you through risks, and structure financing.' },
      { title: 'Active investors', description: 'Family offices and real estate operators acquiring commercial properties in San Antonio and the Hill Country. We become an extension of your acquisitions team.' },
      { title: '1031 buyers', description: 'You\'ve sold a property and have 45 days to identify replacement. We move fast, surface qualified San Antonio and Hill Country options, and get you under contract.' },
      { title: 'Portfolio repositioners', description: 'You own 10+ properties and want to redeploy capital — selling underperformers, acquiring better assets, restructuring debt. We run the strategy.' },
    ],
    faqs: [
      {
        q: 'What does CRECO charge for investment advisory?',
        a: 'Acquisition advisory is typically commission-based (paid by seller per market convention) — meaning if we represent you as the buyer, you typically pay nothing direct. For more strategic engagements (portfolio strategy, hold/sell analysis, off-market sourcing retainer), we structure as either a monthly retainer or success fee, scoped per assignment. Disposition representation is standard 4-6% of sale price, market convention.',
      },
      {
        q: 'Can you help with a 1031 exchange?',
        a: 'Yes — 1031 exchanges are a core part of our investment advisory practice. The 45-day identification window and 180-day close window are tight, especially in active markets. We coordinate with your qualified intermediary (QI), CPA, and lender, surface qualified San Antonio and Hill Country replacement properties (up-leg) within the window, and execute through close.',
      },
      {
        q: 'How do you find off-market deals?',
        a: 'Through the San Antonio and Hill Country commercial real estate relationships our team has built — owners we\'ve repped, brokers we\'ve closed with, attorneys, lenders, family offices, and operators. When a private owner is ready to sell quietly, they often call us first. We don\'t guarantee off-market flow on every assignment, but it\'s a meaningful part of what we bring.',
      },
      {
        q: 'Do you help with debt placement?',
        a: 'We don\'t directly broker commercial loans, but we maintain relationships with Texas commercial lenders (banks, credit unions, life insurance companies, CMBS conduits, debt funds) and refer you to the right capital source for your deal — owner-occupied SBA, agency multifamily, balance-sheet bank, conduit CMBS, etc. We coordinate the debt placement alongside your acquisition.',
      },
      {
        q: 'What size deal do you work?',
        a: 'Investment advisory engagements range from $1M acquisitions (small retail, office condos, single-tenant net lease) up to $50M+ portfolio dispositions. Sweet spot is $3M-$30M asset values. Below $1M, the analysis costs more than the deal economics justify; above $50M we partner with national firms for institutional capital coverage when needed.',
      },
    ],
    relatedSlugs: ['leasing-sales', 'tenant-representation', 'development'],
  },
  {
    slug: 'leasing-sales',
    icon: Building2,
    title: 'Landlord Representation: Leasing & Sales',
    shortDescription: 'Landlord and owner representation — leasing and sales across retail, restaurant, office, medical, industrial, flex, and land. Marketing, negotiation, diligence to close.',
    metaDescription: 'Commercial real estate leasing and sales in San Antonio and the Texas Hill Country. Owner-side representation for retail, industrial, office, flex, and land — marketing, negotiation, and close.',
    keywords: [
      'commercial real estate leasing texas',
      'commercial real estate sales texas',
      'commercial property listing agent texas',
      'sell commercial property texas',
      'lease commercial property texas',
      'commercial real estate broker texas',
      'cre listing agent san antonio',
    ],
    heroSubhead: 'Owner-side leasing and sales across every commercial property type in San Antonio and the Texas Hill Country. Institutional-quality marketing, principal-led negotiation, and execution from listing to close.',
    intro: [
      'Listing a Texas commercial property is not "putting it on LoopNet and waiting." Done well, it\'s a coordinated marketing campaign — broker book, drone photography, custom property website, CoStar / LoopNet / Crexi syndication, direct outreach to qualified principals — combined with disciplined negotiation and diligence management. Done poorly, your property sits on the market for 12 months, signals distress, and trades at a discount.',
      'CRECO\'s leasing and sales practice handles owner-side representation across all commercial property types in San Antonio and the Hill Country: retail centers, industrial buildings, office buildings, mixed-use, flex, and land. Whether you\'re leasing up vacant space, listing a stabilized asset for sale, or testing the market — we bring institutional-quality marketing materials, target the right buyer or tenant pool, and negotiate aggressively for your outcome.',
      'Every CRECO listing is worked directly by our team — not handed off to a junior associate. You get senior-level attention from listing day through close, including weekly progress reports, real-time activity tracking, and direct availability for buyer/tenant questions.',
    ],
    body: [
      'Comprehensive marketing materials: broker book, drone photography, professional photo, custom property website, virtual tours',
      'Listing syndication: CoStar, LoopNet, Crexi, plus our local owner/broker network',
      'Direct outreach campaigns to qualified buyer/tenant pools — including principals who never search public listings',
      'Aggressive offer negotiation: multi-bid tension when possible, walk-away leverage on terms that matter',
      'Diligence coordination from contract through close (or lease execution through delivery)',
      'Quarterly tenant retention check-ins on leasing assignments to push renewal rates',
      'Listing across all commercial property types and price ranges',
    ],
    process: [
      { step: '01', title: 'Property Evaluation', description: 'We tour the asset, audit operating history, and benchmark recent comparable local transactions. We deliver a Broker Opinion of Value (BOV) and recommended price/rent strategy within 5-7 business days.' },
      { step: '02', title: 'Positioning Strategy', description: 'We craft the marketing narrative tailored to your asset and target buyer/tenant. Class B retail center messaging is different from Class A office tower messaging — we calibrate.' },
      { step: '03', title: 'Marketing Launch', description: 'Property hits the market with full materials, MLS-style syndication, and direct outreach to qualified principals. Weekly progress reports show every showing, every inquiry, every level of interest.' },
      { step: '04', title: 'Offer Negotiation', description: 'When offers come in, we tee up multi-offer competition where possible, walk you through tradeoffs (price vs. terms vs. certainty), and negotiate aggressively. Your goal — top dollar, fast close, or lowest risk — drives our strategy.' },
      { step: '05', title: 'Diligence to Close', description: 'We coordinate with your attorney, accountant, lender, and the buyer\'s diligence team. We don\'t disappear after the contract is signed — we manage every deliverable through close.' },
    ],
    useCases: [
      { title: 'Stabilized asset disposition', description: 'You own a fully leased property and want to sell. We position the cash flow story, target investor buyers, and execute on a defined timeline.' },
      { title: 'Vacant building lease-up', description: 'You own a property with significant vacancy. We design and execute a leasing campaign — direct, sublease, or hybrid — to fill the building and stabilize NOI.' },
      { title: 'Value-add disposition', description: 'You own a property with upside but want to redeploy capital. We tell the value-add story to operator buyers who can execute the business plan.' },
      { title: 'Owner-user marketing', description: 'You\'re selling a building you operated yourself. We translate the owner-user story into investor language and price aggressively.' },
    ],
    faqs: [
      {
        q: 'What\'s the typical commission for commercial real estate sales in Texas?',
        a: 'Commercial sales commissions in Texas typically run 4-6% of the sale price for the listing brokerage. The listing broker pays 50% to the cooperating buyer\'s broker (who represents the buyer). Larger deals ($10M+) often negotiate down to 3-5%. Marketing campaign costs (drone, broker book, website, professional photo) are typically included in the commission — not invoiced separately.',
      },
      {
        q: 'How long does it take to sell a Texas commercial property?',
        a: 'Marketing-to-close timelines vary by asset type and condition. Stabilized retail/industrial: 90-150 days. Class A office: 120-180 days. Value-add or specialized assets: 180-300 days. Vacant or distressed: 180-365+ days. CRECO consistently outperforms market average days-on-market by 20-30% through aggressive marketing and proactive buyer cultivation.',
      },
      {
        q: 'Can CRECO market my property "off-market" or "quietly"?',
        a: 'Yes. Confidential marketing engagements (no signs, no public listing, owner identity protected) are common for sensitive sales — divorce/estate situations, tenant-occupied with active operations, owner-user not wanting employees to know. We tap our principal network directly and negotiate without public exposure.',
      },
      {
        q: 'Do you handle ground leases or sale-leasebacks?',
        a: 'Yes. Ground lease structures (you keep the land, sell the improvements) and sale-leaseback transactions (you sell the property and lease it back as the operating tenant) are both specialty structures we handle. Each unlocks capital while preserving operational use; the right structure depends on your tax position, cap-rate sensitivity, and lender requirements.',
      },
      {
        q: 'What if my property doesn\'t sell in the listing term?',
        a: 'Our standard listing agreement is 6 months. If the property hasn\'t sold or stalled near close, we sit down with you to evaluate: was the price wrong? Marketing wrong? Market shifted? Tenant credit? We recommend a path — re-price, re-position, withdraw, or renew listing on adjusted terms — based on what the market told us.',
      },
    ],
    relatedSlugs: ['investment-advisory', 'tenant-representation', 'property-management'],
  },
  {
    slug: 'property-management',
    icon: Wrench,
    title: 'Property Management',
    shortDescription: 'Day-to-day operations and tenant relations for commercial assets — built for owners with properties in San Antonio and the Texas Hill Country.',
    metaDescription: 'Commercial property management in San Antonio and the Texas Hill Country. Operations, vendor coordination, lease administration, CAM reconciliations, and reporting.',
    keywords: [
      'commercial property management texas',
      'commercial property management san antonio',
      'commercial property management austin',
      'commercial property management houston',
      'commercial property management dallas',
      'retail property management texas',
      'industrial property management texas',
      'office property management texas',
      'cam reconciliation texas',
    ],
    heroSubhead: 'Day-to-day operations and tenant relations for commercial assets in San Antonio and the Texas Hill Country — built for owners with portfolios who need institutional-quality reporting at boutique-firm responsiveness.',
    intro: [
      'CRECO\'s property management practice is built for the multi-property commercial owner in San Antonio and the Hill Country. The big national management firms are great for institutional clients with 100+ trophy assets — but they tend to treat 5-property and 10-property owners as small accounts. Local property managers can handle one or two buildings, but typically lack the systems, reporting, and strategic capabilities a portfolio owner needs.',
      'We sit in the gap. CRECO manages portfolios from 5 to 50+ commercial properties — retail, industrial, office, flex, mixed-use — with the same operational rigor and reporting infrastructure you would expect from a national firm. Every owner relationship is handled personally by the CRECO team — people who know every asset, meet your tenants, and answer your calls directly.',
      'Our management approach is proactive, not reactive. We tour every asset on a regular cadence, meet with key tenants quarterly, track lease expirations 12-24 months ahead, and surface capex needs before they become emergencies. The goal is sustained NOI growth and tenant retention — not just keeping the lights on.',
    ],
    body: [
      'Day-to-day building operations: vendor coordination, maintenance, janitorial, landscaping, security',
      'Tenant relations and lease administration: rent collection, escalations, renewals, default management',
      'CAM reconciliations and operating expense audits',
      'Monthly financial reporting (P&L, rent roll, AR aging, leasing pipeline)',
      'Annual budget preparation with capex planning and variance reporting',
      'Capital project oversight: vendor selection, contract negotiation, progress monitoring, owner sign-off',
      'Insurance, tax appeals, and risk management coordination',
      'Lease audits to ensure tenants are paying correctly and recovering OpEx accurately',
    ],
    process: [
      { step: '01', title: 'Onboarding', description: '30-60 day onboarding for a new portfolio: tour every asset, audit existing leases and rent rolls, transition vendor contracts, set up financial reporting, and meet every tenant.' },
      { step: '02', title: 'Operating Cadence', description: 'Monthly financials by the 15th. Quarterly tenant check-ins on key leases. Annual budgets in October. Capex calendar reviewed every quarter.' },
      { step: '03', title: 'Strategic Review', description: 'Quarterly portfolio review meeting with you (the owner): NOI by asset, leasing pipeline, capex status, market trends, hold/sell recommendations.' },
      { step: '04', title: 'Continuous Improvement', description: 'We don\'t just manage — we improve. Every quarter we identify 3-5 actionable initiatives (vendor rebids, lease renegotiations, capex projects, tenant repositioning) to push NOI.' },
    ],
    useCases: [
      { title: 'Multi-property portfolios', description: 'Owners with multiple San Antonio and Hill Country properties needing one firm to coordinate operations, leasing, and strategy across all of them.' },
      { title: 'Long-distance owners', description: 'San Antonio and Hill Country property owners who live out of state — California, New York, Florida — and need on-the-ground management with weekly communication.' },
      { title: 'Family offices', description: 'Multi-generational property owners needing institutional-quality reporting with boutique-firm responsiveness for the family decision-makers.' },
      { title: 'Owner-operator hybrids', description: 'Owners who run their own business in part of the property and lease the rest to other tenants. We handle the tenant side and tie into your operations.' },
    ],
    faqs: [
      {
        q: 'What does CRECO charge for property management?',
        a: 'Property management fees in Texas typically run 3-5% of effective gross income (EGI), depending on portfolio size, asset complexity, and asset type. Multi-property engagements (5+ properties) tier down. Single-asset retail centers run higher (4-6%); large industrial buildings with simpler operations run lower (2.5-4%). Leasing commissions are separate (4-6% of total lease value, market convention).',
      },
      {
        q: 'How often do you tour the properties?',
        a: 'We tour every property under management on a regular cadence — typically weekly for retail centers, bi-weekly for office, and monthly for industrial. We also do unscheduled spot checks. Our team meets with key tenants regularly. Owners receive a monthly property condition summary alongside the financial report.',
      },
      {
        q: 'Do you handle eviction and tenant default?',
        a: 'Yes. We handle the full default lifecycle: rent demand letters, payment plan negotiations, attorney coordination for eviction proceedings, replacement tenant marketing post-vacancy. We have established relationships with Texas commercial real estate attorneys and aim to resolve defaults without eviction when possible — eviction is the most expensive outcome for both sides.',
      },
      {
        q: 'Can I use my existing accountants and lawyers?',
        a: 'Absolutely. We integrate with your existing CPA and attorney. We send monthly financial reports in your preferred format, coordinate audit support, route legal questions through your counsel, and never duplicate services you already have. We\'re an operations and strategy partner, not a one-stop shop.',
      },
      {
        q: 'What\'s the minimum portfolio size?',
        a: 'We have managed single retail centers ($1M-$5M asset value) and we\'ve managed 50+ property portfolios. Practically speaking, our value compounds with portfolio size — owners with 5+ properties get the most ROI from our strategic capabilities. Single-property owners often start with us for leasing or BOV and expand into management as portfolios grow.',
      },
    ],
    relatedSlugs: ['leasing-sales', 'investment-advisory'],
  },
  {
    slug: 'development',
    icon: Layers,
    title: 'Property Development',
    shortDescription: 'From conceptualization through completion — site selection, entitlements, and construction.',
    metaDescription: 'Commercial real estate development services in San Antonio and the Texas Hill Country. Site selection, entitlements, feasibility, design coordination, GC oversight, and lease-up.',
    keywords: [
      'commercial real estate development texas',
      'cre development san antonio',
      'commercial development austin',
      'commercial development houston',
      'commercial development dallas',
      'site selection texas',
      'commercial entitlements texas',
      'build to suit texas',
      'commercial real estate developer san antonio',
    ],
    heroSubhead: 'Concept-to-stabilization development advisory for commercial real estate in San Antonio and the Texas Hill Country. Site selection, feasibility, entitlements, design and construction coordination, and lease-up.',
    intro: [
      'Texas commercial real estate development is a long, capital-intensive game with dozens of fail points along the way: site selection mistakes, entitlement delays, construction cost overruns, leasing risk, capital stack misalignment. Most owners who attempt development without an experienced advisor learn expensive lessons.',
      'CRECO\'s development practice provides advisory and coordination services across the full development lifecycle. We work with first-time developers (often owner-operators expanding their own businesses) and sophisticated repeat developers who need expanded capacity. We are not a general contractor or design firm — we are the owner\'s advocate sitting alongside the GC, architect, lender, and city, making sure the project hits pro forma.',
      'Our development work is centered on San Antonio and the Texas Hill Country — including CRECO\'s own Elkhorn Point retail center in Fair Oaks Ranch — and spans retail, mixed-use, flex, and land. The playbook is consistent: rigorous site selection, conservative pro forma, fast entitlements, controlled construction costs, and pre-leasing to de-risk the lease-up.',
    ],
    body: [
      'Site identification and acquisition advisory in San Antonio and the Hill Country',
      'Highest and best use analysis for raw or improved land parcels',
      'Pro forma development modeling: development cost, NOI projection, exit value, IRR, equity-multiple',
      'Zoning, entitlement, and platting coordination with city planning departments',
      'Capital stack structuring: senior debt, mezzanine, equity, ground lease alternatives',
      'Architect and engineer selection and contract negotiation',
      'GC bid management and construction contract review',
      'Construction monitoring and draw oversight',
      'Lease-up campaign during construction (pre-leasing reduces risk and improves financing)',
    ],
    process: [
      { step: '01', title: 'Site & Concept', description: 'We identify candidate sites or evaluate one you already control. Highest and best use analysis. Submarket comp study to validate the concept.' },
      { step: '02', title: 'Feasibility', description: 'Detailed pro forma model: total development cost, projected stabilized NOI, exit cap rate, IRR/multiple, sensitivity tables. We build to your equity return target.' },
      { step: '03', title: 'Entitlements & Design', description: 'Coordinate zoning approvals, platting, utility commitments. Architect/engineer selection and design coordination through permit set.' },
      { step: '04', title: 'Capital & Construction', description: 'Capital stack lined up. GC bid process, contract negotiation, construction monitoring. Draw approvals and budget tracking through certificate of occupancy.' },
      { step: '05', title: 'Lease-up & Stabilization', description: 'Pre-leasing campaign starts during construction. Stabilization tracked vs pro forma. Either hold for cash flow or position for sale once stabilized — your call.' },
    ],
    useCases: [
      { title: 'Owner-user expansion', description: 'You operate a Texas business and want to develop your own building (vs continued leasing). Often eligible for SBA 504 financing.' },
      { title: 'Land you already own', description: 'You own raw or under-improved land in a San Antonio or Hill Country growth corridor and want to maximize value through development.' },
      { title: 'Build-to-suit', description: 'A specific tenant has committed to lease a custom-built building. We deliver the project to spec, on time, on budget.' },
      { title: 'Spec retail or industrial', description: 'Speculative development of retail centers or industrial buildings in growing San Antonio and Hill Country submarkets — relying on lease-up confidence to justify the build.' },
    ],
    faqs: [
      {
        q: 'How much does CRECO charge for development advisory?',
        a: 'Development advisory engagements are typically structured as a project fee (1-3% of total development cost) plus performance-based equity participation on larger projects. Smaller projects are often hourly or fixed-fee for specific deliverables (site selection, pro forma, entitlement coordination). We\'ll scope the engagement to match your project size and complexity.',
      },
      {
        q: 'Do you take equity positions in projects?',
        a: 'Sometimes. On select projects where we have strong conviction and the owner wants partner-level alignment, CRECO will take a small equity position (typically 5-20%) alongside the lead developer. This is rare and project-specific — most engagements are fee-for-service.',
      },
      {
        q: 'Can you help with SBA 504 owner-user development?',
        a: 'Yes. SBA 504 is a powerful financing tool for owner-occupied development — up to 90% LTC at long amortization with below-market fixed rate. We have closed multiple Texas SBA 504 development projects and coordinate with eligible CDC lenders, the SBA processor, and the owner-user\'s primary bank.',
      },
      {
        q: 'How long does a Texas commercial development take?',
        a: 'Timelines vary widely by complexity. Simple retail or industrial pad with existing zoning: 12-18 months from acquisition to certificate of occupancy. Mixed-use or rezone-required: 24-36 months. Major adaptive reuse or large-scale: 36-60 months. Pre-leasing and lease-up adds another 6-18 months to stabilization. Your IRR is highly sensitive to schedule — we obsess over compressing timelines.',
      },
      {
        q: 'Do you develop your own projects?',
        a: 'CRECO is primarily an advisory and brokerage firm — our principals occasionally develop or co-invest in select local projects, but we are not a vertically-integrated developer. The advantage to you: we are aligned with your interests, not pushing our own pipeline.',
      },
    ],
    relatedSlugs: ['investment-advisory', 'leasing-sales', 'property-management'],
  },
  // Sustainability consulting was retired (Oct 2026) — not a service CRECO
  // offers. /services/sustainability 308s to /services (next.config.js).
];

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={[
          webPage('CollectionPage', '/services', 'Texas Commercial Real Estate Services — CRECO',
            'Tenant representation, leasing & sales, investment advisory, property management, and development.',
            {
              mainEntity: {
                '@type': 'ItemList',
                itemListElement: SERVICES.map((svc, i) => ({
                  '@type': 'ListItem',
                  position: i + 1,
                  item: { '@type': 'Service', name: svc.title, url: `https://www.crecotx.com/services/${svc.slug}`, provider: businessRef, areaServed: { '@type': 'State', name: 'Texas' } },
                })),
              },
            }),
          breadcrumbList([{ name: 'Services', path: '/services' }]),
        ]}
      />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-20 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-4 text-gold">Texas Commercial Real Estate · Services</p>
              <h1 className="font-heading text-display font-bold">
                Full-service Texas commercial real estate.
              </h1>
              <p className="mt-6 text-body-lg text-white/80">
                Leasing, owner services, investment sales and development — with principal-level attention on every engagement.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="#services-form"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  Tell us what you&apos;re working on <ArrowRight className="h-4 w-4" />
                </Link>
                <PhoneCallText variant="inline" tone="dark" surface="services-hero" />
              </div>
            </div>
          </Container>
        </section>

        {/* Who CRECO represents — links to the landlord and seller/investor answer pages */}
        <section className="bg-white border-b border-border py-10" aria-labelledby="who-we-represent-heading">
          <Container>
            <div className="mx-auto max-w-5xl">
              <h2 id="who-we-represent-heading" className="mb-3 font-heading text-heading-xl font-bold text-primary">Who CRECO represents</h2>
              <p className="mb-5 text-body text-foreground-muted">CRECO represents tenants and buyers, landlords and owners, and sellers and investors — for lease and for sale.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/services/tenant-representation" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-body-sm font-semibold text-primary hover:border-gold">Tenants <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/landlord-representation" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-body-sm font-semibold text-primary hover:border-gold">Landlords &amp; owners <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/seller-investor-representation" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-body-sm font-semibold text-primary hover:border-gold">Sellers &amp; investors <ArrowRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Services Grid */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {SERVICES.map(({ slug, icon: Icon, title, shortDescription, body }, i) => (
                <RevealOnScroll key={slug} delay={i * 60}>
                  <div className="h-full rounded-xl border border-border bg-white p-8 transition-all hover:border-gold hover:shadow-card-hover flex flex-col">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="mb-3 font-heading text-heading-lg font-semibold text-primary">{title}</h2>
                    <p className="mb-5 text-body-sm text-foreground-muted">{shortDescription}</p>
                    <ul className="mb-6 space-y-2">
                      {body.slice(0, 5).map(item => (
                        <li key={item} className="flex items-start gap-2 text-body-sm text-foreground-muted">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto">
                      <Link href={`/services/${slug}`} className="inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark hover:text-gold transition-colors">
                        Learn more about {title.toLowerCase()} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* The page's own form — it used to close on a "Get in Touch" button
            that left for /contact. */}
        <section id="services-form" className="section-luxury bg-primary scroll-mt-24" aria-label="Not sure which service fits?">
          <Container>
            <div className="mx-auto max-w-3xl">
              <InlineLeadForm
                tone="dark"
                eyebrow="Start with a conversation"
                heading="Not sure which service fits?"
                body="Tell us what you're working on. We'll recommend an approach — even if that means pointing you somewhere else."
                contextLabel="What are you working on?"
                contextPlaceholder="e.g. Lease ends next year and we may need more space — or, own a strip center and thinking about selling"
                source="contact"
                submitLabel="Talk to our team"
                surface="services-inline"
              />
            </div>
          </Container>
        </section>
        <FaqSection faqs={SERVICES_FAQS} path="/services" heading="CRECO services — FAQ" className="section-luxury bg-white" />
      </main>
      <Footer />
    </>
  );
}
