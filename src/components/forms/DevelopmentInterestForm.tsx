'use client';

/**
 * Inquiry form for 8000 Fair Oaks Pkwy. Captures whether the prospect is
 * looking at the retail bays, an executive office suite, or wants to talk
 * about either — plus the standard tenant context (use, SF, timeline).
 *
 * POSTs to /api/leads with source='8000-fair-oaks-pkwy' and a structured
 * message body so the broker triages it like any other lead. The interest
 * type is included in the message subject and body so it's the first thing
 * the broker sees.
 */

import { useState } from 'react';
import { ArrowRight, MapPin, Store, Briefcase } from 'lucide-react';
import { getRecaptchaToken } from './Recaptcha';
import { Honeypot } from './Honeypot';
import { InquirySuccessCard } from './InquirySuccessCard';
import { googleMapsUrl } from '@/lib/utils';

type InterestType = 'retail' | 'suite' | 'either';

const INTEREST_OPTIONS: { value: InterestType; label: string; description: string; icon: typeof Store }[] = [
  {
    value: 'retail',
    label: 'Retail bay',
    description: 'One of the 4 retail bays — restaurant, fast-casual, coffee, fitness, retail, or service concept',
    icon: Store,
  },
  {
    value: 'suite',
    label: 'Executive office suite',
    description: 'A private office suite — solo professional, small team, satellite location, or growing business',
    icon: Briefcase,
  },
  {
    value: 'either',
    label: 'Open to either',
    description: "Tell us about your situation and we'll point you to the right option",
    icon: MapPin,
  },
];

const RETAIL_USES = [
  'Restaurant / fast-casual',
  'Coffee / quick-service',
  'Retail / boutique',
  'Fitness / studio',
  'Medical / dental',
  'Service business',
  'Other',
];

const SUITE_USES = [
  'Solo professional',
  'Small team (2-5)',
  'Satellite office',
  'Real estate / insurance',
  'Legal / accounting',
  'Consulting',
  'Therapy / counseling',
  'Other',
];

const TIMELINES = [
  'ASAP',
  'Within 30 days',
  'Within 90 days',
  '3-6 months',
  '6+ months',
  'Just exploring',
];

/**
 * Props for the inquiry form.
 *
 * `initialInterest` lets the parent pre-select which inquiry track the
 * form opens on. Used by the modal button on /8000-fair-oaks-pkwy so
 * clicking "Inquire about a retail bay" lands the visitor on the retail
 * track, and "Inquire about an executive suite" lands on the suite
 * track — without forcing a redundant click before they start filling
 * out the rest of the fields.
 */
interface DevelopmentInterestFormProps {
  initialInterest?: InterestType;
}

export function DevelopmentInterestForm({ initialInterest = 'retail' }: DevelopmentInterestFormProps = {}) {
  const [interest, setInterest] = useState<InterestType>(initialInterest);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [useType, setUseType] = useState('');
  const [sfNeeded, setSfNeeded] = useState('');
  const [timeline, setTimeline] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use-type options change based on interest selection — different prospect
  // pools have different relevant categories.
  const useOptions = interest === 'suite' ? SUITE_USES : interest === 'retail' ? RETAIL_USES : [...RETAIL_USES, ...SUITE_USES];

  // Reset use type if it's no longer in the visible options when interest flips
  function handleInterestChange(next: InterestType) {
    setInterest(next);
    setUseType('');
  }

  const interestLabel = INTEREST_OPTIONS.find(o => o.value === interest)?.label ?? '';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken('submit_8000_fair_oaks_pkwy');
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';

      // Pack the structured fields into the message body so the broker gets
      // all the context up-front. The interest type leads so it's the first
      // thing they see in the email subject preview.
      const message = [
        `8000 Fair Oaks Pkwy — ${interestLabel} inquiry`,
        '',
        `Interest: ${interestLabel}`,
        `Use / role: ${useType || '—'}`,
        `SF needed: ${sfNeeded || '—'}`,
        `Timeline: ${timeline || '—'}`,
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
          property_interest: `8000 Fair Oaks Pkwy — ${interestLabel}`,
          source: `8000-fair-oaks-pkwy-${interest}`,
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
      trackEvent('development_inquiry_submitted', {
        interest,
        attribution_source: attribution.utm_source ?? 'direct',
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    // Property-specific copy passed in — the rest (timeline, "while
    // you wait" links, phone fallback) is the shared InquirySuccessCard
    // pattern so the post-submit moment feels consistent across forms.
    return (
      <InquirySuccessCard
        propertyName="8000 Fair Oaks Plaza"
        customMessage={`A CRECO principal will follow up about your ${interest === 'suite' ? 'executive office suite' : interest === 'retail' ? 'retail bay' : '8000 Fair Oaks Pkwy'} inquiry with current availability, the right space recommendation, and a proposed tour time.`}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Honeypot />

      {/* Interest selector — drives the rest of the form */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-3">What are you looking for?</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {INTEREST_OPTIONS.map(opt => {
            const Icon = opt.icon;
            const selected = interest === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleInterestChange(opt.value)}
                className={`text-left rounded-xl border-2 p-4 transition-colors ${
                  selected ? 'border-gold bg-gold/5' : 'border-border bg-white hover:border-gold/50'
                }`}
              >
                <Icon className={`h-5 w-5 mb-2 ${selected ? 'text-gold' : 'text-foreground-muted'}`} />
                <div className={`font-heading text-body-sm font-bold mb-1 ${selected ? 'text-primary' : 'text-primary'}`}>
                  {opt.label}
                </div>
                <div className="text-caption text-foreground-muted leading-snug">{opt.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Email *</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="you@company.com"
          />
        </div>
        {/* Phone made OPTIONAL — was required, which hurt completion.
            Phone is the broker's preferred reply channel, but forcing
            it before submission lost the 10-15% of visitors who don't
            want to share it before a value exchange. We capture email
            as the gate and ask for the number organically in the reply. */}
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="(210) 555-0100 (optional)"
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Company / Concept</label>
          <input
            type="text"
            value={company}
            onChange={e => setCompany(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="Your business or concept"
          />
        </div>
      </div>

      {/* Use Type — options shift with interest */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-2">
          {interest === 'suite' ? 'Type of work / business' : interest === 'retail' ? 'Type of use' : 'Use / business type'}
        </label>
        <div className="flex flex-wrap gap-2">
          {useOptions.map(u => (
            <button
              key={u}
              type="button"
              onClick={() => setUseType(u)}
              className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${
                useType === u
                  ? 'bg-gold text-primary border-gold'
                  : 'bg-white text-foreground-muted border-border hover:border-gold hover:text-primary'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* SF + Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">
            {interest === 'suite' ? 'Suite size or # of offices' : 'Approximate SF needed'}
          </label>
          <input
            type="text"
            value={sfNeeded}
            onChange={e => setSfNeeded(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder={interest === 'suite' ? 'e.g. 1 office for solo, or 600 SF' : 'e.g. 1,500 SF'}
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Timeline</label>
          <select
            value={timeline}
            onChange={e => setTimeline(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
          >
            <option value="">Select…</option>
            {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-1.5">Anything else we should know?</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
          placeholder={
            interest === 'suite'
              ? 'Conference room needs, parking, after-hours access, etc.'
              : interest === 'retail'
                ? 'Hours of operation, drive-thru / patio needs, parking, anchor co-tenancy preferences, etc.'
                : 'Tell us about your situation — we want to point you to the right option.'
          }
        />
      </div>

      {error && <p className="text-body-sm text-destructive">{error}</p>}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <a
          href={googleMapsUrl('8000 Fair Oaks Pkwy Suite 102, Fair Oaks Ranch, TX 78015')}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open 8000 Fair Oaks Pkwy in Google Maps"
          className="text-caption text-foreground-muted hover:text-gold transition-colors max-w-md flex items-center gap-1.5"
        >
          <MapPin className="h-3 w-3 text-gold shrink-0" />
          8000 Fair Oaks Pkwy · Fair Oaks Ranch, TX
        </a>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 whitespace-nowrap"
        >
          {submitting ? 'Sending…' : <>Send inquiry <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </form>
  );
}
