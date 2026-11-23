/** When the Market Brief was last genuinely revised. Bump with each edition or data refresh: page, schema and sitemap all read it. */
export const BRIEF_UPDATED = '2026-11-23';

/** Edition currently at /market-brief. */
export const BRIEF_ISSUE = { number: 2, period: 'Q3 2026', published: 'November 2026' } as const;

/**
 * False until the named broker has read the current edition: the page then says "Prepared by CRECO" and the schema
 * omits reviewedBy / lastReviewed. Flip to true only after he has (same rule as `reviewed` in answer-pages.ts).
 */
export const BRIEF_REVIEWED = false;
