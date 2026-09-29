/**
 * Stand-in address for a lead who gave a phone number and no email.
 *
 * /get-started's finish screen and its "Have us call you" panel ask only for a
 * name and a number. Two stores downstream still need an email:
 *
 *   - this site's `leads.email` is NOT NULL (supabase/migrations/0001_init.sql);
 *   - the Fair Oaks CRM webhook requires one and de-duplicates contacts on it.
 *
 * So a phone-only lead is stored under an address derived from the number.
 * `.invalid` is reserved by RFC 2606 and can never resolve, so nothing is ever
 * delivered to it, and deriving it from the digits means the same caller
 * coming back lands on the same CRM contact instead of a duplicate.
 *
 * Anything that sends mail to leads must skip these — see isPlaceholderEmail.
 */

const PLACEHOLDER_DOMAIN = 'no-email.invalid';

export function phoneOnlyEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `phone-${digits}@${PLACEHOLDER_DOMAIN}`;
}

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return typeof email === 'string' && email.toLowerCase().endsWith(`@${PLACEHOLDER_DOMAIN}`);
}

/** For Supabase `.not('email', 'like', …)` filters. */
export const PLACEHOLDER_EMAIL_LIKE = `%@${PLACEHOLDER_DOMAIN}`;
