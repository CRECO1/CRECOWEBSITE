/**
 * Signed, per-recipient token for the public invoice page (/inv/<token>).
 *
 * The token names the invoice AND the recipient (email + To/Cc role), so a view can be attributed to a
 * person. It is signed (HMAC-SHA256), so it can't be forged or retargeted at another invoice/recipient,
 * and carries no secret data. Anyone holding the link can see that one invoice — the same model as the
 * client portal; forwarding the email forwards the link.
 */
import { createHmac, timingSafeEqual } from 'crypto';

export interface InvoiceViewClaim { inv: string; email: string; role: 'to' | 'cc' }

function secret(): string {
  const s = process.env.INVOICE_VIEW_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('invoice-view-token: no signing secret available');
  return s;
}

const mac = (payload: string) => createHmac('sha256', secret()).update(`invview:${payload}`).digest('base64url').slice(0, 27);

export function signInvoiceView(claim: InvoiceViewClaim): string {
  const payload = Buffer.from(JSON.stringify({ i: claim.inv, e: claim.email, r: claim.role })).toString('base64url');
  return `${payload}.${mac(payload)}`;
}

export function verifyInvoiceView(token: unknown): InvoiceViewClaim | null {
  if (typeof token !== 'string' || token.length > 600) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(mac(payload));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const j = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { i?: string; e?: string; r?: string };
    if (!j.i || !j.e || (j.r !== 'to' && j.r !== 'cc')) return null;
    return { inv: j.i, email: j.e, role: j.r };
  } catch { return null; }
}
