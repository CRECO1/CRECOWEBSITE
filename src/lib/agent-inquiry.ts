import { clampString, isValidEmail, safePhone } from '@/lib/sanitize';

/**
 * Validation for POST /api/v1/inquiries, the endpoint outside AI agents use to pass a person's request to CRECO.
 *
 * What the endpoint guarantees (and says so in /api/openapi.json):
 *   - the person the agent acts for must be named, reachable, and have consented to CRECO contacting them;
 *   - a human at CRECO follows up. Nothing is auto-replied to that person, and no automated email series starts;
 *   - every such lead is labelled as AI-agent-submitted and unverified.
 */

export const INTERESTS = ['tenant', 'buyer', 'seller', 'property_management', 'exploring'] as const;
export type Interest = (typeof INTERESTS)[number];

export const MAX_BODY_BYTES = 10_000;

export type AgentInquiry = {
  agent: { name: string; operator: string; version: string };
  principal: { name: string; email: string | null; phone: string; company: string };
  interest: Interest;
  listingSlug: string;
  message: string;
  requirements: { label: string; value: string }[];
  idempotencyKey: string;
};

const asObj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const text = (v: unknown, max: number) => clampString(v, max).replace(/<[^>]*>/g, '').trim();
const num = (v: unknown) => { const n = Number(v); return Number.isFinite(n) && n > 0 && n < 1e9 ? n : null; };
const list = (v: unknown, each: number, n = 8) => (Array.isArray(v) ? v : v == null ? [] : [v]).map(x => text(x, each)).filter(Boolean).slice(0, n);

export function parseAgentInquiry(raw: unknown): { ok: true; data: AgentInquiry } | { ok: false; errors: Record<string, string> } {
  const b = asObj(raw);
  const errors: Record<string, string> = {};
  const agent = asObj(b.agent), principal = asObj(b.principal), req = asObj(b.requirements);

  const agentName = text(agent.name, 120);
  if (!agentName) errors['agent.name'] = 'Required: the name of the AI agent or product submitting this (e.g. "ChatGPT agent").';

  const pName = text(principal.name, 120);
  if (!pName) errors['principal.name'] = 'Required: the name of the person or business the agent is acting for.';
  const emailRaw = typeof principal.email === 'string' ? principal.email.trim() : '';
  const email = emailRaw && isValidEmail(emailRaw) ? emailRaw.toLowerCase() : null;
  if (emailRaw && !email) errors['principal.email'] = 'Not a valid email address.';
  const phone = safePhone(principal.phone);
  if (!email && !phone) errors['principal'] = 'Required: at least one of principal.email or principal.phone, so a person at CRECO can reach them.';

  if (b.consent !== true) errors['consent'] = 'Required and must be true: the person you act for has agreed to share their contact details and be contacted by CRECO about this request.';

  const interest = text(b.interest, 40).toLowerCase() as Interest;
  if (!INTERESTS.includes(interest)) errors['interest'] = `Required: one of ${INTERESTS.join(', ')}.`;

  const message = text(b.message, 2000);
  if (message.length < 10) errors['message'] = 'Required: what the person is looking for, in at least a sentence (10 to 2000 characters).';

  const slug = text(b.listing_slug, 120).toLowerCase();
  if (slug && !/^[a-z0-9-]{1,120}$/.test(slug)) errors['listing_slug'] = 'Not a valid listing slug. Use a slug from /api/v1/listings.';

  if (Object.keys(errors).length) return { ok: false, errors };

  const requirements: { label: string; value: string }[] = [];
  const push = (label: string, value: string) => { if (value) requirements.push({ label, value }); };
  push('Property types', list(req.property_types, 60).join(', '));
  push('Transaction', ['lease', 'sale'].includes(text(req.transaction, 10).toLowerCase()) ? text(req.transaction, 10).toLowerCase() : '');
  const lo = num(req.min_sqft), hi = num(req.max_sqft);
  push('Size', lo || hi ? `${lo ? lo.toLocaleString('en-US') : 'any'} to ${hi ? hi.toLocaleString('en-US') : 'any'} SF` : '');
  push('Budget', text(req.budget, 120));
  push('Areas', list(req.submarkets, 80).join(', '));
  push('Timeline', text(req.timeline, 120));

  return {
    ok: true,
    data: {
      agent: { name: agentName, operator: text(agent.operator, 120), version: text(agent.version, 40) },
      principal: { name: pName, email, phone, company: text(principal.company, 200) },
      interest, listingSlug: slug, message, requirements,
      idempotencyKey: text(b.idempotency_key, 64),
    },
  };
}
