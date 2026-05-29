/**
 * Client-side validation helpers.
 *
 * These run in the browser before a form POSTs — they're the first cheap
 * filter so the visitor sees a fast inline error rather than a slow
 * server round-trip for obvious typos. The server still re-validates
 * everything in /api/* — never trust this layer alone.
 *
 * Keep this file small and pure. No React, no fetches, no globals.
 */

/**
 * Loose email shape check. Matches `<local>@<host>.<tld>` with non-empty
 * non-whitespace runs in each segment. Intentionally permissive — we'd
 * rather let a slightly-weird-but-valid address through than reject a
 * lead because their email has a plus tag or an unusual TLD. The server's
 * `isValidEmail` (in lib/sanitize) does the stricter check.
 *
 * Returns true for valid-looking emails, false otherwise. Empty strings
 * return false so callers can treat "" the same as "invalid."
 */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isClientEmailValid(email: string | null | undefined): boolean {
  if (!email) return false;
  return EMAIL_RE.test(email.trim());
}
