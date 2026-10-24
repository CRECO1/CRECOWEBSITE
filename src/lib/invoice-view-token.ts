/**
 * Signed, per-recipient token for the public invoice page (/inv/<token>).
 *
 * The token names the invoice AND the recipient (email + To/Cc role), so a view can be attributed to a
 * person. It is signed (HMAC-SHA256), so it can't be forged or retargeted at another invoice/recipient,
 * and carries no secret data. Anyone holding the link can see that one invoice — the same model as the
 * client portal; forwarding the email forwards the link.
 *
 * Signing key: INVOICE_VIEW_SECRET. If it is not set we still fall back to SUPABASE_SERVICE_ROLE_KEY so
 * links keep working (and log a loud warning), but production should set a dedicated secret — a bug that
 * exposes the HMAC key must never also hand out the database key. Verification accepts BOTH keys so that
 * links already emailed (signed with the fallback) keep working after the dedicated secret is introduced.
 *
 * Expiry: new tokens carry `x` (unix seconds, ~1 year). Tokens issued before this change have no `x` and
 * stay valid (they pre-date expiry and cannot be re-issued); everything signed from now on expires.
 */
import { createHmac, timingSafeEqual } from 'crypto';

export interface InvoiceViewClaim { inv: string; email: string; role: 'to' | 'cc' }

const TOKEN_TTL_SECONDS = 365 * 24 * 3600;

function secrets(): { primary: string; legacy: string | null } {
  const dedicated = process.env.INVOICE_VIEW_SECRET || '';
  const legacy = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (dedicated) return { primary: dedicated, legacy: legacy || null };
  if (!legacy) throw new Error('invoice-view-token: no signing secret available');
  if (process.env.NODE_ENV === 'production') {
    console.error('[invoice-view-token] INVOICE_VIEW_SECRET is not set — signing with the service-role key. Set a dedicated secret.');
  }
  return { primary: legacy, legacy: null };
}

const mac = (key: string, payload: string) =>
  createHmac('sha256', key).update(`invview:${payload}`).digest('base64url').slice(0, 27);

export function signInvoiceView(claim: InvoiceViewClaim): string {
  const payload = Buffer.from(JSON.stringify({
    i: claim.inv, e: claim.email, r: claim.role, x: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  })).toString('base64url');
  return `${payload}.${mac(secrets().primary, payload)}`;
}

function macMatches(key: string, payload: string, given: Buffer): boolean {
  const expected = Buffer.from(mac(key, payload));
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function verifyInvoiceView(token: unknown): InvoiceViewClaim | null {
  if (typeof token !== 'string' || token.length > 600) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  let ok = false;
  try {
    const { primary, legacy } = secrets();
    ok = macMatches(primary, payload, given) || (legacy !== null && macMatches(legacy, payload, given));
  } catch { return null; }
  if (!ok) return null;
  try {
    const j = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { i?: string; e?: string; r?: string; x?: number };
    if (!j.i || !j.e || (j.r !== 'to' && j.r !== 'cc')) return null;
    if (typeof j.x === 'number' && j.x < Math.floor(Date.now() / 1000)) return null;
    return { inv: j.i, email: j.e, role: j.r };
  } catch { return null; }
}
