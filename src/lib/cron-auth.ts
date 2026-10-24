import { timingSafeEqual } from 'crypto';

/**
 * Constant-time check of the `Authorization: Bearer ${CRON_SECRET}` header that
 * Vercel Cron (and our dispatcher) send. Returns false when CRON_SECRET is unset;
 * callers keep their own explicit 503 "not configured" branch.
 */
export function isCronAuthorized(authHeader: string | null): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authHeader) return false;
  const given = Buffer.from(authHeader);
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
