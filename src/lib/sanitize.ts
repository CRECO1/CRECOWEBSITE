/**
 * Server-side input sanitization helpers for the API routes.
 *
 * These exist because we interpolate user-submitted strings (name, email,
 * company, message, etc.) into HTML email bodies sent via Resend. Without
 * escaping, a submitter could inject HTML into the email — a stored XSS
 * surface against the broker reading the inbox. Email clients vary widely
 * in how aggressively they strip HTML; we don't want to depend on it.
 *
 * Plus: clamping input lengths and validating email format strictly prevents
 * absurdly long payloads, header-injection-style email values, and gives
 * cleaner DB rows.
 *
 * Usage on the server side:
 *   const safeName  = clampString(name, 200);
 *   const safeEmail = isValidEmail(email) ? email.toLowerCase() : null;
 *   const html = `<p>Hi ${escapeHtml(safeName)},</p>`;
 */

const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape a string for safe interpolation into HTML. Handles the common
 * attack vectors (script injection, attribute breakouts, mustache).
 *
 * Returns '' for null/undefined so callers can blindly use it in templates.
 */
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  const s = String(input);
  return s.replace(/[&<>"'`=/]/g, c => HTML_ESCAPE_MAP[c] ?? c);
}

/**
 * Clamp a string to a maximum length and strip control characters that have
 * no business in user input (newlines + tabs are kept). Returns '' for
 * non-strings so callers don't have to type-check first.
 */
export function clampString(input: unknown, max: number): string {
  if (typeof input !== 'string') return '';
  // Strip C0 control characters except \t (0x09), \n (0x0A), \r (0x0D)
  // eslint-disable-next-line no-control-regex
  const cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return cleaned.slice(0, max).trim();
}

/**
 * Validate an email address strictly enough to reject:
 *   - obviously malformed strings (no @, no TLD)
 *   - newline / whitespace injection (which could become email-header injection
 *     if the SDK ever forwards the value into a raw header)
 *   - absurdly long strings (RFC max is 254 chars)
 *   - multiple addresses (we never want comma-separated)
 *
 * Not RFC-perfect — RFC 5322 allows things like quoted local parts that no
 * real human uses. The intent is: reject anything that doesn't look like a
 * normal email, since this is how spam gets a foothold.
 */
export function isValidEmail(input: unknown): input is string {
  if (typeof input !== 'string') return false;
  if (input.length === 0 || input.length > 254) return false;
  // Reject any whitespace, control chars, or commas — no header injection,
  // no multiple addresses
  if (/[\s,;<>]/.test(input)) return false;
  // Basic shape: local@domain.tld
  return /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(input);
}

/**
 * Normalize a phone string for storage and display: keep digits, +, (), -,
 * and spaces. Clamp to a reasonable length so a malicious submitter can't
 * dump a megabyte into the field.
 */
export function safePhone(input: unknown): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^\d+()\-\s.]/g, '').slice(0, 30).trim();
}

/**
 * Common length caps. Centralized so we can tune them in one place.
 */
export const MAX_LEN = {
  name: 200,
  company: 200,
  email: 254,         // RFC max
  phone: 30,
  message: 4000,
  notes: 4000,
  shortField: 200,    // budget, timeline, source, asset_slug, etc.
  url: 2048,
};
