import { permanentRedirect } from 'next/navigation';

/**
 * /what-is-my-commercial-property-worth → /property-valuation
 *
 * The phrase owners actually type into Google, as a URL. It redirects rather
 * than duplicating the page: two URLs serving the same content would compete
 * with each other, and /property-valuation is the canonical one already
 * indexed and linked from the nav.
 */
export default function WhatIsMyCommercialPropertyWorth(): never {
  permanentRedirect('/property-valuation');
}
