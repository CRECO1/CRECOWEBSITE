import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendLeadToCrm } from '@/lib/crm-lead';
import { enforceRateLimit } from '@/lib/rate-limit';
import { checkEmailQuality } from '@/lib/email-quality';
import { phoneOnlyEmail } from '@/lib/placeholder-email';
import { leadAlertRecipients, leadCrmOwners } from '@/lib/lead-owner';
import { getLeadOwner } from '@/lib/broker';
import { buildLeadNotificationEmail, leadNotificationSubject, type LeadAnswer } from '@/lib/lead-notification-email';
import { clampString, MAX_LEN } from '@/lib/sanitize';
import { AGENT_API_VERSION, AGENT_CONTACT, CORS, findListing } from '@/lib/agent-api';
import { MAX_BODY_BYTES, parseAgentInquiry, type Interest } from '@/lib/agent-inquiry';
import { listingUrl } from '@/lib/schema';

/**
 * The inquiry handler shared by POST /api/v1/inquiries and the MCP server's submit_inquiry tool: an outside AI agent passes on a
 * person's request (see /api/openapi.json).
 *
 * Safeguards, because a keyless public write endpoint is an abuse target:
 *   - per-IP rate limits (5/min, 30/hour), a 10 KB body cap, strict validation with HTML stripped;
 *   - the person must be named, reachable (email checked for a real mail domain) and have consented;
 *   - duplicates (same idempotency key, or same person + listing within 24 h) are accepted once and ignored after;
 *   - NOTHING goes to the person: no auto-reply and no email series (the CRM webhook skips its welcome plan for the
 *     "AI agent" source). The team gets an internal alert, and the contact lands in the CRM tagged "AI Agent Inquiry"
 *     for a human to verify and follow up.
 */

const SOURCE = 'ai-agent-inquiry';
const NOTIFICATION_EMAIL = process.env.LEAD_NOTIFICATION_EMAIL ?? 'info@crecotx.com';
const getFromEmail = () => process.env.RESEND_FROM_EMAIL ?? (process.env.RESEND_FROM_VERIFIED === 'true' ? 'CRECO <noreply@crecotx.com>' : 'onboarding@resend.dev');

const LABEL: Record<Interest, { heading: string; human: string; crmType: 'Tenant' | 'Buyer' | 'Seller' | 'Landlord/Investor' }> = {
  tenant: { heading: 'New AI-agent inquiry: tenant', human: 'Looking for space (via AI agent)', crmType: 'Tenant' },
  buyer: { heading: 'New AI-agent inquiry: buyer', human: 'Looking to buy (via AI agent)', crmType: 'Buyer' },
  seller: { heading: 'New AI-agent inquiry: property owner', human: 'Owns a property (via AI agent)', crmType: 'Seller' },
  property_management: { heading: 'New AI-agent inquiry: property management', human: 'Needs property management (via AI agent)', crmType: 'Landlord/Investor' },
  exploring: { heading: 'New AI-agent inquiry: exploring', human: 'Exploring (via AI agent)', crmType: 'Tenant' },
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) => NextResponse.json(body, { status, headers: { ...CORS, ...extra } });

export async function handleAgentInquiryRequest(req: NextRequest, rawIn?: string): Promise<Response> {
  const burst = await enforceRateLimit(req, { namespace: 'agent-inquiry', max: 5, windowMs: 60_000 });
  if (burst) return burst;
  const hourly = await enforceRateLimit(req, { namespace: 'agent-inquiry-hour', max: 30, windowMs: 3_600_000 });
  if (hourly) return hourly;

  let raw = rawIn ?? '';
  if (rawIn === undefined) { try { raw = await req.text(); } catch { return json({ error: 'bad_request', message: 'Could not read the body.' }, 400); } }
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'too_large', message: `Body must be under ${MAX_BODY_BYTES} bytes.` }, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json({ error: 'bad_request', message: 'Body must be JSON.' }, 400); }

  const parsed = parseAgentInquiry(body);
  if (!parsed.ok) return json({ error: 'validation_failed', errors: parsed.errors, docs: 'https://www.crecotx.com/api/openapi.json' }, 400);
  const q = parsed.data;

  // A listing named by slug must exist, so a typo does not pass quietly.
  const listing = q.listingSlug ? await findListing(q.listingSlug).catch(() => null) : null;
  if (q.listingSlug && !listing) return json({ error: 'validation_failed', errors: { listing_slug: 'No listing with that slug.' } }, 400);

  if (q.principal.email) {
    const quality = await checkEmailQuality(q.principal.email, { checkMx: true });
    if (!quality.ok) return json({ error: 'validation_failed', errors: { 'principal.email': quality.reason === 'disposable' ? 'Use a permanent email address.' : quality.reason === 'no-mx' ? 'That email domain cannot receive mail.' : 'Check the email address.' } }, 400);
  }

  const storedEmail = q.principal.email ?? phoneOnlyEmail(q.principal.phone);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL, supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) { console.error('[agent-inquiry] SUPABASE_SERVICE_ROLE_KEY is not set'); return json({ error: 'unavailable', message: 'Try again later, or have the person call or email CRECO.', contact: AGENT_CONTACT }, 503); }
  const db = createClient(supabaseUrl, supabaseKey);

  // Duplicate: same idempotency key, or the same person asking about the same listing in the last 24 hours.
  const since = new Date(Date.now() - 24 * 3_600_000).toISOString();
  let dupQ = db.from('leads').select('id').eq('source', SOURCE).gte('created_at', since).limit(1);
  dupQ = q.idempotencyKey ? dupQ.eq('intake_data->>idempotency_key', q.idempotencyKey) : dupQ.eq('email', storedEmail).eq('intake_data->>listing_slug', q.listingSlug);
  const { data: dup } = await dupQ;
  if (dup && dup.length) return json({ status: 'duplicate', message: 'This request was already received; nobody needs to resend it.', meta: { api_version: AGENT_API_VERSION } });

  const meta = LABEL[q.interest];
  const ua = clampString(req.headers.get('user-agent'), 160);
  const entries: LeadAnswer[] = [
    { label: 'Submitted by', value: `AI agent: ${q.agent.name}${q.agent.operator ? ` (operator: ${q.agent.operator})` : ''}${q.agent.version ? ` v${q.agent.version}` : ''}` },
    { label: 'Verify first', value: 'Sent through the public agent API. The details are unverified until someone confirms them with the person. Nothing was auto-sent to them.' },
    { label: 'Consent stated by agent', value: 'The person agreed to share their contact details and be contacted by CRECO.' },
    ...(listing ? [{ label: 'Listing', value: `${listing.title}: ${listingUrl(listing)}` }] : []),
    ...q.requirements,
    { label: 'Message', value: q.message },
  ];
  const summary = entries.map(e => `${e.label}: ${e.value}`).join('\n');

  const { data: row, error } = await db.from('leads').insert([{
    name: q.principal.name, email: storedEmail, phone: q.principal.phone || null, company: q.principal.company || null,
    source: SOURCE, status: 'new',
    intake_data: { path: q.interest, listing_slug: q.listingSlug, idempotency_key: q.idempotencyKey, agent: q.agent, user_agent: ua },
    message: `${meta.human}\n\n${summary}`,
    context: { page_path: '/api/v1/inquiries', surface: 'ai-agent-api' },
  }]).select('id').single();
  if (error) { console.error('[agent-inquiry] insert failed:', error.message); return json({ error: 'unavailable', message: 'Could not record the request. Try again later, or have the person call or email CRECO.', contact: AGENT_CONTACT }, 503); }

  // CRM contact + the speed-to-lead call task (owner: the broker). The "AI agent" source keeps it out of the welcome series.
  await sendLeadToCrm({
    name: q.principal.name, email: storedEmail, phone: q.principal.phone, company: q.principal.company,
    ...leadCrmOwners(getLeadOwner({})),
    message: clampString(`AI-agent inquiry (${q.agent.name}): ${q.message}`, MAX_LEN.message),
    source: `AI agent: crecotx.com API (${q.agent.name})`,
    type: meta.crmType, tags: ['AI Agent Inquiry'], page_path: '/api/v1/inquiries', surface: 'ai-agent-api',
  });

  // Internal alert only (to the lead owner and the shared inbox). Never to the person.
  if (process.env.RESEND_API_KEY) {
    try {
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: getFromEmail(), to: leadAlertRecipients(getLeadOwner({})),
        ...(q.principal.email ? { replyTo: q.principal.email } : {}),
        subject: leadNotificationSubject({ heading: meta.heading, name: q.principal.name, company: q.principal.company }),
        html: buildLeadNotificationEmail({ heading: meta.heading, pathLabel: meta.human, name: q.principal.name, company: q.principal.company, email: q.principal.email, phone: q.principal.phone, answers: entries }),
      });
    } catch (e) { console.error('[agent-inquiry] team alert failed:', e instanceof Error ? e.message : e); }
  } else console.warn('[agent-inquiry] RESEND_API_KEY not set; no team alert');

  return json({
    status: 'received', reference: String(row?.id ?? '').slice(0, 8),
    message: 'Thank you. A person at CRECO will follow up with the person you represent directly, usually the same business day. No automated message is sent to them.',
    contact: AGENT_CONTACT, meta: { api_version: AGENT_API_VERSION },
  }, 202);
}
