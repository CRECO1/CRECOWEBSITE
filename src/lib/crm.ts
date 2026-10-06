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
 * CRECO and FORG run on separate Supabase projects. The CRM (crm_clients +
 * email_lead_imports + the dashboard) lives on the FORG Supabase, but
 * the CRECO website's NEXT_PUBLIC_SUPABASE_URL points at its own project.
 * So we use a separate pair of env vars for the CRM write:
 *
 *   CRM_SUPABASE_URL                  → FORG Supabase URL
 *   CRM_SUPABASE_SERVICE_ROLE_KEY     → FORG service role key (DDL/RLS bypass)
 *
 * Falls back to the local NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 * if those aren't set — useful for dev environments where the CRM and
 * website happen to share a database.
 *
 * Failures are logged but never thrown — a CRM outage must not block
 * our own lead-capture flow.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
}

/** Service-role Supabase client for the CRM (FORG project). Prefers
 *  CRM_SUPABASE_* env vars; falls back to the local Supabase if the CRM
 *  happens to live in the same database (e.g. unified dev). */
export function crmAdminClient(): SupabaseClient | null {
  return adminClient();
}

function adminClient(): SupabaseClient | null {
  const url = process.env.CRM_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.CRM_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
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
function channelFor(referrer: string | null, utmMedium: string | null, utmSource: string | null): string {
  const m = (utmMedium ?? '').toLowerCase();
  if (m.includes('cpc') || m.includes('ppc') || m.includes('paid')) return 'Paid Search';
  if (m.includes('email')) return 'Email';
  if (m.includes('social')) return 'Organic Social';
  if (m.includes('referral')) return 'Referral';
  const r = (referrer ?? '').toLowerCase();
  const s = (utmSource ?? '').toLowerCase();
  const hay = `${r} ${s}`;
  if (!r && !s) return 'Direct';
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
  if (out.referrer || out.utm_medium || out.utm_source) {
    out.channel = channelFor((out.referrer as string) ?? null, (out.utm_medium as string) ?? null, (out.utm_source as string) ?? null);
  }
  const journey = sanitizeJourney(p.journey);
  if (journey) out.journey = journey;
  const tos = intOrNull(p.time_on_site_sec);
  if (tos != null) out.time_on_site_sec = tos;
  const pv = intOrNull(p.page_views, 1000) ?? (journey ? journey.length : null);
  if (pv != null) out.page_views = pv;
  return out;
}

/**
 * Push a single lead to the shared CRM. Always writes to both
 * `crm_clients` (dedupe by email) and `email_lead_imports` (the table
 * the Prospects dashboard reads from).
 *
 * Returns true if the prospect row was successfully created or matched
 * an existing client. Errors are logged but never thrown.
 */
export async function pushToCrm(p: CrmPayload): Promise<boolean> {
  const supabase = adminClient();
  if (!supabase) {
    // Local dev / preview without service role — silent noop.
    return false;
  }

  try {
    // 1. Find or create the contact (dedupe by email)
    const { first, last } = splitName(p.name);
    const phone = (p.phone ?? '').trim();
    const company = (p.company ?? '').trim();
    const tags = buildTags(p);
    const message = buildMessage(p);
    const sourceLabel = SOURCE_TO_LABEL[p.source] ?? 'CRECO Website';
    const attr = attributionFields(p);

    // An UNMAPPED source is not a buyer. It used to default to 'Buyer',
    // which both mislabeled the contact and (via TYPE_TO_DEAL) manufactured
    // a "Buyer Purchase" deal. Unknown now means 'Other' and no deal.
    const type: CrmLeadType = SOURCE_TO_TYPE[p.source] ?? 'Other';

    // Dedupe on email OR phone: the same person often subscribes with a
    // personal address and later inquires with a work one.
    const variants = phoneVariants(phone);
    const matchFilter = [
      `email.eq.${p.email}`,
      ...variants.map(v => `phone.eq.${v}`),
    ].join(',');

    const { data: matches } = await supabase
      .from('crm_clients')
      .select('id, tags, lead_source, prospect_status, agent_id, business_name, channel')
      .or(matchFilter)
      .limit(1);
    const existing = matches?.[0] ?? null;

    let clientId: string | null = null;
    let agentId: string | null = existing?.agent_id ?? null;

    if (existing) {
      // Merge tags, keep original source if it was set
      const mergedTags = Array.from(new Set([...(existing.tags ?? []), ...tags]));
      const { error: updateErr } = await supabase
        .from('crm_clients')
        .update({
          tags: mergedTags,
          lead_source: existing.lead_source || sourceLabel,
          // Backfill attribution only when the contact has none (no channel yet),
          // matching the FORG webhook: a returning lead that arrives with a
          // campaign/journey shouldn't lose it because we already knew the person,
          // but a later Direct visit must not overwrite the original acquisition.
          ...(existing.channel ? {} : attr),
          // Fill in a company we captured later; never blank an existing one.
          ...(company && !existing.business_name ? { business_name: company } : {}),
          // Re-surface to "new" if the broker had moved them elsewhere
          prospect_status: existing.prospect_status === 'closed' ? existing.prospect_status : 'new',
          last_touched_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (updateErr) {
        console.error('[crm] crm_clients update failed:', updateErr.message);
      }
      clientId = existing.id;
    } else {
      // The lead's owner (Zack for his listings, Brian for the rest — see
      // getLeadOwner). Falls back to the first admin only if that profile
      // can't be found, so a renamed mailbox never leaves the contact unowned.
      const leadOwner = getLeadOwner({ listingSlug: p.listing_slug, source: p.source });
      const ownerEmail = leadOwner.crm_profile_email;
      const { data: ownerProfile } = await supabase
        .from('crm_profiles')
        .select('id')
        .ilike('email', ownerEmail)
        .limit(1)
        .maybeSingle();
      const { data: adminProfile } = ownerProfile ? { data: null } : await supabase
        .from('crm_profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();
      agentId = ownerProfile?.id ?? adminProfile?.id ?? null;
      // The backup (the other of Zack/Brian) shares the contact (assigned_agent_ids).
      const { data: backupProfile } = await supabase
        .from('crm_profiles')
        .select('id')
        .ilike('email', getLeadBackup(leadOwner).crm_profile_email)
        .limit(1)
        .maybeSingle();
      const backupIds = backupProfile?.id && backupProfile.id !== agentId ? [backupProfile.id] : [];

      const { data: created, error: insertErr } = await supabase
        .from('crm_clients')
        .insert([{
          first_name: first || 'Web',
          last_name:  last || 'Lead',
          email:      p.email,
          phone:      phone || '',
          // Was dropped entirely, so captured company names vanished.
          // '' not null — business_name is NOT NULL on crm_clients, so a
          // null here failed the insert (23502) for every submission from a
          // form without a company field. That was every property-alerts
          // signup, which is why subscribers never became CRM contacts.
          business_name: company || '',
          type,
          notes:      message,
          agent_id:   agentId,
          assigned_agent_ids: backupIds,
          lead_source: sourceLabel,
          business_unit: 'commercial',
          tags,
          prospect_status: 'new',
          // Where this lead came from + the pages/dwell of the visit that
          // produced it. Matches the FORG webhook's insert so both writers
          // store the same shape; omitted fields simply stay null.
          ...attr,
        }])
        .select('id')
        .single();

      if (insertErr) {
        console.error('[crm] crm_clients insert failed:', insertErr.message);
        return false;
      }
      clientId = created?.id ?? null;
    }

    if (!clientId) {
      console.error('[crm] could not resolve client_id; aborting prospect insert');
      return false;
    }

    // 2. Insert into email_lead_imports — this is what the Prospects
    //    view reads from. Without this row, the lead won't appear there
    //    even if crm_clients was created.
    const { error: importErr } = await supabase
      .from('email_lead_imports')
      .insert([{
        gmail_message_id: syntheticMessageId(p),
        source:           sourceLabel,
        business_unit:    'commercial',
        client_id:        clientId,
        raw_subject:      `${p.event} — ${p.source}`,
        parsed_name:      [first, last].filter(Boolean).join(' '),
        parsed_email:     p.email,
        parsed_phone:     phone || null,
        parsed_property:  p.property_interest ?? null,
        parsed_message:   message,
      }]);

    if (importErr) {
      // Unique-violation on gmail_message_id means we already imported
      // this exact event — fine, treat as success.
      const code = (importErr as { code?: string }).code;
      if (code !== '23505') {
        console.error('[crm] email_lead_imports insert failed:', importErr.message);
        return false;
      }
    }

    // 3. Mirror the lead into the Deal Flow "Prospect" column.
    //
    //    A deal is created ONLY when all three hold:
    //      - the source maps to a real transaction type (no 'Buyer' default)
    //      - the payload isn't a subscription (alerts / newsletter /
    //        lead-magnet / market-report), whatever the event is called
    //      - the person has no open deal already, matched by client_id OR
    //        by email/phone within a short window
    //
    //    Agent/Broker/Other leads have no TYPE_TO_DEAL entry, so they fall
    //    out here on their own.
    const dealType = dealTypeFor(p);
    if (dealType) {
      const { data: openDeal } = await supabase
        .from('crm_deals')
        .select('id')
        .eq('client_id', clientId)
        .not('stage', 'in', OPEN_DEAL_STAGES)
        .limit(1)
        .maybeSingle();

      // Same human, different contact row (or a deal created before the
      // client row existed): look for a recent Prospect deal by email or
      // phone. Scoped to a 24h window so a genuine new inquiry weeks later
      // still opens its own deal.
      let recentDuplicate = false;
      if (!openDeal) {
        const since = new Date(Date.now() - DUPLICATE_DEAL_WINDOW_MS).toISOString();
        const dealFilter = [
          `client_email.eq.${p.email}`,
          ...variants.map(v => `client_phone.eq.${v}`),
        ].join(',');
        const { data: recent } = await supabase
          .from('crm_deals')
          .select('id')
          .eq('stage', 'Prospect')
          .gte('created_at', since)
          .or(dealFilter)
          .limit(1);
        recentDuplicate = Boolean(recent?.length);
      }

      if (!openDeal && !recentDuplicate) {
        if (!agentId) {
          const { data: adminProfile } = await supabase
            .from('crm_profiles').select('id').eq('role', 'admin').limit(1).maybeSingle();
          agentId = adminProfile?.id ?? null;
        }
        const { error: dealErr } = await supabase.from('crm_deals').insert([{
          client_id:     clientId,
          client:        [first, last].filter(Boolean).join(' ') || 'Web Lead',
          client_email:  p.email,
          client_phone:  phone || '',
          type:          dealType,
          property:      p.property_interest ?? '',
          value:         0,
          notes:         message,
          agent_id:      agentId,
          stage:         'Prospect',
          last_touch:    new Date().toISOString().slice(0, 10),
          business_unit: 'commercial',
        }]);
        if (dealErr) console.error('[crm] crm_deals insert failed:', dealErr.message);
      }
    }

    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[crm] pushToCrm threw:', msg);
    return false;
  }
}
