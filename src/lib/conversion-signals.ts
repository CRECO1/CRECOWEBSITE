/**
 * Conversion signals for the AI-referral funnel (read by supabase/crm/ai_funnel_30d.sql).
 *
 *   home_click      — the first three clicks on the homepage, per pageview. label = "<section>:<id>",
 *                     value = seconds since the page loaded, meta = { section, id, n }.
 *   intent_reached  — a visitor arrived on a page where a lead is one step away (the get-started funnel, the
 *                     valuation tool, contact, list/sell). label = intent name, meta.from_home = they came
 *                     straight from the homepage.
 *
 * Both ride the first-party tracker (lib/tracker.ts → site_events), so DNT/GPC, the bot / datacenter / team-device
 * gate and ai_source labelling apply automatically; when tracking is off, trackBehavior is a no-op.
 *
 * No PII, fixed IDs only: a click is described by the page's own data-track-section / data-track-id attributes,
 * or — for untagged links — by the destination's site path (query string and hash dropped) or one of the fixed
 * words phone / text / email. Visitor-typed text is never read.
 */

import { trackBehavior } from '@/lib/tracker';

/** Pages where the next step is a lead. Keyed on pathname. */
const INTENT_PAGES: Record<string, string> = {
  '/get-started': 'get_started',
  '/property-valuation': 'valuation',
  '/what-is-my-commercial-property-worth': 'valuation',
  '/contact': 'contact',
  '/list-your-space': 'list_your_space',
  '/sell': 'sell',
  '/development-opportunities': 'development',
  '/tenant-needs': 'tenant_needs',
};

const MAX_HOME_CLICKS = 3;

let currentPath = '';
let previousPath = '';
let loadedAt = 0;
let homeClicks = 0;

/** Call on every navigation (pathname change). Resets the homepage click counter and logs intent arrivals. */
export function onPageView(pathname: string) {
  if (pathname === currentPath) return;
  previousPath = currentPath;
  currentPath = pathname;
  loadedAt = Date.now();
  homeClicks = 0;

  const path = pathname.replace(/\/+$/, '') || '/';
  const intent = INTENT_PAGES[path];
  if (intent) trackBehavior('intent_reached', intent, undefined, { from_home: previousPath === '/' });
}

/** The fixed id for a clicked element: explicit data-track-id, else the destination path / a fixed word. */
function clickId(el: HTMLElement): string {
  const explicit = el.getAttribute('data-track-id');
  if (explicit) return explicit.slice(0, 60);
  const href = el.getAttribute('href') || '';
  if (href.startsWith('tel:')) return 'phone';
  if (href.startsWith('sms:')) return 'text';
  if (href.startsWith('mailto:')) return 'email';
  if (href.startsWith('#')) return href.slice(0, 40);
  if (href.startsWith('/')) return (href.split(/[?#]/)[0].replace(/\/+$/, '') || '/').slice(0, 80);
  if (/^https?:\/\//i.test(href)) {
    try { return `ext:${new URL(href).hostname.replace(/^www\./, '')}`.slice(0, 80); } catch { return 'ext'; }
  }
  return el.tagName.toLowerCase();
}

/** Call from a document-level click listener (capture phase). Logs the first three homepage clicks. */
export function onClick(target: EventTarget | null) {
  try {
    if (currentPath !== '/' || homeClicks >= MAX_HOME_CLICKS) return;
    const t = target as HTMLElement | null;
    const el = t?.closest?.('a[href], [data-track-id]') as HTMLElement | null;
    if (!el) return;
    homeClicks += 1;
    const section = (el.closest('[data-track-section]') as HTMLElement | null)?.getAttribute('data-track-section') || 'other';
    const id = clickId(el);
    trackBehavior('home_click', `${section}:${id}`, Math.round(((Date.now() - loadedAt) / 1000) * 10) / 10, { section, id, n: homeClicks });
  } catch { /* never break a click */ }
}
