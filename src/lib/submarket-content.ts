/**
 * Per-submarket rich content layer.
 *
 * The Supabase `submarkets` table holds owner-editable basic info (name, description,
 * highlights, zip codes) — but those tend to be short. This file holds longer
 * static market-context content for each San Antonio submarket, rendered alongside
 * the DB content on /submarkets/[slug].
 *
 * Adding a new submarket: add an entry below keyed by slug. The detail page
 * looks up content by slug and renders the rich sections if found.
 */

export interface SubmarketContent {
  /** Long-form market overview (3-4 paragraphs) */
  overview: string[];
  /** Market fundamentals: rents, vacancy, key tenants */
  fundamentals: { label: string; value: string; note?: string }[];
  /** Notable buildings / developments in this submarket */
  keyBuildings?: { name: string; description: string }[];
  /** Who typically leases here */
  typicalTenants: string[];
  /** Submarket-specific FAQs with FAQ schema */
  faqs: { q: string; a: string }[];
}

export const SUBMARKET_CONTENT: Record<string, SubmarketContent> = {
  'northwest': {
    overview: [
      'San Antonio Northwest is the most active commercial real estate submarket in the city, anchored by the I-10 / Loop 1604 interchange and stretching from La Cantera to UTSA, the South Texas Medical Center, and the Stone Oak corridor extension. It is the dominant Class A office submarket in San Antonio and increasingly the dominant medical office market.',
      'The submarket has been the primary beneficiary of San Antonio\'s economic and demographic growth over the past 20 years. The University of Texas at San Antonio, the Medical Center, USAA\'s headquarters, Valero, and a deep concentration of professional services drive office demand. La Cantera, The Rim, and the I-10 retail corridor support some of the strongest retail leasing fundamentals in San Antonio.',
      'Industrial and flex activity in Northwest is more limited than the I-35 corridor, but selective spec industrial along Loop 1604 and Highway 151 has performed well. Land for development is scarce and expensive — meaning the focus for industrial users is increasingly Far Northwest and Boerne corridor extensions.',
      'For owners and tenants, Northwest is the high-rent, high-demand submarket where supply is constrained and quality matters more than basis. The right Class A asset in Northwest commands top-of-market rents; the wrong Class B asset in a secondary location struggles even in this strong submarket.',
    ],
    fundamentals: [
      { label: 'Class A office rent', value: '$32-48/SF FSG', note: 'depending on building age and amenities' },
      { label: 'Class B office rent', value: '$22-30/SF FSG' },
      { label: 'Office vacancy', value: '8-12%', note: 'tighter for Class A trophy buildings' },
      { label: 'Retail rent (in-line)', value: '$28-42/SF NNN' },
      { label: 'Retail rent (anchor)', value: '$15-22/SF NNN' },
      { label: 'Industrial rent', value: '$10-14/SF NNN', note: 'limited inventory' },
      { label: 'Cap rate (stabilized retail)', value: '6.5-7.5%' },
      { label: 'Cap rate (Class A office)', value: '7.0-8.0%' },
    ],
    keyBuildings: [
      { name: 'La Cantera Heights', description: 'Premier Class A office and retail mixed-use complex with Six Flags Fiesta Texas adjacency. Anchor of the Northwest Class A office market.' },
      { name: 'The Rim', description: 'Open-air retail center anchored by Bass Pro Shops, Palladium Imax, JC Penney, and other regional and national retailers.' },
      { name: 'Stone Oak', description: 'Master-planned community with extensive Class A office, medical office, and retail along Stone Oak Parkway and US-281.' },
      { name: 'South Texas Medical Center', description: 'One of the largest medical districts in the state, with major hospital systems and dense medical office concentration.' },
      { name: 'USAA Headquarters', description: 'One of the largest single-tenant office campuses in Texas — a major economic and employment anchor for the submarket.' },
    ],
    typicalTenants: [
      'Financial services and insurance (USAA, Valero, regional banks)',
      'Medical practices, hospital outpatient services, and medical specialty groups',
      'Professional services (law firms, accounting, consulting)',
      'Technology and IT services',
      'Retail (national soft goods, restaurants, fitness, specialty)',
      'Educational services and extension campuses',
    ],
    faqs: [
      {
        q: 'Is San Antonio Northwest the most expensive submarket?',
        a: 'For office and retail, yes — Northwest commands the highest rents in San Antonio, particularly in La Cantera, The Rim, and Stone Oak. For industrial, Northwest is mid-pack — the I-35 corridor (Northeast) typically leads industrial rents.',
      },
      {
        q: 'What zip codes does Northwest cover?',
        a: 'Primary zip codes for Northwest commercial real estate include 78230, 78231, 78249, 78256, 78257, 78258, and 78259. Stone Oak (78258, 78259) is sometimes considered a separate submarket; we group it with Northwest in our market analysis.',
      },
      {
        q: 'Is medical office different from Class A office in Northwest?',
        a: 'Yes — medical office is typically standalone or in dedicated medical office buildings (MOBs), priced at a small premium to Class A general office, and underwritten differently because of the longer leases and stickier tenants. The South Texas Medical Center is a dedicated medical submarket within Northwest.',
      },
      {
        q: 'Are there industrial opportunities in Northwest?',
        a: 'Limited but real. Selective industrial pockets exist along Loop 1604, Highway 151, and the Helotes corridor. Land scarcity and high basis make new development challenging — most industrial users targeting Northwest end up looking at Far Northwest extensions or Helotes/Boerne corridor.',
      },
    ],
  },

  'north-central': {
    overview: [
      'San Antonio North Central runs along Loop 410 from US-281 east through the airport corridor to I-35. It is the historic Class B office submarket of San Antonio, with substantial 1980s and 1990s suburban office inventory, mature retail, and meaningful infill multifamily redevelopment.',
      'For tenants, North Central is the value-oriented office submarket — Class B rents 25-40% below Northwest with similar accessibility and a strong professional services tenant base. For owners, North Central is the repositioning submarket: 1990s buildings that benefit from modernization can move up a tenant tier and capture meaningful rent uplift.',
      'Retail in North Central is mature and stable. Major Loop 410 corridors (San Pedro, Broadway, Northwest Loop) have established centers with steady foot traffic and tenant retention. New retail development is limited; value comes from tenant mix optimization on existing centers.',
      'Industrial activity in North Central is minimal — the submarket\'s mature Loop 410 inventory is dominated by office and retail. Industrial users typically look to the I-35 corridor (Northeast) or the South/Southwest industrial submarkets.',
    ],
    fundamentals: [
      { label: 'Class A office rent', value: '$24-32/SF FSG' },
      { label: 'Class B office rent', value: '$18-26/SF FSG', note: 'best Class B value in San Antonio' },
      { label: 'Office vacancy', value: '12-16%' },
      { label: 'Retail rent (in-line)', value: '$20-32/SF NNN' },
      { label: 'Cap rate (Class B office)', value: '8.5-10%' },
      { label: 'Cap rate (stabilized retail)', value: '7.0-8.0%' },
    ],
    typicalTenants: [
      'Professional services (smaller law firms, accounting practices, consulting)',
      'Healthcare and medical (clinics, dental practices, specialty medical)',
      'Financial services regional offices',
      'Education and extension programs',
      'Retail (regional and local restaurants, retail, fitness, services)',
      'Government offices and contractors',
    ],
    faqs: [
      {
        q: 'Why is North Central often called a "value" office submarket?',
        a: 'North Central has substantial 1980s-1990s Class B office inventory at meaningful rent discounts to Northwest — typically 25-40% below comparable space. For cost-conscious tenants who don\'t need trophy Class A, North Central delivers similar accessibility and parking ratios at a fraction of the rent.',
      },
      {
        q: 'What zip codes does North Central cover?',
        a: 'Primary zip codes include 78213, 78216, 78217, 78232, 78233, and parts of 78239 (airport area). The submarket is anchored by Loop 410.',
      },
      {
        q: 'Is North Central a good submarket for owners to acquire?',
        a: 'For value-add buyers with capital and operational capability, yes. North Central Class B office trading at 8.5-10% cap rates with modernization potential offers compelling value-add returns. The risk is that some buildings have substantial deferred capex; underwriting carefully and pricing the capex into the basis is critical.',
      },
    ],
  },

  'northeast': {
    overview: [
      'San Antonio Northeast is the dominant industrial submarket in the city, anchored by the I-35 corridor running from I-410 north to Schertz, Selma, and New Braunfels. It is the primary Texas distribution and logistics submarket between Austin and South Texas, supporting a deep concentration of warehouse, distribution, light manufacturing, and flex-industrial inventory.',
      'The submarket benefits from outstanding logistics geography: direct I-35 access, proximity to I-410, FM 1604, and Loop 1604, and connectivity to both Austin (1 hour north) and the Mexican border via I-35 South. Major distributors, e-commerce fulfillment operations, and last-mile logistics have invested heavily in Northeast over the past decade.',
      'Modern Class A bulk distribution buildings (32+ ft clear, ESFR sprinkler, abundant trailer parking) command premium rents but face supply pipeline pressure as developers race to add inventory. Class B and C industrial in older sections of Northeast trades at meaningful discounts but with operational tradeoffs (lower clear height, fewer dock doors, older construction).',
      'Retail and office activity in Northeast is concentrated near the I-35 / Loop 410 interchange (Northwoods, North Star Mall, Forum at Olympia Parkway) and in the Schertz / Selma residential growth zone. Office is meaningful but secondary to industrial in this submarket.',
    ],
    fundamentals: [
      { label: 'Class A bulk distribution rent', value: '$8.50-11.50/SF NNN' },
      { label: 'Class B industrial rent', value: '$6.50-8.50/SF NNN' },
      { label: 'Industrial vacancy', value: '5-8%', note: 'tightest segment in San Antonio' },
      { label: 'Flex space rent', value: '$10-14/SF NNN' },
      { label: 'Cap rate (stabilized industrial)', value: '6.0-7.0%' },
      { label: 'Class B office rent', value: '$18-24/SF FSG' },
    ],
    keyBuildings: [
      { name: 'Forum at Olympia Parkway', description: 'Major mixed-use lifestyle center with retail, dining, and entertainment — anchor of the Northeast retail node.' },
      { name: 'North Star Mall area', description: 'Established retail, office, and hospitality concentration at the Loop 410/Hwy 281 intersection.' },
      { name: 'Schertz / Selma industrial corridor', description: 'Emerging industrial growth zone along I-35 north — newer Class A bulk distribution and last-mile logistics.' },
      { name: 'I-35 / Loop 410 interchange', description: 'Most-trafficked freeway interchange in San Antonio — premium retail and industrial visibility.' },
    ],
    typicalTenants: [
      'Distribution and logistics (regional, national, e-commerce fulfillment)',
      'Light manufacturing and assembly',
      'Last-mile logistics for parcel delivery',
      'Wholesale and supply businesses',
      'Cold storage and food distribution',
      'Service businesses with vehicle fleets and yards',
      'Construction supply and contractor warehousing',
    ],
    faqs: [
      {
        q: 'What makes Northeast San Antonio strong for industrial?',
        a: 'Logistics geography. Direct I-35 access, proximity to I-410 and Loop 1604, the Austin corridor 60 miles north, and the Mexican border via I-35 South all converge in Northeast. For Texas distribution operations targeting both Austin and South Texas markets, Northeast is the obvious choice.',
      },
      {
        q: 'What zip codes does Northeast cover?',
        a: 'Primary zip codes include 78219, 78220, 78233, 78239, 78247, 78260, and the Schertz/Selma extension zip codes 78108 and 78154. The submarket extends along I-35 from Loop 410 north to New Braunfels.',
      },
      {
        q: 'Is there modern Class A industrial supply or only older inventory?',
        a: 'Both. Significant Class A bulk distribution development has happened in the Schertz/Selma corridor since 2018, with 32-40 ft clear, ESFR sprinkler, and abundant trailer parking. Older sections of Northeast (closer to Loop 410) have substantial Class B/C industrial at lower rents but reduced specs.',
      },
      {
        q: 'How does Northeast compare to South Side / Southeast for industrial?',
        a: 'South Side has emerging industrial along I-37 driven by the Toyota corridor and is more affordable than Northeast — but Northeast has deeper inventory, better logistics geography for distribution covering both Austin and South Texas, and more Class A modern supply. Both submarkets are growing; the choice depends on your specific operations.',
      },
    ],
  },

  'downtown': {
    overview: [
      'San Antonio Downtown — including the CBD (Central Business District), River Walk corridor, and the Pearl District — is undergoing a sustained urban renaissance. The historic core has seen substantial adaptive reuse over the past 15 years, transforming 1900s-1920s warehouses, brewing facilities, and office towers into hospitality, creative office, mixed-use, and high-end residential.',
      'For tenants, Downtown is the urban authentic submarket. Companies attracting younger talent, creative agencies, technology startups, and professional services with an urban brand identity choose Downtown for cultural fit. The Pearl District (anchored by the historic Pearl Brewery campus) is the strongest urban submarket within Downtown.',
      'Hospitality dominates the River Walk corridor: Marriott, Hilton, Hyatt, and dozens of boutique hotels make Downtown San Antonio one of the largest convention hospitality markets in Texas. The Henry B. Gonzalez Convention Center and the Alamo drive consistent visitor traffic and supporting retail demand.',
      'Industrial is virtually absent in Downtown — the submarket is office, retail, hospitality, and residential. Office tower inventory is aging (most Class A built 1970s-1990s) and faces competitive pressure from suburban Class A. The repositioning play in Downtown is conversion: older office to creative office, hospitality, or multifamily.',
    ],
    fundamentals: [
      { label: 'Class A office rent (CBD)', value: '$26-34/SF FSG' },
      { label: 'Creative office rent (Pearl)', value: '$32-48/SF FSG', note: 'premium for adapted space' },
      { label: 'Office vacancy', value: '15-22%' },
      { label: 'Retail rent (River Walk)', value: '$45-90/SF NNN', note: 'depends on visibility' },
      { label: 'Hospitality occupancy', value: '70-78%' },
      { label: 'Cap rate (Class A office)', value: '8.0-9.5%' },
    ],
    keyBuildings: [
      { name: 'Pearl District', description: 'Anchor of urban authentic San Antonio — adapted brewing campus with hotels, restaurants, retail, residential, and creative office.' },
      { name: 'River Walk', description: '15-mile network of pedestrian river walkways with hospitality, dining, retail, and major hotels at every node.' },
      { name: 'Frost Tower', description: 'Iconic Class A office tower in the CBD; mixed-use with retail at street level.' },
      { name: 'Hemisfair', description: 'Redeveloping mixed-use district with civic buildings, hospitality, and residential.' },
      { name: 'Southtown', description: 'Adjacent emerging mixed-use district with creative office, multifamily, and dining.' },
    ],
    typicalTenants: [
      'Creative agencies and design firms',
      'Technology startups and venture-backed companies',
      'Hospitality (hotels, restaurants, nightlife, attractions)',
      'Architecture and engineering firms',
      'Law firms and professional services with urban brand identity',
      'Retail (boutique, restaurants, experiential, gift)',
      'Government and civic offices',
    ],
    faqs: [
      {
        q: 'What is the difference between CBD, Pearl, and River Walk?',
        a: 'CBD (Central Business District) is the office tower core south of the Pearl, including Frost Tower, Houston Street, and the Convention Center area. Pearl District is the redeveloped Pearl Brewery campus north of the CBD, anchored by the Hotel Emma and creative office. River Walk is the pedestrian river network running through the CBD with hospitality and dining concentration. All three are within walking distance and overlap operationally.',
      },
      {
        q: 'Why is Downtown San Antonio office vacancy higher than suburban?',
        a: 'A few reasons: Class A inventory is older (mostly 1970s-1990s) and competes against newer Class A in Northwest; some traditional Downtown tenants relocated to suburban submarkets; and post-pandemic urban office leasing has been slower than suburban. The repositioning opportunity is real — adapted creative office (like Pearl District) commands premium rents and tight occupancy.',
      },
      {
        q: 'What are River Walk retail rents really like?',
        a: 'River Walk-fronting retail is among the highest-rent retail in Texas — $45-90/SF NNN depending on visibility, sublease vs direct, and footprint. The economics are driven by tourist traffic; restaurant and experiential tenants dominate. Retail one block off the River Walk drops dramatically in rent and traffic.',
      },
      {
        q: 'Is residential conversion happening in Downtown?',
        a: 'Yes. Multiple older office buildings have converted to multifamily or hospitality. The economics work when the building has good bones, accessible parking, and views — and the office stabilization story is unattractive. Conversion costs $200-400/SF on top of acquisition, so the math is selective.',
      },
    ],
  },

  'south-side': {
    overview: [
      'San Antonio South Side (including the Toyota Manufacturing corridor along I-37 and the Brooks City Base redevelopment) is the emerging industrial growth submarket of San Antonio. Once a secondary submarket dominated by older industrial and lower-density retail, it is now seeing significant new investment driven by Toyota, Brooks, and the broader I-37 corridor logistics buildout.',
      'For industrial users, South Side offers more affordable land basis than Northeast — meaningful opportunity for build-to-suit and ground-up development. Logistics and distribution operations targeting the Mexican border, San Antonio, and the rapidly growing South Texas residential markets find South Side\'s economics compelling.',
      'Brooks City Base — the redevelopment of the former Brooks Air Force Base — is the centerpiece development of the submarket, with industrial, office, retail, and educational uses. The Brooks redevelopment has catalyzed broader South Side investment.',
      'Retail and office activity in South Side is concentrated near major freeway interchanges (I-37, Loop 410 South) and Brooks. New retail development has accompanied residential growth, and Brooks supports a meaningful office tenant base.',
    ],
    fundamentals: [
      { label: 'Industrial rent', value: '$6.50-8.50/SF NNN', note: 'meaningfully below Northeast' },
      { label: 'Land basis (raw industrial)', value: '$3-7/SF', note: 'attractive for build-to-suit' },
      { label: 'Class B office rent', value: '$18-24/SF FSG' },
      { label: 'Industrial vacancy', value: '8-12%' },
      { label: 'Cap rate (industrial)', value: '7.0-8.0%' },
    ],
    keyBuildings: [
      { name: 'Toyota Manufacturing Texas', description: 'Major Toyota Tacoma and Tundra production plant — a foundational economic driver for the South Side industrial corridor.' },
      { name: 'Brooks City Base', description: 'Redeveloped former Air Force base — mixed-use district with industrial, office, education, and retail.' },
      { name: 'I-37 industrial corridor', description: 'Stretch of new and emerging industrial development along I-37 between Loop 410 and the Toyota campus.' },
    ],
    typicalTenants: [
      'Automotive supply and Toyota tier-1 suppliers',
      'Logistics and distribution operations targeting the Mexican border and South Texas',
      'Manufacturing (light and heavy)',
      'Construction and contractor operations',
      'Cold storage and food distribution',
      'Retail (national QSR, value retail, fitness)',
    ],
    faqs: [
      {
        q: 'Is South Side really an emerging market or is it still secondary?',
        a: 'It is genuinely emerging. Toyota\'s investment, Brooks City Base redevelopment, and the I-37 corridor logistics buildout have all catalyzed sustained investment over the past 15+ years. Land basis remains meaningfully below Northeast San Antonio, making South Side compelling for new industrial development.',
      },
      {
        q: 'Can I find Class A industrial in South Side?',
        a: 'Increasingly yes. Several Class A bulk distribution and flex-industrial developments have been built in the I-37 corridor over the past 5 years. The supply is thinner than Northeast but the basis advantage often offsets that.',
      },
      {
        q: 'What zip codes does South Side cover?',
        a: 'Primary zip codes include 78211, 78214, 78221, 78222, 78223, and the Toyota / Brooks corridor 78235. The submarket runs broadly south of Loop 410.',
      },
    ],
  },

  'far-west': {
    overview: [
      'San Antonio Far West / 1604 (covering the Loop 1604 corridor northwest of I-10, extending toward Helotes, Boerne, and Bandera) is the newest growth submarket of San Antonio commercial real estate. Driven by residential expansion in the Hill Country corridor and improved Loop 1604 connectivity, Far West has emerged as a meaningful submarket for retail, flex, and selected industrial development since 2018.',
      'For retail tenants, Far West offers strong demographics and emerging traffic counts at meaningful rent discounts to Northwest. Class A power center and grocery-anchored retail along Loop 1604 has performed well; new development is keeping pace with residential growth.',
      'Flex industrial activity in Far West is growing, supporting service businesses, contractors, and distribution operations preferring lower basis and Hill Country geography. Office activity remains modest but is following residential expansion.',
      'Land for development in Far West is meaningfully more available than Northwest. For developers and owner-users, Far West offers viable build-to-suit and ground-up development opportunities at attractive land basis. The submarket\'s long-term growth thesis depends on continued residential expansion north and west.',
    ],
    fundamentals: [
      { label: 'Retail rent (anchor)', value: '$15-22/SF NNN' },
      { label: 'Retail rent (in-line)', value: '$22-32/SF NNN' },
      { label: 'Flex industrial rent', value: '$10-13/SF NNN' },
      { label: 'Class B office rent', value: '$22-28/SF FSG' },
      { label: 'Land basis', value: '$5-15/SF', note: 'wide range based on freeway visibility' },
      { label: 'Cap rate (stabilized retail)', value: '7.0-8.0%' },
    ],
    typicalTenants: [
      'Retail (national QSR, regional restaurants, fitness, value retail, grocery)',
      'Service businesses and contractors',
      'Medical practices serving the growing Hill Country residential population',
      'Educational services and extension campuses',
      'Distribution operations preferring Hill Country basis',
      'Light industrial and flex-industrial users',
    ],
    faqs: [
      {
        q: 'Is Far West / 1604 the same as Helotes or Boerne?',
        a: 'Overlapping but not identical. Far West / 1604 covers the Loop 1604 corridor in northwest San Antonio. Helotes is a city within that submarket. Boerne is in Kendall County, just outside Far West but functionally part of the same growth corridor. We treat the area as a continuous Loop 1604 / Hill Country corridor for market analysis.',
      },
      {
        q: 'What zip codes does Far West cover?',
        a: 'Primary zip codes include 78023 (Helotes), 78254, 78255, 78269, with extensions toward 78006 (Boerne).',
      },
      {
        q: 'Is Far West good for new development?',
        a: 'For the right product, yes. Land basis is significantly below Northwest, residential demand is growing, and Loop 1604 connectivity is strong. The risk is supply discipline — multiple competing developers can over-build a specific node. Site selection within Far West matters as much as the decision to develop in Far West at all.',
      },
    ],
  },
};

export function getSubmarketContent(slug: string): SubmarketContent | undefined {
  return SUBMARKET_CONTENT[slug];
}
