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
      name: '—',
      email: cleanEmail,
      message: `Requested the marketing brochure for ${listingTitle}. ${brochureUrl ? 'Brochure URL is on file.' : 'No PDF on file yet — send the offering memo manually.'}`,
      property_interest: `${listingTitle} (${listingSlug})`,
      source: 'brochure-request',
    }),
  });

  if (submitted) {
    return (
      <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-green-700" />
          <div className="text-body-sm">
            <p className="font-semibold text-primary">Brochure on its way.</p>
            {brochureUrl ? (
              <p className="text-foreground-muted mt-0.5">
                Check your inbox in a few minutes. You can also{' '}
                <a
                  href={brochureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Download brochure PDF (opens in a new tab)"
                  className="text-gold-dark font-semibold hover:underline"
                  onClick={() => trackEvent('brochure_downloaded_direct', { listing_slug: listingSlug })}
                >
                  download it now →
                </a>
              </p>
            ) : (
              <p className="text-foreground-muted mt-0.5">
                A CRECO broker will send the offering memo shortly with current pricing and availability.
              </p>
            )}
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
        Full property details — specs, photos, pricing — emailed instantly. No call required.
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
