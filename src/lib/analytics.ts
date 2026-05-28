/**
 * Shared analytics helpers.
 *
 * 1. trackEvent(name, params) — fires a GA4 event via gtag() if the tag
 *    is present on the page, falls back to dataLayer.push for GTM, and
 *    no-ops in SSR / when no analytics is wired up. Used by every form
 *    so we can measure submit/calc/open rates per surface.
 *
 * 2. captureUtmsToCookie() — call once on every landing. Reads utm_*
 *    + referrer from the URL/document, stores them in a single
 *    base64-encoded cookie that persists 30 days. Lets us tie a lead
 *    submitted today to a campaign clicked 2 weeks ago.
 *
 * 3. readUtmsFromCookie() — call from any form handler before POSTing
 *    a lead. Returns the persisted attribution payload (or empty
 *    object). Caller spreads it into the request body so the lead row
 *    carries the source signals.
 *
 * Privacy: no PII stored in the cookie — only utm_* + referrer +
 * landing_page. 30-day TTL chosen as a compromise between attribution
 * accuracy and "fresh visitor" sessions. Cookie is first-party; no
 * cross-site sync.
 */

const COOKIE_NAME = 'creco_attr';
const COOKIE_TTL_DAYS = 30;

export interface UtmAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer?: string;
  landing_page?: string;
}

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

/**
 * Fire a GA4 event. Safe in SSR (no-ops). Names should be snake_case.
 * Params can be any serializable shape; GA4 truncates to its limits
 * server-side so don't sweat exact compliance here.
 */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const w = window as unknown as {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  };
  try {
    if (typeof w.gtag === 'function') {
      w.gtag('event', name, params);
    } else if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: name, ...params });
    }
    // No-op if no analytics is wired. We still log to console in dev
    // so you can see fired events locally without GTM running.
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', name, params);
    }
  } catch {
    // Analytics must never break the form
  }
}

/**
 * Read the current URL's utm_* + document.referrer and stash them in a
 * single cookie. Idempotent across same-session navigations — if the
 * cookie already exists and the new URL has no utm_*, the existing
 * attribution sticks. New utm_* on a later visit overwrites.
 */
export function captureUtmsToCookie() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const incoming: UtmAttribution = {};
    let hasAnyUtm = false;
    for (const k of UTM_KEYS) {
      const v = params.get(k);
      if (v) { incoming[k] = v.slice(0, 200); hasAnyUtm = true; }
    }
    // Referrer + landing_page captured on every visit (overwrites previous
    // even without utm — last-touch attribution on referrer).
    if (document.referrer && !document.referrer.includes(window.location.host)) {
      incoming.referrer = document.referrer.slice(0, 200);
    }
    incoming.landing_page = window.location.pathname.slice(0, 200);

    const existing = readUtmsFromCookie();
    // Merge: existing utm_* persists unless a new utm_* is present
    const merged: UtmAttribution = { ...existing, ...incoming };
    // BUT: if no new utm_* and existing utm_* was set, keep the existing
    // landing_page too so the original journey isn't overwritten.
    if (!hasAnyUtm && existing.landing_page) {
      merged.landing_page = existing.landing_page;
    }

    const value = encodeURIComponent(JSON.stringify(merged));
    const maxAge = COOKIE_TTL_DAYS * 24 * 60 * 60;
    const isSecure = window.location.protocol === 'https:';
    document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
  } catch {
    // Never throw from analytics
  }
}

/**
 * Read the persisted attribution payload from the cookie. Returns an
 * empty object if not set or unreadable.
 */
export function readUtmsFromCookie(): UtmAttribution {
  if (typeof document === 'undefined') return {};
  try {
    const match = document.cookie
      .split('; ')
      .find(c => c.startsWith(`${COOKIE_NAME}=`));
    if (!match) return {};
    const value = decodeURIComponent(match.split('=')[1] ?? '');
    if (!value) return {};
    const parsed = JSON.parse(value);
    return (parsed && typeof parsed === 'object') ? parsed as UtmAttribution : {};
  } catch {
    return {};
  }
}
