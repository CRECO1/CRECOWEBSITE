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

  // Secret IS configured but no token sent → block
  if (!token) return { ok: false, reason: 'missing-token' };

  try {
    const params = new URLSearchParams({ secret, response: token });
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const data = await res.json();
    if (!data.success) return { ok: false, reason: 'google-rejected' };
    if (typeof data.score === 'number' && data.score < SCORE_THRESHOLD) {
      return { ok: false, score: data.score, reason: 'low-score' };
    }
    return { ok: true, score: data.score };
  } catch (err) {
    // Fail CLOSED on a verify error. Failing open let an attacker bypass the
    // score check by inducing a timeout/error at Google's endpoint (or riding a
    // transient outage) to fire unlimited bot submissions + the two Resend
    // emails each triggers. A genuine user simply retries.
    console.warn('reCAPTCHA verify failed; blocking:', (err as Error).message);
    return { ok: false, reason: 'verify-error' };
  }
}
