'use client';

/**
 * Mount-once attribution capture. Reads utm_* + referrer on every visit
 * and persists them to a first-party cookie via the analytics lib. No
 * UI — invisible side-effect component. Mounted from the root layout so
 * it fires on every page load (including direct landings on submarket
 * pages, listing details, etc., not just the homepage).
 *
 * Re-runs on every navigation via the pathname dep, so a visitor who
 * lands on /listings with no utm_*, then visits / with ?utm_source=google,
 * gets the google attribution captured on the second view.
 */

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { captureUtmsToCookie } from '@/lib/analytics';

export function UtmCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureUtmsToCookie();
    // Including searchParams in deps catches ?utm_* added via in-app
    // navigation. pathname covers the common case of landing on a new
    // page via deep link.
  }, [pathname, searchParams]);

  return null;
}
