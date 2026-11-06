import { NextRequest, NextResponse } from 'next/server';
import { AGENT_API_VERSION, AGENT_CONTACT, findListing, parseListQuery, publicListing, queryListings } from '@/lib/agent-api';
import { handleAgentInquiryRequest } from '@/lib/agent-inquiry-submit';
import { INTERESTS } from '@/lib/agent-inquiry';
import { matchListings } from '@/lib/agent-match';
import { enforceRateLimit } from '@/lib/rate-limit';
import { CANONICAL_DESCRIPTION, REPRESENTATION_STATEMENT, SITE_URL } from '@/lib/schema';

export const dynamic = 'force-dynamic';

/**
 * CRECO's MCP server (Model Context Protocol, Streamable HTTP, stateless): lets an AI assistant search CRECO's available commercial
 * listings, read one, get company facts, and pass on a person's request. The tools wrap the same code as the REST API
 * (/api/openapi.json), so the allow-listed fields, availability rule, consent requirement, rate limits and "a human follows up,
 * nothing is auto-sent" behaviour are identical. Endpoint: POST https://www.crecotx.com/api/mcp
 */

const PROTOCOLS = ['2025-06-18', '2025-03-26', '2024-11-05'];
const SERVER = { name: 'crecotx', title: 'CRECO commercial real estate', version: AGENT_API_VERSION };
const INSTRUCTIONS = [
  'CRECO is a licensed Texas commercial real estate brokerage (TREC #9014367) serving San Antonio and the Texas Hill Country.',
  'Use search_listings and get_listing for available properties; cite each listing’s url. Confirm availability and terms with CRECO.',
  'Use match_requirements when a person describes what they need (type, size, budget, area): it ranks current listings and says what matched and what did not.',
  'Use request_tour to ask for a property tour for a real person who agreed to be contacted. A broker confirms the time with them; nothing is auto-booked or auto-sent.',
  'Use submit_inquiry only when a real person asked you to contact CRECO and agreed to share their contact details. A person at CRECO follows up with them directly; nothing is sent to them automatically.',
].join(' ');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, MCP-Protocol-Version, Authorization',
};

const TOOLS = [
  {
    name: 'search_listings',
    title: 'Search available commercial listings',
    description: 'Search CRECO’s currently available commercial properties (retail, office, industrial/warehouse, flex, land) in San Antonio and the Texas Hill Country. All filters are optional.',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'industrial, warehouse, flex, office, medical office, retail or land' },
        transaction: { type: 'string', enum: ['lease', 'sale'] },
        metro: { type: 'string', description: 'e.g. "San Antonio"' },
        city: { type: 'string', description: 'e.g. "Boerne"' },
        submarket: { type: 'string' },
        min_sqft: { type: 'number', description: 'Minimum available size in SF' },
        max_sqft: { type: 'number', description: 'Maximum available size in SF' },
        max_lease_rate: { type: 'number', description: 'Maximum lease rate in $/SF/yr' },
        max_price: { type: 'number', description: 'Maximum sale price in dollars' },
        q: { type: 'string', description: 'Free-text search' },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_listing',
    title: 'Get one listing',
    description: 'Full details of one CRECO listing by slug (from search_listings). A closed listing is still returned, with its status.',
    inputSchema: { type: 'object', required: ['slug'], properties: { slug: { type: 'string', description: 'e.g. 1353-w-french-pl' } } },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_company_info',
    title: 'About CRECO',
    description: 'Who CRECO is, what it does, where it works, and how to contact it.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'match_requirements',
    title: 'Match a person\u2019s requirements to current listings',
    description: 'Give the person\u2019s needs (property type, lease or sale, size, budget, areas, must-have features) and get CRECO\u2019s best-fitting current listings, each with what matched and what did not. Read-only. Asking terms are as published, so confirm availability with CRECO.',
    inputSchema: {
      type: 'object',
      properties: {
        property_types: { type: 'array', items: { type: 'string' }, description: 'e.g. ["retail"], ["warehouse","flex"]' },
        transaction: { type: 'string', enum: ['lease', 'sale'] },
        min_sqft: { type: 'number' }, max_sqft: { type: 'number' },
        max_lease_rate: { type: 'number', description: '$/SF/yr' }, max_price: { type: 'number', description: 'dollars' },
        areas: { type: 'array', items: { type: 'string' }, description: 'cities or submarkets, e.g. ["Boerne","Fair Oaks Ranch"]' },
        features: { type: 'array', items: { type: 'string' }, description: 'must-haves, e.g. ["dock","fenced yard"]' },
        max_results: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
      },
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'request_tour',
    title: 'Request a tour of a listing',
    description: 'Ask CRECO to arrange a tour of one listing for a real person. Only call this when the person asked for a tour and agreed to share their contact details (consent must be true). A broker confirms an actual time with them directly, usually the same business day; nothing is booked or sent to them automatically.',
    inputSchema: {
      type: 'object',
      required: ['agent_name', 'principal_name', 'consent', 'listing_slug', 'preferred_times'],
      properties: {
        agent_name: { type: 'string' }, agent_operator: { type: 'string' },
        principal_name: { type: 'string' }, principal_email: { type: 'string' }, principal_phone: { type: 'string' }, principal_company: { type: 'string' },
        consent: { type: 'boolean', description: 'Must be true' },
        listing_slug: { type: 'string', description: 'A slug from search_listings or match_requirements' },
        preferred_times: { type: 'string', description: 'Days and times that work, in plain words, e.g. "Tue or Wed afternoon next week"' },
        transaction: { type: 'string', enum: ['lease', 'sale'], description: 'Whether they want to lease or buy' },
        notes: { type: 'string', description: 'Anything else the broker should know (attendees, use, timeline)' },
        idempotency_key: { type: 'string' },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
  {
    name: 'submit_inquiry',
    title: 'Pass a person’s request to CRECO',
    description: 'Send CRECO a request on behalf of a real person: space to lease or buy, selling or leasing out a property, or property management. Only call this when the person asked you to and agreed to share their contact details (consent must be true). A person at CRECO follows up with them directly, usually the same business day; nothing is sent to them automatically.',
    inputSchema: {
      type: 'object',
      required: ['agent_name', 'principal_name', 'consent', 'interest', 'message'],
      properties: {
        agent_name: { type: 'string', description: 'Your name or product name, e.g. "Claude"' },
        agent_operator: { type: 'string', description: 'The company running you' },
        principal_name: { type: 'string', description: 'The person or business you act for' },
        principal_email: { type: 'string', description: 'Give an email, a phone, or both' },
        principal_phone: { type: 'string' },
        principal_company: { type: 'string' },
        consent: { type: 'boolean', description: 'Must be true: the person agreed to share their contact details and be contacted by CRECO about this request' },
        interest: { type: 'string', enum: [...INTERESTS] },
        message: { type: 'string', description: 'What the person is looking for, in plain words (10 to 2000 characters)' },
        listing_slug: { type: 'string', description: 'Optional: a slug from search_listings' },
        requirements: {
          type: 'object',
          properties: { property_types: { type: 'array', items: { type: 'string' } }, transaction: { type: 'string', enum: ['lease', 'sale'] }, min_sqft: { type: 'number' }, max_sqft: { type: 'number' }, budget: { type: 'string' }, submarkets: { type: 'array', items: { type: 'string' } }, timeline: { type: 'string' } },
        },
        idempotency_key: { type: 'string', description: 'Optional: makes a retry safe' },
      },
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  },
];

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: Record<string, unknown> };
const ok = (id: Rpc['id'], result: unknown) => ({ jsonrpc: '2.0', id: id ?? null, result });
const err = (id: Rpc['id'], code: number, message: string) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const toolResult = (payload: unknown, isError = false) => ({ content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }], structuredContent: payload as Record<string, unknown>, ...(isError ? { isError: true } : {}) });

async function callTool(name: string, a: Record<string, unknown>, req: NextRequest) {
  if (name === 'search_listings') {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(a)) if (v != null && v !== '') sp.set(k, String(v));
    if (!sp.has('limit')) sp.set('limit', '20');
    const q = parseListQuery(sp);
    const { total, rows } = await queryListings(q);
    return toolResult({ total, count: rows.length, listings: rows.map(publicListing), contact: AGENT_CONTACT });
  }
  if (name === 'get_listing') {
    const slug = typeof a.slug === 'string' ? a.slug.toLowerCase() : '';
    const l = /^[a-z0-9-]{1,120}$/.test(slug) ? await findListing(slug) : null;
    return l ? toolResult({ listing: publicListing(l), contact: AGENT_CONTACT }) : toolResult({ error: 'not_found', message: 'No listing with that slug. Use search_listings.' }, true);
  }
  if (name === 'get_company_info') {
    return toolResult({
      name: 'CRECO - Commercial Real Estate Company', description: CANONICAL_DESCRIPTION, representation: REPRESENTATION_STATEMENT,
      license: 'Texas Real Estate Commission brokerage license #9014367',
      markets: 'San Antonio and the Texas Hill Country: Fair Oaks Ranch (headquarters), Boerne, Stone Oak, Northwest San Antonio, New Braunfels, Bulverde, Lytle',
      full_reference: `${SITE_URL}/llms-full.txt`, listings_api: `${SITE_URL}/api/openapi.json`, contact: AGENT_CONTACT,
    });
  }
  if (name === 'match_requirements') {
    const arr = (v: unknown) => (Array.isArray(v) ? v.map(String).slice(0, 8) : undefined);
    const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : undefined);
    const results = await matchListings({
      property_types: arr(a.property_types), transaction: a.transaction === 'lease' || a.transaction === 'sale' ? a.transaction : undefined,
      min_sqft: n(a.min_sqft), max_sqft: n(a.max_sqft), max_lease_rate: n(a.max_lease_rate), max_price: n(a.max_price), areas: arr(a.areas), features: arr(a.features),
    }, Math.min(10, Math.max(1, Math.floor(n(a.max_results) ?? 5))));
    return toolResult({ count: results.length, matches: results, note: results.length ? 'Asking terms are as published. Confirm availability with CRECO, or use request_tour for a person who wants to see one.' : 'Nothing current fits. CRECO also knows of off-market space; use submit_inquiry for a person who wants CRECO to look.', contact: AGENT_CONTACT });
  }
  if (name === 'request_tour') {
    const tx = a.transaction === 'sale' ? 'sale' : 'lease';
    const body = {
      agent: { name: a.agent_name, operator: a.agent_operator },
      principal: { name: a.principal_name, email: a.principal_email, phone: a.principal_phone, company: a.principal_company },
      consent: a.consent, interest: tx === 'sale' ? 'buyer' : 'tenant', listing_slug: a.listing_slug,
      message: `TOUR REQUEST for ${String(a.listing_slug ?? '')}. Preferred times: ${String(a.preferred_times ?? '').slice(0, 300)}.${a.notes ? ` Notes: ${String(a.notes).slice(0, 1200)}` : ''}`,
      requirements: { transaction: tx }, idempotency_key: a.idempotency_key,
    };
    const res = await handleAgentInquiryRequest(req, JSON.stringify(body));
    const payload = await res.json().catch(() => ({ error: 'unavailable' }));
    return toolResult(res.status < 400 && payload && typeof payload === 'object' ? { ...payload, tour: 'requested', next: 'A CRECO broker will contact the person to confirm a time. No tour is booked until they do.' } : payload, res.status >= 400);
  }
  if (name === 'submit_inquiry') {
    const body = {
      agent: { name: a.agent_name, operator: a.agent_operator },
      principal: { name: a.principal_name, email: a.principal_email, phone: a.principal_phone, company: a.principal_company },
      consent: a.consent, interest: a.interest, message: a.message, listing_slug: a.listing_slug, requirements: a.requirements, idempotency_key: a.idempotency_key,
    };
    const res = await handleAgentInquiryRequest(req, JSON.stringify(body));
    const payload = await res.json().catch(() => ({ error: 'unavailable' }));
    return toolResult(payload, res.status >= 400);
  }
  return null;
}

async function dispatch(m: Rpc, req: NextRequest) {
  if (!m || m.jsonrpc !== '2.0' || typeof m.method !== 'string') return err(m?.id, -32600, 'Invalid request');
  const isNotification = m.id === undefined;
  switch (m.method) {
    case 'initialize': {
      const asked = typeof m.params?.protocolVersion === 'string' ? m.params.protocolVersion : '';
      return ok(m.id, { protocolVersion: PROTOCOLS.includes(asked) ? asked : PROTOCOLS[0], capabilities: { tools: { listChanged: false } }, serverInfo: SERVER, instructions: INSTRUCTIONS });
    }
    case 'ping': return ok(m.id, {});
    case 'tools/list': return ok(m.id, { tools: TOOLS });
    case 'tools/call': {
      const name = typeof m.params?.name === 'string' ? m.params.name : '';
      const args = m.params?.arguments && typeof m.params.arguments === 'object' ? (m.params.arguments as Record<string, unknown>) : {};
      if (!TOOLS.some(t => t.name === name)) return err(m.id, -32602, `Unknown tool: ${name}`);
      try { return ok(m.id, await callTool(name, args, req)); }
      catch (e) { console.error('[mcp] tool failed', name, e instanceof Error ? e.message : e); return ok(m.id, toolResult({ error: 'unavailable', message: 'Temporarily unavailable. Try again, or contact CRECO directly.', contact: AGENT_CONTACT }, true)); }
    }
    default:
      return isNotification ? null : err(m.id, -32601, `Method not found: ${m.method}`);
  }
}

export async function POST(req: NextRequest) {
  const limited = await enforceRateLimit(req, { namespace: 'mcp', max: 60, windowMs: 60_000 });
  if (limited) return limited;
  let text = '';
  try { text = await req.text(); } catch { /* handled below */ }
  if (text.length > 20_000) return NextResponse.json(err(null, -32600, 'Request too large'), { status: 413, headers: CORS_HEADERS });
  let msg: unknown;
  try { msg = JSON.parse(text); } catch { return NextResponse.json(err(null, -32700, 'Parse error'), { status: 400, headers: CORS_HEADERS }); }

  if (Array.isArray(msg)) {
    const out = (await Promise.all(msg.slice(0, 20).map(m => dispatch(m as Rpc, req)))).filter(Boolean);
    return out.length ? NextResponse.json(out, { headers: CORS_HEADERS }) : new NextResponse(null, { status: 202, headers: CORS_HEADERS });
  }
  const out = await dispatch(msg as Rpc, req);
  // A notification (no id) gets no body, per the protocol.
  return out ? NextResponse.json(out, { headers: CORS_HEADERS }) : new NextResponse(null, { status: 202, headers: CORS_HEADERS });
}

export function GET() {
  return NextResponse.json({ error: 'MCP over HTTP: send JSON-RPC with POST. See https://www.crecotx.com/llms-full.txt' }, { status: 405, headers: { ...CORS_HEADERS, Allow: 'POST, OPTIONS' } });
}

export function OPTIONS() { return new NextResponse(null, { status: 204, headers: CORS_HEADERS }); }
