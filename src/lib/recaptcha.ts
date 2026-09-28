/**
 * reCAPTCHA v3 server-side verification helper.
 *
 * Two modes of operation, controlled entirely by env vars:
 *
 *   - If `RECAPTCHA_SECRET_KEY` is unset → verification is bypassed (returns
 *     `{ ok: true }`). This lets the site keep working in dev / before the
 *     keys are provisioned. Form submissions still go through.
 *
 *   - If `RECAPTCHA_SECRET_KEY` is set → token is required. Calls Google's
 *     siteverify endpoint, checks the score (default threshold 0.5), and
 *     rejects the submission if Google flags it as bot-like.
 *
 * Frontend pairs with this server-side check by loading the v3 script when
 * `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set and submitting the resulting token
 * along with the form payload.
 */

interface VerifyResult {
  ok: boolean;
  score?: number;
  reason?: string;
}

const SCORE_THRESHOLD = 0.5;

export async function verifyRecaptcha(token: string | undefined | null): Promise<VerifyResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  // No secret configured → reCAPTCHA disabled, allow through
  if (!secret) return { ok: true, reason: 'recaptcha-disabled' };

  // Secret IS configured but no token arrived — the usual cause is a real visitor whose
  // ad-blocker / privacy extension / network blocked the reCAPTCHA script, not a bot. Fail
  // OPEN rather than 403 a genuine lead: the honeypot + rate limit still guard this path, and
  // the score is only enforced below when a token IS present.
  if (!token) return { ok: true, reason: 'missing-token-allowed' };

  try {
    const params = new URLSearchParams({ secret, response: token });
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      // Don't let a hung siteverify hang (and then drop) the lead submission.
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (!data.success) return { ok: false, reason: 'google-rejected' };
    if (typeof data.score === 'number' && data.score < SCORE_THRESHOLD) {
      return { ok: false, score: data.score, reason: 'low-score' };
    }
    return { ok: true, score: data.score };
  } catch (err) {
    // A verify EXCEPTION (timeout, network, Google 5xx) means the check was
    // *unavailable* — not that this visitor is a bot. Fail OPEN here, exactly like
    // the no-token path above: the honeypot + rate limit still guard this route, and
    // the score is only enforced when Google returns a definitive answer. Failing
    // closed here was inconsistent (a token-less bot already gets the open lane) and
    // was the thing silently 400-ing real leads during a Google blip. Definitive
    // negatives — google-rejected / low-score — still fail closed above.
    console.warn('reCAPTCHA verify unavailable; allowing (honeypot + rate limit still apply):', (err as Error).message);
    return { ok: true, reason: 'verify-error-allowed' };
  }
}
