/**
 * Homepage hero — the two decisions still waiting on Zack. Everything else about the hero's "talk to us" line
 * and AI welcome line reads from the site's existing facts (schema.ts BUSINESS, broker.ts).
 *
 * 1. Google rating in the hero — approved by Zack (Oct 2026). Renders "5.0★ on Google"; the review count is
 *    appended ("5.0★ on Google (38 reviews)") only once it reaches HERO_MIN_REVIEWS_TO_SHOW_COUNT, because a
 *    perfect rating on a handful of reviews reads as thin to a stranger. The numbers come from lib/reviews.ts
 *    (GOOGLE_RATING / GOOGLE_REVIEW_COUNT) — bump them there when the profile changes.
 *
 * 2. Response-time promise (for AI-referred visitors' welcome line)
 *    Replace null with Zack's exact wording, e.g. 'A broker will reply ...'. Do not paraphrase a number he hasn't
 *    given. It renders as its own sentence after the welcome line, only for AI-referred visitors.
 */
export const SHOW_GOOGLE_RATING = true;

/** Show "(N reviews)" beside the hero rating only at or above this many reviews. */
export const HERO_MIN_REVIEWS_TO_SHOW_COUNT = 15;

// TODO(Zack): response-time promise — pending. Leave null until he gives the wording.
export const RESPONSE_TIME_PROMISE: string | null = null;

/** Neutral welcome shown only to visitors who arrived from an AI assistant. No response-time claim. */
export const AI_WELCOME_LINE = 'Looking for space in San Antonio or the Hill Country? Tell us what you need.';
