import { redirect } from 'next/navigation';

/**
 * Legacy URL — preserved as a permanent redirect to the new multi-path
 * /get-started flow. Existing inbound links (search results, external
 * mentions, old social posts) keep working.
 */
export default function LegacyTenantNeedsRedirect() {
  redirect('/get-started');
}
