import type { Listing } from '@/lib/supabase';
import { getListings } from '@/lib/supabase';
import { ListingsClient } from './ListingsClient';

/**
 * Public listings hub — now SERVER-rendered (ISR) so the full inventory is in
 * the prerendered HTML for search engines. It was previously a client-only
 * fetch wrapped in <Suspense fallback={null}> (because of useSearchParams),
 * which rendered an empty page to crawlers and left /listings buried at ~page 4
 * despite ~1,700 monthly search impressions. Interactivity (filters, map,
 * save-search) lives in ListingsClient, seeded with this server data.
 *
 * revalidate keeps it statically cached but fresh; ListingsClient also refreshes
 * client-side on mount so users never see stale inventory within the window.
 */
export const revalidate = 1800; // 30 minutes

export default async function ListingsPage() {
  let listings: Listing[] = [];
  try {
    listings = await getListings('active');
  } catch {
    // Leave empty — ISR retries at the next revalidation, and ListingsClient
    // still merges in the synthetic featured listings + refreshes client-side.
  }

  return <ListingsClient initialListings={listings} />;
}
