'use client';

/**
 * Single-field brochure-request capture on listing detail pages. Sits
 * above the existing "Schedule a tour / Send a message" tabs as the
 * lowest-commitment lead path: visitor drops their email and we send
 * them the marketing brochure PDF (if `brochureUrl` is set on the
 * listing) or a "we'll send shortly" confirmation.
 *
 * Why it converts:
 *   - Lower commitment than "schedule a tour" — visitor isn't asking
 *     for anyone's time, just an asset
 *   - One field = no friction
 *   - Specific to this listing, so the source attribution is rich
 *
 * Posts to /api/leads with source='brochure-request' + property_interest
 * carrying the listing slug/title. Submit pipeline is in the shared
 * useEmailCapture hook — this file owns only the UI shape (intro
 * copy, input + button layout, success-state design).
 */

import { useState } from 'react';
import { ArrowRight, CheckCircle2, FileDown } from 'lucide-react';
import { Honeypot } from './Honeypot';
import { trackEvent } from '@/lib/analytics';
import { useEmailCapture } from '@/hooks/useEmailCapture';

interface Props {
  listingSlug: string;
  listingTitle: string;
  brochureUrl?: string | null;
}

export function BrochureRequestForm({ listingSlug, listingTitle, brochureUrl }: Props) {
  const [email, setEmail] = useState('');

  const { submit, submitting, submitted, error } = useEmailCapture({
    endpoint: '/api/leads',
    recaptchaAction: 'brochure_request',
    successEvent: 'brochure_requested',
    failureEvent: 'brochure_request_failed',
    successEventParams: { listing_slug: listingSlug, has_brochure: !!brochureUrl },
    buildPayload: (cleanEmail) => ({
      name: 'Brochure request',
      email: cleanEmail,
      message: `Requested the marketing brochure for ${listingTitle}. ${brochureUrl ? 'An uploaded brochure PDF is on file.' : 'The auto-generated one-pager was served — consider following up with a full offering memo.'}`,
      property_interest: `${listingTitle} (${listingSlug})`,
      source: 'brochure-request',
    }),
  });

  // Always resolvable: the uploaded brochure PDF when one exists, otherwise the
  // on-demand generated one-pager at /api/brochure/[slug] (works for every
  // listing). This is what makes the "instant brochure" promise real — before,
  // the form claimed an emailed brochure that was never actually sent.
  const brochureHref = brochureUrl || `/api/brochure/${listingSlug}`;

  if (submitted) {
    return (
      <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-green-700" />
          <div className="text-body-sm">
            <p className="font-semibold text-primary">Your brochure is ready.</p>
            <p className="text-foreground-muted mt-0.5">
              <a
                href={brochureHref}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download the property brochure PDF (opens in a new tab)"
                className="text-gold-dark font-semibold hover:underline"
                onClick={() => trackEvent('brochure_downloaded_direct', { listing_slug: listingSlug })}
              >
                Download the brochure (PDF) →
              </a>
              <br />
              A CRECO broker will also follow up with current pricing and availability.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => submit(e, email)} className="rounded-xl border border-border bg-background-cream/50 p-4">
      <Honeypot />
      <div className="flex items-center gap-2 mb-2">
        <FileDown className="h-4 w-4 text-gold" />
        <p className="text-body-sm font-semibold text-primary">Get the brochure</p>
      </div>
      <p className="text-caption text-foreground-muted mb-3">
        Full property details — specs, pricing, and highlights — as an instant PDF download. No call required.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          aria-required="true"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
          aria-label="Email address"
          className="flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary placeholder:text-foreground-muted focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 whitespace-nowrap"
        >
          {submitting ? 'Sending…' : <>Send <ArrowRight className="h-3.5 w-3.5" /></>}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="mt-2 text-caption text-destructive"
        >
          {error}
        </p>
      )}
    </form>
  );
}
