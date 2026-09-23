/**
 * Signup context — turns a capture POST into the answer to "where did this
 * come from?"
 *
 * The notification email used to carry email, name and a raw form id
 * ("property-alerts-inline"), which named the widget but not the page, the
 * intent, or the route in. Half the context was already on the request and
 * simply never read; the other half (the page the visitor was on) now rides
 * in the body from useCaptureSubmit.
 *
 * Privacy posture: coarse geo only. Vercel resolves the IP to city/region at
 * the edge and hands us those headers, so we never read, store or email the
 * address itself. The referrer is trimmed to origin + path upstream.
 */
import type { NextRequest } from 'next/server';

export interface SignupContext {
  sourceLabel: string;
  rawSource: string | null;
  pagePath: string | null;
  pageUrl: string | null;
  pageTitle: string | null;
  referrer: string | null;
  referrerLabel: string | null;
  geo: string | null;
  device: string | null;
  submittedAtLocal: string;
  utm: Record<string, string>;
}

/** Human labels for the form ids. Anything unmapped falls back to the id. */
const SOURCE_LABELS: Record<string, string> = {
  'property-alerts-inline': 'Property alerts — inline card',
  'property-alerts': 'Property alerts — full form (/property-alerts)',
  // The id the /property-alerts form actually sends. Without this it fell
  // through to the raw string and the email read "property-alerts-page".
  'property-alerts-page': 'Property alerts — full form (/property-alerts)',
  'newsletter': 'Newsletter signup',
  'newsletter-footer': 'Newsletter — site footer',
  'lead-magnet': 'Guide download (gated)',
  'market-report': 'Market report opt-in',
  'save-search': 'Saved search',
};

/**
 * Placement ids the inline card passes. They are more specific than the
 * source, and on a property page they name the property itself.
 */
const SURFACE_LABELS: Record<string, string> = {
  'listings-inline': 'Listings index — mid-results card',
  'listings-bottom': 'Listings index — bottom of page',
  'homepage-featured': 'Homepage — below featured properties',
  '8000-fair-oaks-pkwy-bottom': '8000 Fair Oaks Plaza — property page',
  '8923-dietz-elkhorn-bottom': 'Elkhorn Point — property page',
  '15033-main-st-lytle-bottom': '15033 Main St, Lytle — property page',
};

export function labelForSource(source: string | null, surface?: string | null): string {
  const surfaceLabel = surface ? SURFACE_LABELS[surface] : undefined;
  if (surfaceLabel) return surfaceLabel;
  const base = source ? (SOURCE_LABELS[source] ?? source) : 'Unknown form';
  return surface ? `${base} · ${surface}` : base;
}

/** "google.com/search" → "Google search", etc. Falls back to the origin. */
function labelForReferrer(referrer: string | null): string | null {
  if (!referrer) return null;
  const r = referrer.toLowerCase();
  if (r.startsWith('(on-site)')) return `Another page on crecotx.com — ${referrer.replace(/^\(on-site\)\s*/i, '')}`;
  if (r.includes('google.')) return 'Google';
  if (r.includes('bing.')) return 'Bing';
  if (r.includes('duckduckgo.')) return 'DuckDuckGo';
  if (r.includes('chatgpt.com') || r.includes('openai.com')) return 'ChatGPT';
  if (r.includes('perplexity.')) return 'Perplexity';
  if (r.includes('claude.ai')) return 'Claude';
  if (r.includes('linkedin.')) return 'LinkedIn';
  if (r.includes('facebook.') || r.includes('fb.')) return 'Facebook';
  if (r.includes('instagram.')) return 'Instagram';
  if (r.includes('loopnet.')) return 'LoopNet';
  if (r.includes('crexi.')) return 'Crexi';
  try { return new URL(referrer).hostname.replace(/^www\./, ''); } catch { return referrer; }
}

/** Mobile vs desktop from the UA string — enough to know how they were reading. */
function deviceFromUserAgent(ua: string | null, viewportWidth?: unknown): string | null {
  if (!ua) return null;
  const isTablet = /iPad|Tablet/i.test(ua);
  const isMobile = !isTablet && /Mobi|Android|iPhone|iPod/i.test(ua);
  const kind = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';
  const os = /iPhone|iPad|iOS/i.test(ua) ? 'iOS'
    : /Android/i.test(ua) ? 'Android'
    : /Mac OS X|Macintosh/i.test(ua) ? 'Mac'
    : /Windows/i.test(ua) ? 'Windows'
    : /Linux/i.test(ua) ? 'Linux' : null;
  const w = typeof viewportWidth === 'number' && viewportWidth > 0 ? ` · ${Math.round(viewportWidth)}px wide` : '';
  return `${kind}${os ? ` (${os})` : ''}${w}`;
}

const str = (v: unknown, max = 300): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

export function buildSignupContext(req: NextRequest, body: Record<string, unknown>): SignupContext {
  const h = req.headers;

  // Vercel's edge geo headers. Present in production, absent locally — in
  // which case the email simply omits the line rather than guessing.
  const city = str(h.get('x-vercel-ip-city'));
  const region = str(h.get('x-vercel-ip-country-region'));
  const country = str(h.get('x-vercel-ip-country'));
  const geoParts = [city ? decodeURIComponent(city) : null, region, country && country !== 'US' ? country : null].filter(Boolean);

  const utm: Record<string, string> = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
    const v = str(body[k], 120);
    if (v) utm[k] = v;
  }

  const rawSource = str(body.source, 120);
  const surface = str(body.surface, 120);
  const referrer = str(body.referrer) ?? str(body.landing_page);

  return {
    sourceLabel: labelForSource(rawSource, surface),
    rawSource,
    pagePath: str(body.page_path),
    pageUrl: str(body.page_url, 500),
    pageTitle: str(body.page_title, 200),
    referrer,
    referrerLabel: labelForReferrer(referrer),
    geo: geoParts.length > 0 ? geoParts.join(', ') : null,
    device: deviceFromUserAgent(h.get('user-agent'), body.viewport_width),
    submittedAtLocal: new Date().toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      dateStyle: 'medium',
      timeStyle: 'short',
    }) + ' CT',
    utm,
  };
}
