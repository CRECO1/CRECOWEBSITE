'use client';

/**
 * PropertyAlertsInline — the one-field alerts capture for high-intent spots.
 *
 * Where the /property-alerts page asks for filters, this asks only for an
 * email: it sits beside listings and on property pages, where the visitor is
 * already looking at the thing they want alerts about. It keeps its own
 * `property-alerts-inline` source and its own GA events so this surface stays
 * separable from the full page in reporting.
 *
 * The card, the submit path and the success panel are shared with the market
 * report capture via EmailCaptureCard — the two were the same component built
 * twice. Only the words, the payload and the ground it sits on differ.
 */

import { useState } from 'react';
import { BellRing } from 'lucide-react';
import { EmailCaptureCard } from '@/components/forms/EmailCaptureCard';
import { AssetTypePills } from '@/components/forms/AssetTypePills';
import { readUtmsFromCookie } from '@/lib/analytics';

interface PropertyAlertsInlineProps {
  variant?: 'light' | 'dark';
  surface?: string;
}

export function PropertyAlertsInline({
  variant = 'light',
  surface = 'unknown',
}: PropertyAlertsInlineProps) {
  const [email, setEmail] = useState('');
  // Empty means "all types" — the default, and a real answer rather than a
  // blank. Nothing here is required; the card still submits on one tap.
  const [assetTypes, setAssetTypes] = useState<string[]>([]);

  return (
    <EmailCaptureCard
      icon={BellRing}
      tone={variant}
      cardClassName={variant === 'dark'
        ? 'bg-white/5 text-white border border-white/10'
        : 'bg-white border border-border'}
      heading="Get new Texas listings as they post"
      body="One email when something matches your area. Refine the filters later by replying."
      submitLabel="Subscribe"
      success={{
        heading: "You'll get the next new listing.",
        body: "We'll email you when a new property goes live. Reply to narrow it by submarket, size, or type.",
      }}
      email={email}
      onEmailChange={setEmail}
      extra={<AssetTypePills selected={assetTypes} onChange={setAssetTypes} tone={variant} />}
      submit={{
        endpoint: '/api/subscribe',
        recaptchaAction: 'subscribe_property_alerts',
        errorFallback: 'Something went wrong. Try again.',
        track: {
          success: 'property_alerts_inline_subscribed',
          failure: 'property_alerts_inline_failed',
          props: { surface, asset_types: assetTypes.join(',') || 'all' },
        },
        buildPayload: ({ recaptchaToken }) => ({
          // The subscribers table wants a name; derive one from the address
          // rather than asking for it, which is the whole point of this card.
          name: email.split('@')[0]?.slice(0, 40) || 'Alerts Subscriber',
          email,
          subscription_type: 'property-alerts',
          source: 'property-alerts-inline',
          // Same shape the full /property-alerts form stores, so one
          // subscriber record means the same thing wherever it came from.
          filters: { property_types: assetTypes },
          // Which placement of the card this was — it already went to GA as a
          // tracking prop; the notification email needs it too, because
          // "property-alerts-inline" alone cannot distinguish the listings
          // index from a property landing page.
          surface,
          recaptchaToken,
          ...readUtmsFromCookie(),
        }),
      }}
    />
  );
}
