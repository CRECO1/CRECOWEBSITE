/**
 * Email quality gate — is this address one a broker could actually reach?
 *
 * Three checks, cheapest first:
 *   1. Shape. Already covered by isValidEmail in ./sanitize; re-checked here so
 *      a caller gets one verdict from one function.
 *   2. Disposable domain. A throwaway inbox is never a lead — nobody asks for
 *      Texas industrial comps from a ten-minute address.
 *   3. MX records. The domain has to be able to receive mail at all. This
 *      catches typos (gmial.com) and invented domains that pass a regex.
 *
 * The MX lookup is the only one that touches the network, so it is optional
 * and fails OPEN: a DNS hiccup must never cost a real enquiry. Everything here
 * is designed to reject the obviously-junk and wave through anything doubtful.
 */
import { promises as dns } from 'node:dns';
import { isValidEmail } from './sanitize';

/**
 * Disposable / throwaway providers. Not exhaustive — it does not need to be.
 * The long tail is handled by the MX check and the confirmation step, and a
 * blocklist that is too aggressive starts eating real small-business domains.
 */
const DISPOSABLE_DOMAINS = new Set([
  '0-mail.com', '10minutemail.com', '10minutemail.net', '20minutemail.com', '33mail.com',
  'anonaddy.com', 'anonaddy.me', 'burnermail.io', 'byom.de', 'cock.li',
  'dispostable.com', 'discard.email', 'dropmail.me', 'emailondeck.com', 'emailtemporario.com.br',
  'fakeinbox.com', 'fakemail.net', 'getairmail.com', 'getnada.com', 'grr.la',
  'guerrillamail.biz', 'guerrillamail.com', 'guerrillamail.de', 'guerrillamail.info',
  'guerrillamail.net', 'guerrillamail.org', 'guerrillamailblock.com', 'harakirimail.com',
  'inboxbear.com', 'inboxkitten.com', 'jetable.org', 'mail-temporaire.fr', 'mail7.io',
  'mailcatch.com', 'maildrop.cc', 'mailasdf.com', 'mailinator.com', 'mailnesia.com',
  'mailsac.com', 'mailtemp.info', 'mintemail.com', 'moakt.com', 'mohmal.com',
  'mytemp.email', 'nowmymail.com', 'opayq.com', 'sharklasers.com', 'spam4.me',
  'spamgourmet.com', 'spambog.com', 'temp-mail.io', 'temp-mail.org', 'tempail.com',
  'tempinbox.com', 'tempmail.com', 'tempmail.net', 'tempmailo.com', 'tempr.email',
  'throwawaymail.com', 'trashmail.com', 'trashmail.de', 'trbvm.com', 'tmpmail.org',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'zetmail.com',
]);

/** Obvious role/no-reply addresses — nobody is on the other end of these. */
const ROLE_LOCALPARTS = new Set(['noreply', 'no-reply', 'donotreply', 'do-not-reply', 'postmaster', 'mailer-daemon', 'abuse']);

export type EmailRejection = 'malformed' | 'disposable' | 'role-address' | 'no-mx';

export interface EmailVerdict {
  ok: boolean;
  reason?: EmailRejection;
  /** True when the address is fine but worth a second look (see geo tagging). */
  domain: string | null;
}

export function domainOf(email: string): string | null {
  const at = email.lastIndexOf('@');
  return at === -1 ? null : email.slice(at + 1).trim().toLowerCase();
}

/** Synchronous checks only — safe to call anywhere, no network. */
export function checkEmailQualitySync(emailRaw: unknown): EmailVerdict {
  if (!isValidEmail(emailRaw)) return { ok: false, reason: 'malformed', domain: null };
  const email = String(emailRaw).trim().toLowerCase();
  const domain = domainOf(email);
  if (!domain) return { ok: false, reason: 'malformed', domain: null };

  if (DISPOSABLE_DOMAINS.has(domain)) return { ok: false, reason: 'disposable', domain };

  const local = email.slice(0, email.lastIndexOf('@'));
  if (ROLE_LOCALPARTS.has(local)) return { ok: false, reason: 'role-address', domain };

  return { ok: true, domain };
}

/**
 * Adds the MX lookup. Fails open on any DNS error — an outage or a slow
 * resolver must not turn into a rejected enquiry.
 */
export async function checkEmailQuality(emailRaw: unknown, opts: { checkMx?: boolean } = {}): Promise<EmailVerdict> {
  const verdict = checkEmailQualitySync(emailRaw);
  if (!verdict.ok || opts.checkMx === false || !verdict.domain) return verdict;

  try {
    const records = await Promise.race([
      dns.resolveMx(verdict.domain),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('mx-timeout')), 3000)),
    ]);
    if (!records || records.length === 0) return { ok: false, reason: 'no-mx', domain: verdict.domain };
    return verdict;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    // NXDOMAIN / NODATA are real answers: the domain cannot receive mail.
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      return { ok: false, reason: 'no-mx', domain: verdict.domain };
    }
    // Anything else (timeout, SERVFAIL, resolver down) — let it through.
    return verdict;
  }
}

/** Markets CRECO actually works. Everything else is tagged, never blocked. */
const HOME_REGIONS = new Set(['TX']);

/**
 * Flags a signup as outside the market. Deliberately advisory: a Texas owner
 * travelling, a relocating tenant, or an out-of-state investor are all real,
 * so this tags for triage rather than rejecting.
 */
export function isOutOfMarket(geoRegion: string | null, geoCountry: string | null): boolean {
  if (geoCountry && geoCountry.toUpperCase() !== 'US') return true;
  if (geoRegion && !HOME_REGIONS.has(geoRegion.toUpperCase())) return true;
  return false;
}
