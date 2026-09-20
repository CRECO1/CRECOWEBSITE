import type { Listing } from '@/lib/supabase';
import { getListings } from '@/lib/supabase';
import { ListingsClient } from './ListingsClient';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqSection } from '@/components/marketing/FaqSection';
import { ValuationCta } from '@/components/marketing/ValuationCta';
import { withSyntheticListings } from '@/lib/featured-properties';
import { filterListings } from '@/lib/public-listings';
import { BUSINESS, breadcrumbList, listingItemList, listingSummary, webPage } from '@/lib/schema';

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
 *
 * Structured data: CollectionPage + ItemList of every available listing (full
 * RealEstateListing nodes) + BreadcrumbList, and a live-inventory FAQ whose
 * answers are generated from the same data — so an AI agent asking "what
 * space does CRECO have right now?" gets current, citable facts.
 */
export const revalidate = 1800; // 30 minutes

function joinSummaries(ls: Listing[]): string {
  return ls.map(l => `${l.title} (${listingSummary(l)})`).join('; ');
}

export default async function ListingsPage() {
  let listings: Listing[] = [];
  try {
    listings = await getListings('active');
  } catch {
    // Leave empty — ISR retries at the next revalidation, and ListingsClient
    // still merges in the synthetic featured listings + refreshes client-side.
  }

  const available = withSyntheticListings(listings).filter(l => l.status === 'active' || l.status === 'pending');
  const lease = filterListings(available, { transaction: 'lease' });
  const sale = filterListings(available, { transaction: 'sale' });
  const fairOaks = filterListings(available, { city: 'Fair Oaks Ranch' });
  const sa = filterListings(available, { metro: 'San Antonio' });
  const none = `Contact CRECO at ${BUSINESS.phoneDisplay} for off-market and upcoming options.`;

  const faqs = [
    {
      q: 'What commercial properties does CRECO currently have available?',
      a: available.length > 0
        ? `CRECO currently markets ${available.length} Texas commercial properties: ${joinSummaries(available)}.`
        : `New inventory is being added. ${none}`,
    },
    {
      q: 'What commercial space is available for lease in San Antonio and Fair Oaks Ranch?',
      a: sa.length > 0
        ? `In the San Antonio metro (including Fair Oaks Ranch, Boerne, Lytle, and the Hill Country) CRECO lists: ${joinSummaries(sa)}.${fairOaks.length ? ` In Fair Oaks Ranch specifically: ${fairOaks.map(l => l.title).join(' and ')}.` : ''}`
        : `No San Antonio-area listings are public right now. ${none}`,
    },
    {
      q: 'What commercial property is for lease vs. for sale?',
      a: `For lease: ${lease.length ? lease.map(l => l.title).join(', ') : 'none currently public'}. For sale: ${sale.length ? sale.map(l => l.title).join(', ') : 'none currently public'}. ${none}`,
    },
    {
      q: 'Does CRECO only show its own listings?',
      a: `No. This page lists properties CRECO represents or owns, but as a licensed Texas brokerage (${BUSINESS.trecLicenseDisplay}) CRECO's tenant- and buyer-representation clients get access to the entire market — including LoopNet/CoStar/Crexi inventory and off-market space. Tenant representation is typically paid by the landlord.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={[
          webPage(
            'CollectionPage',
            '/listings',
            'Texas Commercial Real Estate Listings — CRECO',
            'Retail, office, industrial, flex, and land for lease and sale across Texas, represented by CRECO.',
            { mainEntity: { '@id': 'https://www.crecotx.com/listings#listings' } },
          ),
          listingItemList(available, '/listings', 'Available CRECO commercial listings', 'Currently available Texas commercial properties represented or owned by CRECO.'),
          breadcrumbList([{ name: 'Listings', path: '/listings' }]),
        ]}
      />
      <ListingsClient initialListings={listings}>
        <FaqSection faqs={faqs} path="/listings" heading="Available commercial space — quick answers" />
        <ValuationCta surface="listings" />
      </ListingsClient>
    </>
  );
}
