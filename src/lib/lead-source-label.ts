/**
 * The human-readable "where did this come from" string the CRM stores as
 * `lead_source`.
 *
 * It used to be a constant per source slug — 'listing-inquiry' always read
 * "Listing inquiry — crecotx.com/list-your-space". That was true while
 * /list-your-space was the only page with a listing form on it. It stopped
 * being true when the short inline forms went onto the representation, city
 * and asset pages: those deliberately reuse an existing source slug so the
 * CRM still types the contact correctly (Landlord/Investor, Seller, Tenant),
 * which meant a landlord captured on /landlord-representation arrived
 * labelled as though they had filled in /list-your-space.
 *
 * So the slug keeps deciding the *kind* of lead, and the page the form was
 * actually on decides the *place*. Where we have no page — an API call with
 * no page context — the old constant is still the best guess, so nothing
 * regresses for callers that never sent one.
 */

/** Longest path we will put in a label; anything longer is noise in the CRM. */
const MAX_PATH = 120;

/**
 * A site-relative path we are willing to show, or null.
 *
 * Rejects absolute and protocol-relative URLs: this string is presented as
 * "crecotx.com<path>", so letting an off-site value through would attribute a
 * lead to a page that is not ours.
 */
export function originPath(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;

  // Query and hash describe the visit, not the page — `page_path` and the utm
  // columns already carry those.
  const path = raw.split(/[?#]/)[0].replace(/\/+$/, '');
  if (path.length > MAX_PATH) return null;

  // The homepage collapses to nothing so the label reads "crecotx.com"
  // rather than a trailing slash.
  return path;
}

/**
 * `${kind} — crecotx.com${path}`, e.g.
 * "Listing inquiry — crecotx.com/landlord-representation".
 *
 * @param kind        What sort of lead this is, from the source slug.
 * @param defaultPath The page to name when the submission carried no page
 *                    context — the canonical form for that kind.
 */
export function leadSourceLabel(opts: {
  kind: string;
  defaultPath: string;
  pagePath?: unknown;
  landingPage?: unknown;
  /** Trailing parenthetical, e.g. the raw slug for an unclassified lead. */
  note?: string | null;
}): string {
  const path =
    originPath(opts.pagePath) ??
    originPath(opts.landingPage) ??
    originPath(opts.defaultPath) ??
    '';
  return `${opts.kind} — crecotx.com${path}${opts.note ? ` (${opts.note})` : ''}`;
}
