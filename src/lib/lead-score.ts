/**
 * Lead scoring — turns the signals we already capture on every /api/leads
 * submission into a triage priority the broker can read from the inbox list
 * without opening the email.
 *
 * Why this exists:
 *   Speed-to-lead is the single biggest driver of CRE conversion — a lead
 *   called within 5 minutes converts far better than one called an hour
 *   later. But the broker notification used to be `New Lead: {name} —
 *   {source}` for *every* submission, so a "ready to sell my warehouse"
 *   owner with a phone number looked identical to a newsletter signup in
 *   the inbox. Hot leads waited in line behind cold ones.
 *
 *   This scores each lead from data we already have (no new form fields,
 *   no DB migration) so the notification subject + banner scream when a
 *   high-intent lead lands. It changes nothing the prospect sees — it's
 *   purely an internal triage signal.
 *
 * Deliberately simple + deterministic: no ML, no external calls. Easy to
 * reason about, tune, and unit-test. Tiers are intentionally coarse
 * (hot / warm / cool) because the only decision they drive is "call this
 * one now vs. work it in the normal queue."
 */

export interface LeadSignals {
  source: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  property_interest?: string | null;
  /** Attribution medium (creco_attr cookie) — paid visitors skew higher-intent. */
  utm_medium?: string | null;
}

export type LeadTier = 'hot' | 'warm' | 'cool';

export interface LeadScore {
  score: number;
  tier: LeadTier;
  /** Human-readable "why" bullets shown in the notification banner. */
  reasons: string[];
  /** agent-application etc. — a recruiting lead, not a client. Routed/labeled apart. */
  isRecruiting: boolean;
}

/**
 * Forms that signal an active transaction intent (someone with a property,
 * a deal, or a specific need — not just browsing). +40.
 */
const HIGH_INTENT = new Set([
  'valuation-request', 'owner-inquiry', 'buyer-inquiry', 'pm-inquiry',
  'tour-request', 'broker-profile',
]);

/**
 * Property-specific interest — attached to a listing, a development, or a
 * concrete asset request. High, but a notch below "I own/want to transact." +30.
 */
const MID_HIGH_INTENT = new Set([
  'listing', 'brochure-request', 'tenant-needs', 'retail-leasing',
  'development-interest', 'claim-suite',
  '8000-fair-oaks-pkwy', '8979-dietz-elkhorn', '15033-main-st-lytle',
]);

/** General engagement — real, but top-of-funnel. +15. */
const MID_INTENT = new Set([
  'contact', 'save-search', 'property-alerts-inline', 'property-alerts-page',
  'chat-widget', 'exploring',
]);

// Everything else (market-report, footer, exit-intent, …) gets the +5 base.

/**
 * Transaction language in the message / property-interest field. A message
 * that names a deal ("ready to sell", "1031", "20,000 SF", "$3M budget")
 * is a much warmer signal than "just looking."
 */
const INTENT_KEYWORDS = /\b(sell|selling|sale|buy|buying|purchase|acqui\w+|dispos\w+|1031|exchange|invest\w*|cap\s*rate|ready|asap|urgent|budget|cash|closing|under\s*contract|lease\s*expir|\d[\d,]*\s*(?:sf|sq|square)|acre|\$\s?\d)/i;

function digits(s?: string | null): number {
  return s ? s.replace(/\D/g, '').length : 0;
}

/**
 * Score a lead from the signals captured at submit time.
 * Pure — no side effects, no I/O. Safe to call in a hot request path.
 */
export function scoreLead(s: LeadSignals): LeadScore {
  const source = (s.source || 'contact').toLowerCase().trim();
  const isRecruiting = source === 'agent-application';
  const reasons: string[] = [];
  let score = 0;

  // 1. Base by form intent
  if (HIGH_INTENT.has(source)) { score += 40; reasons.push('High-intent form (owner / buyer / valuation / tour)'); }
  else if (MID_HIGH_INTENT.has(source)) { score += 30; reasons.push('Property-specific interest'); }
  else if (MID_INTENT.has(source)) { score += 15; }
  else { score += 5; }

  // 2. Phone provided — the strongest "call me" signal we get
  if (digits(s.phone) >= 10) { score += 25; reasons.push('Phone number provided — wants a call'); }

  // 3. Company — B2B / principal signal
  if (s.company && s.company.trim().length > 1) { score += 10; reasons.push('Company named'); }

  // 4. Message substance + transaction language
  const text = `${s.message ?? ''} ${s.property_interest ?? ''}`.trim();
  if (text.length > 40) score += 8;
  if (INTENT_KEYWORDS.test(text)) { score += 15; reasons.push('Deal language in the message'); }

  // 5. Attribution — paid visitors self-select as higher intent
  const medium = (s.utm_medium ?? '').toLowerCase();
  if (medium.includes('cpc') || medium.includes('paid') || medium.includes('ppc')) {
    score += 10; reasons.push('Paid-search visitor');
  } else if (medium.includes('organic') && !medium.includes('social')) {
    score += 5;
  }

  // Recruiting applications are not sales leads — cap the score and relabel
  // so they never masquerade as a hot client lead in the inbox.
  if (isRecruiting) {
    score = Math.min(score, 10);
    reasons.length = 0;
    reasons.push('Career / agent application — not a client lead');
  }

  const tier: LeadTier = isRecruiting
    ? 'cool'
    : score >= 60 ? 'hot'
    : score >= 35 ? 'warm'
    : 'cool';

  return { score, tier, reasons, isRecruiting };
}

/** Inbox-scannable label for the notification subject line. */
export function tierSubjectLabel(t: LeadTier, isRecruiting: boolean): string {
  if (isRecruiting) return 'Career application';
  return t === 'hot' ? '🔥 HOT LEAD' : t === 'warm' ? 'Warm lead' : 'New lead';
}

/** Banner accent color per tier (inline-styled for email clients). */
export function tierColor(t: LeadTier): { bg: string; fg: string; label: string } {
  switch (t) {
    case 'hot':  return { bg: '#B42318', fg: '#FFFFFF', label: '🔥 HOT LEAD — call now' };
    case 'warm': return { bg: '#C9A962', fg: '#1A1A1A', label: 'Warm lead' };
    default:     return { bg: '#525252', fg: '#FFFFFF', label: 'New lead' };
  }
}
