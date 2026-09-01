'use client';

/**
 * Google Analytics loader — gated to the PRODUCTION hostnames only.
 *
 * Previously the GA tag loaded on any host where NEXT_PUBLIC_GA_ID was inlined,
 * which includes Vercel deploy + preview URLs (creco-*.vercel.app) and
 * localhost. That leaked preview / staging / dev visits into the production GA4
 * property and tripped GA's "additional domains detected" tag-quality
 * diagnostic. Restricting the load to crecotx.com / www.crecotx.com keeps that
 * traffic out of GA entirely, at the source.
 *
 * The check runs client-side because the hostname is only known in the browser.
 * These scripts already use strategy="afterInteractive" (deferred until after
 * hydration), so deciding in an effect doesn't change real-world load timing;
 * on non-production hosts the component simply renders nothing and gtag never
 * loads, so trackEvent() no-ops there.
 */

import Script from 'next/script';
import { useEffect, useState } from 'react';

const PROD_HOSTS = new Set(['crecotx.com', 'www.crecotx.com']);

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(PROD_HOSTS.has(window.location.hostname));
  }, []);

  if (!gaId || !enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  );
}
