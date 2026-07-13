/**
 * Tool definitions + executors for the CRECO chat concierge.
 *
 * Two tools:
 *
 *   1. search_listings — Claude can query the live listings table by
 *      property type, transaction type, city/submarket, and size range.
 *      Returns up to 5 matches with title, slug, spec chips, and a
 *      canonical URL Claude can suggest.
 *
 *   2. capture_lead — Claude can offer to have someone follow up. If the
 *      visitor agrees and shares contact info, this writes a row to the
 *      leads table with source='chat-widget' so it flows into the same
 *      Resend + CRM pipeline as every other lead. The T+24hr generic
 *      follow-up cron picks it up like any other inquiry.
 *
 * Both are read/write-narrow: search_listings can only SELECT, and
 * capture_lead can only INSERT into leads. Neither can touch anything
 * else. The service-role key stays server-side.
 */

import { createClient } from '@supabase/supabase-js';

// ─── Tool schemas (fed to Claude) ────────────────────────────────────

export const SEARCH_LISTINGS_TOOL = {
  name: 'search_listings',
  description:
    'Search the live CRECO listings database for currently-available Texas commercial properties. Use this whenever a visitor asks about specific space (e.g. "do you have warehouse in Northeast San Antonio?", "any retail under 2000 SF in Fair Oaks Ranch?", "office space for lease in Austin?"). Returns up to 5 matches with title, slug, city, size, and other spec chips. Prefer to return the results as a short conversational list with clickable URLs — never claim to have listings that aren\'t in the returned array.',
  input_schema: {
    type: 'object' as const,
    properties: {
      property_type: {
        type: 'string',
        enum: ['office', 'warehouse', 'flex', 'retail', 'land', 'any'],
        description:
          'Filter by property type. Use "warehouse" for industrial. Use "any" if the visitor didn\'t specify.',
      },
      transaction_type: {
        type: 'string',
        enum: ['lease', 'sale', 'any'],
        description: 'Filter by lease vs sale. Use "any" if not specified.',
      },
      city: {
        type: 'string',
        description:
          'City name (case-insensitive substring match) — e.g. "San Antonio", "Austin", "Fair Oaks Ranch", "Lytle". Leave empty for statewide.',
      },
      min_sqft: {
        type: 'number',
        description: 'Minimum square footage. Omit for no minimum.',
      },
      max_sqft: {
        type: 'number',
        description: 'Maximum square footage. Omit for no maximum.',
      },
    },
    required: ['property_type', 'transaction_type'],
  },
};

export const CAPTURE_LEAD_TOOL = {
  name: 'capture_lead',
  description:
    'Record a lead in the CRECO CRM so a broker follows up personally. Use this only when the visitor has explicitly agreed to be contacted and has shared their name AND email. If they only share a first name or only an email, ask for the missing piece before calling. Do not call this speculatively — capturing a lead without consent is a bad experience. After a successful call, tell the visitor a CRECO principal will follow up within one business day.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: {
        type: 'string',
        description: "The visitor's name. Required.",
      },
      email: {
        type: 'string',
        description: "The visitor's email. Required. Must be a valid-looking email.",
      },
      phone: {
        type: 'string',
        description: "The visitor's phone number if they shared one. Optional.",
      },
      interest: {
        type: 'string',
        description:
          'Brief description of what the visitor is looking for (e.g. "warehouse for lease NE San Antonio 15K SF"). Required — this is what the broker sees when they open the lead.',
      },
    },
    required: ['name', 'email', 'interest'],
  },
};

export const CHAT_TOOLS = [SEARCH_LISTINGS_TOOL, CAPTURE_LEAD_TOOL];

// ─── Tool executors ──────────────────────────────────────────────────

/**
 * Server-side Supabase client using the service role key. Bypasses RLS
 * because chat runs unauthenticated (the visitor is anonymous). Tools
 * are the only surface here so the client is narrow-scoped.
 */
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

interface SearchListingsInput {
  property_type?: string;
  transaction_type?: string;
  city?: string;
  min_sqft?: number;
  max_sqft?: number;
}

/** Execute search_listings — returns a serializable object for Claude. */
export async function executeSearchListings(input: SearchListingsInput) {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: 'Listings database is not configured. Ask the visitor to call (210) 817-3443 for current inventory.' };
  }

  let query = supabase
    .from('listings')
    .select('title, slug, city, headline, property_type, transaction_type, sqft, lease_rate, lease_rate_basis, sale_price, submarket')
    .in('status', ['active', 'pending'])
    .order('featured', { ascending: false })
    .order('listing_date', { ascending: false })
    .limit(5);

  // Normalize industrial → warehouse
  const type = input.property_type?.toLowerCase() === 'industrial' ? 'warehouse' : input.property_type?.toLowerCase();
  if (type && type !== 'any') {
    query = query.eq('property_type', type);
  }
  const txn = input.transaction_type?.toLowerCase();
  if (txn === 'lease' || txn === 'sale') {
    // Include 'both' so lease-or-sale listings surface in either filter
    query = query.or(`transaction_type.eq.${txn},transaction_type.eq.both`);
  }
  if (input.city) {
    query = query.ilike('city', `%${input.city.trim()}%`);
  }
  if (typeof input.min_sqft === 'number' && input.min_sqft > 0) {
    query = query.gte('sqft', input.min_sqft);
  }
  if (typeof input.max_sqft === 'number' && input.max_sqft > 0) {
    query = query.lte('sqft', input.max_sqft);
  }

  const { data, error } = await query;
  if (error) {
    return { error: `Listings query failed: ${error.message}` };
  }
  if (!data || data.length === 0) {
    return {
      count: 0,
      message: "No exact matches in the current active inventory. The visitor should submit their tenant needs at https://www.crecotx.com/get-started so a broker can source off-market options.",
    };
  }

  // Shape a compact payload — Claude doesn't need the raw row, just
  // enough to reference each listing in a chat reply. URLs are the
  // canonical /listings/[slug] path so the visitor can click through.
  return {
    count: data.length,
    listings: data.map((l: {
      title: string;
      slug: string;
      city: string | null;
      headline: string | null;
      property_type: string | null;
      transaction_type: string | null;
      sqft: number | null;
      lease_rate: number | null;
      lease_rate_basis: string | null;
      sale_price: number | null;
      submarket: string | null;
    }) => ({
      title: l.title,
      url: `https://www.crecotx.com/listings/${l.slug}`,
      city: l.city,
      submarket: l.submarket,
      property_type: l.property_type,
      transaction_type: l.transaction_type,
      sqft: l.sqft,
      headline: l.headline,
      lease_rate: l.lease_rate,
      lease_rate_basis: l.lease_rate_basis,
      sale_price: l.sale_price,
    })),
  };
}

interface CaptureLeadInput {
  name?: string;
  email?: string;
  phone?: string;
  interest?: string;
}

/** Execute capture_lead — writes to leads + returns confirmation. */
export async function executeCaptureLead(input: CaptureLeadInput) {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: 'Lead capture is not configured. Ask the visitor to call (210) 817-3443 directly.' };
  }

  const name = (input.name ?? '').trim().slice(0, 120);
  const email = (input.email ?? '').trim().toLowerCase().slice(0, 160);
  const phone = (input.phone ?? '').trim().slice(0, 40) || null;
  const interest = (input.interest ?? '').trim().slice(0, 500);

  // Minimum viable lead
  if (!name || !email || !interest) {
    return { error: 'Missing required fields — name, email, and interest description are all required. Ask the visitor for whichever is missing.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Email format looks invalid. Ask the visitor to confirm their email.' };
  }

  const { data, error } = await supabase
    .from('leads')
    .insert([{
      name,
      email,
      phone,
      message: interest,
      property_interest: interest.slice(0, 100),
      source: 'chat-widget',
      status: 'new',
    }])
    .select('id')
    .single();

  if (error) {
    return { error: `Could not record lead: ${error.message}` };
  }

  return {
    success: true,
    lead_id: data?.id,
    message: 'Lead recorded. A CRECO principal will follow up within one business day by phone or email. Confirm this to the visitor.',
  };
}

/**
 * Dispatcher — called from the chat route with the tool name + input.
 * Isolates the switch in one place so adding a new tool is one file
 * change.
 */
export async function executeChatTool(name: string, input: unknown): Promise<unknown> {
  switch (name) {
    case 'search_listings':
      return executeSearchListings((input ?? {}) as SearchListingsInput);
    case 'capture_lead':
      return executeCaptureLead((input ?? {}) as CaptureLeadInput);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
