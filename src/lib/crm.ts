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

function isSubscriptionSource(source: string): boolean {
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
}

/** Service-role Supabase client for the CRM (FORG project). Prefers
 *  CRM_SUPABASE_* env vars; falls back to the local Supabase if the CRM
 *  happens to live in the same database (e.g. unified dev). */
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
  return tags;
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
      .select('id, tags, lead_source, prospect_status, agent_id, business_name')
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
      // Need to assign to an admin agent — same approach the FORG
      // webhook uses. Pick the first commercial admin we find.
      const { data: adminProfile } = await supabase
        .from('crm_profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();
      agentId = adminProfile?.id ?? null;

      const { data: created, error: insertErr } = await supabase
        .from('crm_clients')
        .insert([{
          first_name: first || 'Web',
          last_name:  last || 'Lead',
          email:      p.email,
          phone:      phone || '',
          // Was dropped entirely, so captured company names vanished.
          business_name: company || null,
          type,
          notes:      message,
          agent_id:   agentId,
          assigned_agent_ids: [],
          lead_source: sourceLabel,
          business_unit: 'commercial',
          tags,
          prospect_status: 'new',
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
