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
 *
 * It ALSO skips GA for detectable bots. GA4's Sept-2026 city report was topped
 * by Singapore and Ashburn, VA (datacenter hubs, ~21% of "users") — JS-executing
 * scrapers/headless agents that fire GA and inflate every metric. GA4's own data
 * filters can only target internal traffic (by IP) or debug mode, not a city or
 * datacenter, so the effective place to filter these is at the source: don't
 * load gtag when the client looks automated. The check is deliberately
 * conservative (webdriver flag + unambiguous bot user-agents) so no real visitor
 * is dropped — and human clicks from AI assistants (chatgpt.com/ai-assistant)
 * come from normal browsers, so they're unaffected. Sophisticated bots that
 * fully mimic a browser still get through; for those, read reports net of the
 * datacenter cities.
 */

import Script from 'next/script';
import { useEffect, useState } from 'react';

const PROD_HOSTS = new Set(['crecotx.com', 'www.crecotx.com']);

/** Unambiguous automation / bot signals. Real browsers match none of these. */
function isLikelyBot(): boolean {
  try {
    // navigator.webdriver is true under Selenium/Puppeteer/Playwright/headless
    // automation and false/undefined in real user browsers.
    if (navigator.webdriver) return true;
    const ua = navigator.userAgent || '';
    return /bot|crawl|spider|headless|scrape|lighthouse|pagespeed|gtmetrix|pingdom|phantom|puppeteer|playwright|selenium|prerender|slurp|monitoring/i.test(ua);
  } catch {
    return false;
  }
}

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(PROD_HOSTS.has(window.location.hostname) && !isLikelyBot());
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
