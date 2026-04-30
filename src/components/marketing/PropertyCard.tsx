/**
 * Shared property listing card. Used on:
 *  - Homepage featured listings
 *  - /listings index
 *  - /listings/[slug] "more available properties" cross-sell
 *  - /submarkets/[slug] available properties
 *  - PropertyLandingPage (Texas keyword landing pages)
 *
 * Standardizing the card here means visual updates only happen in one place.
 */

import Link from 'next/link';
import Image from 'next/image';
import { Building2, MapPin } from 'lucide-react';
import {
  formatPrice, formatSqft, formatLeaseRate, transactionLabel, propertyTypeLabel,
} from '@/lib/utils';

interface PropertyCardProps {
  listing: any;
  /**
   * If true, the property type badge appears as a second pill alongside the
   * transaction type. Useful on listings/landing pages where context matters.
   * Default false (just transaction type) for cleaner cards on home/sub.
   */
  showPropertyTypeBadge?: boolean;
}

export function PropertyCard({ listing, showPropertyTypeBadge = false }: PropertyCardProps) {
  const priceDisplay = listing.transaction_type === 'sale' && listing.sale_price
    ? formatPrice(listing.sale_price)
    : listing.lease_rate
      ? formatLeaseRate(listing.lease_rate, listing.lease_rate_basis)
      : 'Contact for pricing';

  const heroImage = Array.isArray(listing.images) && listing.images[0] ? listing.images[0] : null;

  return (
    <Link href={`/listings/${listing.slug}`} className="card-luxury group block h-full">
      <div className="image-luxury aspect-property bg-background-warm relative">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={`${listing.title} – ${propertyTypeLabel(listing.property_type)} in ${listing.city ?? 'Texas'}, TX`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-foreground-subtle">
            <Building2 className="h-12 w-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {listing.transaction_type && (
            <span className="rounded-full bg-gold px-3 py-1 text-caption font-semibold text-primary uppercase">
              {transactionLabel(listing.transaction_type)}
            </span>
          )}
          {showPropertyTypeBadge && listing.property_type && (
            <span className="rounded-full bg-white/95 px-3 py-1 text-caption font-semibold text-primary">
              {propertyTypeLabel(listing.property_type)}
            </span>
          )}
        </div>
      </div>

      <div className="p-6">
        <p className="mb-1 text-caption uppercase tracking-wider text-foreground-muted">
          <MapPin className="mr-1 inline h-3 w-3" />
          {listing.city ?? 'San Antonio'}, TX
          {listing.submarket ? ` · ${listing.submarket}` : ''}
        </p>
        <h3 className="mb-2 font-heading text-heading-sm font-semibold text-primary group-hover:text-gold transition-colors line-clamp-1">
          {listing.title}
        </h3>
        {listing.headline && (
          <p className="mb-3 text-body-sm text-foreground-muted line-clamp-2">{listing.headline}</p>
        )}
        <p className="mb-3 price-tag text-xl">{priceDisplay}</p>
        <div className="flex items-center gap-3 text-caption text-foreground-muted border-t border-border pt-3">
          <span>{propertyTypeLabel(listing.property_type)}</span>
          <span aria-hidden="true">·</span>
          <span>{formatSqft(listing.sqft)}</span>
          {listing.zoning && (
            <>
              <span aria-hidden="true">·</span>
              <span>Zoning {listing.zoning}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
