/**
 * Submarket hub-page content — the data backing /markets/[slug].
 *
 * Each entry produces a full keyword-targeted SEO landing page using the
 * shared CityHubPage component. We organize by parent metro so the
 * /markets index can group cleanly.
 *
 * Editorial principle: each submarket gets content that no one else has —
 * specific rent ranges, who's leasing right now, what 2026 looks like
 * locally. Not boilerplate. That's how these pages earn ranking.
 *
 * To add a new submarket: append an entry, push to sitemap, done.
 */

import type { CityHubConfig } from '@/components/marketing/CityHubPage';

export type ParentMetro = 'austin' | 'dallas-fort-worth' | 'houston' | 'san-antonio' | 'hill-country';

export const PARENT_METRO_LABELS: Record<ParentMetro, string> = {
  'austin':            'Austin Metro',
  'dallas-fort-worth': 'Dallas–Fort Worth',
  'houston':           'Houston Metro',
  'san-antonio':       'San Antonio Metro',
  'hill-country':      'Texas Hill Country',
};

export interface SubmarketEntry {
  slug: string;
  parentMetro: ParentMetro;
  /** Short label for the index card */
  shortLabel: string;
  /** Optional descriptor in the index card */
  tagline: string;
  /** Page meta + body content */
  config: CityHubConfig;
  /** SEO meta */
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
}

// ── Shared building blocks ──────────────────────────────────────────────────
// Avoid copy-pasting the same property-link cards on every page. These are
// the same Texas-wide landing pages on every submarket — keyword-stable.

const STANDARD_PROPERTY_LINKS = [
  { label: 'Office space for lease — Texas', href: '/texas-office-space-for-lease',           description: 'Class A trophy and Class B office across this submarket and the broader Texas market.' },
  { label: 'Industrial / warehouse for lease', href: '/texas-industrial-property-for-lease', description: 'Bulk distribution, flex, and small-bay industrial — modern and value-add inventory.' },
  { label: 'Retail space for lease',         href: '/texas-retail-space-for-lease',          description: 'Inline retail, end-cap, and pad sites at quality center locations.' },
  { label: 'Commercial property for sale',   href: '/texas-commercial-property-for-sale',    description: 'Investment, owner-user, and 1031 replacement opportunities across the submarket.' },
];

const STANDARD_WHY_BULLETS = [
  'Texas-wide network with on-the-ground broker presence',
  'Off-market deal flow across all major property types',
  'Tenant rep — landlord pays our commission, you get unbiased advocacy',
  'Owner services for landlords and multi-property investors',
  'Direct broker access — no junior-handoff, every engagement led by a senior',
  'Lease + investment-sale fluency across office, industrial, retail, and land',
];

// ── Submarket entries ──────────────────────────────────────────────────────

export const SUBMARKETS: SubmarketEntry[] = [
  // ───────────────────────── AUSTIN METRO ─────────────────────────
  {
    slug: 'round-rock',
    parentMetro: 'austin',
    shortLabel: 'Round Rock',
    tagline: 'Austin\'s northern industrial corridor + Dell HQ market',
    metaTitle: 'Round Rock Commercial Real Estate | Office, Industrial, Retail | CRECO',
    metaDescription:
      'Round Rock commercial real estate — industrial, office, retail, flex for lease and sale in Williamson County. Dell HQ submarket, Samsung-Taylor corridor adjacency, and one of Texas\'s strongest suburban industrial markets.',
    keywords: [
      'round rock commercial real estate',
      'round rock industrial space',
      'round rock warehouse for lease',
      'round rock office space',
      'round rock retail space for lease',
      'round rock commercial property for sale',
      'williamson county commercial real estate',
      'i-35 industrial corridor',
      'samsung taylor texas',
      'dell round rock real estate',
    ],
    config: {
      city: 'Round Rock',
      cityShort: 'Round Rock',
      heroEyebrow: 'Austin Metro · Williamson County',
      heroTitle: 'Round Rock commercial real estate — the I-35 industrial corridor and Dell\'s home market.',
      heroSubhead:
        'Industrial, office, retail, and flex space for lease and sale in Round Rock — anchored by Dell Technologies, adjacent to Samsung\'s Taylor megafab, and home to one of the strongest suburban CRE markets in the Austin metro. CRECO works tenant-side and owner-side across Williamson County.',
      marketStats: [
        { label: 'Industrial absorption',     value: 'Strong',      context: 'Samsung-Taylor + e-comm + 3PL demand' },
        { label: 'Office vacancy',            value: '~14%',        context: 'Class B suburban, with TI concessions' },
        { label: 'Class A industrial rents',  value: '$10–13/SF',   context: 'NNN, modern bulk distribution' },
        { label: 'Population growth',         value: '+30%',        context: 'last decade — fastest in Texas' },
      ],
      marketIntro: [
        'Round Rock is the most overlooked CRE submarket in the Austin metro. National coverage gravitates to Downtown Austin and the Domain because they\'re glamorous. Round Rock just quietly does the work — Dell Technologies\' worldwide headquarters anchors a 350,000-employee tech and logistics ecosystem, and the I-35 industrial corridor (Round Rock through Pflugerville to Hutto) absorbs more square feet of Class A industrial each quarter than any submarket north of San Antonio.',
        'The 2026 story is the Samsung-Taylor megafab adjacency. Samsung\'s $17B+ semiconductor fabrication facility in Taylor (just east of Round Rock) is in active commissioning, and the supplier ecosystem — chip equipment, specialty chemicals, precision machining, packaging — is leasing flex and small-bay industrial space across Round Rock at sustained 95%+ occupancy. If you\'re a tenant in that supply chain, you\'re competing for limited space. If you\'re an owner of small-bay industrial here, you\'re a price-setter.',
        'Office tells a different story. Round Rock Class B suburban office sits at ~14% vacancy with meaningful concessions on offer — $40–60/SF TI, 9–12 months free rent on 7-year deals. Trophy Class A in the immediate Dell campus area holds up better. Retail in the Round Rock Premium Outlets / La Frontera corridor is genuinely tight — restaurant and discount apparel tenants are signing 5-year deals at near-asking rents.',
      ],
      servicesIntro: [
        'CRECO\'s Round Rock practice covers the spectrum — tenant rep for businesses scouting Williamson County space, owner-side leasing for landlords, investment advisory for buyers and sellers, and 1031 coordination for Texas portfolio owners adding Round Rock exposure.',
        'We\'re particularly active in the I-35 small-bay industrial segment, where the supply tightness creates both leasing leverage for landlords and acquisition opportunity for owner-users. We track every available 5K–30K SF industrial block in Williamson County and can usually surface off-market options through our broker network within 48 hours of a tenant requirement coming in.',
        'For Round Rock office tenants — particularly in Class B suburban — we use the current concession environment aggressively. Free rent and TI are at multi-year highs, and tenants who structure deals well in 2026 lock in below-market economics for the rest of the cycle.',
      ],
      submarkets: [
        { name: 'I-35 Industrial Corridor',     characterization: 'Small-bay + bulk industrial',     description: 'The Round Rock-through-Pflugerville-to-Hutto stretch along I-35. Strong small-bay supply tightness with bulk distribution catching up.' },
        { name: 'Dell Campus / North Round Rock', characterization: 'Class A office + flex',         description: 'Anchored by Dell HQ. Class A office holds value, flex with office buildout commands premium rents from tech-adjacent operators.' },
        { name: 'La Frontera / Premium Outlets',  characterization: 'Retail + lifestyle',           description: 'Strong daytime traffic from Premium Outlets, high-quality grocery-anchored and lifestyle retail. Limited vacancy.' },
        { name: 'Hutto Corridor',                 characterization: 'Industrial + emerging mixed-use', description: 'Samsung-Taylor adjacency driving Class A industrial absorption. Some early mixed-use development underway.' },
      ],
      whyBullets: [
        'Williamson County market knowledge — Dell campus to Taylor corridor',
        'Active in I-35 small-bay industrial deal flow',
        'Tenant rep for Samsung-Taylor supplier ecosystem',
        'Off-market access through Austin + statewide broker network',
        'Direct broker access — every engagement led by a senior CRECO broker',
        'Lease structure expertise — TI, abatement, exit options',
      ],
      relatedInsights: [
        { slug: 'texas-industrial-warehouse-leasing-2026', category: 'Tenant Strategy', title: 'Texas Industrial Warehouse Leasing 2026: What Tenants Should Pay, Push For, and Walk Away From' },
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook: What Owners and Tenants Should Watch in 2026' },
        { slug: 'texas-1031-exchange-strategy', category: 'Investor Strategy', title: '1031 Exchange Strategy for Texas Commercial Property Owners: Timing, Sourcing, and the Mistakes That Cost You' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  {
    slug: 'cedar-park-leander',
    parentMetro: 'austin',
    shortLabel: 'Cedar Park & Leander',
    tagline: 'Northwest Austin\'s demographic growth corridor',
    metaTitle: 'Cedar Park & Leander Commercial Real Estate | Retail, Office, Industrial | CRECO',
    metaDescription:
      'Cedar Park and Leander commercial real estate — northwest Austin\'s fastest-growing submarket. Retail anchored by H-E-B and 1890 Ranch, growing professional office, and emerging industrial. Tenant rep + owner services from CRECO.',
    keywords: [
      'cedar park commercial real estate',
      'leander commercial real estate',
      'cedar park retail for lease',
      'leander office space',
      'northwest austin commercial property',
      '1890 ranch leasing',
      'cedar park warehouse',
      'williamson county northwest',
    ],
    config: {
      city: 'Cedar Park & Leander',
      cityShort: 'Cedar Park',
      heroEyebrow: 'Austin Metro · Williamson County',
      heroTitle: 'Cedar Park and Leander — Austin\'s demographic engine and a top-five Texas retail growth submarket.',
      heroSubhead:
        'Retail, professional office, medical, and emerging industrial space for lease across Cedar Park and Leander. The northwest Austin growth corridor adds 30,000+ residents per year, anchored by 1890 Ranch, the Cedar Park Center, H-E-B-anchored centers, and an expanding healthcare cluster. CRECO covers retail, office, and owner-user industrial across the corridor.',
      marketStats: [
        { label: 'Annual population growth', value: '+5%',         context: 'one of fastest-growing Texas submarkets' },
        { label: 'Retail vacancy',           value: '~4%',         context: 'effectively full in growth corridors' },
        { label: 'Class A retail rents',     value: '$32–42/SF',   context: 'NNN, grocery-anchored shop space' },
        { label: 'Median HH income',         value: '$120K+',      context: 'top-tier Austin metro buying power' },
      ],
      marketIntro: [
        'Cedar Park and Leander are the same story told from two ZIP codes. Leander is greenfield growth — new residential, new schools, new shopping centers being built faster than tenants can sign. Cedar Park is its slightly-older sibling, anchored by 1890 Ranch and the Cedar Park Center, with maturing retail trade areas, established office tenancies, and a denser professional-services base. Together they form one of the most predictable retail growth corridors in Texas.',
        'The retail story is straightforward. Grocery-anchored centers (HEB, HEB plus, Sprouts, Whole Foods) are full. Shop-space rents in primary growth centers run $32–42/SF NNN with multiple-bid leasing for restaurant end-caps and discount apparel boxes. The 2026 catalyst is the continued residential growth — Cedar Park and Leander each added ~5% population in 2025, and absent a recession, the pipeline of new rooftops keeps shop-space rents climbing through 2027.',
        'Office is less dramatic but solid. Class B professional office in the 183 corridor (Cedar Park\'s central commercial strip) sits at ~9% vacancy with rents in the $26–34/SF gross range. Medical office is genuinely tight — the healthcare cluster around Cedar Park Regional Medical and the emerging Leander-area clinics absorbs every well-located medical building. Industrial is small but emerging — a few flex parks in Leander serving the local contractor and small-business ecosystem.',
      ],
      servicesIntro: [
        'CRECO\'s Cedar Park / Leander practice is heaviest in retail leasing and small-bay flex. We represent retail tenants seeking end-caps, pad sites, and inline space in the corridor\'s primary growth centers, and we work owner-side with retail-strip and grocery-anchored landlords on rent push and tenant mix optimization.',
        'For office tenants, we focus on the 183 corridor and the emerging Leander professional centers — the right submarket pick saves a year of buildout time when business growth is the constraint. For investors, the underwriting story here is durable demographic growth that supports cap-rate compression on quality centers over 5–10 year holds.',
      ],
      submarkets: [
        { name: '183 Cedar Park Corridor',    characterization: 'Retail + professional office', description: 'The central commercial strip from Lakeline north. Established retail trade area, professional office, and medical clustering.' },
        { name: '1890 Ranch / Cedar Park Town Center', characterization: 'Mixed-use retail + entertainment', description: 'Power-center retail anchored by H-E-B, big-box discount, and a strong restaurant and entertainment lineup.' },
        { name: 'Leander Growth Corridor',    characterization: 'New retail + residential-driven', description: 'Greenfield growth along 183A and the new Leander developments. Multiple grocery-anchored centers under construction or recently delivered.' },
        { name: 'Lakeline / Cedar Park South', characterization: 'Office + medical',           description: 'Closer-in office and medical office cluster. Healthcare-driven absorption and walkable mixed-use pockets.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-retail-leasing-fundamentals-2026', category: 'Owner Strategy', title: 'Texas Retail Leasing Fundamentals 2026: What Strong Centers Have, What Weak Centers Don\'t' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook: What Owners and Tenants Should Watch in 2026' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  {
    slug: 'the-domain',
    parentMetro: 'austin',
    shortLabel: 'The Domain & North Austin',
    tagline: 'Austin\'s Class A office concentration',
    metaTitle: 'The Domain Commercial Real Estate | Class A Office, Premium Retail | CRECO',
    metaDescription:
      'The Domain commercial real estate — Austin\'s Class A office concentration and premium mixed-use retail district. Trophy office leasing, retail tenant rep, and investment-sale advisory from CRECO.',
    keywords: [
      'the domain commercial real estate',
      'domain austin office space',
      'north austin class a office',
      'domain retail space for lease',
      'mopac office leasing',
      'rock rose retail',
      'domain northside',
      'austin trophy office',
    ],
    config: {
      city: 'The Domain & North Austin',
      cityShort: 'The Domain',
      heroEyebrow: 'Austin Metro · MoPac Corridor',
      heroTitle: 'The Domain and North Austin — Class A trophy office, premium retail, and the most-watched suburban market in Texas.',
      heroSubhead:
        'Class A office, lifestyle retail, and flex space at The Domain, Domain Northside, Rock Rose, and the broader North Austin MoPac corridor. Trophy office holds firm even through the broader Austin softening; retail trades on lifestyle and walkability. CRECO works tenant-side and owner-side across the corridor.',
      marketStats: [
        { label: 'Trophy Class A office',  value: '$58–68/SF',   context: 'gross, premium full-service' },
        { label: 'Class A office vacancy', value: '~9%',         context: 'tightest in the Austin metro' },
        { label: 'Retail rents (top centers)', value: '$48–65/SF', context: 'NNN, prime ground-floor' },
        { label: 'Tech tenant concentration', value: 'Top 3',     context: 'Austin metro by SF leased' },
      ],
      marketIntro: [
        'The Domain is the cleanest evidence in Texas of office\'s post-2022 bifurcation. Class A trophy buildings here — recently built, fully amenitized, walkable to retail and restaurants — leased through the worst of the office downturn at single-digit vacancy and rising rents. Class B buildings two miles away, with worse amenities and older infrastructure, sat at 25%+ vacancy. Same metro, same year, two completely different markets.',
        'Tenant demand at The Domain is driven by the relocation premium. Austin tech employers (Google, Indeed, Atlassian, Vrbo, and dozens of mid-stage companies) compete for the same Class A trophy footprint because their hiring depends on it. Trophy is a hiring tool. When a company moves from Class B in the suburbs to The Domain, employee tenure typically lengthens — Class A amenities are real talent retention. So the Class A premium gets paid willingly.',
        'Retail is its own story. The Domain (and its sibling, Domain Northside, plus Rock Rose) function as Austin\'s mixed-use lifestyle district. Ground-floor retail commands rents that look more like Manhattan than Texas — $50/SF NNN endcaps lease in days. Restaurant and apparel tenants pay the premium because the corridor delivers walking traffic, daytime population, and evening lifestyle volume in a single venue. Even through retail softening elsewhere, The Domain corridor stays full.',
      ],
      servicesIntro: [
        'CRECO\'s North Austin practice splits across two distinct client profiles: tech tenants leasing Class A trophy office (typically 10K–100K SF blocks) and retail / lifestyle tenants leasing premium ground-floor footprint in The Domain ecosystem. The deal structures are completely different, but the discipline — comp-anchored pricing, structured concession negotiation, exit-option preservation — is consistent.',
        'On the owner side, our work centers on investment advisory for Class A trophy office and mixed-use retail. We model net-to-seller scenarios, source institutional buyers, and structure dispositions or recapitalizations that capture the trophy premium without leaving tail risk on the table.',
      ],
      submarkets: [
        { name: 'The Domain & Domain Northside',  characterization: 'Mixed-use retail + Class A office', description: 'The anchor district. Walkable retail, restaurants, and trophy office towers. Lowest vacancy in the Austin metro by far.' },
        { name: 'Rock Rose',                      characterization: 'Boutique retail + restaurants',    description: 'Specialty retail and restaurant district adjacent to The Domain. Premium ground-floor rents, lifestyle-driven traffic.' },
        { name: 'MoPac Corridor Class A',         characterization: 'Trophy office',                    description: 'The Class A trophy office stretch along MoPac north of 183. Tech tenant-heavy, premium rents and amenities.' },
        { name: 'Burnet Road Corridor',           characterization: 'Mid-tier office + flex',           description: 'Adjacent Class B and Class A- office, plus emerging mixed-use along the Burnet Road growth corridor.' },
      ],
      whyBullets: [
        'Class A trophy office tenant + landlord representation experience',
        'Premium retail leasing in mixed-use lifestyle districts',
        'Investment-sale advisory for institutional-grade Austin assets',
        'Off-market deal flow across the North Austin corridor',
        'Direct broker access — every engagement led by a senior CRECO broker',
        'Tech-tenant lease structure expertise (large-block, multi-year deals)',
      ],
      relatedInsights: [
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook: What Owners and Tenants Should Watch in 2026' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
        { slug: 'multi-property-owner-strategy', category: 'Investor Strategy', title: 'Multi-Property Owner Strategy: When to Hold, When to Sell, When to Reposition Your Texas Commercial Real Estate' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  // ───────────────────────── DALLAS-FORT WORTH ─────────────────────────
  {
    slug: 'frisco',
    parentMetro: 'dallas-fort-worth',
    shortLabel: 'Frisco',
    tagline: 'DFW\'s premier corporate-relocation submarket',
    metaTitle: 'Frisco Commercial Real Estate | Class A Office, Retail, Industrial | CRECO',
    metaDescription:
      'Frisco commercial real estate — DFW\'s premier corporate-relocation submarket and home to The Star, the PGA, Toyota North America, and dozens of corporate HQ relocations. Class A office, retail, and industrial leasing + investment sales from CRECO.',
    keywords: [
      'frisco commercial real estate',
      'frisco office space',
      'frisco class a office',
      'frisco retail for lease',
      'frisco warehouse',
      'frisco commercial property for sale',
      'the star frisco leasing',
      'pga frisco real estate',
      'dallas north tollway office',
      'collin county commercial',
    ],
    config: {
      city: 'Frisco',
      cityShort: 'Frisco',
      heroEyebrow: 'Dallas–Fort Worth · Collin County',
      heroTitle: 'Frisco commercial real estate — DFW\'s corporate-relocation magnet and one of America\'s strongest suburban CRE markets.',
      heroSubhead:
        'Class A office, lifestyle retail, mixed-use, and flex space across Frisco — anchored by The Star (Cowboys HQ), the PGA of America\'s national headquarters, Toyota North America, and a continuous pipeline of corporate relocations. CRECO covers tenant representation, owner services, and investment sales across Collin County.',
      marketStats: [
        { label: 'Class A office rents',         value: '$36–44/SF',  context: 'gross, premium suburban' },
        { label: 'Office vacancy (Frisco core)', value: '~12%',       context: 'tightest in the DFW suburban submarket' },
        { label: 'Population growth',            value: '+6%/yr',     context: 'fastest-growing US city its size' },
        { label: 'Corporate HQ relocations',     value: 'Top 3',      context: 'US cities since 2018' },
      ],
      marketIntro: [
        'Frisco is the most concentrated story of Texas\'s corporate-relocation decade. Toyota North America moved its HQ here. Keurig Dr Pepper, FedEx Office, Jamba, Tenet Healthcare — Frisco accumulated more Fortune 500 HQ presence in 10 years than most major cities accumulate in 50. The Cowboys built The Star here. The PGA of America moved its national headquarters here. The relocations aren\'t over — Frisco\'s 2026 pipeline of announced corporate moves rivals 2018-19 peaks.',
        'The CRE consequence: Frisco Class A office is one of the few US suburban office submarkets that\'s actually tightening, not softening. New trophy buildings deliver and lease within 18 months. Tenants pay $36–44/SF gross for the corporate-relocation premium. Retail — particularly in the Frisco Square and Stonebriar corridor — runs at sub-5% vacancy with premium rents in every category from grocery-anchored to restaurant pad sites.',
        'Industrial is the smaller story but real. The DFW logistics network extends north into Frisco/Plano, with small-bay and last-mile distribution serving the explosive Collin County population. Most of the bulk industrial sits further south (Alliance, South Dallas) but the small-bay 20K–60K SF segment is genuinely tight in Collin County and trades at premium per-SF prices.',
      ],
      servicesIntro: [
        'CRECO\'s Frisco practice is heaviest in two areas: Class A office tenant representation for corporate-relocation candidates and growing local employers, and high-end retail leasing in the Frisco Square / Stonebriar / The Star ecosystem.',
        'For corporate tenants evaluating Frisco, our work starts before the location decision — we model net occupancy economics, run comparative-submarket analyses across DFW (Frisco vs Plano vs Las Colinas vs Uptown), and structure the actual lease to maximize TI, abatement, and renewal flexibility. Frisco demands aggressive structure because the corporate-relocation premium gets quoted casually by listing brokers.',
        'On the owner side, we provide investment-sale advisory for institutional Class A office and mixed-use retail in the Frisco corridor — modeling buyer pools (1031, institutional, foreign capital, family office), structuring marketing strategies, and negotiating dispositions that capture the corporate-relocation premium without underwriting wishful thinking.',
      ],
      submarkets: [
        { name: 'Frisco Square & The Star',        characterization: 'Mixed-use + Class A office',     description: 'The Cowboys HQ + Frisco municipal district. Walkable mixed-use, premium Class A office, lifestyle retail.' },
        { name: 'Stonebriar / Tollway',            characterization: 'Corporate office + retail',      description: 'Anchored by Stonebriar Centre. Major corporate office tenants, premium retail and restaurant, tollway accessibility.' },
        { name: 'PGA Frisco / Fields',             characterization: 'Mixed-use development',          description: 'The PGA of America HQ + Fields mixed-use development. Office, hotel, and retail still in active build-out.' },
        { name: 'Preston Road Corridor',           characterization: 'Retail + professional office',   description: 'Established retail spine connecting Frisco to Plano. Grocery-anchored centers, professional office, and emerging multifamily.' },
      ],
      whyBullets: [
        'Frisco corporate-relocation tenant representation experience',
        'Class A office + premium retail leasing across the Tollway corridor',
        'Investment-sale advisory for institutional Frisco assets',
        'Off-market deal flow through DFW broker network',
        'Direct broker access — every engagement led by a senior CRECO broker',
        'Net-occupancy modeling for corporate-tenant location decisions',
      ],
      relatedInsights: [
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook: What Owners and Tenants Should Watch in 2026' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
        { slug: 'multi-property-owner-strategy', category: 'Investor Strategy', title: 'Multi-Property Owner Strategy: When to Hold, When to Sell, When to Reposition Your Texas Commercial Real Estate' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  {
    slug: 'plano',
    parentMetro: 'dallas-fort-worth',
    shortLabel: 'Plano',
    tagline: 'Mature corporate-office anchor of DFW',
    metaTitle: 'Plano Commercial Real Estate | Office, Retail, Mixed-Use | CRECO',
    metaDescription:
      'Plano commercial real estate — DFW\'s mature corporate-office anchor with Legacy West, Toyota-area HQ campuses, and dozens of Fortune 500 offices. Tenant rep, owner services, and investment advisory from CRECO.',
    keywords: [
      'plano commercial real estate',
      'plano office space for lease',
      'legacy west office',
      'west plano commercial property',
      'plano retail space',
      'plano warehouse',
      'east plano industrial',
      'collin county office',
    ],
    config: {
      city: 'Plano',
      cityShort: 'Plano',
      heroEyebrow: 'Dallas–Fort Worth · Collin County',
      heroTitle: 'Plano commercial real estate — the corporate-office anchor of the DFW Tollway corridor.',
      heroSubhead:
        'Class A office, mixed-use, retail, and east-side industrial across Plano — home to Legacy West, the Toyota corporate campus, J.P. Morgan Chase\'s 6,000-employee Plano campus, and one of the densest corporate-office concentrations in the Sun Belt. CRECO works tenant-side and owner-side across all property types in the Plano corridor.',
      marketStats: [
        { label: 'Class A office rents',     value: '$34–42/SF',  context: 'gross, Legacy West premium' },
        { label: 'Total office inventory',   value: '40M+ SF',    context: 'one of largest suburban office markets in US' },
        { label: 'Fortune 500 employers',    value: '8+',         context: 'major HQ or campus presence' },
        { label: 'Median HH income',         value: '$110K+',     context: 'top US large-city demographics' },
      ],
      marketIntro: [
        'Plano predates the Frisco corporate-relocation boom by 20 years. Legacy and West Plano were built in the 1990s as the original Texas corporate-office suburb, anchored by EDS, Frito-Lay, and later JPMorgan Chase, Liberty Mutual, FedEx Office, and Toyota North America. The result today: 40 million-plus square feet of office, dense Fortune 500 employment, and a mature suburban CRE market with more depth than younger neighbors like Frisco or McKinney.',
        'The 2026 story is Class A office stability with Class B / older Class A slowly softening. Legacy West and the trophy Tollway buildings near the Toyota campus hold rents and stay full. Mid-tier office along the Plano-Frisco border and into older Plano corporate parks sees vacancy in the 18-22% range with meaningful concessions. Plano\'s sheer size means it\'s several markets in one — the trophy core is healthy, the older periphery is in transition.',
        'Retail is durable across Plano. The Shops at Legacy, Legacy West retail, and Stonebriar corridor (partly Plano, partly Frisco) command premium rents. Inner Plano retail along Preston Road and Coit Road runs at low single-digit vacancy. Industrial is concentrated in East Plano and into Richardson — smaller bay product, less institutional than Alliance but more accessible for local users.',
      ],
      servicesIntro: [
        'CRECO\'s Plano practice spans the Class A trophy core (Legacy West, the Tollway corridor) and the broader mid-tier office market. For tenants, we run structured relocation processes and play the bifurcation — premium trophy when growth and recruiting are the constraint, well-negotiated Class B when cost optimization is the priority.',
        'On the owner side, our investment-sale work spans institutional Class A trophy down to private-buyer-grade mid-tier office and retail strip. We model net-to-seller for every plausible buyer pool and structure dispositions that capture the right premium without underwriting tail risk.',
      ],
      submarkets: [
        { name: 'Legacy West & Legacy',         characterization: 'Trophy office + mixed-use',         description: 'The Class A trophy core. JPMorgan, Toyota, FedEx Office anchor; Legacy West mixed-use retail and lifestyle.' },
        { name: 'Tollway Corridor',             characterization: 'Class A + Class B office',          description: 'The Dallas North Tollway office stretch through West Plano. Mix of trophy and older Class A.' },
        { name: 'East Plano',                   characterization: 'Industrial + value office',         description: 'Industrial parks along the eastern side of Plano and into Richardson. Smaller-bay product, owner-user friendly.' },
        { name: 'Preston Road / Park Boulevard', characterization: 'Retail + medical',                description: 'Mature retail corridors with grocery-anchored centers, medical office clustering, and dense suburban residential.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook: What Owners and Tenants Should Watch in 2026' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
        { slug: 'texas-1031-exchange-strategy', category: 'Investor Strategy', title: '1031 Exchange Strategy for Texas Commercial Property Owners' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  {
    slug: 'las-colinas',
    parentMetro: 'dallas-fort-worth',
    shortLabel: 'Las Colinas & DFW Airport',
    tagline: 'DFW\'s logistics + corporate-office crossroads',
    metaTitle: 'Las Colinas & DFW Airport Commercial Real Estate | CRECO',
    metaDescription:
      'Las Colinas and DFW Airport commercial real estate — the corporate-office and logistics crossroads of the DFW metroplex. Class A office leasing, bulk distribution, and investment sales from CRECO.',
    keywords: [
      'las colinas commercial real estate',
      'las colinas office space',
      'dfw airport industrial',
      'irving texas commercial real estate',
      'las colinas urban center',
      'alliance industrial corridor',
      'dfw logistics real estate',
      'irving office for lease',
    ],
    config: {
      city: 'Las Colinas & DFW Airport',
      cityShort: 'Las Colinas',
      heroEyebrow: 'Dallas–Fort Worth · Irving + Coppell',
      heroTitle: 'Las Colinas and the DFW Airport corridor — the corporate-office and logistics center of the DFW metroplex.',
      heroSubhead:
        'Class A office at the Las Colinas Urban Center, master-planned corporate campuses, and the largest concentration of bulk distribution and last-mile logistics space in the DFW region. CRECO works office tenants, industrial users, landlords, and investors across the corridor.',
      marketStats: [
        { label: 'Class A office rents', value: '$28–36/SF', context: 'gross, Urban Center trophy' },
        { label: 'Industrial inventory', value: '200M+ SF',  context: 'DFW airport corridor — largest in TX' },
        { label: 'Industrial vacancy',   value: '~9%',       context: 'with bulk softening, small-bay tight' },
        { label: 'Fortune 500 HQs',      value: '6+',        context: 'major presence in the corridor' },
      ],
      marketIntro: [
        'Las Colinas and the DFW Airport corridor are two markets stapled together. Las Colinas itself is a master-planned 1980s corporate suburb with the Urban Center as its trophy Class A office concentration — ExxonMobil, Caterpillar Financial, Microsoft, McKesson, and Citigroup have or had major presence here. The DFW Airport corridor wrapping around the airport is the largest industrial market in Texas: 200M+ square feet of bulk distribution, last-mile delivery, and air-cargo-adjacent flex.',
        'The 2026 office story is bifurcated like everywhere else in DFW. Trophy Class A at the Urban Center holds value with decent leasing velocity. Mid-tier Class B around the corridor sees 18-25% vacancy with deep concessions on offer. The opportunity for tenants is real — a corporate user willing to take well-located Class B can lock in below-market economics for the rest of the cycle.',
        'Industrial is the more important story. Last-mile distribution (Amazon, FedEx, UPS, and the broader e-commerce supply chain) is structurally tight near the airport. Bulk warehouse (250K+ SF) in the Alliance corridor (just north) softened in 2024 and is now stabilizing. Speculative bulk delivered in 2023-24 is finally absorbing, but rents are 8-12% below 2022 peaks. Tenants in the 50K-150K SF range are in the sweet spot — supply is tight enough to keep rents firm, soft enough for negotiation.',
      ],
      servicesIntro: [
        'CRECO\'s Las Colinas / DFW Airport practice runs across two distinct deal flows: corporate-office tenant rep at the Urban Center and broader Las Colinas suburban office market, and industrial leasing/owner advisory across the airport corridor.',
        'For office tenants, we use the bifurcation aggressively — there\'s deep concession value in mid-tier Las Colinas product that disappears the moment a tenant accepts standard asking-rent terms. For industrial users in the 50K-200K SF range, we run multi-candidate processes that surface off-market options through our DFW broker network and structure terms to capture the current concession environment in bulk distribution.',
      ],
      submarkets: [
        { name: 'Las Colinas Urban Center',   characterization: 'Trophy Class A office',        description: 'The trophy office concentration. Walkable, amenitized, transit-served. Holds value through the broader office cycle.' },
        { name: 'Las Colinas Corporate Parks', characterization: 'Class B suburban office',    description: 'Older master-planned corporate parks across Las Colinas. Deeper concessions, value-rent opportunity for cost-conscious tenants.' },
        { name: 'DFW Airport Industrial',     characterization: 'Bulk + last-mile distribution', description: 'Massive industrial corridor wrapping the airport. Last-mile tight, bulk distribution stabilizing.' },
        { name: 'Coppell / Grapevine',         characterization: 'Suburban industrial + retail',  description: 'Northern airport-adjacent submarkets. Strong mid-bay industrial leasing and quality suburban retail.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-industrial-warehouse-leasing-2026', category: 'Tenant Strategy', title: 'Texas Industrial Warehouse Leasing 2026: What Tenants Should Pay, Push For, and Walk Away From' },
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'multi-property-owner-strategy', category: 'Investor Strategy', title: 'Multi-Property Owner Strategy' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  // ───────────────────────── HOUSTON ─────────────────────────
  {
    slug: 'the-woodlands',
    parentMetro: 'houston',
    shortLabel: 'The Woodlands',
    tagline: 'Houston\'s premier corporate-relocation suburb',
    metaTitle: 'The Woodlands Commercial Real Estate | Office, Retail, Mixed-Use | CRECO',
    metaDescription:
      'The Woodlands commercial real estate — Houston\'s premier corporate-relocation suburb, home to ExxonMobil\'s campus and a dense corporate-office ecosystem. Class A office, premium retail, and investment advisory from CRECO.',
    keywords: [
      'the woodlands commercial real estate',
      'the woodlands office space',
      'woodlands texas class a office',
      'hughes landing office',
      'town center woodlands retail',
      'exxonmobil campus woodlands',
      'montgomery county commercial',
      'north houston office',
    ],
    config: {
      city: 'The Woodlands',
      cityShort: 'The Woodlands',
      heroEyebrow: 'Houston Metro · Montgomery County',
      heroTitle: 'The Woodlands commercial real estate — Houston\'s corporate-relocation suburb and one of the strongest suburban CRE markets in the Sun Belt.',
      heroSubhead:
        'Class A office, premium retail, and mixed-use space across The Woodlands — anchored by the ExxonMobil campus, Hughes Landing, Town Center, and a dense corporate ecosystem (Anadarko/Occidental, Huntsman, Repsol, McKesson, and dozens more). CRECO covers tenant rep, owner services, and investment sales across Montgomery County.',
      marketStats: [
        { label: 'Class A office rents',  value: '$32–40/SF',  context: 'gross, Town Center premium' },
        { label: 'Office vacancy',        value: '~14%',       context: 'Class A trophy notably tighter' },
        { label: 'Major employers',       value: '50+',        context: 'corporate offices > 100 employees' },
        { label: 'Median HH income',      value: '$120K+',     context: 'top-tier Houston demographics' },
      ],
      marketIntro: [
        'The Woodlands is the cleanest example in Texas of a fully-formed planned community that became a CRE market. Anchored by ExxonMobil\'s 385-acre corporate campus and the supporting executive and professional ecosystem, plus Town Center as a walkable mixed-use district and Hughes Landing as the newest Class A trophy concentration, The Woodlands has more genuine corporate-relocation depth than any other Houston suburb.',
        'Office tells a familiar 2026 story: trophy Class A holds, mid-tier Class B sees concessions. The difference here is that the trophy depth is real. Hughes Landing buildings, Waterway Square towers, and the immediate Town Center stretch are at single-digit vacancy with $34–40/SF gross asking rents. Out at the edges of the corridor and into older corporate parks along 1488, vacancy is higher and TI/abatement packages are at multi-year highs.',
        'Retail is durable. Market Street at Town Center, Hughes Landing retail, and the strong grocery-anchored centers (HEB plus, Whole Foods, multiple specialty grocers) run at sub-5% vacancy. Restaurants compete for endcap space with multi-bid leasing. Industrial is small — The Woodlands isn\'t an industrial market, but the surrounding 1488/I-45 corridor handles flex and light distribution for the local business ecosystem.',
      ],
      servicesIntro: [
        'CRECO\'s Woodlands practice is heaviest in corporate-office tenant representation and high-end retail leasing. Houston-bound corporate tenants evaluating Woodlands locations need someone who understands the comparative submarket economics (Woodlands vs Energy Corridor vs Galleria) and can negotiate the trophy-premium structure without overpaying.',
        'For retail tenants, the Town Center / Hughes Landing / Market Street ecosystem rewards specific landlord relationships and deep knowledge of the trade-area dynamics. We work both tenant and landlord side across the corridor.',
      ],
      submarkets: [
        { name: 'Town Center & Market Street', characterization: 'Mixed-use lifestyle + Class A office', description: 'The walkable mixed-use core. Premium retail, dining, and Class A office. Lowest vacancy in The Woodlands.' },
        { name: 'Hughes Landing',              characterization: 'Trophy Class A office + retail',       description: 'The newest Class A trophy concentration. Walkable retail, premium office, and adjacent residential.' },
        { name: 'Waterway Square',             characterization: 'Class A office + hotel',               description: 'The original Class A trophy district along the Woodlands Waterway. Mature ecosystem, strong tenant retention.' },
        { name: 'ExxonMobil Campus Corridor',  characterization: 'Corporate office + supporting flex',    description: 'The supporting ecosystem around ExxonMobil\'s campus. Mix of Class A, Class B, and supporting flex space.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
        { slug: 'multi-property-owner-strategy', category: 'Investor Strategy', title: 'Multi-Property Owner Strategy' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  {
    slug: 'sugar-land',
    parentMetro: 'houston',
    shortLabel: 'Sugar Land',
    tagline: 'Houston\'s southwest corporate-office and retail anchor',
    metaTitle: 'Sugar Land Commercial Real Estate | Office, Retail, Industrial | CRECO',
    metaDescription:
      'Sugar Land commercial real estate — southwest Houston\'s corporate-office and retail anchor. Class A office, mixed-use retail, medical, and industrial leasing + investment sales from CRECO.',
    keywords: [
      'sugar land commercial real estate',
      'sugar land office space',
      'sugar land town square',
      'fort bend county commercial',
      'first colony retail',
      'sugar land industrial',
      'southwest houston office',
      'highway 6 commercial property',
    ],
    config: {
      city: 'Sugar Land',
      cityShort: 'Sugar Land',
      heroEyebrow: 'Houston Metro · Fort Bend County',
      heroTitle: 'Sugar Land commercial real estate — southwest Houston\'s corporate-office and lifestyle-retail anchor.',
      heroSubhead:
        'Class A office, mixed-use retail, medical, and industrial space across Sugar Land — home to Sugar Land Town Square, First Colony Mall, the Memorial Hermann medical corridor, and a dense suburban corporate-office market. CRECO works tenant-side and owner-side across Fort Bend County.',
      marketStats: [
        { label: 'Class A office rents', value: '$28–34/SF', context: 'gross, Town Square premium' },
        { label: 'Office vacancy',       value: '~12%',      context: 'Class A tighter than Class B' },
        { label: 'Medical office demand', value: 'Strong',   context: 'Memorial Hermann corridor expansion' },
        { label: 'Median HH income',     value: '$120K+',    context: 'one of strongest Houston suburbs' },
      ],
      marketIntro: [
        'Sugar Land is the Houston suburb with the deepest density of professional services, healthcare, and corporate-services employment outside the Galleria. The Sugar Land Town Square mixed-use core, First Colony retail trade area, and the Memorial Hermann medical corridor anchor a CRE market that runs more like a small city than a typical suburb. The Fort Bend County demographics — top-tier household income, dense suburban residential, and continued population growth — sustain it through every cycle.',
        'Office in 2026 is solid but not spectacular. Class A around Town Square holds rents in the $28–34/SF gross range with 8-10% vacancy. Older Class B around Highway 6 and the broader Sugar Land office market sees 15-20% vacancy with meaningful TI and abatement on the table. Medical office is the standout — Memorial Hermann\'s continued expansion plus growing specialty practice clusters keeps medical building absorption strong with rents at premium to general office.',
        'Retail is genuinely tight at the upper end. First Colony Mall trade area, Sugar Land Town Square retail, and the grocery-anchored centers along Highway 6 all run at low single-digit vacancy. Restaurant endcaps, especially anything with patios or drive-throughs, lease with multiple bids. Industrial is more modest — small-bay and flex along Highway 90 and into the broader Fort Bend County industrial network.',
      ],
      servicesIntro: [
        'CRECO\'s Sugar Land practice covers Class A and Class B office leasing, retail across the Town Square and First Colony corridors, and growing medical-office work along the Memorial Hermann ecosystem. We also handle investment-sale advisory for institutional and private-buyer-grade assets across Fort Bend County.',
        'For office tenants, the Sugar Land bifurcation creates real opportunity — well-negotiated Class B in the right submarket locks in below-market rent for 5+ years. For retail, our relationships with the major Sugar Land landlords give us advance knowledge of upcoming availability in the tightest centers.',
      ],
      submarkets: [
        { name: 'Sugar Land Town Square',       characterization: 'Mixed-use + Class A office',         description: 'The walkable mixed-use core. Premium retail, restaurants, and Class A office. Tightest vacancy in Sugar Land.' },
        { name: 'First Colony / Highway 6',     characterization: 'Mature retail + office',             description: 'The First Colony Mall trade area + Highway 6 corridor. Strong retail, mature professional office, dense suburban residential.' },
        { name: 'Memorial Hermann Medical Corridor', characterization: 'Medical office + healthcare',  description: 'Expanding medical office cluster anchored by Memorial Hermann. Specialty practices, surgical centers, supporting healthcare.' },
        { name: 'Highway 90 Industrial',        characterization: 'Flex + small-bay industrial',        description: 'The light industrial spine across Sugar Land. Owner-user friendly, local-business-focused, accessible logistics for SW Houston.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'texas-retail-leasing-fundamentals-2026', category: 'Owner Strategy', title: 'Texas Retail Leasing Fundamentals 2026' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  // ───────────────────────── SAN ANTONIO ─────────────────────────
  {
    slug: 'stone-oak',
    parentMetro: 'san-antonio',
    shortLabel: 'Stone Oak & North Central San Antonio',
    tagline: 'San Antonio\'s strongest suburban-growth corridor',
    metaTitle: 'Stone Oak Commercial Real Estate | North Central San Antonio | CRECO',
    metaDescription:
      'Stone Oak and North Central San Antonio commercial real estate — the strongest suburban-growth corridor in the SA metro. Retail, office, medical, and investment sales from CRECO.',
    keywords: [
      'stone oak commercial real estate',
      'north central san antonio commercial',
      'stone oak retail for lease',
      'stone oak medical office',
      'us highway 281 commercial',
      'bulverde road commercial',
      'north san antonio office space',
      'sonterra office',
    ],
    config: {
      city: 'Stone Oak & North Central San Antonio',
      cityShort: 'Stone Oak',
      heroEyebrow: 'San Antonio Metro · Bexar County North',
      heroTitle: 'Stone Oak and North Central San Antonio — the strongest suburban CRE corridor in the SA metro.',
      heroSubhead:
        'Retail, medical office, professional services, and emerging mixed-use across the Stone Oak, Sonterra, and US 281 North corridor. Anchored by the Methodist Stone Oak Hospital, strong grocery-anchored retail (HEB, Whole Foods), and a dense professional ecosystem. CRECO works tenant and owner sides across the corridor.',
      marketStats: [
        { label: 'Retail vacancy',          value: '~4%',         context: 'effectively full in growth centers' },
        { label: 'Class A retail rents',    value: '$28–36/SF',   context: 'NNN, grocery-anchored shop space' },
        { label: 'Medical office demand',   value: 'Strong',      context: 'Methodist Stone Oak expansion' },
        { label: 'Population growth',       value: 'Top 5',       context: 'fastest-growing SA submarket' },
      ],
      marketIntro: [
        'Stone Oak and the broader North Central San Antonio corridor (US 281 from Loop 1604 north into the Hill Country gateway) are the demographic engine of the SA metro. High household incomes, sustained residential growth, and the emerging mixed-use clusters around Sonterra and TPC Parkway combine to make this the strongest retail and medical-office submarket in San Antonio.',
        'Retail is genuinely tight. Grocery-anchored centers run at low single-digit vacancy with rents that look more like Austin than typical SA. The 2026 catalyst is the continued north-and-northwest residential growth into the Bulverde and Spring Branch areas (Hill Country gateway), which keeps the Stone Oak trade area growing structurally for the next decade. Restaurant endcaps in the corridor lease with multiple bids and premium rents.',
        'Medical office is the second standout. Methodist Stone Oak Hospital\'s continued expansion plus specialty practice clustering keeps medical building absorption strong. Office in general is solid — professional and corporate office sits at 10-12% vacancy with $24–28/SF gross asking rents, decent leasing velocity.',
      ],
      servicesIntro: [
        'CRECO\'s North Central SA practice is heaviest in retail leasing (tenant + landlord) and medical office across the Methodist Stone Oak ecosystem. We work with retail tenants seeking pad sites and endcaps in primary growth centers, and we handle owner-side leasing for landlords across the strongest grocery-anchored centers.',
        'For investors, the underwriting story here is durable demographic growth that supports cap-rate compression on quality retail and medical-office product over 5-10 year holds. We provide investment-sale advisory and 1031 coordination across the corridor.',
      ],
      submarkets: [
        { name: 'Stone Oak Parkway / 281',     characterization: 'Premium retail + medical',          description: 'The Stone Oak Parkway / US 281 commercial spine. Strong grocery-anchored retail, medical office, and professional services.' },
        { name: 'Sonterra / Encino Park',      characterization: 'Mature retail + Class A office',    description: 'The Sonterra master-planned core. Mature retail, established office, and continued mixed-use development.' },
        { name: 'TPC Parkway / Cibolo Canyons', characterization: 'Emerging mixed-use + retail',      description: 'Newer growth corridor anchored by the JW Marriott. Emerging retail, hospitality, and residential.' },
        { name: 'Bulverde Road North',         characterization: 'Retail + service-driven',           description: 'The northern arc into the Hill Country gateway. Continued retail and service-business growth.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-retail-leasing-fundamentals-2026', category: 'Owner Strategy', title: 'Texas Retail Leasing Fundamentals 2026' },
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'multi-property-owner-strategy', category: 'Investor Strategy', title: 'Multi-Property Owner Strategy' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  // ───────────────────────── HILL COUNTRY ─────────────────────────
  {
    slug: 'new-braunfels',
    parentMetro: 'hill-country',
    shortLabel: 'New Braunfels',
    tagline: 'I-35 corridor\'s fastest-growing Hill Country market',
    metaTitle: 'New Braunfels Commercial Real Estate | Retail, Industrial, Office | CRECO',
    metaDescription:
      'New Braunfels commercial real estate — the I-35 corridor\'s fastest-growing Hill Country market between Austin and San Antonio. Retail, industrial, office, and investment advisory from CRECO.',
    keywords: [
      'new braunfels commercial real estate',
      'new braunfels retail for lease',
      'new braunfels industrial',
      'new braunfels warehouse',
      'comal county commercial property',
      'i-35 corridor commercial',
      'new braunfels office space',
      'gruene commercial real estate',
    ],
    config: {
      city: 'New Braunfels',
      cityShort: 'New Braunfels',
      heroEyebrow: 'Texas Hill Country · Comal County',
      heroTitle: 'New Braunfels commercial real estate — the I-35 corridor\'s breakout Hill Country market.',
      heroSubhead:
        'Retail, industrial, office, and investment property across New Braunfels — one of the fastest-growing small-mid cities in America, anchored by I-35 between Austin and San Antonio. Strong retail demand, expanding industrial inventory, and a mature Class B office base. CRECO covers tenant rep, owner services, and investment sales across Comal County.',
      marketStats: [
        { label: 'Population growth',     value: 'Top 5',       context: 'fastest-growing US cities its size' },
        { label: 'Retail vacancy',        value: '~5%',         context: 'tightest in primary growth centers' },
        { label: 'Industrial inventory',  value: 'Growing',     context: 'I-35 corridor absorption strong' },
        { label: 'Hospitality demand',    value: 'Strong',      context: 'Schlitterbahn + Gruene draw' },
      ],
      marketIntro: [
        'New Braunfels has been one of America\'s fastest-growing cities its size for a decade running. Population growth driven by the I-35 corridor between Austin and San Antonio, hospitality and lifestyle appeal (Gruene, Schlitterbahn, the Comal and Guadalupe rivers), and an increasingly diverse local economy. The result is a CRE market that\'s emerged from "small-town Texas" into a real submarket with depth across retail, industrial, and office.',
        'Retail is the dominant story. Grocery-anchored centers (HEB, HEB plus, Whole Earth Provision adjacencies) run at 95%+ occupancy. The Creekside Town Center and the I-35 commercial frontage between New Braunfels and San Marcos absorb new retail product as fast as it can be built. Restaurant and lifestyle tenants pay premium rents for pad sites with good visibility.',
        'Industrial is the emerging story. The I-35 corridor between Austin and San Antonio is one of the most-watched industrial growth corridors in Texas — new bulk distribution, small-bay manufacturing, and flex parks have delivered or are under construction across the New Braunfels-Schertz-Cibolo arc. Rents and absorption remain strong. Office is more modest — Class B professional office for local services, growing but not institutional-grade.',
      ],
      servicesIntro: [
        'CRECO\'s New Braunfels practice is heaviest in retail tenant rep and owner-side leasing, plus I-35 corridor industrial. We work with retail tenants on pad sites and endcaps in primary growth centers, and we represent industrial users sourcing space across the broader San Marcos-New Braunfels-Schertz corridor.',
        'For investors, the New Braunfels growth story is one of the most durable in Texas — demographic-driven demand that should sustain cap-rate compression on quality retail and industrial product over the next decade. We provide investment-sale advisory and 1031 coordination focused on the corridor.',
      ],
      submarkets: [
        { name: 'I-35 Commercial Frontage',     characterization: 'Retail + hospitality',          description: 'The dense commercial spine along I-35 through New Braunfels. Strong retail, restaurants, and hospitality presence.' },
        { name: 'Creekside Town Center',        characterization: 'Mixed-use retail',              description: 'The Creekside development — anchored mixed-use with strong retail and lifestyle tenant draw.' },
        { name: 'I-35 Industrial Corridor',    characterization: 'Industrial + flex',             description: 'Bulk distribution and flex industrial along the I-35 corridor — including the broader San Marcos-Schertz growth arc.' },
        { name: 'Gruene + Downtown New Braunfels', characterization: 'Lifestyle + tourism retail', description: 'Historic Gruene district and downtown — hospitality, specialty retail, and tourism-driven commerce.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-retail-leasing-fundamentals-2026', category: 'Owner Strategy', title: 'Texas Retail Leasing Fundamentals 2026' },
        { slug: 'texas-industrial-warehouse-leasing-2026', category: 'Tenant Strategy', title: 'Texas Industrial Warehouse Leasing 2026' },
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  // ───────────────────────── AUSTIN — Round 2 ─────────────────────────
  {
    slug: 'east-austin',
    parentMetro: 'austin',
    shortLabel: 'East Austin',
    tagline: 'Creative office, premium retail, and adaptive-reuse industrial',
    metaTitle: 'East Austin Commercial Real Estate | Creative Office, Retail | CRECO',
    metaDescription:
      'East Austin commercial real estate — creative office, premium retail, restaurants, and adaptive-reuse industrial across one of the highest-demand submarkets in Texas. Tenant rep + owner services from CRECO.',
    keywords: [
      'east austin commercial real estate',
      'east austin office space',
      'east austin retail for lease',
      'east austin creative office',
      'east 6th commercial property',
      'east austin warehouse',
      'east austin industrial conversion',
      'adaptive reuse austin',
      'east cesar chavez retail',
    ],
    config: {
      city: 'East Austin',
      cityShort: 'East Austin',
      heroEyebrow: 'Austin Metro · East Side',
      heroTitle: 'East Austin commercial real estate — Texas\'s most-watched creative-class submarket.',
      heroSubhead:
        'Creative office, premium retail, restaurants, and adaptive-reuse industrial across East Austin — anchored by East 6th, East Cesar Chavez, the Mueller redevelopment, and a continued wave of warehouse-to-flex conversions. The Austin commercial real estate submarket most reflective of the city\'s identity, and increasingly its highest-rent retail and most-sought creative office.',
      marketStats: [
        { label: 'Class A creative office rents', value: '$44–58/SF', context: 'gross, premium adaptive-reuse' },
        { label: 'Retail vacancy (top corridors)', value: '~4%',     context: 'East 6th, Cesar Chavez tight' },
        { label: 'Adaptive-reuse pipeline',        value: 'Active',   context: 'warehouse-to-flex conversions ongoing' },
        { label: 'Daytime employment growth',      value: '+8%/yr',   context: 'creative-class concentration' },
      ],
      marketIntro: [
        'East Austin is the most distinctive commercial real estate submarket in Texas. What started as a working-class industrial and residential neighborhood east of I-35 has become Austin\'s creative-class commercial core — restaurants, boutique retail, breweries, creative office, and adaptive-reuse flex space. Every other Austin commercial submarket has peers in other Texas cities. East Austin\'s closest comparison is the Bowery, RiNo, or East Williamsburg — not anywhere else in Texas.',
        'For commercial tenants, East Austin works two ways. Creative office tenants (design firms, agencies, software companies in the 5K–25K SF range) pay a premium to be here because it\'s where their talent wants to work. Retail tenants in the East 6th and East Cesar Chavez corridors lease at rents comparable to The Domain because pedestrian and evening traffic deliver volume. Industrial users, increasingly, find themselves priced out — most of the warehouse space has been converted to creative office or mixed-use.',
        'The 2026 story is continued rent push at the top of the market and tightening supply. New ground-up commercial development is constrained by zoning and lot configurations. Adaptive-reuse conversions of remaining industrial product continue. Investor demand is among the strongest in Texas for any commercial real estate submarket — multiple bids on every quality East Austin commercial sale.',
      ],
      servicesIntro: [
        'CRECO\'s East Austin commercial real estate practice covers creative office tenant representation, premium retail leasing on the corridor stretches, and investment-sale advisory for the increasingly institutional buyer pool active here. Adaptive-reuse strategy — buying older industrial, converting to creative office or mixed-use — is one of the most-asked-about advisory engagements in the East Austin market and we work with both owner-users and value-add investors on those plays.',
        'For retail tenants seeking East 6th, Cesar Chavez, or Mueller-area space, the rent premium demands disciplined deal structure. We negotiate TI, percentage-rent floors, and exit-option flexibility that protects tenant economics even when the market peaks.',
      ],
      submarkets: [
        { name: 'East 6th Street',          characterization: 'Premium retail + entertainment',   description: 'Walking-traffic retail and restaurant spine. Premium rents, multiple-bid leasing on every quality endcap.' },
        { name: 'East Cesar Chavez',        characterization: 'Mixed-use retail + creative office', description: 'Mixed-use retail with growing creative-office adaptive-reuse. Rapidly maturing commercial corridor.' },
        { name: 'Mueller Redevelopment',    characterization: 'Master-planned mixed-use',           description: 'The Mueller airport-redevelopment master plan. Class A office, walkable retail, dense residential.' },
        { name: 'East Austin Industrial Corridor', characterization: 'Adaptive-reuse + remaining flex', description: 'The older industrial spine — what remains, plus active adaptive-reuse conversion to creative office and mixed-use.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'texas-retail-leasing-fundamentals-2026', category: 'Owner Strategy', title: 'Texas Retail Leasing Fundamentals 2026' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  {
    slug: 'pflugerville',
    parentMetro: 'austin',
    shortLabel: 'Pflugerville',
    tagline: 'I-35 industrial growth corridor + suburban retail',
    metaTitle: 'Pflugerville Commercial Real Estate | Industrial, Retail, Office | CRECO',
    metaDescription:
      'Pflugerville commercial real estate — northeast Austin\'s industrial growth corridor, anchored by the I-35 logistics spine and the Samsung-Taylor adjacency. Industrial leasing, retail, and investment advisory from CRECO.',
    keywords: [
      'pflugerville commercial real estate',
      'pflugerville industrial space',
      'pflugerville warehouse for lease',
      'pflugerville retail',
      'pflugerville commercial property for sale',
      'travis county industrial commercial',
      'i-35 austin north industrial',
      'pflugerville flex space',
    ],
    config: {
      city: 'Pflugerville',
      cityShort: 'Pflugerville',
      heroEyebrow: 'Austin Metro · Travis County NE',
      heroTitle: 'Pflugerville commercial real estate — Austin\'s northeastern industrial growth corridor.',
      heroSubhead:
        'Industrial, flex, retail, and emerging office across Pflugerville — the I-35 commercial real estate logistics corridor between Austin and Round Rock. Strong absorption from e-commerce, last-mile distribution, and Samsung-Taylor supplier-ecosystem tenants. CRECO covers industrial leasing, retail, and investment advisory across the corridor.',
      marketStats: [
        { label: 'Industrial absorption',     value: 'Strong',     context: 'e-comm + Samsung-Taylor supply chain' },
        { label: 'Class A industrial rents',  value: '$9.50–12/SF', context: 'NNN, bulk + small-bay' },
        { label: 'Retail vacancy',            value: '~6%',         context: 'tightening as residential grows' },
        { label: 'Population growth',         value: '+4%/yr',      context: 'one of fastest-growing Austin suburbs' },
      ],
      marketIntro: [
        'Pflugerville is the working commercial real estate submarket of northeast Austin. Less glamorous than the Domain or East Austin, but anchored by a real industrial economy along the I-35 corridor and increasingly part of the Samsung-Taylor megafab supplier ecosystem. Strong logistics, light manufacturing, and a growing retail base driven by suburban residential growth.',
        'Industrial is the dominant commercial story. Bulk distribution (75K–200K SF) along the I-35 corridor leases steadily to e-commerce 3PLs, last-mile carriers, and supply-chain players. Small-bay industrial (10K–40K SF) is genuinely tight — limited supply, strong tenant demand from local businesses and Samsung-supplier operations. Class A industrial rents in the corridor run $9.50–12/SF NNN with sustained 92%+ occupancy.',
        'Retail follows the residential growth. Grocery-anchored centers along Pflugerville Parkway, FM 685, and the Stone Hill corridor run at 4-6% vacancy with steady rent push. Restaurants and discount apparel lease quickly. Office is more limited — Class B suburban professional office for local services, with sub-15% vacancy and reasonable concessions.',
      ],
      servicesIntro: [
        'CRECO\'s Pflugerville commercial real estate practice is heaviest in industrial leasing and owner-user sales. We work with industrial tenants in the 10K–150K SF range seeking I-35 corridor space, including the supplier-ecosystem operations supporting Samsung-Taylor. Owner-side, we handle leasing for landlords and investment-sale advisory for value-add and stabilized industrial product.',
        'For retail, we work both tenant and landlord side across the growth-corridor centers. The combination of residential growth, durable demographic profile, and limited new development pipeline makes Pflugerville retail a solid long-hold commercial investment story for buyers seeking stable suburban Texas exposure.',
      ],
      submarkets: [
        { name: 'I-35 Industrial Corridor',   characterization: 'Bulk + small-bay industrial', description: 'The I-35 commercial logistics spine. Bulk distribution and small-bay flex serving e-comm, last-mile, and Samsung-supplier operations.' },
        { name: 'Pflugerville Parkway',       characterization: 'Suburban retail + service',    description: 'The east-west retail spine through Pflugerville. Grocery-anchored centers, restaurants, and professional services.' },
        { name: 'Stone Hill Town Center',     characterization: 'Power-center retail',          description: 'The dominant retail node — big-box, grocery, and lifestyle retail anchoring the broader trade area.' },
        { name: 'FM 685 / Cele Corridor',     characterization: 'Emerging industrial + flex',   description: 'Newer industrial pipeline along FM 685 and into the broader Cele growth area. Speculative bulk + flex coming online.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-industrial-warehouse-leasing-2026', category: 'Tenant Strategy', title: 'Texas Industrial Warehouse Leasing 2026' },
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'texas-1031-exchange-strategy', category: 'Investor Strategy', title: '1031 Exchange Strategy for Texas Commercial Property Owners' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  // ───────────────────────── DFW — Round 2 ─────────────────────────
  {
    slug: 'allen-mckinney',
    parentMetro: 'dallas-fort-worth',
    shortLabel: 'Allen & McKinney',
    tagline: 'North Collin County\'s next commercial-growth wave',
    metaTitle: 'Allen & McKinney Commercial Real Estate | Retail, Office, Industrial | CRECO',
    metaDescription:
      'Allen and McKinney commercial real estate — north Collin County\'s next-wave commercial growth corridor. Retail anchored by Watters Creek and McKinney Town Center, growing office, and emerging industrial. Tenant rep + owner services from CRECO.',
    keywords: [
      'allen commercial real estate',
      'mckinney commercial real estate',
      'allen retail for lease',
      'mckinney office space',
      'watters creek leasing',
      'mckinney warehouse',
      'allen industrial commercial',
      'north collin county commercial property',
    ],
    config: {
      city: 'Allen & McKinney',
      cityShort: 'Allen & McKinney',
      heroEyebrow: 'Dallas–Fort Worth · Collin County North',
      heroTitle: 'Allen and McKinney commercial real estate — north Collin County\'s commercial-growth wave.',
      heroSubhead:
        'Retail, office, and emerging industrial commercial real estate across Allen and McKinney — north Collin County\'s next-wave growth submarket. Anchored by Watters Creek at Montgomery Farm (Allen), McKinney\'s historic downtown and Town Center, and a continued residential pipeline that\'s pushing CRE demand north of the Frisco/Plano mature cores.',
      marketStats: [
        { label: 'Retail vacancy',         value: '~5%',          context: 'tightest in lifestyle + grocery-anchored' },
        { label: 'Population growth',      value: '+4-6%/yr',     context: 'Allen + McKinney combined' },
        { label: 'Class A retail rents',   value: '$32–42/SF',    context: 'NNN, lifestyle + power centers' },
        { label: 'Median HH income',       value: '$115K+',       context: 'top-tier DFW demographics' },
      ],
      marketIntro: [
        'Allen and McKinney are the next wave of north Collin County\'s commercial real estate growth. Frisco and Plano are the mature cores; Allen and McKinney are 5-10 years behind on the same trajectory. The commercial retail story is already mature — Watters Creek, McKinney Town Center, and the broader Highway 75 (US 75) commercial corridor run at low-single-digit vacancy with strong rent push. Office is emerging. Industrial is small but real along the eastern side toward Princeton and Anna.',
        'The 2026 catalyst is continued residential growth. Allen and McKinney each add 4-6% population per year. The commercial trade areas keep expanding, and the daytime employment base grows with each new corporate satellite or healthcare expansion. The combination of demographic strength, retail tightness, and lower entry costs vs Frisco/Plano makes these markets among the most-recommended for retail and small-office commercial investors in DFW.',
        'For commercial tenants, Allen and McKinney work well for retail (especially restaurant, service, and grocery-adjacent) and growing professional office. The combination of demographic strength and affordable rents vs Frisco/Plano makes them strong picks for businesses serving the north DFW residential base.',
      ],
      servicesIntro: [
        'CRECO\'s Allen / McKinney commercial real estate practice is heaviest in retail leasing — both tenant rep and owner-side. We work the Watters Creek and McKinney Town Center corridors plus the broader Highway 75 retail spine. For office tenants, we focus on the emerging Class B professional inventory growing across both cities.',
        'On the investment side, the Allen / McKinney corridor is one of the most-recommended DFW retail and small-office commercial buy opportunities for investors seeking growth-corridor exposure at better entry pricing than Frisco or Plano can offer.',
      ],
      submarkets: [
        { name: 'Watters Creek at Montgomery Farm', characterization: 'Premium retail + lifestyle', description: 'Allen\'s premier lifestyle commercial retail center. Strong restaurant and specialty retail tenant mix, daytime + evening traffic.' },
        { name: 'McKinney Town Center',             characterization: 'Mixed-use + downtown retail',  description: 'McKinney\'s historic downtown plus the surrounding mixed-use commercial. Strong restaurant, specialty retail, and growing office.' },
        { name: 'Highway 75 / US 75 Corridor',       characterization: 'Retail + service-driven',     description: 'The dominant commercial retail spine. Grocery-anchored centers, big-box, and professional services along US 75.' },
        { name: 'East Allen / McKinney Industrial', characterization: 'Emerging industrial + flex',   description: 'The eastern side of both cities — toward Princeton, Anna, and the broader Collin County growth arc. Industrial and flex emerging.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-retail-leasing-fundamentals-2026', category: 'Owner Strategy', title: 'Texas Retail Leasing Fundamentals 2026' },
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  {
    slug: 'fort-worth-downtown',
    parentMetro: 'dallas-fort-worth',
    shortLabel: 'Fort Worth Downtown',
    tagline: 'Mature urban Class A office + Sundance Square retail',
    metaTitle: 'Fort Worth Downtown Commercial Real Estate | Class A Office, Retail | CRECO',
    metaDescription:
      'Fort Worth Downtown commercial real estate — mature urban Class A office, Sundance Square retail, and a continued investment-sale and adaptive-reuse commercial pipeline. Tenant rep + owner services from CRECO.',
    keywords: [
      'fort worth downtown commercial real estate',
      'fort worth office space',
      'sundance square retail',
      'downtown fort worth class a office',
      'tarrant county commercial real estate',
      'fort worth mixed-use commercial',
      'downtown fort worth investment',
      'fort worth commercial property for sale',
    ],
    config: {
      city: 'Fort Worth Downtown',
      cityShort: 'Fort Worth Downtown',
      heroEyebrow: 'Dallas–Fort Worth · Tarrant County',
      heroTitle: 'Fort Worth Downtown commercial real estate — the strongest urban submarket in Tarrant County.',
      heroSubhead:
        'Class A office, Sundance Square retail, hospitality, and continued adaptive-reuse mixed-use commercial real estate across downtown Fort Worth — the most walkable, most-watched urban CRE submarket in Tarrant County. CRECO works tenant-side and owner-side across the corridor.',
      marketStats: [
        { label: 'Class A office rents', value: '$28–36/SF',  context: 'gross, trophy downtown' },
        { label: 'Office vacancy',       value: '~17%',       context: 'Class A trophy notably tighter' },
        { label: 'Sundance Square retail vacancy', value: '<5%', context: 'walkable urban core full' },
        { label: 'Adaptive-reuse pipeline',  value: 'Active',  context: 'office-to-residential ongoing' },
      ],
      marketIntro: [
        'Fort Worth Downtown is the most underrated urban commercial real estate submarket in Texas. While Dallas Uptown gets the headlines, Fort Worth\'s downtown has quietly built a walkable mixed-use ecosystem anchored by Sundance Square, an emerging trophy-office story, and one of the strongest convention-and-hospitality bases in the state. The result: commercial rents that look modest by Dallas comparison but deliver durable demand from local corporate, energy-sector, and growing professional services tenants.',
        'Office in 2026 follows the broader bifurcation. Class A trophy buildings around Sundance Square and the immediate downtown core hold rents and stay reasonably full. Older Class B office along the downtown periphery sees deeper vacancy and meaningful concessions. The adaptive-reuse pipeline is real and growing — multiple downtown office buildings are converting to residential or mixed-use, which gradually tightens the remaining office inventory.',
        'Retail at Sundance Square and the immediate downtown core runs at sub-5% vacancy. Restaurant and specialty retail tenants pay premium rents for walking-traffic commercial locations. Hospitality is one of the strongest convention markets in Texas — adjacent retail and food-and-beverage benefit from the convention-driven daytime + evening volume.',
      ],
      servicesIntro: [
        'CRECO\'s Fort Worth Downtown commercial real estate practice covers Class A office tenant representation, premium retail and restaurant leasing at Sundance Square and the surrounding walkable core, and investment-sale advisory for mixed-use, hospitality-adjacent, and adaptive-reuse opportunities.',
        'For corporate tenants evaluating downtown Fort Worth commercial space, we work the bifurcation aggressively — trophy Class A holds value but well-negotiated Class B in downtown still represents real opportunity for cost-conscious users. For investors, the adaptive-reuse pipeline (office-to-residential, office-to-hospitality) is an active area where we provide acquisition advisory.',
      ],
      submarkets: [
        { name: 'Sundance Square',         characterization: 'Walkable retail + office',          description: 'The walking-traffic commercial core. Premium retail, restaurants, and Class A office. Lowest vacancy in downtown.' },
        { name: 'Burnett Plaza Corridor',  characterization: 'Class A office',                    description: 'The trophy office concentration. Major corporate tenants, mixed-use first floors, and convention proximity.' },
        { name: 'West 7th',                 characterization: 'Mixed-use + lifestyle retail',       description: 'Adjacent walkable mixed-use commercial district. Strong restaurant and lifestyle retail draw, growing office.' },
        { name: 'Downtown Periphery',       characterization: 'Adaptive-reuse + value office',     description: 'Older office building stock, much of it pipeline-eligible for residential or hospitality conversion. Value-add territory.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'multi-property-owner-strategy', category: 'Investor Strategy', title: 'Multi-Property Owner Strategy' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  // ───────────────────────── HOUSTON — Round 2 ─────────────────────────
  {
    slug: 'energy-corridor',
    parentMetro: 'houston',
    shortLabel: 'Energy Corridor',
    tagline: 'Houston\'s corporate-office concentration along I-10 West',
    metaTitle: 'Houston Energy Corridor Commercial Real Estate | Class A Office | CRECO',
    metaDescription:
      'Houston Energy Corridor commercial real estate — the I-10 West corporate-office concentration anchored by BP, Shell, ExxonMobil supplier operations, and the broader energy sector. Class A office, supporting retail, and investment-sale advisory from CRECO.',
    keywords: [
      'energy corridor commercial real estate',
      'energy corridor office space',
      'houston i-10 west commercial',
      'energy corridor class a office',
      'memorial city commercial real estate',
      'west houston corporate office',
      'bp america office',
      'houston energy sector commercial real estate',
    ],
    config: {
      city: 'Houston Energy Corridor',
      cityShort: 'Energy Corridor',
      heroEyebrow: 'Houston Metro · I-10 West',
      heroTitle: 'Houston Energy Corridor commercial real estate — the West Houston corporate-office concentration.',
      heroSubhead:
        'Class A office, supporting retail, and emerging mixed-use commercial real estate along Houston\'s Energy Corridor — the I-10 West corporate-office concentration anchored by BP America, Shell, ExxonMobil supplier-ecosystem operations, and the broader energy-sector employment base. CRECO works tenant-side and owner-side across the corridor.',
      marketStats: [
        { label: 'Class A office rents',     value: '$22–30/SF', context: 'gross, deep concessions on offer' },
        { label: 'Office vacancy',           value: '~24%',       context: 'softest major Houston office submarket' },
        { label: 'TI + free-rent packages',  value: 'Aggressive', context: 'multi-year highs for tenants' },
        { label: 'Energy-sector concentration', value: 'Top US', context: 'corporate employment dense' },
      ],
      marketIntro: [
        'The Houston Energy Corridor is the most tenant-favorable Class A office commercial real estate submarket in Texas. Energy-sector consolidation, the 2014-2020 oil downturn, and the broader corporate-footprint compression since 2022 have left the corridor with sustained vacancy in the 22-26% range. Class A buildings that would have leased at $32+/SF gross in 2014 are now signing tenants at $22-28/SF with free-rent packages of 9-18 months and TI in the $50-80/SF range. For commercial tenants seeking quality Class A office at meaningfully below-market economics, the Energy Corridor is the strongest play in Texas right now.',
        'The commercial story isn\'t uniformly bleak. Trophy Class A in the immediate Memorial City and Energy Corridor master-planned core (Park Ten, Eldridge, near the West Sam Houston Tollway) holds value better than mid-tier buildings further out. Tenants who want a corporate-park experience (campus, parking, amenities) at concession-driven economics find the corridor uniquely attractive. The energy sector itself stabilized in 2024-25 and is no longer the bleed source it was earlier in the decade.',
        'Retail along the I-10 West commercial corridor (Memorial City Mall trade area, Town and Country Village adjacency) runs at healthier vacancy with steady tenant base. Industrial is small but real — small-bay flex serving local services and energy-supplier operations.',
      ],
      servicesIntro: [
        'CRECO\'s Energy Corridor commercial real estate practice is heaviest in Class A office tenant representation. For corporate tenants — energy or otherwise — willing to commit to the corridor, the concession environment is the strongest in Texas. Well-structured 7-10 year deals lock in below-market economics for the rest of the cycle.',
        'On the owner side, our work centers on investment-sale advisory for distressed and value-add office commercial real estate, plus repositioning strategy for owners considering conversion plays or major capex-driven retenanting.',
      ],
      submarkets: [
        { name: 'Memorial City',              characterization: 'Mixed-use + Class A office',     description: 'Memorial City Mall + surrounding Class A office. Mixed-use commercial density, healthcare presence, residential adjacency.' },
        { name: 'Park Ten Corporate Park',    characterization: 'Master-planned corporate office', description: 'The Energy Corridor\'s master-planned commercial office core. Campus-style Class A, amenitized, supporting energy-sector tenants.' },
        { name: 'Eldridge Parkway Corridor',  characterization: 'Class A + Class B office',       description: 'Major office commercial corridor through the Energy Corridor. Mix of trophy and value-rent product, concessions available.' },
        { name: 'West Sam Houston Tollway',   characterization: 'Suburban office + retail',       description: 'Western edge of the Energy Corridor. Office + suburban retail serving the energy-corridor workforce.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
        { slug: 'multi-property-owner-strategy', category: 'Investor Strategy', title: 'Multi-Property Owner Strategy' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  {
    slug: 'galleria',
    parentMetro: 'houston',
    shortLabel: 'Galleria / Uptown Houston',
    tagline: 'Houston\'s trophy office + premium retail commercial core',
    metaTitle: 'Houston Galleria Commercial Real Estate | Class A Office, Premium Retail | CRECO',
    metaDescription:
      'Houston Galleria / Uptown commercial real estate — the city\'s trophy Class A office + premium retail commercial core. Tenant rep, owner services, and investment-sale advisory from CRECO.',
    keywords: [
      'houston galleria commercial real estate',
      'galleria office space',
      'uptown houston class a office',
      'galleria retail for lease',
      'post oak boulevard office',
      'houston trophy commercial office',
      'uptown houston commercial property',
      'galleria area commercial investment',
    ],
    config: {
      city: 'Houston Galleria / Uptown',
      cityShort: 'Galleria',
      heroEyebrow: 'Houston Metro · Uptown',
      heroTitle: 'Houston Galleria and Uptown commercial real estate — the trophy office and premium-retail commercial core of Houston.',
      heroSubhead:
        'Class A trophy office, premium retail, mixed-use, and luxury hospitality commercial real estate across the Galleria / Uptown Houston district — the city\'s densest concentration of Fortune 500 offices, high-end retail, and walking-traffic urban CRE. CRECO covers tenant rep, owner services, and investment-sale advisory across Post Oak Boulevard and the surrounding district.',
      marketStats: [
        { label: 'Trophy Class A office rents',  value: '$36–48/SF',  context: 'gross, Post Oak Blvd premium' },
        { label: 'Galleria retail rents',        value: '$60–95/SF',  context: 'NNN, premium ground-floor' },
        { label: 'Office vacancy (trophy)',       value: '~11%',       context: 'tighter than Houston overall' },
        { label: 'Fortune 500 corporate density', value: 'Top 5 US',   context: 'Houston submarket concentration' },
      ],
      marketIntro: [
        'The Galleria / Uptown Houston district is the city\'s trophy commercial real estate concentration. Post Oak Boulevard is the trophy office spine — BG Group Place, Williams Tower, 4 Houston Center adjacency, San Felipe Plaza, and dozens of other Class A commercial buildings clustered in a dense, walkable urban core. The Galleria itself anchors the premium retail story — the second-largest mall in Texas, surrounded by luxury retail, fine dining, and luxury hospitality (Post Oak Hotel, St. Regis, JW Marriott).',
        'Office in 2026 holds reasonably firm at the trophy level. Class A trophy commercial buildings in the immediate Post Oak Boulevard core see 9-12% vacancy with rents holding in the $36-48/SF gross range. Class B and older Class A buildings further from the core see deeper vacancy and active concession packages. The trophy premium is real — commercial tenants pay for the location, amenities, and walking-distance to retail and hospitality.',
        'Retail at the Galleria and surrounding walkable corridors runs at premium commercial rents that look more like Manhattan than Houston. Restaurant endcaps with patios lease with multiple bids. Luxury retail and specialty are the most-sought tenant categories. The combination of luxury hospitality, corporate-office daytime population, and surrounding residential affluence (River Oaks, Tanglewood, Memorial-area) sustains it through every cycle.',
      ],
      servicesIntro: [
        'CRECO\'s Galleria / Uptown commercial real estate practice spans Class A trophy office tenant representation, premium retail and restaurant leasing in the Galleria-adjacent corridors, and investment-sale advisory for institutional-grade urban office and mixed-use commercial product.',
        'For corporate tenants, the Galleria trophy ecosystem rewards specific landlord relationships and structured deal negotiation. Even at the trophy tier, the right tenant gets meaningful TI, abatement, and renewal flexibility — but only when the deal is structured properly. Generalist tenant rep misses real value here.',
      ],
      submarkets: [
        { name: 'Post Oak Boulevard',           characterization: 'Trophy Class A office',        description: 'The trophy commercial office spine. Williams Tower, San Felipe Plaza, BG Group, and the broader Class A concentration.' },
        { name: 'The Galleria',                 characterization: 'Premium retail + hospitality',  description: 'The Galleria mall and surrounding luxury commercial retail. Multi-bid leasing on premium ground-floor; restaurants with patios at premium rents.' },
        { name: 'San Felipe Corridor',          characterization: 'Class A office + retail',      description: 'The east-west office spine through Uptown. Mature Class A office mixed with retail and hospitality.' },
        { name: 'Memorial Park Adjacency',      characterization: 'Walkable mixed-use',           description: 'The transitional commercial corridor toward Memorial Park. Growing mixed-use, walkable retail, and emerging Class A.' },
      ],
      whyBullets: [
        'Trophy Class A commercial office tenant + landlord representation experience',
        'Premium retail and restaurant leasing in walkable urban districts',
        'Investment-sale advisory for institutional Houston urban assets',
        'Off-market commercial deal flow through Houston + statewide broker network',
        'Direct broker access — every engagement led by a senior CRECO broker',
        'Corporate-tenant lease structure expertise (large-block, multi-year deals)',
      ],
      relatedInsights: [
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'texas-retail-leasing-fundamentals-2026', category: 'Owner Strategy', title: 'Texas Retail Leasing Fundamentals 2026' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  {
    slug: 'houston-heights',
    parentMetro: 'houston',
    shortLabel: 'The Heights & Inner Loop',
    tagline: 'Houston\'s urban-walkable retail and creative-office commercial submarket',
    metaTitle: 'Houston Heights Commercial Real Estate | Inner Loop Retail, Creative Office | CRECO',
    metaDescription:
      'Houston Heights and Inner Loop commercial real estate — urban-walkable retail, creative office, adaptive-reuse industrial, and one of the strongest restaurant-leasing commercial submarkets in Texas. Tenant rep + owner services from CRECO.',
    keywords: [
      'heights houston commercial real estate',
      'houston heights retail for lease',
      'heights creative office',
      'houston inner loop commercial',
      '19th street retail',
      'heights mixed-use commercial',
      'montrose commercial real estate',
      'rice village retail',
    ],
    config: {
      city: 'The Heights & Inner Loop Houston',
      cityShort: 'The Heights',
      heroEyebrow: 'Houston Metro · Inner Loop',
      heroTitle: 'The Heights and Inner Loop Houston commercial real estate — urban-walkable retail, creative office, and Texas\'s strongest restaurant-leasing market.',
      heroSubhead:
        'Retail, creative office, restaurants, and adaptive-reuse mixed-use commercial real estate across Houston\'s Inner Loop — anchored by The Heights, Montrose, Rice Village, and the Washington Avenue corridor. Walkable urban density, premium retail rents, and growing creative-office commercial demand. CRECO works tenant-side and owner-side across the Inner Loop.',
      marketStats: [
        { label: 'Premium retail rents',          value: '$44–58/SF', context: 'NNN, 19th Street / Rice Village' },
        { label: 'Restaurant endcap demand',       value: 'Strongest', context: 'multi-bid leasing common' },
        { label: 'Creative office rents',          value: '$32–44/SF', context: 'gross, adaptive-reuse premium' },
        { label: 'Inner Loop daytime population',  value: 'Densest',   context: 'Houston metro density leader' },
      ],
      marketIntro: [
        'Houston\'s Inner Loop is the urban-walkable commercial real estate submarket Texas has been waiting for. The Heights, Montrose, Rice Village, and the Washington Avenue corridor together form a dense, pedestrian-friendly mixed-use commercial ecosystem that\'s closer in feel to Brooklyn or Chicago than typical Houston. The retail story is the dominant one — restaurant, specialty retail, and lifestyle tenants compete for endcaps at rents that look more like premium urban markets than suburban Texas.',
        '19th Street in The Heights is the most-watched retail corridor — a walking-traffic main street with multi-bid leasing on every available endcap and rents in the $44-58/SF NNN range. Rice Village delivers similar dynamics with a slightly more affluent demographic profile. Washington Avenue is the evening-traffic corridor, especially for restaurant and bar concepts. Montrose blends specialty retail, restaurants, and creative office.',
        'Office is the smaller but emerging commercial story. Creative-class adaptive reuse of older warehouse and commercial buildings in the Heights and adjacent areas delivers Class A creative office at premium gross rents. Tenants are typically agencies, design firms, mid-stage software, and professional services that prioritize walkable urban locations for hiring. Industrial conversion to flex/creative office continues across the Inner Loop.',
      ],
      servicesIntro: [
        'CRECO\'s Inner Loop commercial real estate practice is heaviest in retail and restaurant leasing — both tenant and landlord side — across the 19th Street, Rice Village, Washington Avenue, and Montrose corridors. We also represent creative-office tenants seeking adaptive-reuse space and provide investment-sale advisory for the increasingly institutional buyer pool active in the submarket.',
        'For retail tenants targeting any of the Inner Loop corridors, deal structure matters because the rents are premium. We negotiate TI, percentage-rent floors, and exit-option flexibility that protect tenant economics through cycle turns.',
      ],
      submarkets: [
        { name: '19th Street Heights',          characterization: 'Walking-traffic retail',      description: 'The main commercial retail spine through The Heights. Multi-bid leasing, restaurants, specialty retail, and lifestyle.' },
        { name: 'Rice Village',                 characterization: 'Premium retail + restaurant',  description: 'Affluent urban-walkable commercial retail district near Rice University. Premium ground-floor rents, multi-bid restaurant leasing.' },
        { name: 'Washington Avenue Corridor',   characterization: 'Restaurant + nightlife',        description: 'Evening-traffic commercial corridor anchored by restaurant and bar concepts. Strong leasing velocity in food-and-beverage.' },
        { name: 'Montrose',                     characterization: 'Mixed-use + specialty retail',  description: 'Eclectic mixed-use commercial district. Specialty retail, restaurants, creative office, and continued adaptive-reuse activity.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-retail-leasing-fundamentals-2026', category: 'Owner Strategy', title: 'Texas Retail Leasing Fundamentals 2026' },
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  // ───────────────────────── SAN ANTONIO — Round 2 ─────────────────────────
  {
    slug: 'northwest-san-antonio',
    parentMetro: 'san-antonio',
    shortLabel: 'NW San Antonio',
    tagline: 'San Antonio\'s commercial spine — USAA, UTSA, and the medical center',
    metaTitle: 'Northwest San Antonio Commercial Real Estate | Office, Retail, Medical | CRECO',
    metaDescription:
      'Northwest San Antonio commercial real estate — the commercial spine of SA, anchored by USAA, UTSA, the South Texas Medical Center, and the Loop 1604 / I-10 commercial office and retail concentration. Tenant rep + owner services from CRECO.',
    keywords: [
      'northwest san antonio commercial real estate',
      'nw san antonio office space',
      'south texas medical center commercial',
      'usaa area office',
      'loop 1604 commercial',
      'utsa area commercial real estate',
      'nw san antonio retail',
      'la cantera commercial',
    ],
    config: {
      city: 'Northwest San Antonio',
      cityShort: 'NW San Antonio',
      heroEyebrow: 'San Antonio Metro · Bexar County NW',
      heroTitle: 'Northwest San Antonio commercial real estate — the commercial spine of the SA metro.',
      heroSubhead:
        'Office, retail, medical, and supporting industrial commercial real estate across NW San Antonio — anchored by USAA\'s campus, UTSA, the South Texas Medical Center, and the Loop 1604 / I-10 commercial concentration. The densest commercial-employment submarket in the SA metro. CRECO works tenant-side and owner-side across the corridor.',
      marketStats: [
        { label: 'Class A office rents',     value: '$26–32/SF', context: 'gross, Loop 1604 premium' },
        { label: 'Office vacancy',           value: '~16%',       context: 'with Class B concessions on offer' },
        { label: 'Medical office demand',     value: 'Strong',     context: 'STMC + Methodist expansion' },
        { label: 'Daytime employment',        value: 'Top 1',      context: 'densest in the SA metro' },
      ],
      marketIntro: [
        'Northwest San Antonio is the commercial-employment center of the SA metro. USAA\'s 16,000-employee campus, UTSA\'s ~32,000 students and supporting commercial ecosystem, the South Texas Medical Center\'s sprawling healthcare cluster, and the Loop 1604 / I-10 office concentration together form the largest commercial real estate submarket in San Antonio. For tenants seeking office, medical, or supporting retail near a deep employment base, this is the default starting point in SA.',
        'Office in 2026 is bifurcated like everywhere else. Class A trophy along Loop 1604 (Sonterra-adjacent, La Cantera, the immediate UTSA corridor) holds rents in the $26-32/SF gross range with 10-13% vacancy. Class B and older Class A further out sees 18-22% vacancy with meaningful TI and abatement packages on offer. The bifurcation creates real commercial opportunity for cost-conscious tenants who don\'t require trophy amenities.',
        'Medical office along the STMC commercial corridor is genuinely tight. Methodist, Christus Santa Rosa, and University Health expansions plus the broader specialty-practice clustering keep medical building absorption strong with rents at premium to general office. Retail across NW SA runs at low single-digit vacancy in primary growth centers (La Cantera, Huebner Oaks, Bandera Pointe).',
      ],
      servicesIntro: [
        'CRECO\'s NW San Antonio commercial real estate practice covers office leasing across the full quality spectrum — Class A trophy through Class B value-rent product — plus medical office across the STMC ecosystem and retail across the primary growth centers. We work both tenant and owner side, with deep relationships across the major NW SA landlords and broker network.',
        'For office tenants, the bifurcation creates real opportunity. We help tenants pick the right submarket within NW SA (Loop 1604 vs UTSA vs STMC adjacency) and structure terms that capture the current concession environment. For medical tenants, the STMC corridor rewards specific landlord relationships — we know who\'s building new commercial product and who has space coming available.',
      ],
      submarkets: [
        { name: 'Loop 1604 / La Cantera',       characterization: 'Class A office + premium retail', description: 'The trophy office + retail commercial concentration. La Cantera mall, Class A office, walking-distance retail and dining.' },
        { name: 'South Texas Medical Center',   characterization: 'Medical office + healthcare',     description: 'The dense healthcare commercial cluster. Specialty practices, surgical centers, supporting healthcare administration.' },
        { name: 'USAA Campus / Fiesta Texas',   characterization: 'Corporate office + retail',        description: 'USAA\'s 16,000-employee campus + surrounding office and retail ecosystem. Strong corporate-services commercial tenancy.' },
        { name: 'UTSA Main Campus / I-10',      characterization: 'University-adjacent + emerging mixed-use', description: 'UTSA-area commercial. Growing mixed-use, student-oriented retail, and supporting office. Emerging.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'texas-retail-leasing-fundamentals-2026', category: 'Owner Strategy', title: 'Texas Retail Leasing Fundamentals 2026' },
        { slug: 'texas-tenant-lease-negotiation-playbook', category: 'Tenant Strategy', title: 'The Texas Tenant Lease Negotiation Playbook' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  {
    slug: 'schertz-cibolo-selma',
    parentMetro: 'san-antonio',
    shortLabel: 'Schertz, Cibolo & Selma',
    tagline: 'I-35 northeast industrial growth corridor',
    metaTitle: 'Schertz, Cibolo, Selma Commercial Real Estate | Industrial, Retail | CRECO',
    metaDescription:
      'Schertz, Cibolo, and Selma commercial real estate — the I-35 northeast industrial commercial growth corridor between San Antonio and New Braunfels. Industrial leasing, retail, and investment advisory from CRECO.',
    keywords: [
      'schertz commercial real estate',
      'cibolo commercial real estate',
      'selma commercial property',
      'schertz industrial space',
      'i-35 northeast industrial',
      'guadalupe county commercial',
      'comal county industrial',
      'schertz warehouse for lease',
    ],
    config: {
      city: 'Schertz, Cibolo & Selma',
      cityShort: 'Schertz Corridor',
      heroEyebrow: 'San Antonio Metro · Guadalupe + Comal Counties',
      heroTitle: 'Schertz, Cibolo, and Selma commercial real estate — the I-35 northeast industrial growth corridor.',
      heroSubhead:
        'Industrial, flex, retail, and supporting office commercial real estate across Schertz, Cibolo, and Selma — the I-35 northeast corridor connecting San Antonio to New Braunfels. One of the strongest industrial commercial growth submarkets in the broader SA metro, with continued residential and retail expansion alongside. CRECO covers industrial leasing, retail, and investment advisory.',
      marketStats: [
        { label: 'Class A industrial rents', value: '$8.50–11/SF', context: 'NNN, bulk + small-bay' },
        { label: 'Industrial absorption',    value: 'Strong',       context: 'e-comm + manufacturing demand' },
        { label: 'Retail vacancy',           value: '~5%',          context: 'tightest in primary corridors' },
        { label: 'Population growth',        value: '+3-5%/yr',     context: 'one of fastest-growing SA submarkets' },
      ],
      marketIntro: [
        'The Schertz / Cibolo / Selma corridor is the working commercial real estate submarket of northeast San Antonio. The I-35 stretch from Selma through Schertz into Cibolo handles the bulk of the SA-to-New-Braunfels industrial growth — bulk distribution, light manufacturing, supplier-ecosystem operations, and small-bay flex. The combination of strategic logistics positioning, growing residential, and lower land cost vs central San Antonio makes the corridor one of the strongest industrial commercial growth stories in Texas right now.',
        'Industrial is the dominant commercial story. Class A bulk distribution (75K-300K SF) along the I-35 stretch leases steadily with 90%+ occupancy. Small-bay industrial (10K-40K SF) is genuinely tight — limited supply, strong tenant demand from local businesses, e-commerce 3PLs, and growing manufacturing operations. Rents in the $8.50-11/SF NNN range with steady push as supply tightens.',
        'Retail follows the residential growth. Primary growth centers along FM 3009, FM 78, and the I-35 commercial frontage run at 4-6% vacancy with steady rent push. Restaurants and grocery-anchored centers lease well. Office is more limited — Class B suburban professional office for local services.',
      ],
      servicesIntro: [
        'CRECO\'s Schertz / Cibolo / Selma commercial real estate practice is heaviest in industrial leasing and owner-user sales. We work with industrial tenants in the 10K-200K SF range seeking I-35 corridor space and represent landlords on lease-up of new and stabilized industrial product. The combination of supply tightness in small-bay and continued strong absorption in bulk makes this one of the most-active industrial submarkets we cover.',
        'For retail and small-office, we work both tenant and owner side across the growth-corridor centers. Investment-sale advisory across the corridor focuses on durable industrial income and growing retail demand.',
      ],
      submarkets: [
        { name: 'I-35 Schertz Industrial',     characterization: 'Bulk + small-bay industrial', description: 'The I-35 industrial commercial spine through Schertz. Bulk distribution, supplier operations, small-bay flex.' },
        { name: 'FM 3009 / Cibolo Corridor',   characterization: 'Retail + service-driven',     description: 'The retail commercial spine through Cibolo. Grocery-anchored, restaurants, services for the growing residential base.' },
        { name: 'Selma I-35 Frontage',          characterization: 'Retail + auto + service',     description: 'I-35 commercial frontage through Selma. Strong retail visibility, auto, service-driven tenants.' },
        { name: 'Cibolo Growth Corridor',       characterization: 'Emerging retail + residential', description: 'Newer growth along the eastern Cibolo arc. Retail follows residential expansion.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-industrial-warehouse-leasing-2026', category: 'Tenant Strategy', title: 'Texas Industrial Warehouse Leasing 2026' },
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'texas-1031-exchange-strategy', category: 'Investor Strategy', title: '1031 Exchange Strategy for Texas Commercial Property Owners' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },

  // ───────────────────────── HILL COUNTRY — Round 2 ─────────────────────────
  {
    slug: 'bulverde-spring-branch',
    parentMetro: 'hill-country',
    shortLabel: 'Bulverde & Spring Branch',
    tagline: 'Hill Country gateway — commercial retail follows the residential boom',
    metaTitle: 'Bulverde & Spring Branch Commercial Real Estate | Hill Country Gateway | CRECO',
    metaDescription:
      'Bulverde and Spring Branch commercial real estate — the Hill Country gateway commercial corridor north of San Antonio. Retail, professional office, and emerging mixed-use following one of Texas\'s strongest residential-growth waves.',
    keywords: [
      'bulverde commercial real estate',
      'spring branch commercial real estate',
      'bulverde retail for lease',
      'comal county commercial property',
      'hill country gateway commercial',
      'us 281 north commercial',
      'bulverde office space',
      'spring branch retail',
    ],
    config: {
      city: 'Bulverde & Spring Branch',
      cityShort: 'Bulverde',
      heroEyebrow: 'Texas Hill Country · Comal County South',
      heroTitle: 'Bulverde and Spring Branch commercial real estate — the Hill Country gateway corridor.',
      heroSubhead:
        'Retail, professional office, and emerging mixed-use commercial real estate across Bulverde and Spring Branch — the Hill Country gateway north of San Antonio, where the Stone Oak commercial corridor arcs into one of Texas\'s strongest residential-growth waves. CRECO works tenant-side and owner-side across the corridor.',
      marketStats: [
        { label: 'Population growth',        value: 'Top 10',      context: 'fastest-growing TX small markets' },
        { label: 'Retail vacancy',           value: '~5%',         context: 'tightening as residential expands' },
        { label: 'Grocery-anchored rents',   value: '$26–34/SF',   context: 'NNN, growth-center shop space' },
        { label: 'Median HH income',         value: '$110K+',      context: 'top-tier Hill Country demographics' },
      ],
      marketIntro: [
        'Bulverde and Spring Branch are the Hill Country\'s next-wave commercial real estate growth corridor. Strong residential expansion driven by the Stone Oak / Sonterra commercial corridor extending north out of San Antonio into the rolling Comal County countryside. Top-tier household incomes, sustained population growth, and a commercial market that\'s evolved from "rural gateway" into a real submarket with depth across retail, professional office, and emerging mixed-use.',
        'Retail is the dominant commercial story. The Bulverde Walmart-anchored center and the broader US 281 North commercial frontage absorb new retail product as fast as it can be built. Grocery-anchored centers run at 4-6% vacancy with steady rent push. Restaurants and lifestyle tenants compete for pad sites with good visibility. The combination of demographic strength and limited supply makes the corridor a strong commercial investor story for retail product.',
        'Office is more limited but emerging. Class B professional office for local services, healthcare clinics, and growing employment-base operations. The combination of strong residential growth and limited Class A supply means commercial tenants seeking quality professional space often build owner-user rather than lease.',
      ],
      servicesIntro: [
        'CRECO\'s Bulverde / Spring Branch commercial real estate practice is heaviest in retail tenant rep and owner-side leasing. We work with retail tenants on pad sites and endcaps in primary growth centers, and we handle owner-side leasing for landlords across the strongest grocery-anchored centers.',
        'For investors, the corridor\'s combination of demographic-driven retail demand and limited supply makes it a strong long-hold commercial play. We provide investment-sale advisory across retail product and emerging mixed-use opportunities.',
      ],
      submarkets: [
        { name: 'US 281 North Bulverde',         characterization: 'Retail + service-driven',    description: 'The US 281 commercial spine through Bulverde. Anchor grocery, restaurants, professional services.' },
        { name: 'Spring Branch / FM 311',         characterization: 'Emerging retail + residential', description: 'Newer growth commercial corridor along FM 311. Retail follows the residential expansion into Hill Country countryside.' },
        { name: 'Hill Country Galleria Adjacency', characterization: 'Lifestyle + specialty retail', description: 'The lifestyle-retail anchors of the broader Hill Country gateway. Specialty retail, restaurants, hospitality.' },
        { name: 'Cibolo Canyon Adjacency',         characterization: 'Hospitality + retail',         description: 'Adjacent to the JW Marriott + TPC corridor. Hospitality-supporting retail and emerging office.' },
      ],
      whyBullets: STANDARD_WHY_BULLETS,
      relatedInsights: [
        { slug: 'texas-retail-leasing-fundamentals-2026', category: 'Owner Strategy', title: 'Texas Retail Leasing Fundamentals 2026' },
        { slug: 'texas-commercial-real-estate-outlook-2026', category: 'Market Outlook', title: 'Texas Commercial Real Estate Outlook 2026' },
        { slug: 'multi-property-owner-strategy', category: 'Investor Strategy', title: 'Multi-Property Owner Strategy' },
      ],
      propertyLinks: STANDARD_PROPERTY_LINKS,
    },
  },
];

export function findSubmarket(slug: string): SubmarketEntry | undefined {
  return SUBMARKETS.find(s => s.slug === slug);
}

export function submarketsByMetro(): Record<ParentMetro, SubmarketEntry[]> {
  const out: Record<ParentMetro, SubmarketEntry[]> = {
    'austin':            [],
    'dallas-fort-worth': [],
    'houston':           [],
    'san-antonio':       [],
    'hill-country':      [],
  };
  for (const s of SUBMARKETS) out[s.parentMetro].push(s);
  return out;
}
