/**
 * CRM bridge — every lead-creating event on crecotx.com gets mirrored
 * into the shared Fair Oaks Realty Group CRM so the broker sees it on
 * the commercial dashboard at
 *   https://www.fairoaksrealtygroup.com/crm/commercial
 *
 * For a web lead to surface everywhere the broker looks, we write up to
 * three rows, all keyed to one client (deduped by email):
 *   1. `crm_clients`        — the contact (shows in Contacts / Prospects)
 *   2. `email_lead_imports` — legacy import row, kept for history
 *   3. `crm_deals`          — a Prospect-stage deal, so real transaction
 *      leads land in the Deal Flow "Prospect" column. Newsletter
 *      subscribers and agent applicants get no deal (no transaction type).
 *
 * This site holds NO CRM database key: leads reach the CRM through its secret-authenticated lead webhook (see pushToCrm).
 *
 * Failures are logged but never thrown — a CRM outage must not block
 * our own lead-capture flow.
 */

import { assetTypeTags } from './asset-types';
import { getLeadOwner, getLeadBackup } from './broker';

type CrmLeadType = 'Buyer' | 'Seller' | 'Tenant' | 'Landlord/Investor' | 'Agent' | 'Broker' | 'Other';

/**
 * Sources that are SUBSCRIPTIONS, not transactions: alerts, newsletter,
 * gated-guide downloads, market-report opt-ins. They create a contact but
 * never a deal, no matter which endpoint or event name they arrive under.
 *
 * Matched by prefix, so surface-specific slugs ('property-alerts-inline',
 * 'newsletter-footer') are covered without listing every one. This is the
 * fix for the bug where a property-alerts signup posted to /api/leads,
 * arrived as `lead.created` with an unmapped source, and fell through to
 * the 'Buyer' default — producing a phantom "Buyer Purchase" deal.
 */
const SUBSCRIPTION_SOURCE_PREFIXES = [
  'property-alerts',
  'alerts',
  'newsletter',
  'lead-magnet',
  'market-report',
  'guide',
  'subscribe',
] as const;

/** Stages that mean "this deal is still live". */
const OPEN_DEAL_STAGES = '("Closed","Lost")';

/** How far back to look for an existing Prospect deal for the same person. */
const DUPLICATE_DEAL_WINDOW_MS = 24 * 60 * 60 * 1000;

export function isSubscriptionSource(source: string): boolean {
  const s = source.trim().toLowerCase();
  return SUBSCRIPTION_SOURCE_PREFIXES.some(prefix => s === prefix || s.startsWith(`${prefix}-`) || s.startsWith(`${prefix}_`));
}

/**
 * True when this payload must never create a deal: an explicit subscriber
 * event, any declared subscription_type, or a subscription-shaped source.
 */
function isSubscription(p: CrmPayload): boolean {
  return p.event === 'subscriber.created'
    || Boolean(p.subscription_type)
    || isSubscriptionSource(p.source);
}

/**
 * The single decision point for "does this payload deserve a pipeline deal?"
 * Pure and exported so the rules can be exercised without a CRM connection.
 *
 * Returns the Deal Flow type, or undefined when no deal should exist:
 *   - subscriptions (alerts / newsletter / lead-magnet / market-report)
 *   - unmapped sources (previously defaulted to 'Buyer' — the bug)
 *   - Agent / Broker / Other types, which have no TYPE_TO_DEAL entry
 */
export function dealTypeFor(p: CrmPayload): string | undefined {
  if (isSubscription(p)) return undefined;
  const mapped = SOURCE_TO_TYPE[p.source];
  if (!mapped) return undefined;
  return TYPE_TO_DEAL[mapped];
}

/** Digits only, US 10-digit normalized — '+1 (210) 817-3443' → '2108173443'. */
export function normalizePhone(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

/**
 * The formats the CRM might have stored the same number in. PostgREST has no
 * digits-only comparison, so we match against the common renderings instead.
 */
function phoneVariants(phone: string | null | undefined): string[] {
  const d = normalizePhone(phone);
  if (d.length !== 10) return d ? [d] : [];
  const [a, b, c] = [d.slice(0, 3), d.slice(3, 6), d.slice(6)];
  return [d, `(${a}) ${b}-${c}`, `${a}-${b}-${c}`, `${a}.${b}.${c}`, `+1${d}`, `1${d}`, `(${a})${b}-${c}`];
}

/** Map our source slugs onto the CRM's client-type enum. */
const SOURCE_TO_TYPE: Record<string, CrmLeadType> = {
  'valuation-request': 'Seller',
  'owner-inquiry':     'Seller',
  'seller':            'Seller',
  'tour-request':      'Tenant',
  'tenant-needs':      'Tenant',
  'tenant':            'Tenant',
  'pm-inquiry':        'Landlord/Investor',
  'buyer-inquiry':     'Buyer',
  'contact':           'Buyer',
  'listing':           'Buyer',
  'quiz':              'Buyer',
  'exploring':         'Buyer',
  'agent-application': 'Agent',
};

/** Human-readable label for the `source` column on email_lead_imports. */
const SOURCE_TO_LABEL: Record<string, string> = {
  'valuation-request': 'CRECO Website — Valuation Tool',
  'tour-request':      'CRECO Website — Tour Request',
  'owner-inquiry':     'CRECO Website — Sell / List',
  'tenant-needs':      'CRECO Website — Tenant Rep',
  'buyer-inquiry':     'CRECO Website — Buyer / Investor',
  'pm-inquiry':        'CRECO Website — Property Management',
  'agent-application': 'CRECO Website — Agent Application',
  'market-report':     'CRECO Website — Market Report',
  'exploring':         'CRECO Website — Exploring',
  'contact':           'CRECO Website — Contact Form',
  'listing':           'CRECO Website — Listing Inquiry',
  'quiz':              'CRECO Website — Get Started Quiz',
  'brochure-request':  'CRECO Website — Brochure Request',
};

/** Map the CRM client-type onto a Deal Flow pipeline type, so a web lead
 *  also lands in the "Prospect" column. Agent/Broker leads are absent on
 *  purpose — they're recruiting, not a transaction — so they get no deal. */
const TYPE_TO_DEAL: Partial<Record<CrmLeadType, string>> = {
  'Buyer':             'Buyer Purchase',
  'Seller':            'Seller Listing',
  'Tenant':            'Tenant Lease',
  'Landlord/Investor': 'Landlord Listing',
};

export interface CrmPayload {
  event: 'lead.created' | 'tour.requested' | 'valuation.requested' | 'inquiry.received' | 'subscriber.created';
  /** Our internal leads.id (uuid) if we managed to save it on our side. */
  lead_id?: string | null;
  /** Free-form slug like 'tour-request', 'valuation-request', 'contact'. */
  source: string;
  name?: string | null;
  email: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  property_interest?: string | null;
  listing_slug?: string | null;
  subscription_type?: string | null;
  asset_slug?: string | null;
  filters?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  // ── Attribution ────────────────────────────────────────────────────────────
  // Forwarded from the lead routes so the contact pushToCrm creates carries
  // WHERE it came from (utm/referrer/landing) and the visit journey + dwell —
  // the exact columns the FORG webhook receiver stores. Without these, pushToCrm
  // (the writer that actually authors the crm_clients row in prod, since the
  // webhook path is dormant) inserted an attribution-less row, so the CRM's
  // "Lead Attribution" tab showed "not recorded". All optional: an omitted
  // field stays null, exactly as before.
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  page_path?: string | null;
  surface?: string | null;
  geo?: string | null;
  device?: string | null;
  /** Ordered pages this visit touched, [{p,t}] (t = ms since first view). */
  journey?: Array<{ p: string; t: number }> | null;
  time_on_site_sec?: number | null;
  page_views?: number | null;
  // v2 tracker fields (see FairOaks lib/tracker.ts): persistent visitor id, visit count, first touch, ad click ids, environment.
  visitor_id?: string | null;
  visit_count?: number | null;
  first_touch?: Record<string, unknown> | null;
  click_ids?: Record<string, string> | null;
  env?: Record<string, unknown> | null;
}

/** Split a "First Last" name into the CRM's two-column model. */
function splitName(full: string | null | undefined): { first: string; last: string } {
  const trimmed = (full ?? '').trim();
  if (!trimmed) return { first: 'Web', last: 'Lead' };
  const parts = trimmed.split(/\s+/);
  return {
    first: parts[0],
    last: parts.length > 1 ? parts.slice(1).join(' ') : '',
  };
}

/**
 * Build the notes / message blob written to crm_clients.notes and
 * email_lead_imports.parsed_message. Includes everything we know — the
 * broker opens the contact, sees the full picture.
 */
function buildMessage(p: CrmPayload): string {
  const lines: string[] = [];
  if (p.message) lines.push(p.message);
  if (p.property_interest) lines.push(`Property of interest: ${p.property_interest}`);
  if (p.listing_slug) lines.push(`Listing: https://www.crecotx.com/listings/${p.listing_slug}`);
  if (p.asset_slug) lines.push(`Guide / report: ${p.asset_slug}`);
  if (p.subscription_type) lines.push(`Subscription: ${p.subscription_type}`);
  if (p.filters && Object.keys(p.filters).length > 0) {
    lines.push(`Filters: ${JSON.stringify(p.filters)}`);
  }
  if (p.metadata && Object.keys(p.metadata).length > 0) {
    lines.push(`Metadata: ${JSON.stringify(p.metadata)}`);
  }
  if (p.lead_id) lines.push(`CRECO lead_id: ${p.lead_id}`);
  return lines.join('\n');
}

/** Build the tag list. 'Website' goes on every lead so the broker can
 *  filter the entire web-driven cohort in the CRM. 'New Lead' is the
 *  Prospects-view default. 'CRECO' brands the commercial side. */
function buildTags(p: CrmPayload): string[] {
  const tags = ['New Lead', 'Website', 'CRECO'];
  if (p.event === 'tour.requested')       tags.push('Tour Scheduled');
  if (p.event === 'valuation.requested')  tags.push('Valuation Tool');
  // Quarterly market-report opt-ins — a distinct tag so they can be segmented
  // and enrolled in the recurring market-report campaign.
  if (p.source === 'market-report')       tags.push('Market Report');
  if (p.event === 'subscriber.created') {
    if (p.subscription_type === 'lead-magnet')       tags.push('Lead Magnet');
    else if (p.subscription_type === 'property-alerts') tags.push('Property Alerts');
    else if (p.subscription_type === 'newsletter')   tags.push('Newsletter');
  }
  // The asset types they asked for, as tags, so the CRM can segment on
  // "everyone watching industrial" without reading the filters JSON.
  const f = (p.filters && typeof p.filters === 'object' && !Array.isArray(p.filters))
    ? (p.filters as Record<string, unknown>)
    : null;
  if (f) tags.push(...assetTypeTags(f.property_types ?? f.property_type));
  return Array.from(new Set(tags));
}

/** Synthetic gmail_message_id — required (NOT NULL + UNIQUE) on
 *  email_lead_imports. Prefix with `crecotx:` so it can never collide
 *  with a real Gmail message id (which are pure base64). */
function syntheticMessageId(p: CrmPayload): string {
  const ts = Date.now();
  // Use lead_id if we have one (best stable key), else email + ts.
  const tail = p.lead_id ?? `${p.email}-${ts}`;
  return `crecotx:${p.event}:${tail}`;
}

/**
 * Coarse channel bucket from referrer + utm_medium/source, roughly GA4's
 * default channel grouping. Kept in lockstep with the FORG webhook receiver's
 * channelFor (FairOaks-consolidate/src/lib/lead-context.ts) so the two CRM
 * writers bucket a lead the same way and first-party numbers stay comparable.
 */
function channelFor(referrer: string | null, utmMedium: string | null, utmSource: string | null, clickIds?: Record<string, string> | null): string {
  const m = (utmMedium ?? '').toLowerCase();
  const ci = clickIds ?? {};
  // Ad-platform click ids are the surest paid signal — a Google/Bing ad click often arrives with no utm at all.
  if (ci.gclid || ci.gbraid || ci.wbraid || ci.dclid || ci.msclkid) return 'Paid Search';
  if (ci.ttclid || ci.li_fat_id || ci.twclid) return 'Paid Social';
  if (m.includes('cpc') || m.includes('ppc') || m.includes('paid')) return m.includes('social') ? 'Paid Social' : 'Paid Search';
  if (m.includes('email')) return 'Email';
  if (m.includes('sms') || m.includes('text')) return 'SMS';
  if (m.includes('social')) return 'Organic Social';
  if (m.includes('referral')) return 'Referral';
  const r = (referrer ?? '').toLowerCase();
  const s = (utmSource ?? '').toLowerCase();
  const hay = `${r} ${s}`;
  if (!r && !s) return ci.fbclid ? 'Organic Social' : 'Direct';
  if (/chatgpt|openai|perplexity|claude\.ai|gemini\.google|copilot\.microsoft|you\.com|phind|kagi/.test(hay)) return 'AI Assistant';
  if (/google|bing|yahoo|duckduckgo|ecosia/.test(hay)) return 'Organic Search';
  if (/facebook|instagram|linkedin|twitter|x\.com|tiktok|youtube|pinterest|nextdoor/.test(hay)) return 'Organic Social';
  if (/zillow|realtor\.com|redfin|har\.com|trulia|homes\.com|loopnet|crexi/.test(hay)) return 'Listing Portal';
  if (/mail\.|outlook|gmail/.test(hay)) return 'Email';
  return 'Referral';
}

/** Non-empty trimmed string, capped — null otherwise. */
function attrStr(v: unknown, max = 200): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

/** Non-negative integer from a number/string, capped. */
function intOrNull(v: unknown, max = 86400): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(Math.round(n), max);
}

/** Sanitise the visit trail ([{p,t}]); caps length + field sizes; null if empty. */
function sanitizeJourney(v: unknown): Array<{ p: string; t: number }> | null {
  if (!Array.isArray(v)) return null;
  const out: Array<{ p: string; t: number }> = [];
  for (const item of v) {
    if (out.length >= 40) break;
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const p = (item as Record<string, unknown>).p;
      const t = (item as Record<string, unknown>).t;
      if (typeof p === 'string' && p.trim()) {
        out.push({ p: p.trim().slice(0, 200), t: typeof t === 'number' && t >= 0 ? Math.round(t) : 0 });
      }
    }
  }
  return out.length ? out : null;
}

/**
 * Build the crm_clients attribution columns from a lead payload — the same
 * shape the FORG webhook receiver writes (utm_*, referrer, landing_page,
 * page_path, surface, geo, device, derived channel, journey, time_on_site_sec,
 * page_views). Only non-empty values are included, so an unknown field stays
 * null rather than being written as an empty string.
 */
function attributionFields(p: CrmPayload): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const strs: Array<[string, unknown]> = [
    ['utm_source', p.utm_source], ['utm_medium', p.utm_medium], ['utm_campaign', p.utm_campaign],
    ['utm_term', p.utm_term], ['utm_content', p.utm_content], ['referrer', p.referrer],
    ['landing_page', p.landing_page], ['page_path', p.page_path], ['surface', p.surface],
    ['geo', p.geo], ['device', p.device],
  ];
  for (const [k, v] of strs) {
    const s = attrStr(v, k === 'referrer' || k === 'landing_page' || k === 'page_path' ? 300 : 200);
    if (s) out[k] = s;
  }
  // Derive the channel only when there are signals, matching the webhook: a pure
  // Direct visit leaves channel null so a later campaign visit can still set it.
  const clickIds = p.click_ids && typeof p.click_ids === 'object' ? p.click_ids : null;
  if (out.referrer || out.utm_medium || out.utm_source || (clickIds && Object.keys(clickIds).length)) {
    out.channel = channelFor((out.referrer as string) ?? null, (out.utm_medium as string) ?? null, (out.utm_source as string) ?? null, clickIds);
  }
  const journey = sanitizeJourney(p.journey);
  if (journey) out.journey = journey;
  const tos = intOrNull(p.time_on_site_sec);
  if (tos != null) out.time_on_site_sec = tos;
  const pv = intOrNull(p.page_views, 1000) ?? (journey ? journey.length : null);
  if (pv != null) out.page_views = pv;
  // v2 visitor story — shapes already sanitised by the route's tracker helper; re-clip here as a backstop.
  const vid = attrStr(p.visitor_id, 64); if (vid && /^[A-Za-z0-9_-]{8,64}$/.test(vid)) out.visitor_id = vid;
  const vc = intOrNull(p.visit_count, 100000); if (vc != null) out.visit_count = vc;
  if (p.first_touch && typeof p.first_touch === 'object') out.first_touch = p.first_touch;
  if (clickIds && Object.keys(clickIds).length) out.click_ids = clickIds;
  if (p.env && typeof p.env === 'object') out.env = p.env;
  return out;
}

/**
 * Push a single lead to the shared CRM through its secret-authenticated lead webhook (/api/webhook/lead) with
 * `web_lead_sync`, so this public site holds NO CRM database key. The CRM does the database work: find the contact (email or
 * phone), merge tags, log the lead on email_lead_imports (the Prospects view) and open a Prospect deal when the rules allow
 * (see dealTypeFor). Everything sent here is derived by the pure helpers above.
 *
 * Unlike the old direct writer, a returning contact's prospect_status is NOT reset to "new" by a form submission.
 *
 * Returns true if the CRM accepted it. Errors are logged but never thrown.
 */
const CRM_LEAD_WEBHOOK_URL = process.env.CRM_LEAD_WEBHOOK_URL ?? 'https://www.fairoaksrealtygroup.com/api/webhook/lead';

export async function pushToCrm(p: CrmPayload): Promise<boolean> {
  const secret = process.env.CRM_LEAD_WEBHOOK_SECRET;
  if (!secret) return false; // local dev / preview — silent noop

  try {
    const { first, last } = splitName(p.name);
    const type: CrmLeadType = SOURCE_TO_TYPE[p.source] ?? 'Other';
    const leadOwner = getLeadOwner({ listingSlug: p.listing_slug, source: p.source });
    const attr = attributionFields(p);
    const res = await fetch(CRM_LEAD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify({
        web_lead_sync: true,
        first_name: first || 'Web',
        last_name: last || 'Lead',
        email: p.email,
        phone: (p.phone ?? '').trim() || undefined,
        company: (p.company ?? '').trim() || undefined,
        source: p.source,
        lead_source_label: SOURCE_TO_LABEL[p.source] ?? 'CRECO Website',
        type,
        message: buildMessage(p),
        tags: buildTags(p),
        event: p.event,
        subscription_type: p.subscription_type ?? undefined,
        property_interest: p.property_interest ?? undefined,
        deal_type: dealTypeFor(p),
        import_message_id: syntheticMessageId(p),
        import_subject: `${p.event} — ${p.source}`,
        owner_email: leadOwner.crm_profile_email,
        backup_email: getLeadBackup(leadOwner).crm_profile_email,
        business_unit: 'commercial',
        lead_site: 'crecotx.com',
        notify: false, // the forms already email the team
        ...attr,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[crm] webhook rejected the lead:', res.status, (await res.text()).slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error('[crm] pushToCrm threw:', err instanceof Error ? err.message : String(err));
    return false;
  }
}
