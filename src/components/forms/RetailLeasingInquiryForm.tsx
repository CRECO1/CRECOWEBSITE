'use client';

/**
 * Inquiry form for 8979 Dietz Elkhorn (Fair Oaks Ranch retail center)
 * pre-leasing landing page. Pre-qualifies local operators per the
 * CRECO leasing strategy — concept, SF, target open date, financing
 * status — so the broker can triage hot/warm/aspirational on the
 * first read.
 *
 * POSTs to /api/leads with source='8979-dietz-elkhorn-{category}' and
 * a structured message body. Mirrors the DevelopmentInterestForm flow
 * (Honeypot + reCAPTCHA + UTM attribution) so leads land in the same
 * pipeline as 8000 Fair Oaks Pkwy.
 *
 * Field rationale (from the leasing strategy):
 *   - Concept category drives the suite recommendation (end caps for
 *     F&B, food-ready bays, etc.) so we capture it up front.
 *   - SF needed maps to single-suite (~1,500 SF) vs. combine-two
 *     (~3,000 SF) vs. anchor (~4,500 SF).
 *   - Target open date qualifies urgency.
 *   - Existing locations + financing status are the Hot/Warm/
 *     Aspirational signal — established operator with SBA pre-approval
 *     is Hot, idea-stage no-financing is Aspirational.
 */

import { useState } from 'react';
import { ArrowRight, Utensils, HeartPulse, Briefcase, ShoppingBag } from 'lucide-react';
import { InquirySuccessCard } from './InquirySuccessCard';
import { getRecaptchaToken } from './Recaptcha';
import { Honeypot } from './Honeypot';

type ConceptCategory = 'food-beverage' | 'health-wellness' | 'professional' | 'retail-specialty' | 'other';

const CATEGORIES: { value: ConceptCategory; label: string; icon: typeof Utensils; examples: string }[] = [
  {
    value: 'food-beverage',
    label: 'Food & Beverage',
    icon: Utensils,
    examples: 'Coffee, bakery, fast-casual, juice, wine bar, brunch',
  },
  {
    value: 'health-wellness',
    label: 'Health & Wellness',
    icon: HeartPulse,
    examples: 'Pilates / fitness, med-spa, salon, massage, PT, IV',
  },
  {
    value: 'professional',
    label: 'Professional Services',
    icon: Briefcase,
    examples: 'Insurance, financial, dental, optometry, real estate',
  },
  {
    value: 'retail-specialty',
    label: 'Retail & Specialty',
    icon: ShoppingBag,
    examples: "Boutique, pet, home decor, children's, golf, gift",
  },
];

const SF_OPTIONS = [
  '1,500 SF (single suite)',
  '3,000 SF (two combined)',
  '4,500 SF (three combined)',
  'End cap with patio',
  'Not sure yet',
];

const TIMELINES = [
  'ASAP / next quarter',
  '3-6 months',
  '6-12 months',
  '12+ months',
  'Just exploring',
];

const FINANCING = [
  'Self-funded / cash',
  'SBA pre-approved',
  'Working with a lender',
  'Investor / partner',
  'Need guidance on financing',
];

export function RetailLeasingInquiryForm() {
  const [category, setCategory] = useState<ConceptCategory | ''>('');
  const [otherCategory, setOtherCategory] = useState('');
  const [concept, setConcept] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [existingLocations, setExistingLocations] = useState('');
  const [sfNeeded, setSfNeeded] = useState('');
  const [timeline, setTimeline] = useState('');
  const [financing, setFinancing] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryLabel = CATEGORIES.find(c => c.value === category)?.label
    ?? (category === 'other' ? `Other (${otherCategory || 'unspecified'})` : '');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!category) { setError('Pick a concept category.'); return; }
    if (!concept.trim()) { setError("Tell us the concept name."); return; }
    if (!name.trim() || !email.trim()) { setError('Name and email are required.'); return; }

    setSubmitting(true);
    try {
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';
      const recaptchaToken = await getRecaptchaToken('submit_8979_dietz_elkhorn');

      // Pack structured pre-qualification into the message body so the
      // broker sees the Hot/Warm/Aspirational signal at a glance.
      const message = [
        `8979 Dietz Elkhorn — ${categoryLabel} inquiry`,
        '',
        `Category: ${categoryLabel}`,
        `Concept: ${concept}`,
        `SF needed: ${sfNeeded || '—'}`,
        `Timeline: ${timeline || '—'}`,
        `Existing locations: ${existingLocations || '—'}`,
        `Financing: ${financing || '—'}`,
        notes ? `\nNotes: ${notes}` : '',
      ].filter(Boolean).join('\n');

      const { trackEvent, readUtmsFromCookie } = await import('@/lib/analytics');
      const attribution = readUtmsFromCookie();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
          message,
          property_interest: `8979 Dietz Elkhorn — ${categoryLabel}`,
          source: `8979-dietz-elkhorn-${category}`,
          recaptchaToken,
          website: honeypot,
          ...attribution,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not send inquiry');
      }
      setSubmitted(true);
      trackEvent('retail_leasing_inquiry_submitted', {
        category,
        attribution_source: attribution.utm_source ?? 'direct',
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <InquirySuccessCard
        propertyName="8979 Dietz Elkhorn"
        customMessage="A CRECO principal will follow up about 8979 Dietz Elkhorn with current suite availability, your suite recommendation, and a proposed tour time. If you're a great fit for an end cap or food-ready bay, we'll flag that right away."
      />
    );
  }

  const inputCls =
    'w-full rounded-lg border border-border bg-white px-4 py-3 text-body-sm text-primary focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Honeypot />

      {/* Category selector — drives the recommendation downstream */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-3">
          What kind of business are you opening?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map(opt => {
            const Icon = opt.icon;
            const selected = category === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`text-left rounded-xl border-2 p-4 transition-colors ${
                  selected ? 'border-gold bg-gold/5' : 'border-border bg-white hover:border-gold/50'
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${selected ? 'text-gold' : 'text-foreground-muted'}`} />
                <div className="font-heading text-body-sm font-bold text-primary mb-1">{opt.label}</div>
                <div className="text-caption text-foreground-muted leading-snug">{opt.examples}</div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setCategory('other')}
            className={`text-left rounded-xl border-2 p-4 transition-colors sm:col-span-2 ${
              category === 'other' ? 'border-gold bg-gold/5' : 'border-border bg-white hover:border-gold/50'
            }`}
          >
            <div className="font-heading text-body-sm font-bold text-primary mb-1">Something else</div>
            <div className="text-caption text-foreground-muted leading-snug">
              Tell us about your concept — we&apos;re open to creative ideas that fit the neighborhood.
            </div>
          </button>
        </div>
        {category === 'other' && (
          <input
            type="text"
            value={otherCategory}
            onChange={e => setOtherCategory(e.target.value)}
            placeholder="What category?"
            className={`mt-3 ${inputCls}`}
            maxLength={80}
          />
        )}
      </div>

      {/* Concept name */}
      <div>
        <label htmlFor="retail-1" className="block text-body-sm font-semibold text-primary mb-2">
          Concept name <span className="text-foreground-muted font-normal">(or your working name)</span>
        </label>
        <input id="retail-1"
          type="text"
          value={concept}
          onChange={e => setConcept(e.target.value)}
          placeholder='e.g. "Daughters Coffee" or "Pilates by Sarah"'
          required
          maxLength={120}
          className={inputCls}
        />
      </div>

      {/* Two-column: SF + timeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="retail-2" className="block text-body-sm font-semibold text-primary mb-2">Space size</label>
          <select id="retail-2" value={sfNeeded} onChange={e => setSfNeeded(e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {SF_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="retail-3" className="block text-body-sm font-semibold text-primary mb-2">Target open date</label>
          <select id="retail-3" value={timeline} onChange={e => setTimeline(e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {TIMELINES.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Existing locations + financing — Hot/Warm/Aspirational signal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="retail-4" className="block text-body-sm font-semibold text-primary mb-2">
            Existing locations <span className="text-foreground-muted font-normal">(optional)</span>
          </label>
          <input id="retail-4"
            type="text"
            value={existingLocations}
            onChange={e => setExistingLocations(e.target.value)}
            placeholder="Boerne, Stone Oak, etc."
            maxLength={160}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="retail-5" className="block text-body-sm font-semibold text-primary mb-2">
            Funding status <span className="text-foreground-muted font-normal">(optional)</span>
          </label>
          <select id="retail-5" value={financing} onChange={e => setFinancing(e.target.value)} className={inputCls}>
            <option value="">Select…</option>
            {FINANCING.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Contact block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
        <div>
          <label htmlFor="retail-6" className="block text-body-sm font-semibold text-primary mb-2">Your name</label>
          <input id="retail-6" type="text" value={name} onChange={e => setName(e.target.value)} required maxLength={120} autoComplete="name" className={inputCls} />
        </div>
        <div>
          <label htmlFor="retail-7" className="block text-body-sm font-semibold text-primary mb-2">Company / LLC</label>
          <input id="retail-7" type="text" value={company} onChange={e => setCompany(e.target.value)} maxLength={160} autoComplete="organization" className={inputCls} />
        </div>
        <div>
          <label htmlFor="retail-8" className="block text-body-sm font-semibold text-primary mb-2">Email</label>
          <input id="retail-8" type="email" value={email} onChange={e => setEmail(e.target.value)} required maxLength={160} autoComplete="email" className={inputCls} />
        </div>
        <div>
          <label htmlFor="retail-9" className="block text-body-sm font-semibold text-primary mb-2">Phone</label>
          <input id="retail-9" type="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={40} autoComplete="tel" className={inputCls} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="retail-10" className="block text-body-sm font-semibold text-primary mb-2">
          Anything else? <span className="text-foreground-muted font-normal">(optional)</span>
        </label>
        <textarea id="retail-10"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          maxLength={1200}
          placeholder="Anchor preferences, end-cap interest, food infrastructure needs, etc."
          className={inputCls}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-body-sm text-red-800">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-semibold text-primary hover:bg-gold-light disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? 'Sending…' : (<>Send <ArrowRight className="h-4 w-4" /></>)}
      </button>

      <p className="text-caption text-foreground-muted text-center leading-relaxed">
        Tours are walked weekly. A CRECO broker will follow up within one business day
        with your suite recommendation and proposed times.
      </p>
    </form>
  );
}
