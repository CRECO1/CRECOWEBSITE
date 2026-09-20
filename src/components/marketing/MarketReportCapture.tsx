'use client';

/**
 * MarketReportCapture — passive, inline lead-magnet card.
 *
 * A calm in-content email capture for visitors who are not ready to inquire
 * about a specific property but will trade an email for a quarterly market
 * read. Sits at the bottom of property landing pages, on /insights, and as a
 * side anchor on /listings.
 *
 * Note it posts to /api/leads, NOT /api/subscribe: a market-report request is
 * treated as a lead the broker can work, and that has been true since it
 * launched. The endpoint stays where it is.
 *
 * Single field by design — no name, no phone. The card, submit path and
 * success panel come from EmailCaptureCard, shared with the inline property
 * alerts capture; the two were the same component written twice.
 */

import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { EmailCaptureCard } from '@/components/forms/EmailCaptureCard';
import { readUtmsFromCookie } from '@/lib/analytics';

interface MarketReportCaptureProps {
  /**
   * Tonal variant. `light` works on cream/white sections, `dark` works on the
   * near-black bands.
   */
  variant?: 'light' | 'dark';
  /** Where this card was mounted — surface attribution for GA. */
  surface?: string;
}

export function MarketReportCapture({
  variant = 'light',
  surface = 'unknown',
}: MarketReportCaptureProps) {
  const [email, setEmail] = useState('');

  return (
    <EmailCaptureCard
      icon={TrendingUp}
      tone={variant}
      cardClassName={variant === 'dark'
        ? 'bg-primary text-white border border-white/10'
        : 'bg-background-cream border border-border'}
      errorClassName="text-red-400"
      heading="Quarterly Texas commercial market report"
      body="Cap rates, vacancy, and active deal flow across San Antonio, Austin, Houston, and DFW. Free. No call."
      submitLabel="Send me the report"
      success={{
        heading: "You're on the list.",
        body: 'The next quarterly report goes out within two weeks. Watch your inbox.',
      }}
      email={email}
      onEmailChange={setEmail}
      submit={{
        endpoint: '/api/leads',
        recaptchaAction: 'subscribe_market_report',
        errorFallback: 'Something went wrong. Try again or email info@crecotx.com.',
        track: {
          success: 'market_report_subscribed',
          failure: 'market_report_failed',
          props: { surface },
        },
        buildPayload: ({ recaptchaToken }) => ({
          name: email.split('@')[0]?.slice(0, 40) || 'Market Report Subscriber',
          email,
          source: 'market-report',
          message: `Subscribed to the quarterly Texas commercial market report from ${surface}.`,
          recaptchaToken,
          ...readUtmsFromCookie(),
        }),
      }}
    />
  );
}
