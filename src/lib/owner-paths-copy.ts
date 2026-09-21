/**
 * The owner-side offers, in one place.
 *
 * CRECO now asks a property owner four different things, and they are easy to
 * blur together: lease my space, sell my property, look at my development
 * site, tell me what it's worth. Each has its own route, source, CRM tags and
 * capture — so each gets its own wording here, and the shared band below
 * renders them side by side rather than stacking four full-width pitches.
 *
 * Claims discipline, same as the listing copy: nothing quantitative, no track
 * record, no commission figure. Development in particular is described as
 * representation, sourcing and advisory — NOT entitlement work, construction
 * management or a development résumé, none of which CRECO has told us it does.
 */

export const SALE_CTA = {
  heading: 'Sell your commercial property',
  body:
    'Priced against real comps and cap rates, marketed to CRECO’s buyer and investor network, and negotiated through to close — with 1031 replacement options identified if you need them.',
  action: 'Start a disposition',
  reassurance: 'No cost to discuss · Confidential if you prefer',
  href: '/sell',
} as const;

export const DEVELOPMENT_CTA = {
  heading: 'Have a site or a development opportunity?',
  body:
    'Land, an underused site, or a deal that needs the right capital behind it — bring it to CRECO for a market read, a disposition strategy, or an introduction to investors looking for exactly that.',
  action: 'Bring us the opportunity',
  reassurance: 'Owners and developers · Confidential review',
  href: '/development-opportunities',
} as const;

/** What CRECO genuinely does on a disposition. Qualitative only. */
export const SALE_POINTS = [
  { title: 'Priced to the evidence', body: 'A value range built from comparable sales, the asset’s income and current cap rates — not a number picked to win the listing.' },
  { title: 'Marketed to real buyers', body: 'The commercial platforms buyers and brokers search, plus direct outreach to CRECO’s own buyer and investor relationships. Quietly, if a confidential sale suits you better.' },
  { title: '1031 options identified', body: 'If the sale triggers an exchange, CRECO helps identify replacement property inside your deadlines rather than leaving you to find it.' },
  { title: 'Negotiated to close', body: 'Offers weighed on price, terms and certainty of close — then diligence, deadlines and the closing table coordinated with your attorney and title company.' },
] as const;

/**
 * Development offering. Deliberately narrow.
 *
 * CRECO is a brokerage: it can sell a site, find a site, read a market and
 * make introductions. It has NOT told us it entitles land, manages
 * construction, or carries a development track record — so none of that is
 * claimed here. Widen this only on the broker's explicit confirmation of what
 * he actually wants to offer.
 */
export const DEVELOPMENT_POINTS = [
  { title: 'Sites brought to market', body: 'Representation on the sale of land and underused sites — positioning, pricing and the buyer pool that actually builds.' },
  { title: 'Sites sourced', body: 'For developers with a thesis: CRECO works its Texas broker and owner relationships to find sites that fit it, including off-market conversations.' },
  { title: 'A market read', body: 'What the submarket supports today — demand, comparable projects and what buyers and tenants are actually paying — before money goes into a deal.' },
  { title: 'Capital introductions', body: 'Introductions to investors and owner-users in CRECO’s network when a deal needs the right partner. Advisory and brokerage — CRECO is not the developer.' },
] as const;

export const DEVELOPMENT_PROPERTY_TYPES = [
  'Raw land',
  'Underused / redevelopment site',
  'Existing building to reposition',
  'Pad site',
  'Other',
] as const;

export const DEVELOPMENT_ROLES = [
  'I own the site',
  'I am a developer looking for sites',
  'Both / something else',
] as const;

export const SALE_TIMELINES = ['Ready now', 'Next 3–6 months', '6–12 months', 'Just exploring'] as const;
