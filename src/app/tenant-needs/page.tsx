import { permanentRedirect } from 'next/navigation';

/**
 * Legacy URL — preserved as a permanent redirect to the new multi-path
 * /get-started flow. Existing inbound links (search results, external
 * mentions, old social posts) keep working.
 */
export default function LegacyTenantNeedsRedirect(): never {
  permanentRedirect('/get-started');
}
