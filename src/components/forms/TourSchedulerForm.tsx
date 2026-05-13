'use client';

/**
 * Schedule-a-tour form for listing detail pages. Captures contact info +
 * preferred date/time + tour format (in-person / video / either), POSTs
 * to /api/tour-request which:
 *   1. Saves a lead row (source='tour-request')
 *   2. Emails the prospect a confirmation with .ics calendar attachment
 *   3. Notifies the broker at info@crecotx.com
 *
 * Renders inline on the listing detail page next to the existing
 * ListingContactForm. Switches to a success state on submit.
 */

import { useState } from 'react';
import { ArrowRight, CalendarClock, CheckCircle, Phone, Video } from 'lucide-react';
import { getRecaptchaToken } from './Recaptcha';
import { Honeypot } from './Honeypot';

interface Props {
  listingSlug: string;
  listingTitle: string;
  listingAddress: string;
}

const TOUR_FORMATS = [
  { value: 'in-person', label: 'In-person', description: 'Walk the property with a CRECO broker', icon: CalendarClock },
  { value: 'video',     label: 'Video',     description: 'Live video walk-through over Zoom / FaceTime',  icon: Video },
  { value: 'either',    label: 'Either',    description: 'Whichever works for the broker',               icon: Phone },
] as const;

function defaultDate(): string {
  // Tomorrow, formatted YYYY-MM-DD
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_TIME = '10:00';

export function TourSchedulerForm({ listingSlug, listingTitle, listingAddress }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState(defaultDate());
  const [preferredTime, setPreferredTime] = useState(DEFAULT_TIME);
  const [tourFormat, setTourFormat] = useState<typeof TOUR_FORMATS[number]['value']>('in-person');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken('schedule_tour');
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';
      const res = await fetch('/api/tour-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          listingSlug,
          listingTitle,
          listingAddress,
          preferredDate,
          preferredTime,
          tourFormat,
          notes,
          recaptchaToken,
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not submit tour request');
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
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-gold mb-3" />
        <h3 className="font-heading text-heading-sm font-bold text-primary mb-2">Tour request sent.</h3>
        <p className="text-body-sm text-foreground-muted max-w-md mx-auto">
          Check your inbox — we just sent a confirmation with a calendar invite you can add to your calendar. A CRECO broker will reach out shortly to confirm.
        </p>
        <p className="mt-3 text-caption text-foreground-muted">
          Need to talk now? Call <a href="tel:+12108173443" className="text-gold-dark hover:underline font-semibold">(210) 817-3443</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Honeypot />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">Name *</span>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="Your name"
          />
        </label>
        <label className="block">
          <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">Phone *</span>
          <input
            type="tel"
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
            placeholder="(210) 555-0100"
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">Email *</span>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
          placeholder="you@company.com"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">Preferred date *</span>
          <input
            type="date"
            required
            min={defaultDate()}
            value={preferredDate}
            onChange={e => setPreferredDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
          />
        </label>
        <label className="block">
          <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">Preferred time *</span>
          <input
            type="time"
            required
            value={preferredTime}
            onChange={e => setPreferredTime(e.target.value)}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
          />
        </label>
      </div>

      <div>
        <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-2">Tour format</span>
        <div className="grid grid-cols-3 gap-2">
          {TOUR_FORMATS.map(f => {
            const Icon = f.icon;
            const selected = tourFormat === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setTourFormat(f.value)}
                className={`text-left rounded-lg border-2 p-2.5 transition-colors ${
                  selected ? 'border-gold bg-gold/5' : 'border-border bg-white hover:border-gold/50'
                }`}
              >
                <Icon className={`h-4 w-4 mb-1 ${selected ? 'text-gold' : 'text-foreground-muted'}`} />
                <div className={`text-caption font-semibold ${selected ? 'text-primary' : 'text-primary'}`}>
                  {f.label}
                </div>
                <div className="text-caption text-foreground-muted leading-tight mt-0.5">{f.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      <label className="block">
        <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">Notes (optional)</span>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold"
          placeholder="Anything we should know — alternate dates, specific questions, etc."
        />
      </label>

      {error && <p className="text-body-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? 'Sending…' : <>Request tour <ArrowRight className="h-4 w-4" /></>}
      </button>

      <p className="text-caption text-foreground-muted text-center">
        We'll confirm within an hour during business hours. No spam.
      </p>
    </form>
  );
}
