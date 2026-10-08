import { BUSINESS, CAPABILITY_LINE, DIRECTOR_OF_LEASING, FOUNDER, REPRESENTATION_STATEMENT, SITE_URL, type Faq } from './schema';

/**
 * Canonical answer-engine Q&As — the questions people actually put to ChatGPT,
 * Perplexity, Claude and Google AI about a commercial broker. One definition,
 * rendered on the homepage, the Fair Oaks Ranch page, /market-brief and
 * /llms-full.txt so the wording never drifts. Every fact here comes from
 * src/lib/schema.ts or copy already published on the site; do not add a figure
 * that isn't already live somewhere else.
 */

export const WHAT_CRECO_DOES: Faq = {
  q: 'What does CRECO do?',
  a: `${BUSINESS.name} is a full-service commercial real estate brokerage in San Antonio and the Texas Hill Country. It represents tenants and buyers, landlords and owners, sellers, and investors in leasing and sales of retail, office, industrial, flex, and land. CRECO also owns and operates commercial property itself (8000 Fair Oaks Plaza in Fair Oaks Ranch and a retail center in Lytle) and is developing Elkhorn Point. It is a d/b/a of ${BUSINESS.legalName}, TREC #${BUSINESS.trecLicense}; broker and founder ${FOUNDER.name}.`,
};

export const WHAT_AREAS_SERVED: Faq = {
  q: 'What areas does CRECO serve?',
  a: 'San Antonio and the Texas Hill Country: Fair Oaks Ranch (headquarters), Boerne, Leon Springs and the I-10 corridor, Stone Oak, the Medical Center and Northwest San Antonio, Schertz–Cibolo–Selma, New Braunfels, Bulverde and Spring Branch, and Lytle on the I-35 corridor. CRECO also represents tenants with requirements elsewhere in Texas.',
};

export const HOW_TO_LEASE_FAIR_OAKS: Faq = {
  q: 'How do I lease commercial space in Fair Oaks Ranch?',
  a: `Tell CRECO what you need (use, size, budget, timing) at ${SITE_URL}/get-started or call ${BUSINESS.phoneDisplay}. CRECO then shortlists available space, including off-market options, tours it with you, and negotiates the letter of intent and lease. For a tenant, representation is typically free because the landlord pays the commission, and a focused search usually takes about 30–90 days to a signed lease. CRECO's own Fair Oaks Ranch space includes the retail bays and executive office suites at 8000 Fair Oaks Plaza (8000 Fair Oaks Pkwy) and the new Elkhorn Point retail center (8923 Dietz Elkhorn Rd), which is pre-leasing.`,
};

export const WHO_IS_BROKER: Faq = {
  q: 'Who is the broker behind CRECO?',
  a: `${FOUNDER.name} is the broker and founder of CRECO (TREC #${FOUNDER.trecLicense}); ${DIRECTOR_OF_LEASING.name} is ${DIRECTOR_OF_LEASING.jobTitle}. The brokerage is licensed by the Texas Real Estate Commission under TREC #${BUSINESS.trecLicense}.`,
};

/** Lead-with-the-answer block for the homepage, llms.txt and llms-full.txt. */
export const CORE_ANSWERS: Faq[] = [WHAT_CRECO_DOES, WHAT_AREAS_SERVED, HOW_TO_LEASE_FAIR_OAKS];

export const REPRESENTATION_ANSWER: Faq = {
  q: 'Does CRECO represent tenants or landlords?',
  a: `Both — and investors. ${REPRESENTATION_STATEMENT} ${CAPABILITY_LINE}`,
};

/** /market-brief — honest pre-launch answers (no figures until the edition is sourced). */
export const MARKET_BRIEF_FAQS: Faq[] = [
  {
    q: 'What is the San Antonio & Hill Country Market Brief?',
    a: `A quarterly brief on San Antonio and Texas Hill Country commercial real estate (retail, office and industrial) written by ${FOUNDER.name}, with each figure cited to its source. The first edition is in preparation and publishes this quarter; sign up on this page to get one email when it is out.`,
  },
  {
    q: 'Where can I find CRECO\'s San Antonio market information today?',
    a: 'CRECO publishes market pages for San Antonio commercial real estate, Fair Oaks Ranch and Boerne, plus submarket pages for Stone Oak, Northwest San Antonio, Schertz–Cibolo–Selma, New Braunfels and Bulverde & Spring Branch. For current availability, rents or a specific submarket, call (210) 817-3443.',
  },
  {
    q: 'Who writes the brief?',
    a: `${FOUNDER.name}, CRECO's broker and founder (TREC #${FOUNDER.trecLicense}). CRECO owns and operates commercial property in Fair Oaks Ranch and Lytle and is developing Elkhorn Point, so the brief is written from the perspective of an owner, landlord and broker in the markets it covers.`,
  },
];

/** /markets hub. */
export const MARKETS_FAQS: Faq[] = [
  WHAT_AREAS_SERVED,
  {
    q: 'Which San Antonio and Hill Country submarkets does CRECO cover?',
    a: 'Stone Oak, Northwest San Antonio and the Medical Center, Schertz–Cibolo–Selma, New Braunfels, and Bulverde & Spring Branch, alongside the city-level pages for San Antonio, Fair Oaks Ranch and Boerne. Each submarket page lists current CRECO inventory and local leasing context.',
  },
  {
    q: 'Can CRECO help if my requirement is outside these markets?',
    a: 'Yes for tenants: CRECO represents tenants with requirements elsewhere in Texas. Its owner-side listings and local depth are concentrated in San Antonio and the Texas Hill Country.',
  },
];
