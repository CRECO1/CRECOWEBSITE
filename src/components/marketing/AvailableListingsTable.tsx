import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { JsonLd } from '@/components/seo/JsonLd';
import type { Listing } from '@/lib/supabase';
import { listingHref } from '@/lib/featured-properties';
import { assetCategory, listingItemList, listingPriceText } from '@/lib/schema';
import { transactionLabel } from '@/lib/utils';
import { NoListingsCTA } from '@/components/listings/NoListingsCTA';

/**
 * Server-rendered "available now" table + ItemList JSON-LD for market and
 * asset-class pages. A plain table (address · type · size · price) is the
 * format LLMs extract most reliably, and it keeps the page honest: it only
 * ever shows live CRECO inventory, never placeholder cards.
 */
export function AvailableListingsTable({
  listings,
  path,
  title,
  intro,
  emptyText,
  emptyHeading,
  asset,
  emptySurface,
  className = 'section-luxury bg-white',
}: {
  listings: Listing[];
  path: string;
  title: string;
  intro?: string;
  emptyText: string;
  /** Heading above `emptyText` when there's nothing to table. */
  emptyHeading?: string;
  /**
   * The page's asset value ('office', 'retail', 'industrial'), so the empty
   * state can name that category instead of "commercial space".
   */
  asset?: string;
  /** Placement id for the empty state's contact taps. Falls back to `path`. */
  emptySurface?: string;
  className?: string;
}) {
  return (
    <section className={className} aria-labelledby="available-heading">
      {listings.length > 0 && <JsonLd data={listingItemList(listings, path, title, intro)} />}
      <Container>
        <div className="mx-auto max-w-5xl">
          <p className="overline mb-3 text-gold">Available Now</p>
          <h2 id="available-heading" className="mb-3 font-heading text-heading-xl font-bold text-primary">{title}</h2>
          {intro && <p className="mb-6 text-body text-foreground-muted">{intro}</p>}
          {listings.length === 0 ? (
            /* Was a single grey paragraph. Cold organic traffic lands on these
               pages precisely because they name a city and an asset type, so a
               page with no live inventory was sending the best-qualified
               visitor we get away with nothing to tap. The statement of the gap
               is unchanged — it's now the body of a block that also explains
               off-market space and offers call, text, email and the needs
               form. */
            <NoListingsCTA
              heading={emptyHeading ?? 'Let’s find the right space for you'}
              body={emptyText}
              propertyType={asset}
              surface={emptySurface ?? `available-table-empty${path}`}
              action={{ href: '/listings', label: 'Browse all CRECO listings' }}
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] text-left text-body-sm">
                <thead className="bg-background-cream text-caption uppercase tracking-wider text-foreground-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3">Property</th>
                    <th scope="col" className="px-4 py-3">Type</th>
                    <th scope="col" className="px-4 py-3">Size</th>
                    <th scope="col" className="px-4 py-3">Price / rate</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(l => {
                    const href = listingHref(l);
                    const external = /^https?:\/\//.test(href);
                    return (
                      <tr key={l.slug} className="border-t border-border">
                        <td className="px-4 py-3">
                          <Link href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="font-semibold text-primary hover:text-gold">
                            {l.title}
                          </Link>
                          <div className="text-caption text-foreground-muted">{[l.address, l.city].filter(Boolean).join(', ')}, {l.state || 'TX'} {l.zip}</div>
                        </td>
                        <td className="px-4 py-3 text-foreground-muted">{assetCategory(l.property_type)} · {transactionLabel(l.transaction_type)}</td>
                        <td className="px-4 py-3 text-foreground-muted">{l.sqft && l.sqft > 0 ? `${l.sqft.toLocaleString()} SF` : 'Varies'}</td>
                        <td className="px-4 py-3 text-foreground-muted">{listingPriceText(l)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
