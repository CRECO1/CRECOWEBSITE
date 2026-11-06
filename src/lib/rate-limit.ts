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
import { createHash } from 'node:crypto';
import { resolveClientIp } from '@/lib/client-ip';

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
  return resolveClientIp(req.headers);
}

/** An IPv6 visitor controls a whole /64, so limits key on that prefix, not the single address. IPv4 and "unknown" pass through unchanged. */
export function ipBucket(ip: string): string {
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const groups = ip.includes('::') ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h;
  return groups.slice(0, 4).map(g => (g || '0').toLowerCase()).join(':') + '::/64';
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

  if (ns.size > 5000) { for (const [k, b] of ns) if (b.resetAt < now) ns.delete(k); if (ns.size > 5000) ns.clear(); }
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
 * Shared limiter backed by the Supabase database (public.rl_hit, see
 * supabase/migrations/0056_rate_limit_hits.sql). Used when no Redis is
 * configured. If the function is not installed yet, the key is missing, or the
 * call is slow or fails, it falls back to the in-memory limiter so a form can
 * never be taken down by the limiter itself.
 */
async function checkRateLimitDb(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!base || !svc) return checkRateLimit(key, opts);
  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/rest/v1/rpc/rl_hit`, {
      method: 'POST',
      headers: { apikey: svc, Authorization: `Bearer ${svc}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_key: `${opts.namespace}:${key}`, p_window_ms: opts.windowMs }),
      signal: AbortSignal.timeout(1500),
      cache: 'no-store',
    });
    if (!res.ok) return checkRateLimit(key, opts);
    const rows = (await res.json()) as Array<{ hits?: number; ttl_ms?: number }>;
    const hits = Number(rows?.[0]?.hits ?? 0);
    if (!hits) return checkRateLimit(key, opts);
    const ttl = Number(rows?.[0]?.ttl_ms ?? opts.windowMs);
    const resetAt = Date.now() + (ttl > 0 ? ttl : opts.windowMs);
    if (hits > opts.max) return { allowed: false, remaining: 0, resetAt };
    return { allowed: true, remaining: Math.max(0, opts.max - hits), resetAt };
  } catch {
    return checkRateLimit(key, opts);
  }
}

/**
 * Shared (cross-instance) limiter. When UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set (Vercel KV / Upstash integration), counts
 * live in Redis so the limit binds across serverless instances and cold
 * starts. Without them, or if Redis errors, it falls back to the per-instance
 * in-memory limiter above, so a Redis outage can never take a form down.
 */
export async function checkRateLimitShared(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return checkRateLimitDb(key, opts);
  try {
    const windowSec = Math.max(1, Math.ceil(opts.windowMs / 1000));
    const redisKey = `rl:${opts.namespace}:${key}`;
    const res = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([['INCR', redisKey], ['EXPIRE', redisKey, String(windowSec), 'NX'], ['PTTL', redisKey]]),
      signal: AbortSignal.timeout(1500),
      cache: 'no-store',
    });
    if (!res.ok) return checkRateLimitDb(key, opts);
    const out = (await res.json()) as Array<{ result?: number }>;
    const count = Number(out?.[0]?.result ?? 0);
    const pttl = Number(out?.[2]?.result ?? opts.windowMs);
    const resetAt = Date.now() + (pttl > 0 ? pttl : opts.windowMs);
    if (!count) return checkRateLimit(key, opts);
    if (count > opts.max) return { allowed: false, remaining: 0, resetAt };
    return { allowed: true, remaining: Math.max(0, opts.max - count), resetAt };
  } catch {
    return checkRateLimit(key, opts);
  }
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
export async function enforceRateLimit(
  req: NextRequest,
  opts: RateLimitOptions,
): Promise<Response | null> {
  const ip = ipBucket(clientIp(req));
  const result = await checkRateLimitShared(ip, opts);
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


/**
 * Gate for automatic email to an address a visitor TYPED INTO A FORM: no more than 2 per recipient per 24 hours and 150 an hour overall, so a form
 * can't be used to mail-bomb someone from our domain or burn the sending quota. A "no" just skips the automatic reply (the lead is still saved and
 * the broker still alerted), so a real visitor loses nothing but the courtesy email.
 */
export async function mailAllowed(emailRaw: string): Promise<boolean> {
  const email = String(emailRaw ?? '').trim().toLowerCase();
  if (!email) return false;
  const key = createHash('sha256').update(email).digest('hex').slice(0, 24);
  const per = await checkRateLimitShared(key, { namespace: 'mail-recipient', max: 2, windowMs: 24 * 3600_000 });
  if (!per.allowed) return false;
  const all = await checkRateLimitShared('all', { namespace: 'mail-global', max: 150, windowMs: 3600_000 });
  return all.allowed;
}
