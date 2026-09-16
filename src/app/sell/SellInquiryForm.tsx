'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getRecaptchaToken } from '@/components/forms/Recaptcha';
import { Honeypot } from '@/components/forms/Honeypot';

/**
 * Owner-inquiry form island for /sell.
 *
 * Extracted from sell/page.tsx so that page can be a Server Component (server-
 * rendered copy for SEO + it can host the async <TrustStrip/> and
 * <Testimonials/> server components). This file owns the only interactive bits
 * — submit state + the POST to /api/leads with source='owner-inquiry'. Behavior
 * is unchanged from the previous inline version.
 */
export function SellInquiryForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const recaptchaToken = await getRecaptchaToken('submit_sell');
    const { trackEvent, readUtmsFromCookie } = await import('@/lib/analytics');
    const attribution = readUtmsFromCookie();
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name'),
        company: data.get('company'),
        email: data.get('email'),
        phone: data.get('phone'),
        message: `Property Address: ${data.get('address')}\nProperty Type: ${data.get('property_type')}\nGoal: ${data.get('goal')}\nTimeline: ${data.get('timeline')}\nNotes: ${data.get('notes')}`,
        source: 'owner-inquiry',
        recaptchaToken,
        website: data.get('website'),  // honeypot
        ...attribution,
      }),
    }).catch(() => {});
    trackEvent('owner_inquiry_submitted', {
      property_type: String(data.get('property_type') ?? ''),
      goal: String(data.get('goal') ?? ''),
      timeline: String(data.get('timeline') ?? ''),
      attribution_source: attribution.utm_source ?? 'direct',
    });
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div id="valuation" className="rounded-2xl bg-background-cream p-8 lg:p-10">
      {submitted ? (
        <div className="text-center py-8">
          <CheckCircle className="mx-auto mb-4 h-14 w-14 text-gold" />
          <h3 className="font-heading text-heading-xl font-bold text-primary mb-2">Request Received</h3>
          <p className="text-body text-foreground-muted">
            A CRECO broker will reach out within one business day to discuss your property and next steps.
          </p>
        </div>
      ) : (
        <>
          <h3 className="mb-2 font-heading text-heading-xl font-bold text-primary">Request a Property Opinion</h3>
          <p className="mb-6 text-body-sm text-foreground-muted">
            Tell us about your property and we&apos;ll provide a no-obligation Broker Opinion of Value or leasing strategy.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Honeypot />
            <div className="grid grid-cols-2 gap-4">
              <input name="name" required placeholder="Your Name" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
              <input name="company" placeholder="Company / Entity" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input name="phone" type="tel" required placeholder="Phone Number" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
              <input name="email" type="email" required placeholder="Email Address" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
            </div>
            <input name="address" required placeholder="Property Address" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
            <div className="grid grid-cols-2 gap-4">
              <select name="property_type" required className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="">Property type…</option>
                <option>Office</option>
                <option>Warehouse / Industrial</option>
                <option>Flex</option>
                <option>Retail</option>
                <option>Land</option>
                <option>Multifamily</option>
                <option>Mixed-Use</option>
                <option>Other</option>
              </select>
              <select name="goal" required className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold">
                <option value="">My goal…</option>
                <option>Sell</option>
                <option>Lease</option>
                <option>Either</option>
                <option>Just want a valuation</option>
              </select>
            </div>
            <select name="timeline" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold">
              <option value="">Timeline…</option>
              <option>ASAP (within 30 days)</option>
              <option>1–3 months</option>
              <option>3–6 months</option>
              <option>6–12 months</option>
              <option>Just exploring</option>
            </select>
            <textarea name="notes" rows={3} placeholder="Anything else we should know? (occupancy, rent roll, deferred maintenance, etc.)" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold resize-none" />
            <Button type="submit" size="lg" fullWidth loading={loading}>
              Request a Property Opinion
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
