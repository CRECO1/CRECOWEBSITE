/**
 * Who gets counted in GA4 + Clarity. Shared by both loaders so they can't
 * drift apart (each used to carry its own copy of the bot check).
 *
 * Three kinds of visit are kept out, at the source, because GA4's own data
 * filters can't target them (it can only exclude internal traffic by IP):
 *
 *  1. Automation — webdriver / unambiguous bot user agents.
 *  2. Our own team. The Oct-2026 review found half of all key events coming
 *     from Fair Oaks Ranch (the office) — form tests, not leads. A device is
 *     marked internal by opening any page with ?internal=1 (?internal=0
 *     clears it), and automatically when it visits the staff-only portal.
 *  3. Datacenter visits — mostly corporate email security scanners (Microsoft
 *     Safe Links, Google, Proofpoint) that open every link in a campaign email
 *     the moment it lands. They render the page like a browser, so the bot
 *     check misses them; the middleware recognises their cities from Vercel's
 *     geo header and sets the creco_dc cookie read here.
 */

export const PROD_HOSTS = new Set(['crecotx.com', 'www.crecotx.com']);

// Authenticated portal, the token-auth client invoice portal, and private owner
// reports (/r/<token> — the token must never reach GA) — never record
// session replay or fire marketing analytics on these.
export const EXCLUDED_PREFIXES = ['/admin', '/billing', '/manage', '/client/', '/r/'];

// Staff-only areas. Visiting one marks the device as internal.
const STAFF_PREFIXES = ['/admin', '/billing', '/manage'];

const INTERNAL_KEY = 'creco_internal';
export const DATACENTER_COOKIE = 'creco_dc';

export function isExcludedPath(pathname: string | null): boolean {
  return !pathname || EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
}

/** Unambiguous automation / bot signals. Real browsers match none of these. */
export function isLikelyBot(): boolean {
  try {
    // navigator.webdriver is true under Selenium/Puppeteer/Playwright/headless
    // automation and false/undefined in real user browsers.
    if (navigator.webdriver) return true;
    const ua = navigator.userAgent || '';
    return /bot|crawl|spider|headless|scrape|lighthouse|pagespeed|gtmetrix|pingdom|phantom|puppeteer|playwright|selenium|prerender|slurp|monitoring/i.test(ua);
  } catch {
    return false;
  }
}

/** Applies ?internal=1 / ?internal=0 and the staff-portal rule, then reports the flag. */
export function isInternalVisitor(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('internal');
    if (param === '1') localStorage.setItem(INTERNAL_KEY, '1');
    else if (param === '0') localStorage.removeItem(INTERNAL_KEY);
    else if (STAFF_PREFIXES.some((p) => window.location.pathname.startsWith(p))) {
      localStorage.setItem(INTERNAL_KEY, '1');
    }
    return localStorage.getItem(INTERNAL_KEY) === '1';
  } catch {
    return false;
  }
}

export function isDatacenterVisitor(): boolean {
  try {
    return document.cookie.split('; ').includes(`${DATACENTER_COOKIE}=1`);
  } catch {
    return false;
  }
}

/** True when this browser should be counted: production host, a person, not us, not a scanner. */
export function shouldTrackVisitor(): boolean {
  // Evaluate the internal flag first so ?internal=1 is recorded even on a
  // non-production host or a flagged connection.
  const internal = isInternalVisitor();
  return PROD_HOSTS.has(window.location.hostname) && !internal && !isLikelyBot() && !isDatacenterVisitor();
}
