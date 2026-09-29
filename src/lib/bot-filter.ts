/**
 * Server-side bot screening for the public lead handlers — everything that
 * doesn't depend on reCAPTCHA.
 *
 * reCAPTCHA stays fail-open on purpose (lib/recaptcha.ts): a visitor whose
 * ad-blocker ate the script still gets through. That leaves a scripted POST
 * with no token facing only the honeypot and the per-IP rate limit, and the
 * spam that reached the CRM had two tells neither of those catches:
 *
 *   1. No `form_rendered_at`. Every real form on the site renders <Honeypot>,
 *      which stamps it, and every submit path sends it — so a missing stamp is
 *      a POST that never came from our page. The timing check used to let a
 *      missing stamp through; here it fails.
 *   2. A keyboard-mash name — "hGkLmNqRtZ", "sdfghjkl", "XbTrWqPl".
 *
 * Same heuristics as the CRM / Fair Oaks side, so a submission judged a bot on
 * one property is judged a bot on the other.
 *
 * Tuned to never reject a person. The name check only looks at plain-ASCII
 * Latin names (anything with accents, CJK, Cyrillic etc. is skipped outright),
 * only single signals that no real name produces reject on their own, and the
 * weaker signals have to stack. The cost of losing one genuine enquiry is far
 * higher than the cost of one bot reaching the layers behind this.
 */

import { NextResponse } from 'next/server';
import { checkFormTiming } from '@/lib/form-timing';

export type GibberishReason =
  | 'keyboard-row'
  | 'consonant-run'
  | 'no-vowels'
  | 'random-case'
  | 'weak-signals';

export interface NameVerdict {
  gibberish: boolean;
  reason?: GibberishReason;
}

// Runs of 5+ adjacent keys along a keyboard row, in either direction. Nobody's
// name contains "asdfg" or "lkjhg". Five, not four: "Uiop" / "Wert" style
// fragments are too short to be sure of.
const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
const KEY_RUNS: string[] = (() => {
  const runs: string[] = [];
  for (const row of KEY_ROWS) {
    for (const r of [row, [...row].reverse().join('')]) {
      for (let i = 0; i + 5 <= r.length; i++) runs.push(r.slice(i, i + 5));
    }
  }
  return runs;
})();

// 'y' counts as a vowel — Lynn, Glynn, Llywelyn.
const VOWELS = /[aeiouy]/;

function longestConsonantRun(word: string): number {
  let best = 0;
  let cur = 0;
  for (const ch of word) {
    if (/[a-z]/.test(ch) && !VOWELS.test(ch)) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

/**
 * Case flips after the first letter of a token: "hGkLmN" → many, "McDonald" →
 * 1, "DeShawn" → 1, "MacArthur" → 1. Real names top out around 2.
 */
function caseFlips(token: string): number {
  let flips = 0;
  const letters = token.replace(/[^A-Za-z]/g, '');
  for (let i = 2; i < letters.length; i++) {
    const prevUpper = letters[i - 1] === letters[i - 1].toUpperCase();
    const curUpper = letters[i] === letters[i].toUpperCase();
    if (prevUpper !== curUpper) flips += 1;
  }
  return flips;
}

export function looksLikeGibberishName(raw: unknown): NameVerdict {
  if (typeof raw !== 'string') return { gibberish: false };
  const name = raw.trim();
  // Empty / initials-only are validated (or allowed) by the route itself.
  if (name.length < 5) return { gibberish: false };
  // Only judge plain Latin names. Accents, apostrophes and hyphens are fine
  // (stripped below); any other script is out of scope — never guess.
  if (/[^\x20-\x7E]/.test(name)) return { gibberish: false };

  const lower = name.toLowerCase();
  const letters = lower.replace(/[^a-z]/g, '');
  if (letters.length < 5) return { gibberish: false };
  const tokens = name.split(/[\s.,'’-]+/).filter(Boolean);

  // ── Single signals no real name produces ──────────────────────────────────
  const squashed = lower.replace(/[^a-z]/g, '');
  if (KEY_RUNS.some(run => squashed.includes(run))) {
    return { gibberish: true, reason: 'keyboard-row' };
  }
  // Seven consonants in a row inside one word. Knightsbridge peaks at 6
  // (g-h-t-s-b-r); nothing in English, Spanish, Polish-in-ASCII or Gaelic
  // spelling reaches 7.
  if (tokens.some(t => longestConsonantRun(t.toLowerCase()) >= 7)) {
    return { gibberish: true, reason: 'consonant-run' };
  }
  // Eight-plus letters and not a single vowel (y included).
  if (letters.length >= 8 && !VOWELS.test(letters)) {
    return { gibberish: true, reason: 'no-vowels' };
  }
  // Four or more case flips inside one token: "hGkLmN", "XbTrWqPl".
  if (tokens.some(t => t.length >= 6 && caseFlips(t) >= 4)) {
    return { gibberish: true, reason: 'random-case' };
  }

  // ── Weaker signals — need at least two together ───────────────────────────
  const vowelCount = [...letters].filter(c => VOWELS.test(c)).length;
  let weak = 0;
  if (letters.length >= 8 && vowelCount / letters.length < 0.2) weak += 1;
  if (tokens.some(t => longestConsonantRun(t.toLowerCase()) >= 5)) weak += 1;
  if (tokens.length === 1 && letters.length >= 12) weak += 1;
  if (tokens.some(t => t.length >= 6 && caseFlips(t) >= 2)) weak += 1;
  if (weak >= 2) return { gibberish: true, reason: 'weak-signals' };

  return { gibberish: false };
}

/**
 * Runs the timing (mandatory) and name checks for one public handler. Returns
 * the response to send when the submission is rejected, or null to carry on.
 * Call it after the honeypot check.
 *
 * - Timing too fast / stale, or a gibberish name: answered like the honeypot —
 *   success to the caller, nothing recorded — so a bot learns nothing.
 * - Timing stamp missing: a real 400 asking for a refresh. A bot gains nothing
 *   from it, and the one human it could ever hit (a tab still running a bundle
 *   from before a deploy) can recover instead of losing their enquiry.
 *
 * `successBody` is the handler's own normal success JSON, so a rejected bot
 * gets exactly what a real submission would.
 */
export function screenSubmission(opts: {
  tag: string;
  body: Record<string, unknown>;
  name?: unknown;
  successBody?: Record<string, unknown>;
}): NextResponse | null {
  const { tag, body, name, successBody = { success: true } } = opts;

  const timing = checkFormTiming(body.form_rendered_at);
  if (!timing.ok) {
    console.warn(`[${tag}] rejected on timing`, { reason: timing.reason, elapsedMs: timing.elapsedMs });
    if (timing.reason === 'missing') {
      return NextResponse.json(
        { error: 'Something went wrong with this form. Please refresh the page and try again.' },
        { status: 400 },
      );
    }
    return NextResponse.json(successBody);
  }

  const verdict = looksLikeGibberishName(name);
  if (verdict.gibberish) {
    console.warn(`[${tag}] rejected on gibberish name`, {
      reason: verdict.reason,
      // Enough to audit false positives in the logs without storing the value.
      nameLength: typeof name === 'string' ? name.length : null,
      sample: typeof name === 'string' ? name.slice(0, 24) : null,
    });
    return NextResponse.json(successBody);
  }

  return null;
}
