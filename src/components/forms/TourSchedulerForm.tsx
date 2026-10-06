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

import { useEffect, useState } from 'react';
import { ArrowRight, CalendarClock, CheckCircle, Phone, Video } from 'lucide-react';
import { getRecaptchaToken } from './Recaptcha';
import { Honeypot } from './Honeypot';
import { trackEvent, leadPayloadFields, identifyLead } from '@/lib/analytics';

interface Props {
  listingSlug: string;
  listingTitle: string;
  listingAddress: string;
  /** When set, the success state offers the brochure — the follow-up ask. */
  brochureHref?: string;
}

const TOUR_FORMATS = [
  { value: 'in-person', label: 'In-person', description: 'Walk the property with a CRECO team member', icon: CalendarClock },
  { value: 'video',     label: 'Video',     description: 'Live video walk-through over Zoom / FaceTime',  icon: Video },
  { value: 'either',    label: 'Either',    description: 'Whichever works best for scheduling',               icon: Phone },
] as const;

/**
 * Tap-to-pick slots instead of the native date/time inputs. On a phone those
 * open a spinner per field and let people pick a Sunday at 2 AM; a row of
 * real weekday chips and broker-hours times is one tap each, and every pick
 * is a time a broker can actually show the property.
 */
const TIME_SLOTS = [
  { value: '09:00', label: '9:00 AM' },
  { value: '10:30', label: '10:30 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:30', label: '1:30 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:30', label: '4:30 PM' },
] as const;

const DEFAULT_TIME = '10:30';

/** YYYY-MM-DD in the visitor's local calendar (toISOString would shift to UTC). */
function localYmd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The next `n` weekdays, starting tomorrow. */
function nextBusinessDays(n: number): Date[] {
  const days: Date[] = [];
  const d = new Date();
  while (days.length < n) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(d));
  }
  return days;
}

export function TourSchedulerForm({ listingSlug, listingTitle, listingAddress, brochureHref }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  // Days are computed after mount: the page is statically rendered and cached,
  // so a server-side "tomorrow" would be stale (and in UTC, not Texas).
  const [days, setDays] = useState<Date[]>([]);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState(DEFAULT_TIME);
  useEffect(() => {
    const next = nextBusinessDays(5);
    setDays(next);
    setPreferredDate(localYmd(next[0]));
  }, []);
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
      const capturedForm = new FormData(e.currentTarget);
      const honeypot = (capturedForm.get('website') as string) ?? '';
      const formRenderedAt = Number(capturedForm.get('form_rendered_at')) || undefined;
      const recaptchaToken = await getRecaptchaToken('schedule_tour');
      identifyLead(email, name, 'tour-request');
      const attribution = leadPayloadFields();
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
          form_rendered_at: formRenderedAt,
          ...attribution,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not submit tour request');
      }
      setSubmitted(true);
      trackEvent('tour_request_submitted', {
        listing_slug: listingSlug,
        tour_format: tourFormat,
        attribution_source: attribution.utm_source ?? 'direct',
      });
    } catch (err) {
      setError((err as Error).message);
      trackEvent('tour_request_failed', { reason: (err as Error).message?.slice(0, 80) });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="form-success-box text-center">
        <CheckCircle className="mx-auto h-10 w-10 text-gold mb-3" />
        <h3 className="font-heading text-heading-sm font-bold text-primary mb-2">Tour request sent.</h3>
        <p className="text-body-sm text-foreground-muted max-w-md mx-auto">
          Check your inbox — we just sent a confirmation with a calendar invite you can add to your calendar. Someone from our team will reach out shortly to confirm.
        </p>
        {brochureHref && (
          <p className="mt-4">
            <a
              href={brochureHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('brochure_downloaded_direct', { listing_slug: listingSlug, surface: 'tour_success' })}
              className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-dark hover:underline"
            >
              While you wait — download the brochure (PDF) →
            </a>
          </p>
        )}
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
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold-dark"
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
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold-dark"
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
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold-dark"
          placeholder="you@company.com"
        />
      </label>

      <div>
        <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-2">Pick a day *</span>
        <div className="grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Tour day">
          {days.length === 0
            ? Array.from({ length: 5 }).map((_, k) => (
                <div key={k} className="h-[52px] rounded-lg border-2 border-border bg-background-cream/50" aria-hidden />
              ))
            : days.map(d => {
                const value = localYmd(d);
                const selected = preferredDate === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setPreferredDate(value)}
                    className={`rounded-lg border-2 px-2 py-2 text-center transition-colors ${selected ? 'border-gold bg-gold/5' : 'border-border bg-white hover:border-gold/50'}`}
                  >
                    <span className="block text-caption font-semibold uppercase text-foreground-muted">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="block text-body-sm font-bold text-primary">
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </button>
                );
              })}
        </div>
      </div>

      <div>
        <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-2">Pick a time *</span>
        <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Tour time">
          {TIME_SLOTS.map(t => {
            const selected = preferredTime === t.value;
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPreferredTime(t.value)}
                className={`rounded-lg border-2 px-2 py-2 text-center transition-colors text-body-sm font-semibold ${selected ? 'border-gold bg-gold/5 text-primary' : 'border-border bg-white text-primary hover:border-gold/50'}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-caption text-foreground-muted">Need a different time? Add it in the notes.</p>
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
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold-dark"
          placeholder="Anything we should know — alternate dates, specific questions, etc."
        />
      </label>

      {error && <p role="alert" className="text-body-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !preferredDate}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3 text-body-sm font-bold text-primary shadow-sm hover:bg-gold-light disabled:opacity-60"
      >
        {submitting ? 'Sending…' : <>Schedule a tour <ArrowRight className="h-4 w-4" /></>}
      </button>

      <p className="text-caption text-foreground-muted text-center">
        We'll confirm within an hour during business hours. No spam.
      </p>
    </form>
  );
}
