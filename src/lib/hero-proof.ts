/**
 * Homepage hero — the two decisions still waiting on Zack. Everything else about the hero's "talk to us" line
 * and AI welcome line reads from the site's existing facts (schema.ts BUSINESS, broker.ts).
 *
 * 1. Google rating in the hero ("5.0★ on Google · 6 reviews")
 *    Flip SHOW_GOOGLE_RATING to true. The numbers come from lib/reviews.ts (GOOGLE_RATING / GOOGLE_REVIEW_COUNT),
 *    so they stay in step with the reviews section. Nothing else to edit.
 *
 * 2. Response-time promise (for AI-referred visitors' welcome line)
 *    Replace null with Zack's exact wording, e.g. 'A broker will reply ...'. Do not paraphrase a number he hasn't
 *    given. It renders as its own sentence after the welcome line, only for AI-referred visitors.
 */
export const SHOW_GOOGLE_RATING = false;

// TODO(Zack): response-time promise — pending. Leave null until he gives the wording.
export const RESPONSE_TIME_PROMISE: string | null = null;

/** Neutral welcome shown only to visitors who arrived from an AI assistant. No response-time claim. */
export const AI_WELCOME_LINE = 'Looking for space in San Antonio or the Hill Country? Tell us what you need.';
