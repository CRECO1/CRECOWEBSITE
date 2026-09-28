'use client';

/**
 * Map view of the active listings inventory (Leaflet + open tiles — see
 * map-base.tsx for why not Google Maps).
 *
 * Renders a marker per listing (filtered to those with lat/lng), colored by
 * property type, with a popup on click that previews the listing and links
 * to the detail page. The map auto-fits to the bounds of the visible
 * listings on first paint and whenever the filtered set changes.
 *
 * The map only loads when the user actually switches into map view — the
 * /listings page lazy-imports this component (ssr:false) to keep Leaflet out
 * of the grid-view critical path.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Building2, MapPin, ArrowRight } from 'lucide-react';
import type { Listing } from '@/lib/supabase';
import { formatPrice, formatLeaseRate, formatSqft, transactionLabel, propertyTypeLabel } from '@/lib/utils';
import { BASEMAPS, BasemapToggle, PROPERTY_PIN, pinIcon, type Basemap } from './map-base';

// Texas-center fallback when a listing set has no geocoded entries — keeps the
// map from snapping to the middle of the Pacific.
const TEXAS_CENTER: [number, number] = [31.0, -99.0];

interface Props {
  listings: Listing[];
  /** Optional fixed height; default fills available space inside parent. */
  height?: string;
  /** Optional — wired in by /listings so the empty state can clear active filters in one click. */
  onClearFilters?: () => void;
  /** Whether any filters are currently applied — used to gate the "Clear filters" button on the empty state. */
  hasFilters?: boolean;
}

export function ListingsMap({ listings, height = '70vh', onClearFilters, hasFilters }: Props) {
  const [basemap, setBasemap] = useState<Basemap>('street');

  // Only listings that actually have coordinates. The filtering chain on
  // /listings can produce a set with mostly-not-geocoded entries; we render
  // a clear empty state below instead of an empty map.
  const placed = useMemo(
    () => listings.filter(l =>
      l.latitude !== null && l.latitude !== undefined &&
      l.longitude !== null && l.longitude !== undefined
    ),
    [listings]
  );

  // Initial center: centroid of placed listings, or Texas-center fallback.
  const initialCenter = useMemo<[number, number]>(() => {
    if (placed.length === 0) return TEXAS_CENTER;
    const lat = placed.reduce((s, l) => s + Number(l.latitude), 0) / placed.length;
    const lng = placed.reduce((s, l) => s + Number(l.longitude), 0) / placed.length;
    return [lat, lng];
  }, [placed]);

  if (placed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center bg-background-cream rounded-xl border border-border p-12 text-center" style={{ height }}>
        <MapPin className="h-10 w-10 text-foreground-subtle mb-3" />
        <h3 className="font-heading text-heading-sm font-semibold text-primary mb-1">No mapped properties match</h3>
        <p className="text-body-sm text-foreground-muted max-w-md mb-4">
          Properties matching your filters don&apos;t have map coordinates yet, or the filter set is empty.
        </p>
        {hasFilters && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90"
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  const layer = BASEMAPS[basemap];

  return (
    <div className="relative isolate rounded-xl overflow-hidden border border-border shadow-card" style={{ height }}>
      <MapContainer
        center={initialCenter}
        zoom={placed.length === 1 ? 14 : 9}
        minZoom={5}
        maxZoom={19}
        scrollWheelZoom
        className="w-full h-full"
        style={{ background: '#e8e4dc' }}
      >
        <TileLayer
          key={basemap}
          url={layer.url}
          attribution={layer.attribution}
          maxNativeZoom={layer.maxNativeZoom}
          maxZoom={19}
        />
        <BoundsFitter listings={placed} />
        {placed.map(l => (
          <Marker
            key={l.id}
            position={[Number(l.latitude), Number(l.longitude)]}
            icon={pinIcon(l.property_type, 1.05)}
            title={l.title}
            alt={l.title}
          >
            <Popup className="creco-popup" maxWidth={260} minWidth={220} closeButton>
              <ListingInfoCard listing={l} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <BasemapToggle value={basemap} onChange={setBasemap} />
      <Legend />
    </div>
  );
}

/**
 * On listings-set change, fit the map's bounds to enclose every marker plus a
 * small viewport padding. Single-property case skips this — the initial zoom
 * (14) already frames a single pin well.
 */
function BoundsFitter({ listings }: { listings: Listing[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || listings.length <= 1) return;
    const bounds = L.latLngBounds(
      listings.map(l => [Number(l.latitude), Number(l.longitude)] as [number, number])
    );
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
  }, [map, listings]);

  return null;
}

function ListingInfoCard({ listing }: { listing: Listing }) {
  const price =
    listing.transaction_type === 'sale' && listing.sale_price
      ? formatPrice(listing.sale_price)
      : listing.lease_rate
        ? formatLeaseRate(listing.lease_rate, listing.lease_rate_basis)
        : 'Contact for pricing';

  const img = listing.images && (listing.images as string[])[0];

  return (
    <div className="max-w-[240px] font-sans">
      {img ? (
        <div className="relative aspect-[16/10] w-full bg-background-warm rounded-md overflow-hidden mb-2">
          <Image
            src={img}
            alt={listing.title}
            fill
            sizes="240px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[16/10] w-full bg-background-warm rounded-md flex items-center justify-center mb-2">
          <Building2 className="h-6 w-6 text-foreground-subtle" />
        </div>
      )}
      <p className="text-caption text-foreground-muted mb-0.5">
        {listing.city}, TX{listing.submarket ? ` · ${listing.submarket}` : ''}
      </p>
      <p className="font-heading text-body font-semibold text-primary leading-tight line-clamp-2">
        {listing.title}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5 mb-2">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-caption font-semibold text-primary uppercase">
          {propertyTypeLabel(listing.property_type)}
        </span>
        <span className="rounded-full bg-gold/20 px-2 py-0.5 text-caption font-semibold text-gold-dark uppercase">
          {transactionLabel(listing.transaction_type)}
        </span>
      </div>
      <div className="text-body-sm font-bold text-primary mb-1">{price}</div>
      {listing.sqft && (
        <p className="text-caption text-foreground-muted">{formatSqft(listing.sqft)}</p>
      )}
      <Link
        href={`/listings/${listing.slug}`}
        className="mt-2 inline-flex items-center gap-1 text-caption font-semibold text-gold-dark hover:text-gold"
      >
        View details <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/**
 * Floating legend pinned to the bottom-left of the map. Static — the five
 * most-common property types account for ~95% of CRE inventory and we don't
 * want the legend to balloon.
 */
function Legend() {
  const items: { label: string; type: keyof typeof PROPERTY_PIN }[] = [
    { label: 'Industrial', type: 'warehouse' },
    { label: 'Office', type: 'office' },
    { label: 'Retail', type: 'retail' },
    { label: 'Flex', type: 'flex' },
    { label: 'Land', type: 'land' },
  ];
  return (
    <div className="absolute bottom-6 left-3 sm:left-6 bg-white/95 backdrop-blur rounded-lg shadow-md border border-border px-3 py-2 z-[500]">
      <p className="text-caption uppercase tracking-widest font-semibold text-foreground-muted mb-1.5">Property type</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map(i => {
          const s = PROPERTY_PIN[i.type];
          return (
            <div key={i.label} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded-full border"
                style={{ backgroundColor: s.bg, borderColor: s.border }}
              />
              <span className="text-caption text-foreground">{i.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
