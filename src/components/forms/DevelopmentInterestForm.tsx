'use client';

/**
 * Interest-capture form for the 8000 Fair Oaks Pkwy development. Collects
 * tenant prospect details (name, email, phone, company, use, sf needed,
 * timeline, notes) and POSTs to /api/leads with a development-specific
 * source so the broker can triage at a glance.
 *
 * Re-uses the existing leads endpoint instead of creating a new schema —
 * simpler ops, fewer moving parts. The structured info is packed into the
 * `message` field as a formatted block.
 */

import { useState } from 'react';
import { ArrowRight, CheckCircle, MapPin } from 'lucide-react';
import { getRecaptchaToken } from './Recaptcha';
import { Honeypot } from './Honeypot';

const USE_TYPES = [
  'Restaurant / fast-casual',
  'Restaurant w/ drive-thru',
  'Coffee / quick-service',
  'Retail / boutique',
  'Fitness / studio',
  'Medical / dental',
  'Service business',
  'Professional office',
  'Other',
];

const TIMELINES = [
  'Just exploring',
  'Within 6 months',
  '6-12 months',
  '12+ months',
  'Flexible — depends on the right fit',
];

export function DevelopmentInterestForm() {
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken('submit_development_interest');
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';

      // Pack the development-specific fields into the message body so the
      // broker gets all context in one place without changing the leads schema.
      const message = [
        '8000 Fair Oaks Pkwy — tenant prospect',
        '',
        `Use: ${useType || '—'}`,
        `SF needed: ${sfNeeded || '—'}`,
        `Timeline: ${timeline || '—'}`,
        notes ? `\nNotes: ${notes}` : '',
      ].filter(Boolean).join('\n');

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
          message,
          property_interest: '8000 Fair Oaks Pkwy',
          source: '8000-fair-oaks-pkwy',
          recaptchaToken,
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not register interest');
      }
      setSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-gold mb-4" />
        <h2 className="font-heading text-heading-md font-bold text-primary mb-2">Got it — we'll be in touch.</h2>
        <p className="text-body text-foreground-muted max-w-md mx-auto">
          Thanks for registering interest in 8000 Fair Oaks Pkwy. A CRECO broker will follow up directly with current development status, available space, and timeline as soon as we have specifics to share with you.
        </p>
        <p className="mt-4 text-body-sm text-foreground-muted">
          Want to talk now? Call <a href="tel:+12108173443" className="text-gold-dark hover:underline font-semibold">(210) 817-3443</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Honeypot />

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
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Phone *</label>
          <input
            type="tel"
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="(210) 555-0100"
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

      {/* Use Type */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-2">Type of use</label>
        <div className="flex flex-wrap gap-2">
          {USE_TYPES.map(u => (
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
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Approximate SF needed</label>
          <input
            type="text"
            value={sfNeeded}
            onChange={e => setSfNeeded(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="e.g. 2,500 SF"
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
          placeholder="Drive-thru / patio needs, hours of operation, parking, anchor co-tenancy preferences, etc."
        />
      </div>

      {error && <p className="text-body-sm text-destructive">{error}</p>}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <p className="text-caption text-foreground-muted max-w-md flex items-center gap-1.5">
          <MapPin className="h-3 w-3 text-gold shrink-0" />
          8000 Fair Oaks Pkwy · Fair Oaks Ranch, TX
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 whitespace-nowrap"
        >
          {submitting ? 'Sending…' : <>Register interest <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </form>
  );
}
