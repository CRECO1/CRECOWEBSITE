'use client';

import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getRecaptchaToken } from '@/components/forms/Recaptcha';
import { Honeypot } from '@/components/forms/Honeypot';
import { trackEvent, readUtmsFromCookie } from '@/lib/analytics';

export function ListingContactForm({ listingTitle }: { listingTitle: string }) {
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

  // Success state — replaces the form with a friendly confirmation
  if (submitted) {
    return (
      <div className="rounded-xl bg-gold/10 border border-gold/30 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gold">
          <CheckCircle className="h-6 w-6 text-primary" />
        </div>
        <h3 className="font-heading text-heading-sm font-semibold text-primary mb-2">
          Thank you!
        </h3>
        <p className="text-body-sm text-foreground-muted">
          A CRECO broker will reach out within one business day with details on <span className="font-semibold text-primary">{listingTitle}</span>.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-4 text-caption text-foreground-muted hover:text-primary underline"
        >
          Send another message
        </button>
      </div>
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
