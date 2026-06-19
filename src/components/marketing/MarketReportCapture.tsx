'use client';

/**
 * MarketReportCapture — passive, inline lead-magnet card.
 *
 * Replaces the killed exit-intent popup with a calmer, in-content
 * email-capture for visitors who aren't ready to inquire about a
 * specific property but might exchange an email for a quarterly market
 * read. Dropped in the bottom of property landing pages, on /insights,
 * and on /listings as a side-anchor.
 *
 * Design choices:
 *   - Single field (email). No name, no phone. Lower friction = higher
 *     conversion on a passive capture.
 *   - Inline success state replaces the form so the user gets immediate
 *     feedback without modal/toast machinery.
 *   - POSTs to /api/leads with source='market-report'. The leads API
 *     requires `name` so we send the email prefix as a placeholder —
 *     the broker workflow treats this differently from a high-intent
 *     inquiry (the source field tells them so).
 *   - Honeypot kept; reCAPTCHA dropped intentionally — even if a few
 *     bot submits sneak through, an email-only payload is low-damage
 *     and the friction-free experience is worth it for a passive magnet.
 *   - Fires GA4 `market_report_subscribed` on success so the dashboard
 *     can track this as a conversion event.
 */

import { useState } from 'react';
import { ArrowRight, CheckCircle, TrendingUp } from 'lucide-react';
import { Honeypot } from '@/components/forms/Honeypot';
import { trackEvent, readUtmsFromCookie } from '@/lib/analytics';

interface MarketReportCaptureProps {
  /**
   * Tonal variant. `light` works on cream/white sections, `dark` works
   * on the primary navy background.
   */
  variant?: 'light' | 'dark';
  /** Where this card was mounted — surface attribution for GA. */
  surface?: string;
}

export function MarketReportCapture({
  variant = 'light',
  surface = 'unknown',
}: MarketReportCaptureProps = {}) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cardClasses = variant === 'dark'
    ? 'bg-primary text-white border border-white/10'
    : 'bg-background-cream border border-border';
  const headingClasses = variant === 'dark' ? 'text-white' : 'text-primary';
  const bodyClasses = variant === 'dark' ? 'text-white/70' : 'text-foreground-muted';
  const inputClasses = variant === 'dark'
    ? 'bg-white/10 text-white placeholder:text-white/40 border-white/20 focus:border-gold'
    : 'bg-white text-primary placeholder:text-foreground-muted border-border focus:border-gold';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email.');
      return;
    }
    setSubmitting(true);

    // Honeypot — if filled, silently no-op (looks successful to the bot).
    const honeypotEl = (e.currentTarget as HTMLFormElement).elements.namedItem('website');
    const honeypot = honeypotEl instanceof HTMLInputElement ? honeypotEl.value : '';
    if (honeypot) {
      setSuccess(true);
      setSubmitting(false);
      return;
    }

    try {
      // Name field is required by /api/leads — use the email prefix as a
      // placeholder so the broker can still recognize who subscribed.
      const namePlaceholder = email.split('@')[0]?.slice(0, 40) || 'Market Report Subscriber';
      const utms = readUtmsFromCookie();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: namePlaceholder,
          email,
          source: 'market-report',
          message: `Subscribed to the quarterly Texas commercial market report from ${surface}.`,
          ...utms,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      trackEvent('market_report_subscribed', { surface });
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Try again or email info@crecotx.com.');
      trackEvent('market_report_failed', { surface, reason: (err as Error).message?.slice(0, 80) });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={`rounded-2xl p-6 sm:p-8 ${cardClasses}`}>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-6 w-6 text-gold shrink-0 mt-0.5" />
          <div>
            <h3 className={`font-heading text-heading-sm font-bold mb-1 ${headingClasses}`}>
              You&apos;re on the list.
            </h3>
            <p className={`text-body-sm leading-relaxed ${bodyClasses}`}>
              The next quarterly report goes out within two weeks. Watch your inbox.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 sm:p-8 ${cardClasses}`}>
      <div className="flex items-start gap-3 mb-4">
        <TrendingUp className="h-6 w-6 text-gold shrink-0 mt-1" />
        <div>
          <h3 className={`font-heading text-heading-sm font-bold mb-1 ${headingClasses}`}>
            Quarterly Texas commercial market report
          </h3>
          <p className={`text-body-sm leading-relaxed ${bodyClasses}`}>
            Cap rates, vacancy, and active deal flow across San Antonio, Austin,
            Houston, and DFW. Free. No call.
          </p>
        </div>
      </div>

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
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-body-sm font-bold text-primary hover:bg-gold-light shadow-sm transition-colors disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send me the report'}
          {!submitting && <ArrowRight className="h-4 w-4 shrink-0" />}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-caption text-red-400">{error}</p>
      )}
      <p className={`mt-3 text-caption ${bodyClasses}`}>
        We never sell your info. Unsubscribe anytime.
      </p>
    </div>
  );
}
