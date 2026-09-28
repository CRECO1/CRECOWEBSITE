'use client';

/**
 * Microsoft Clarity loader — gated like GA, plus authenticated-route exclusion.
 *
 * Clarity is SESSION REPLAY: it records the actual rendered screen. The inline
 * loader this replaces had NO gate at all, so it recorded on every route —
 * including the authenticated `/billing`, `/admin` and `/manage` portal, where
 * the replay captures invoices, account data and financial figures. That is a
 * real privacy/compliance exposure, not just noisy data. It also loaded on
 * Vercel preview/localhost and for bots, unlike GA.
 *
 * This component:
 *   1. Loads Clarity only on the production hostnames, for non-bots, and NOT on
 *      the authenticated portal (mirrors GoogleAnalytics' host/bot gate).
 *   2. On navigating INTO an excluded route, tells an already-running Clarity to
 *      `stop()` — because a visitor who lands on marketing (Clarity running) and
 *      then clicks into `/billing` would otherwise keep being recorded through
 *      the portal.
 *   3. Uses the hardened bootstrap (`typeof c[a] === 'function'` instead of the
 *      stock `||`, plus a single-inject guard) so a non-callable `window.clarity`
 *      left behind by Clarity's own script can't make its tag loader throw
 *      "window.clarity is not a function".
 */

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const PROD_HOSTS = new Set(['crecotx.com', 'www.crecotx.com']);
// Authenticated portal — never record session replay or fire analytics here.
const EXCLUDED_PREFIXES = ['/admin', '/billing', '/manage'];

/** Unambiguous automation / bot signals — mirrors GoogleAnalytics.isLikelyBot. */
function isLikelyBot(): boolean {
  try {
    if (navigator.webdriver) return true;
    const ua = navigator.userAgent || '';
    return /bot|crawl|spider|headless|scrape|lighthouse|pagespeed|gtmetrix|pingdom|phantom|puppeteer|playwright|selenium|prerender|slurp|monitoring/i.test(ua);
  } catch {
    return false;
  }
}

export function ClarityAnalytics({ clarityId }: { clarityId: string }) {
  const pathname = usePathname();
  const excludedPath = !pathname || EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));
  const [prodHuman, setProdHuman] = useState(false);

  useEffect(() => {
    setProdHuman(PROD_HOSTS.has(window.location.hostname) && !isLikelyBot());
  }, []);

  // Halt an already-running recording the moment the user enters the portal.
  useEffect(() => {
    if (!excludedPath) return;
    try {
      (window as unknown as { clarity?: (cmd: string) => void }).clarity?.('stop');
    } catch {
      /* never let analytics teardown break the app */
    }
  }, [excludedPath]);

  if (!clarityId || !prodHuman || excludedPath) return null;

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=typeof c[a]==="function"?c[a]:function(){(c[a].q=c[a].q||[]).push(arguments)};if(c.__clarityLoaderInjected)return;c.__clarityLoaderInjected=1;t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`}
    </Script>
  );
}
