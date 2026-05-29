'use client';

/**
 * Homepage-hero single-field capture. The first impression CTA — one input,
 * one button, no friction. Goes to /api/leads with source='hero-quick-capture'
 * and the operator follows up via the normal lead workflow.
 *
 * Why single-field: pixel data + every CRO study agrees that each additional
 * field shaves ~10% off conversion. Above the fold a single email field
 * captures the broadest top-of-funnel signal — the operator gets contact +
 * we attribute via the UTM cookie. Phone, message, intent — all gathered in
 * the follow-up call/email.
 *
 * Tracking: fires `hero_capture_submitted` GA4 event so we can see exactly
 * how many leads this surface generates relative to /get-started, /contact,
 * /property-alerts. Carries UTMs from the cookie.
 */

import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { getRecaptchaToken } from './Recaptcha';
import { Honeypot } from './Honeypot';
import { trackEvent, readUtmsFromCookie } from '@/lib/analytics';

export function HeroQuickCapture() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Hard guard against double-submission: the button is also disabled
    // during the in-flight request, but a fast double-click can land
    // between event dispatch and setState committing. This guard runs
    // synchronously inside the same event tick so the second click
    // bails before the second fetch goes out.
    if (submitting) return;
    setError(null);

    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Enter a valid email.');
      return;
    }

    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken('hero_quick_capture');
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';
      const attribution = readUtmsFromCookie();

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Single field + a system-generated name so the API validator
          // (which requires a non-empty name) accepts the row. Operator
          // sees "—" in the name column and follows up to learn more.
          name: '—',
          email: email.trim().toLowerCase(),
          message: 'Submitted via homepage hero quick-capture. Follow up to qualify intent.',
          source: 'hero-quick-capture',
          recaptchaToken,
          website: honeypot,
          ...attribution,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not submit');
      }
      setSubmitted(true);
      trackEvent('hero_capture_submitted', {
        // Don't echo the email itself — keeps PII out of GA4. Just signal that
        // the submission happened so funnels can count it.
        attribution_source: attribution.utm_source ?? 'direct',
      });
    } catch (err) {
      setError((err as Error).message);
      trackEvent('hero_capture_failed', { reason: (err as Error).message?.slice(0, 80) });
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-gold/40 bg-white/10 backdrop-blur-sm px-5 py-4 text-left">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-gold" />
          <div>
            <p className="font-semibold text-white">You&apos;re on the list.</p>
            <p className="text-body-sm text-white/80 mt-0.5">
              A CRECO broker will reach out within one business day with current Texas commercial real estate matched to your interest.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md"
      aria-label="Get matched with Texas commercial real estate"
    >
      <Honeypot />
      <p className="mb-2 text-caption uppercase tracking-widest text-gold">Get matched with active properties</p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email address"
          className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-body-sm text-white placeholder:text-white/50 focus:outline-none focus:border-gold focus:bg-white/15 focus:ring-2 focus:ring-gold/40 transition-colors"
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3 text-body-sm font-semibold text-primary hover:bg-gold-light disabled:opacity-60 whitespace-nowrap"
        >
          {submitting ? 'Sending…' : <>Get matched <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-2 text-caption text-amber-300"
        >
          {error}
        </p>
      )}
      <p className="mt-2 text-caption text-white/60">
        Free, no obligation. Broker will follow up within one business day.
      </p>
    </form>
  );
}
