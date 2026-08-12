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

type CrmLeadType = 'Buyer' | 'Seller' | 'Tenant' | 'Landlord/Investor' | 'Agent' | 'Broker';

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
    const tags = buildTags(p);
    const message = buildMessage(p);
    const type: CrmLeadType = SOURCE_TO_TYPE[p.source] ?? 'Buyer';
    const sourceLabel = SOURCE_TO_LABEL[p.source] ?? 'CRECO Website';

    const { data: existing } = await supabase
      .from('crm_clients')
      .select('id, tags, lead_source, prospect_status, agent_id')
      .eq('email', p.email)
      .maybeSingle();

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

    // 3. Mirror the lead into the Deal Flow "Prospect" column. Only real
    //    transaction leads (Buyer/Seller/Tenant/Landlord) get a deal —
    //    newsletter subscribers and agent applicants don't. Skip if the
    //    contact already has an open deal so re-submissions don't pile up.
    const dealType = TYPE_TO_DEAL[type];
    if (dealType && p.event !== 'subscriber.created') {
      const { data: openDeal } = await supabase
        .from('crm_deals')
        .select('id')
        .eq('client_id', clientId)
        .not('stage', 'in', '("Closed","Lost")')
        .limit(1)
        .maybeSingle();
      if (!openDeal) {
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
