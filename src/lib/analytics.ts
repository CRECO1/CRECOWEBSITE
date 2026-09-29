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
 * Lead-generating form submits. When any of these fires, trackEvent ALSO emits
 * GA4's standard `generate_lead` event. Reason: GA4's "Generate leads" reports
 * (New leads, lead source, conversion rate) only recognize the recommended
 * `generate_lead` name — our descriptive custom names (contact_form_submitted,
 * owner_inquiry_submitted, …) are marked as key events but never populate the
 * lead-lifecycle metrics, so that whole reporting section read zero. The custom
 * event stays for per-surface analysis; generate_lead carries the custom name
 * as `lead_source` so leads can still be segmented by which form produced them.
 * Mark `generate_lead` as a key event in GA4 for it to count as a conversion.
 */
const LEAD_EVENTS = new Set<string>([
  'contact_form_submitted',
  'owner_inquiry_submitted',
  'listing_inquiry_submitted',
  'valuation_lead_submitted',
  'tour_request_submitted',
  'broker_message_submitted',
  'development_inquiry_submitted',
  'retail_leasing_inquiry_submitted',
  'get_started_submitted',
  'property_alerts_subscribed',
  // The inline landing-page forms. These were firing their own event but
  // never mirroring to generate_lead, so the GA4 lead reports undercounted.
  'inline_lead_submitted',
  // Email-capture / subscribe conversions that were firing their own event but
  // never mirroring to generate_lead — so these leads were invisible to GA4's
  // lead-lifecycle reports (same undercount bug, still open for these four).
  'property_alerts_inline_subscribed',
  'market_report_subscribed',
  'save_search_submitted',
  'brochure_requested',
]);

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
      // Mirror lead submits to GA4's standard generate_lead so the
      // "Generate leads" reports populate (they key off this exact name).
      if (LEAD_EVENTS.has(name)) {
        w.gtag('event', 'generate_lead', { lead_source: name, ...params });
      }
    } else if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: name, ...params });
      if (LEAD_EVENTS.has(name)) {
        w.dataLayer.push({ event: 'generate_lead', lead_source: name, ...params });
      }
    }
    // No-op if no analytics is wired. We still log to console in dev
    // so you can see fired events locally without GTM running.
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug('[analytics]', name, params);
    }
    // Mirror into Microsoft Clarity as a custom event. Clarity is already on
    // the page for session replay; tagging the event means you can filter
    // recordings down to "sessions where someone started a lead form and
    // never submitted" and watch exactly what happened. Clarity's event API
    // takes a name only, so the interesting dimensions go through set()
    // as separate tags.
    const c = (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity;
    if (typeof c === 'function') {
      c('event', name);
      for (const key of CLARITY_TAG_KEYS) {
        const v = params[key];
        if (typeof v === 'string' && v) c('set', key, v.slice(0, 100));
      }
    }
  } catch {
    // Analytics must never break the form
  }
}

/**
 * Dimensions worth promoting to Clarity tags — these are the ones you filter
 * replays by. Deliberately a fixed allowlist rather than "every param": it
 * keeps anything accidental (or personal) from becoming a Clarity dimension.
 */
const CLARITY_TAG_KEYS = ['surface', 'source', 'path', 'step_id', 'cta', 'form'] as const;

/**
 * Events that must fire at most once per page load.
 *
 * A "form started" signal is only meaningful as a count of people, not of
 * focus events — without this, tabbing between four fields would report four
 * starts and the start→submit rate would be nonsense.
 */
const firedOnce = new Set<string>();

export function trackOnce(dedupeKey: string, name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  if (firedOnce.has(dedupeKey)) return;
  firedOnce.add(dedupeKey);
  trackEvent(name, params);
}

/**
 * First interaction with a lead form. Pair with the matching *_submitted
 * event to get an abandonment rate per surface.
 */
export function trackFormStart(form: string, surface: string, extra: Record<string, unknown> = {}) {
  trackOnce(`form_start:${form}:${surface}`, 'lead_form_started', { form, surface, ...extra });
}

/**
 * Listing-engagement events (GA4 ecommerce shape).
 *
 * Enhanced Measurement already captures outbound clicks and URL-param site
 * search — but the /listings page searches and filters entirely client-side
 * and its cards are internal <Link>s, so none of that browsing reaches GA
 * without these. Routed through trackEvent(), so each also lands in Clarity
 * as a custom event (filter replays to "viewed a warehouse, never enquired").
 *
 * CRECO is commercial: item value is the sale price when set, else the lease
 * rate ($/SF/yr) as a stand-in. transaction_type rides alongside so a report
 * never conflates a $2M sale with a $28/SF lease.
 */
export function trackViewItem(p: {
  id: string; name: string;
  sale_price?: number | null; lease_rate?: number | null;
  city?: string | null; submarket?: string | null;
  property_type?: string | null; transaction_type?: string | null; sqft?: number | null;
}) {
  const value = p.sale_price ?? p.lease_rate ?? 0;
  trackEvent('view_item', {
    event_category: 'Listing',
    currency: 'USD',
    value,
    items: [{
      item_id: p.id,
      item_name: p.name,
      price: value,
      item_category: p.property_type ?? '',
      item_category2: p.transaction_type ?? '',
      item_category3: p.submarket ?? p.city ?? '',
      item_variant: p.sqft ? `${p.sqft} SF` : '',
    }],
  });
}

export function trackSelectItem(p: {
  id: string; name: string; price?: number | null; list_name?: string; index?: number;
}) {
  trackEvent('select_item', {
    event_category: 'Listing',
    item_list_name: p.list_name ?? 'Listings',
    items: [{ item_id: p.id, item_name: p.name, price: p.price ?? 0, index: p.index ?? 0 }],
  });
}

export function trackViewItemList(p: {
  list_name: string; results_count?: number;
  property_type?: string; transaction_type?: string; submarket?: string;
}) {
  trackEvent('view_item_list', {
    event_category: 'Listing',
    item_list_name: p.list_name,
    results_count: p.results_count ?? 0,
    property_type: p.property_type ?? '',
    transaction_type: p.transaction_type ?? '',
    submarket: p.submarket ?? '',
  });
}

export function trackListingSearch(p: {
  term?: string; results_count?: number;
  property_type?: string; transaction_type?: string; submarket?: string;
}) {
  trackEvent('search', {
    event_category: 'Search',
    search_term: p.term ?? '',
    results_count: p.results_count ?? 0,
    property_type: p.property_type ?? '',
    transaction_type: p.transaction_type ?? '',
    submarket: p.submarket ?? '',
  });
}

/**
 * Read the current URL's utm_* + document.referrer and stash them in a
 * single cookie. Idempotent across same-session navigations — if the
 * cookie already exists and the new URL has no utm_*, the existing
 * attribution sticks. New utm_* on a later visit overwrites.
 */
export function captureUtmsToCookie() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  // Log the page into this visit's trail on every navigation, independent of
  // whether there is any utm to store.
  recordJourneyStep();
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

/**
 * The page trail for THIS visit — sessionStorage, per tab. On a lead it answers
 * "what did they look at, and how long were they here before submitting". Kept
 * out of the attribution cookie on purpose: a cookie rides on every request and
 * is size-capped, whereas a visit journey belongs in sessionStorage and only
 * ever gets spread into a form POST. Every accessor is wrapped — analytics must
 * never throw.
 */
export interface JourneyStep { p: string; t: number }

const JOURNEY_KEY = 'creco_journey';
const JOURNEY_T0_KEY = 'creco_journey_t0';
const JOURNEY_MAX_STEPS = 30;

function journeyStart(): number {
  try {
    const raw = sessionStorage.getItem(JOURNEY_T0_KEY);
    const prev = raw ? parseInt(raw, 10) : NaN;
    if (Number.isFinite(prev)) return prev;
    const now = Date.now();
    sessionStorage.setItem(JOURNEY_T0_KEY, String(now));
    return now;
  } catch { return Date.now(); }
}

function readJourney(): JourneyStep[] {
  try {
    const raw = sessionStorage.getItem(JOURNEY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is JourneyStep => !!s && typeof s.p === 'string' && typeof s.t === 'number')
      : [];
  } catch { return []; }
}

/** Append the current path to the visit journey. Idempotent per page. */
export function recordJourneyStep(): void {
  if (typeof window === 'undefined') return;
  try {
    const t0 = journeyStart();
    const steps = readJourney();
    const p = window.location.pathname.slice(0, 200);
    if (steps.length && steps[steps.length - 1].p === p) return;
    steps.push({ p, t: Math.max(0, Date.now() - t0) });
    sessionStorage.setItem(JOURNEY_KEY, JSON.stringify(steps.slice(-JOURNEY_MAX_STEPS)));
  } catch {
    // never break a render
  }
}

/**
 * The visit trail + seconds-on-site, spread into a lead POST so the CRM can
 * show "what pages did they visit and how long before they left". Records the
 * submit page as the final step first, in case a form renders without a route
 * change (a modal on the landing page).
 */
export function journeyPayload(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  recordJourneyStep();
  const steps = readJourney();
  const t0 = journeyStart();
  return {
    journey: steps,
    page_views: steps.length,
    time_on_site_sec: Math.round(Math.max(0, Date.now() - t0) / 1000),
  };
}

/**
 * Everything a lead form should attach so it is both attributable and shows its
 * visit: the stored utm/referrer attribution plus this visit's page trail and
 * seconds-on-site. Forms already spread readUtmsFromCookie(); swapping the call
 * to this keeps journey travelling with the attribution it belongs next to.
 */
export function leadPayloadFields(): Record<string, unknown> {
  return { ...readUtmsFromCookie(), ...journeyPayload() };
}

/**
 * Tie the live Microsoft Clarity session to this lead so a named person's
 * recording — every page, scroll and hesitation — becomes findable in Clarity
 * by email or name. We already forward event names to Clarity in trackEvent;
 * this adds identity at the one moment we learn it, the submit. Clarity hashes
 * the id it stores, so no raw email is exposed. Never throws.
 */
export function identifyLead(email?: string | null, name?: string | null, source?: string | null): void {
  if (typeof window === 'undefined' || !email) return;
  try {
    const c = (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity;
    if (typeof c !== 'function') return;
    c('identify', email);
    if (name) c('set', 'lead_name', name);
    if (source) c('set', 'lead_source', source);
  } catch {
    // Clarity must never break a submit.
  }
}
