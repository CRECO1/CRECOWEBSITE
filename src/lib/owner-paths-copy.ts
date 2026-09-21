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
    'Bring it to CRECO. We represent owners and developers in development transactions — sourcing the opportunity, advising on the deal, and negotiating the terms.',
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
 * Development offering — exactly four things, confirmed by the broker on
 * 2026-09-20: "represent source advise negotiations terms."
 *
 * That is the whole scope and this list must not grow past it. CRECO does NOT
 * do feasibility studies, does not provide capital or financing partners, does
 * not structure JVs, does not handle entitlements or construction, and claims
 * no development track record. An earlier draft promised a market read and
 * investor introductions; both were removed because neither is in scope.
 * Anything added here needs the broker to say it first.
 */
export const DEVELOPMENT_POINTS = [
  { title: 'We represent you', body: 'Owner or developer, CRECO acts as your broker in the transaction \u2014 your side of the table, with the duty that comes with it.' },
  { title: 'We source the opportunity', body: 'Sites and deals found through CRECO\u2019s Texas broker and owner relationships, including conversations that never reach a listing platform.' },
  { title: 'We advise on the deal', body: 'A broker\u2019s read on what is actually in front of you \u2014 how the deal is put together, what the terms mean, and where the exposure sits.' },
  { title: 'We negotiate the terms', body: 'Price, conditions, timing and contingencies negotiated on your behalf, alongside your attorney, through to a signed contract.' },
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
