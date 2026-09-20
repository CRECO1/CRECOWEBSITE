'use client';

/**
 * Footer newsletter signup. Single email input + button, inline success state.
 * POSTs to /api/subscribe with subscription_type='newsletter'.
 *
 * Layout is its own — it has to sit in a dark footer column — but the submit
 * path is the shared one, so honeypot, reCAPTCHA and error handling behave the
 * same here as in every other capture.
 */

import { useState } from 'react';
import { ArrowRight, CheckCircle, Mail } from 'lucide-react';
import { Honeypot } from './Honeypot';
import { useCaptureSubmit } from '@/lib/use-capture-submit';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const { submitting, submitted, error, submit } = useCaptureSubmit({
    endpoint: '/api/subscribe',
    recaptchaAction: 'subscribe_newsletter',
    buildPayload: ({ recaptchaToken, website }) => ({
      email,
      subscription_type: 'newsletter',
      source: 'footer',
      recaptchaToken,
      website,
    }),
    onSuccess: () => setEmail(''),
  });

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-body-sm text-gold">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span>Subscribed — check your inbox.</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <Honeypot />
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold/60" aria-hidden="true" />
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            disabled={submitting}
            className="w-full rounded-lg border border-white/15 bg-white/5 pl-9 pr-3 py-2.5 text-body-sm text-white placeholder:text-white/40 focus:outline-none focus:border-gold focus:bg-white/10 disabled:opacity-60"
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-body-sm font-semibold text-primary transition-colors hover:bg-gold-light disabled:opacity-60 whitespace-nowrap"
        >
          {submitting ? 'Subscribing…' : <>Subscribe <ArrowRight className="h-4 w-4" /></>}
        </button>
      </div>
      {error && <p className="text-caption text-destructive">{error}</p>}
      <p className="text-caption text-white/70">
        Texas commercial market analysis, ~once a month. Unsubscribe anytime.
      </p>
    </form>
  );
}
