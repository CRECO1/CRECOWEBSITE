/**
 * Per-IP in-memory rate limiter for public API endpoints.
 *
 * Honest scope: this is a best-effort defense, not a hard guarantee.
 * Vercel functions are stateless — buckets live in a single warm
 * function instance and reset on cold start. An attacker spreading
 * traffic across many concurrent edge regions could route around this.
 *
 * It exists to:
 *   1. Catch the most common abuse pattern (one IP hammering one
 *      endpoint via curl / a basic script).
 *   2. Layer on top of the existing reCAPTCHA + honeypot defenses —
 *      defense in depth.
 *   3. Throttle accidental loops (a misconfigured client retrying
 *      every 100ms) before they rack up a bill.
 *
 * For a hard guarantee at scale, back this with Upstash Redis or
 * Vercel KV. The interface is intentionally narrow so swapping in a
 * distributed implementation is a one-file change.
 *
 * Why per-IP and not per-email: email is user-controlled and trivially
 * randomized; IP is harder to fake at volume. We still validate email
 * shape elsewhere as a separate concern.
 *
 * Why best-effort logging instead of throwing: a rate-limit miss
 * shouldn't crash a handler; the caller decides whether to 429 or
 * continue (some endpoints might prefer "log + allow" for paying
 * customers).
 */

import type { NextRequest } from 'next/server';

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Per-namespace bucket maps. Each (key, namespace) gets its own counter
 * so /api/leads and /api/inquiry don't share a quota — an operator
 * legitimately filling out one form shouldn't block the other.
 */
const buckets = new Map<string, Map<string, Bucket>>();

function getNamespaceBuckets(namespace: string): Map<string, Bucket> {
  let m = buckets.get(namespace);
  if (!m) {
    m = new Map();
    buckets.set(namespace, m);
  }
  return m;
}

/**
 * Best-effort IP extraction. Vercel sets x-forwarded-for and x-real-ip
 * on every request. Falls back to a literal "unknown" bucket — better
 * to share the unknown-IP quota across actors than to silently let
 * unattributed traffic through unlimited.
 */
export function clientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    // x-forwarded-for can be a comma-separated chain; first entry is
    // the original client. Trim defensively.
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}

export interface RateLimitOptions {
  /** Bucket namespace — typically the route path. */
  namespace: string;
  /** How many requests allowed per window. */
  max: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

export interface RateLimitResult {
  /** True when the request is within the allowed quota. */
  allowed: boolean;
  /** Remaining requests in the current window (0 when allowed=false). */
  remaining: number;
  /** Epoch ms when the window resets. */
  resetAt: number;
}

/**
 * Check whether a given key (typically IP) is within the rate limit
 * for a namespace. Increments the counter on a hit.
 *
 * Returns enough info for the caller to set Retry-After / X-RateLimit-*
 * headers if it wants — most just need allowed/false to 429.
 */
export function checkRateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const ns = getNamespaceBuckets(opts.namespace);
  const now = Date.now();
  const bucket = ns.get(key);

  if (!bucket || bucket.resetAt < now) {
    // Fresh window — start a new bucket. count=1 for this request.
    const resetAt = now + opts.windowMs;
    ns.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: opts.max - 1, resetAt };
  }

  if (bucket.count >= opts.max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, opts.max - bucket.count),
    resetAt: bucket.resetAt,
  };
}

/**
 * Convenience wrapper for the common case: check by client IP, return
 * a Response if rate-limited. Caller can `return` it directly.
 *
 *   const limited = enforceRateLimit(req, { namespace: 'leads', max: 5, windowMs: 60_000 });
 *   if (limited) return limited;
 *
 * Sets standard rate-limit headers (X-RateLimit-Limit, -Remaining, -Reset)
 * + Retry-After in seconds — courteous to legitimate clients and required
 * by some HTTP linters.
 */
export function enforceRateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
): Response | null {
  const ip = clientIp(req);
  const result = checkRateLimit(ip, opts);
  if (result.allowed) return null;
  const retryAfterSeconds = Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000));
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please slow down and try again shortly.',
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Limit': String(opts.max),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      },
    },
  );
}
