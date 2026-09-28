/**
 * What each commercial property type IS, in plain words — for the moment a
 * visitor filters /listings down to something we have nothing public in.
 *
 * The old empty state was a dead end: "No properties found. Try adjusting your
 * filters." Someone who just tapped "Flex" on the homepage told us exactly what
 * they want, and we answered with a shrug. This module is the content half of
 * the fix — the listings empty state reads a type's entry and explains the
 * category, says who it's for, and invites the visitor to tell us what they
 * need instead of bouncing.
 *
 * Keys are `listings.property_type` VALUES, not labels, so a filter value from
 * the URL (?type=warehouse) resolves without a translation step. 'warehouse' is
 * the stored value for what the site calls Industrial — same convention as
 * lib/asset-types.ts.
 *
 * Claims discipline, same rule as lib/owner-paths-copy.ts: these describe a
 * property CATEGORY and CRECO's brokerage role. Nothing quantitative, no track
 * record, no inventory promise, no commission talk. "We often know of options
 * that aren't listed online" is a statement about how commercial brokerage
 * works and is fine; "we have 12 flex buildings available" is not.
 */

export interface PropertyTypeGuide {
  /** Display label, e.g. "Flex" / "Industrial". */
  label: string;
  /**
   * How the type reads mid-sentence, e.g. "flex space", "land". Used to build
   * the off-market line and the CTA heading, so it has to work in
   * "A lot of Texas ___ never reaches a listing site".
   */
  spaceNoun: string;
  /** What the property type IS — 1–2 sentences, no jargon. */
  definition: string;
  /** Who leases or buys it — concrete business types a visitor recognises. */
  whoItsFor: string;
  /** The ask, in the visitor's own terms. */
  ctaLine: string;
  /** Placeholder for the single free-text field on the capture form. */
  contextPlaceholder: string;
}

const GUIDES: Record<string, PropertyTypeGuide> = {
  flex: {
    label: 'Flex',
    spaceNoun: 'flex space',
    definition:
      'Flex space blends office and warehouse under one roof — offices or a showroom up front, warehouse, lab, or light-assembly space in back.',
    whoItsFor:
      'Popular with contractors and building trades, distributors, e-commerce and service companies, medical and lab users, and growing businesses that have outgrown an office suite but don’t need a full warehouse.',
    ctaLine: 'Looking for flex space? Tell us what you need and we’ll find it.',
    contextPlaceholder:
      'Size, office-to-warehouse split, submarket and timing — e.g. 6,000 SF with 2,000 SF office, north San Antonio, by Q2',
  },

  warehouse: {
    label: 'Industrial',
    spaceNoun: 'industrial and warehouse space',
    definition:
      'Industrial and warehouse space is built for storing, moving, and making things — clear height, dock-high or grade-level loading, heavier power, and room for trucks, with a small office component up front.',
    whoItsFor:
      'Distributors, manufacturers and fabricators, e-commerce and 3PL operators, building trades, and anyone who needs racking, yard space, or room for a forklift.',
    ctaLine: 'Need warehouse or industrial space? Tell us your size, power, and loading needs.',
    contextPlaceholder:
      'Size, clear height, loading and power — e.g. 15,000 SF, 24′ clear, two dock doors, 3-phase, I-35 corridor',
  },

  office: {
    label: 'Office',
    spaceNoun: 'office space',
    definition:
      'Office space is where your team and your clients meet — anything from a single professional suite to a full floor, in Class A towers, established suburban parks, or converted Hill Country buildings.',
    whoItsFor:
      'Professional services, insurance and finance, engineering and design firms, title and legal, and any team that needs a front door clients can walk through.',
    ctaLine: 'Looking for office space? Tell us your headcount, submarket, and timing.',
    contextPlaceholder:
      'Headcount or square footage, submarket, private offices vs. open plan, and when you need to be in',
  },

  retail: {
    label: 'Retail',
    spaceNoun: 'retail space',
    definition:
      'Retail space is street-facing, customer-facing real estate — inline suites in a strip or anchored center, freestanding buildings, restaurant and drive-thru pads, and urban storefronts.',
    whoItsFor:
      'Restaurants and cafés, franchises, salons and fitness, medical retail and urgent care, and any operator whose business depends on visibility, parking, and traffic counts.',
    ctaLine: 'Looking for retail space? Tell us your concept, trade area, and size.',
    contextPlaceholder:
      'Concept, size, trade area and must-haves — e.g. 2,200 SF quick-service with a drive-thru, Boerne or Fair Oaks',
  },

  land: {
    label: 'Land',
    spaceNoun: 'commercial land',
    definition:
      'Commercial land is the ground itself — raw acreage, improved pad sites, and infill or redevelopment tracts. It trades on zoning, utilities, access, and what the site can realistically become.',
    whoItsFor:
      'Developers and builders, owner-users planning a build-to-suit, investors positioning ahead of growth, and operators who need yard, storage, or outdoor space.',
    ctaLine: 'Looking for land? Tell us your acreage, intended use, and target area.',
    contextPlaceholder:
      'Acreage, intended use, utilities and area — e.g. 3–5 acres zoned for contractor yard, along US-281',
  },

  industrial: {
    label: 'Industrial',
    spaceNoun: 'industrial and warehouse space',
    definition:
      'Industrial and warehouse space is built for storing, moving, and making things — clear height, dock-high or grade-level loading, heavier power, and room for trucks, with a small office component up front.',
    whoItsFor:
      'Distributors, manufacturers and fabricators, e-commerce and 3PL operators, building trades, and anyone who needs racking, yard space, or room for a forklift.',
    ctaLine: 'Need warehouse or industrial space? Tell us your size, power, and loading needs.',
    contextPlaceholder:
      'Size, clear height, loading and power — e.g. 15,000 SF, 24′ clear, two dock doors, 3-phase, I-35 corridor',
  },

  'medical office': {
    label: 'Medical Office',
    spaceNoun: 'medical office space',
    definition:
      'Medical office is office space built for patient care — plumbed exam rooms, wider corridors, accessible parking close to the door, and zoning that permits clinical use.',
    whoItsFor:
      'Physicians and dentists, therapy and imaging, dermatology and med-spa, urgent care, and established practices opening a second location.',
    ctaLine: 'Opening or relocating a practice? Tell us your rooms, parking, and timing.',
    contextPlaceholder:
      'Exam rooms or square footage, parking needs, referral area, and your target open date',
  },

  'mixed-use': {
    label: 'Mixed-Use',
    spaceNoun: 'mixed-use property',
    definition:
      'Mixed-use property puts more than one use on a single site or in one building — retail or restaurant at the street with office or residential above.',
    whoItsFor:
      'Investors who want more than one income stream under one roof, and owner-users who want to occupy part of a building and lease the rest.',
    ctaLine: 'Looking at mixed-use? Tell us the mix you want and the market you want it in.',
    contextPlaceholder:
      'The mix you’re after, size, market, and whether you plan to occupy any of it',
  },

  multifamily: {
    label: 'Multifamily',
    spaceNoun: 'multifamily property',
    definition:
      'Multifamily is residential income property — duplexes and fourplexes up through apartment communities. It’s valued on rents, expenses, and cap rate rather than on a per-square-foot lease rate.',
    whoItsFor:
      'Investors building a rental portfolio, 1031 buyers placing exchange proceeds, and owners trading up from scattered single-family rentals.',
    ctaLine: 'Looking for multifamily? Tell us unit count, market, and the return you need.',
    contextPlaceholder:
      'Unit count, market, condition you’ll take on, and your target return or price range',
  },
};

/**
 * The version shown when no-results ISN'T one clean property type — an odd
 * filter combination, a search term that matched nothing, or a custom type with
 * no entry above. Still explains what's going on and still asks, because the
 * one thing this component must never do is dead-end.
 */
export const GENERIC_EMPTY_COPY = {
  heading: 'Nothing public matches that yet',
  definition:
    'Our listings page shows the Texas properties CRECO can market publicly — it isn’t everything we’re working on, and it changes week to week.',
  whoItsFor:
    'Widening one filter usually turns up options. But if you already know what you need, skipping the filters and telling us is faster.',
  ctaLine: 'Tell us what you’re looking for and we’ll go find it.',
  contextPlaceholder:
    'Property type, size, submarket, budget and timing — as much or as little as you know',
} as const;

/**
 * The off-market reassurance line. Built from `spaceNoun` so it reads correctly
 * for both count nouns and mass nouns ("a lot of Texas flex space" /
 * "a lot of Texas commercial land").
 *
 * This is a description of how commercial brokerage works, not an inventory
 * claim — keep it that way.
 */
export function offMarketLine(spaceNoun: string): string {
  return `A lot of Texas ${spaceNoun} never reaches a listing site. Owners who haven’t gone to market, space coming available next quarter, and options we hear about from other brokers first — those are the ones worth a phone call.`;
}

export type EmptyStateCopy =
  | ({ kind: 'typed'; value: string } & PropertyTypeGuide)
  | ({ kind: 'generic' } & typeof GENERIC_EMPTY_COPY & { label: null; spaceNoun: string });

/**
 * Resolve the filter value to the copy the empty state should render.
 *
 * `null` / 'all' / an unknown value all fall through to the generic version —
 * a custom property type someone added in the CMS has no vetted definition, and
 * inventing one on the fly is exactly the kind of claim this file exists to
 * avoid.
 */
export function emptyStateCopy(propertyType: string | null | undefined): EmptyStateCopy {
  if (propertyType && propertyType !== 'all') {
    const guide = GUIDES[propertyType] ?? GUIDES[propertyType.toLowerCase()];
    if (guide) return { kind: 'typed', value: propertyType, ...guide };
  }
  return { kind: 'generic', ...GENERIC_EMPTY_COPY, label: null, spaceNoun: 'commercial space' };
}

/** Whether a vetted definition exists for a filter value. */
export function hasPropertyTypeGuide(propertyType: string | null | undefined): boolean {
  if (!propertyType || propertyType === 'all') return false;
  return Boolean(GUIDES[propertyType] ?? GUIDES[propertyType.toLowerCase()]);
}
