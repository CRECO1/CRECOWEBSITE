'use client';

/**
 * Property Alerts subscription form. Users specify the kind of Texas commercial
 * real estate they're looking for (property type, transaction, submarket, size
 * range) and we email them when matching listings hit the CRECO inventory.
 *
 * POSTs to /api/subscribe with subscription_type='property-alerts' and the
 * filters JSON saved to subscribers.filters for downstream matching.
 */

import { useState } from 'react';
import { ArrowRight, CheckCircle, BellRing } from 'lucide-react';
import { getRecaptchaToken } from './Recaptcha';
import { Honeypot } from './Honeypot';

const PROPERTY_TYPES = [
  { value: 'office', label: 'Office' },
  { value: 'warehouse', label: 'Warehouse / Industrial' },
  { value: 'flex', label: 'Flex' },
  { value: 'retail', label: 'Retail' },
  { value: 'land', label: 'Land' },
  { value: 'mixed-use', label: 'Mixed-Use' },
];

const SUBMARKETS = [
  'Northwest', 'North Central', 'Northeast', 'Downtown', 'South Side', 'Far West',
  'Austin', 'Houston', 'Dallas', 'Fort Worth', 'New Braunfels', 'Boerne', 'Schertz',
];

const SIZE_RANGES = [
  { label: 'Any size', min: null, max: null },
  { label: 'Under 5,000 SF', min: 0, max: 5000 },
  { label: '5,000 – 15,000 SF', min: 5000, max: 15000 },
  { label: '15,000 – 50,000 SF', min: 15000, max: 50000 },
  { label: '50,000 – 100,000 SF', min: 50000, max: 100000 },
  { label: '100,000+ SF', min: 100000, max: null },
];

export function PropertyAlertsForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [transactionType, setTransactionType] = useState<'lease' | 'sale' | 'both'>('both');
  const [submarkets, setSubmarkets] = useState<string[]>([]);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePropertyType(value: string) {
    setPropertyTypes(p => p.includes(value) ? p.filter(x => x !== value) : [...p, value]);
  }

  function toggleSubmarket(value: string) {
    setSubmarkets(p => p.includes(value) ? p.filter(x => x !== value) : [...p, value]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken('subscribe_property_alerts');
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';
      const range = SIZE_RANGES[sizeIdx];
      const filters = {
        property_types: propertyTypes,
        transaction_type: transactionType,
        submarkets,
        size_min: range.min,
        size_max: range.max,
        notes: notes.trim() || null,
      };
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          subscription_type: 'property-alerts',
          source: 'property-alerts-page',
          filters,
          recaptchaToken,
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not subscribe');
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
        <h2 className="font-heading text-heading-md font-bold text-primary mb-2">You're on the list.</h2>
        <p className="text-body text-foreground-muted max-w-md mx-auto">
          We'll email you the moment a Texas commercial property matching your filters hits the CRECO listings — usually within a week of being signed by an owner.
        </p>
        <p className="mt-4 text-body-sm text-foreground-muted">
          Want to talk through your search now? Call <a href="tel:+12108173443" className="text-gold-dark hover:underline font-semibold">(210) 817-3443</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Honeypot />

      {/* Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary placeholder:text-foreground-muted/60 focus:outline-none focus:border-gold"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-body-sm font-semibold text-primary mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary placeholder:text-foreground-muted/60 focus:outline-none focus:border-gold"
            placeholder="you@company.com"
          />
        </div>
      </div>

      {/* Transaction Type */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-2">I'm looking to…</label>
        <div className="inline-flex rounded-lg border border-border bg-white p-1">
          {([
            { value: 'lease', label: 'Lease' },
            { value: 'sale', label: 'Buy' },
            { value: 'both', label: 'Either' },
          ] as const).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTransactionType(opt.value)}
              className={`px-4 py-1.5 rounded-md text-body-sm font-medium transition-colors ${
                transactionType === opt.value ? 'bg-primary text-white' : 'text-foreground-muted hover:text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Property Types */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-2">Property type <span className="text-foreground-muted font-normal">(select any that interest you)</span></label>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map(p => {
            const selected = propertyTypes.includes(p.value);
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => togglePropertyType(p.value)}
                className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${
                  selected
                    ? 'bg-gold text-primary border-gold'
                    : 'bg-white text-foreground-muted border-border hover:border-gold hover:text-primary'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submarkets */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-2">Texas submarkets <span className="text-foreground-muted font-normal">(select any)</span></label>
        <div className="flex flex-wrap gap-2">
          {SUBMARKETS.map(s => {
            const selected = submarkets.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => toggleSubmarket(s)}
                className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${
                  selected
                    ? 'bg-gold text-primary border-gold'
                    : 'bg-white text-foreground-muted border-border hover:border-gold hover:text-primary'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Size */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-2">Size range</label>
        <select
          value={sizeIdx}
          onChange={e => setSizeIdx(Number(e.target.value))}
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
        >
          {SIZE_RANGES.map((r, i) => (
            <option key={i} value={i}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-body-sm font-semibold text-primary mb-1.5">Anything else we should know? <span className="text-foreground-muted font-normal">(optional)</span></label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary placeholder:text-foreground-muted/60 focus:outline-none focus:border-gold"
          placeholder="Specific tenants we should know about, timeline, deal size, owner-user financing requirements, etc."
        />
      </div>

      {error && <p className="text-body-sm text-destructive">{error}</p>}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <p className="text-caption text-foreground-muted max-w-md">
          We send alerts only when a relevant Texas property hits our listings. No spam. Unsubscribe anytime. Your filters stay private.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 whitespace-nowrap"
        >
          {submitting ? 'Setting up alerts…' : <><BellRing className="h-4 w-4" /> Set up alerts <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
    </form>
  );
}
