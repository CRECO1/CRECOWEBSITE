'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { getRecaptchaToken } from '@/components/forms/Recaptcha';
import { Honeypot } from '@/components/forms/Honeypot';
import { InquirySuccessCard } from '@/components/forms/InquirySuccessCard';
import { trackEvent, readUtmsFromCookie } from '@/lib/analytics';
import type { Broker } from '@/lib/broker';

/**
 * `broker` — the specific broker handling inquiries for this listing.
 * Passed through to InquirySuccessCard so the post-submit "Zach will
 * follow up" copy shows the correct name/avatar when the listing is
 * assigned to a broker other than PRIMARY_BROKER (e.g. Louis Pasteur
 * → Brian Blanco). Optional so existing callers keep working.
 */
export function ListingContactForm({
  listingTitle,
  broker,
}: {
  listingTitle: string;
  broker?: Broker;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const recaptchaToken = await getRecaptchaToken('submit_listing_inquiry');
      const attribution = readUtmsFromCookie();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          company: data.get('company'),
          email: data.get('email'),
          phone: data.get('phone'),
          message: data.get('message') || `I'm interested in ${listingTitle}`,
          property_interest: listingTitle,
          source: 'listing',
          recaptchaToken,
          website: data.get('website'),  // honeypot
          ...attribution,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not submit. Please try again or call us directly.');
      }

      form.reset();
      setSubmitted(true);
      trackEvent('listing_inquiry_submitted', {
        listing_title: listingTitle,
        attribution_source: attribution.utm_source ?? 'direct',
      });
    } catch (err) {
      setError((err as Error).message);
      trackEvent('listing_inquiry_failed', { reason: (err as Error).message?.slice(0, 80) });
    } finally {
      setSubmitting(false);
    }
  }

  // Success state — uses the shared InquirySuccessCard so the
  // post-submit moment matches every other inquiry surface on the
  // site. showBrowseProperties is false here because the visitor was
  // already browsing properties when they submitted; routing them
  // back to the grid undoes the choice they just made.
  if (submitted) {
    return (
      <InquirySuccessCard
        broker={broker}
        propertyName={listingTitle}
        customMessage={`${broker?.name ?? 'A CRECO principal'} will follow up about ${listingTitle} with current availability, full property details, and a proposed tour time.`}
        onReset={() => setSubmitted(false)}
        showBrowseProperties={false}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Honeypot />
      <input
        name="name"
        required
        placeholder="Your Name"
        className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
      />
      <input
        name="company"
        placeholder="Company (optional)"
        className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email Address"
        className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone (optional)"
        className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
      />
      <textarea
        name="message"
        rows={3}
        placeholder={`I'd like more info on ${listingTitle}`}
        className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold resize-none"
      />
      {error && (
        <p className="text-caption text-destructive">{error}</p>
      )}
      <Button type="submit" size="lg" fullWidth loading={submitting}>
        {submitting ? 'Sending…' : 'Request Info'}
      </Button>
    </form>
  );
}
