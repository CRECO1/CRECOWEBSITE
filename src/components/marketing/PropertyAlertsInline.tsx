'use client';

/**
 * PropertyAlertsInline — one-field inline signup that drops into
 * /listings (below the grid) and into the bottom of property landing
 * pages. The full multi-field form still lives at /property-alerts;
 * this is the friction-reduced surface for high-intent contexts ("I'm
 * browsing listings, just send me new ones").
 *
 * Why a separate, simpler form?
 *   - The big form at /property-alerts asks for filters (type, size,
 *     market). Those matter for the actual alerts engine, but they
 *     scare off the casual visitor. This one captures email now and
 *     lets the broker workflow apply a sensible default ("all active
 *     Texas listings") until the visitor refines.
 *   - Mirrors MarketReportCapture's frictionless single-field pattern.
 *
 * Honeypot kept. reCAPTCHA dropped (low-damage payload, see
 * MarketReportCapture for the same reasoning). Fires GA4
 * `property_alerts_inline_subscribed` so we can separate this surface
 * from the /property-alerts page form.
 */

import { useState } from 'react';
import { ArrowRight, CheckCircle, BellRing } from 'lucide-react';
import { Honeypot } from '@/components/forms/Honeypot';
import { trackEvent, readUtmsFromCookie } from '@/lib/analytics';

interface PropertyAlertsInlineProps {
  variant?: 'light' | 'dark';
  surface?: string;
}

export function PropertyAlertsInline({
  variant = 'light',
  surface = 'unknown',
}: PropertyAlertsInlineProps = {}) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardClasses = variant === 'dark'
    ? 'bg-primary text-white border border-white/10'
    : 'bg-white border border-border';
  const headingClasses = variant === 'dark' ? 'text-white' : 'text-primary';
  const bodyClasses = variant === 'dark' ? 'text-white/70' : 'text-foreground-muted';
  const inputClasses = variant === 'dark'
    ? 'bg-white/10 text-white placeholder:text-white/40 border-white/20 focus:border-gold'
    : 'bg-background-cream text-primary placeholder:text-foreground-muted border-border focus:border-gold';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }
    setSubmitting(true);

    const honeypotEl = (e.currentTarget as HTMLFormElement).elements.namedItem('website');
    const honeypot = honeypotEl instanceof HTMLInputElement ? honeypotEl.value : '';
    if (honeypot) {
      setSuccess(true);
      setSubmitting(false);
      return;
    }

    try {
      const namePlaceholder = email.split('@')[0]?.slice(0, 40) || 'Alerts Subscriber';
      const utms = readUtmsFromCookie();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: namePlaceholder,
          email,
          source: 'property-alerts-inline',
          message: `Subscribed to property alerts from ${surface} — broker to apply default Texas filter until refined.`,
          ...utms,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      trackEvent('property_alerts_inline_subscribed', { surface });
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Try again.');
      trackEvent('property_alerts_inline_failed', { surface, reason: (err as Error).message?.slice(0, 80) });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={`rounded-2xl p-6 ${cardClasses}`}>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-gold shrink-0 mt-0.5" />
          <div>
            <h3 className={`font-heading text-body-lg font-bold mb-1 ${headingClasses}`}>
              You&apos;ll get the next new listing.
            </h3>
            <p className={`text-body-sm leading-relaxed ${bodyClasses}`}>
              We&apos;ll email you when a new property goes live. Reply to narrow it by submarket, size, or type.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 ${cardClasses}`}>
      <div className="flex items-center gap-2 mb-3">
        <BellRing className="h-5 w-5 text-gold shrink-0" />
        <h3 className={`font-heading text-body-lg font-bold ${headingClasses}`}>
          Get new Texas listings as they post
        </h3>
      </div>
      <p className={`text-body-sm leading-relaxed mb-4 ${bodyClasses}`}>
        One email when something matches your area. Refine the filters later by replying.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <Honeypot />
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className={`flex-1 rounded-lg border px-3 py-2.5 text-body-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gold/30 ${inputClasses}`}
          aria-label="Email address"
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-bold text-white hover:bg-primary/90 shadow-sm transition-colors disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Subscribe'}
          {!submitting && <ArrowRight className="h-4 w-4 shrink-0" />}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-caption text-red-500">{error}</p>
      )}
    </div>
  );
}
