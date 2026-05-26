'use client';

/**
 * Google Maps view of the active listings inventory.
 *
 * Renders a marker per listing (filtered to those with lat/lng), colored by
 * property type, with an InfoWindow on click that previews the listing and
 * links to the detail page. Map auto-fits to the bounds of the visible
 * listings on first paint and when the filtered set changes.
 *
 * The map only loads when the user actually switches into map view — the
 * /listings page lazy-imports this component to keep the @vis.gl bundle
 * out of the grid-view critical path.
 *
 * Required env: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (restricted to crecotx.com
 * domains in Google Cloud Console).
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import { Building2, MapPin, ArrowRight } from 'lucide-react';
import type { Listing } from '@/lib/supabase';
import { formatPrice, formatLeaseRate, formatSqft, transactionLabel, propertyTypeLabel } from '@/lib/utils';

// Per-property-type pin styling. Background fills the pin body, border darkens
// the outline, glyph hex is the inner letter color. Picked to be high-contrast
// against the Google Maps base layer.
const TYPE_STYLE: Record<string, { bg: string; border: string; glyph: string; glyphColor: string }> = {
  warehouse: { bg: '#1E40AF', border: '#0F2A6B', glyph: 'W', glyphColor: '#FFFFFF' },
  industrial: { bg: '#1E40AF', border: '#0F2A6B', glyph: 'I', glyphColor: '#FFFFFF' },
  office:    { bg: '#0F1B33', border: '#050B1A', glyph: 'O', glyphColor: '#F4C04E' },
  retail:    { bg: '#C9A14A', border: '#8C6F26', glyph: 'R', glyphColor: '#0F1B33' },
  flex:      { bg: '#7C3AED', border: '#4C1D95', glyph: 'F', glyphColor: '#FFFFFF' },
  land:      { bg: '#16A34A', border: '#14532D', glyph: 'L', glyphColor: '#FFFFFF' },
  'mixed-use': { bg: '#DB2777', border: '#831843', glyph: 'M', glyphColor: '#FFFFFF' },
};
const DEFAULT_STYLE = { bg: '#475569', border: '#1E293B', glyph: '•', glyphColor: '#FFFFFF' };

// Texas-center fallback when a listing set has no geocoded entries — keeps the
// map from snapping to the middle of the Pacific.
const TEXAS_CENTER = { lat: 31.0, lng: -99.0 };

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
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
  const initialCenter = useMemo(() => {
    if (placed.length === 0) return TEXAS_CENTER;
    const lat = placed.reduce((s, l) => s + Number(l.latitude), 0) / placed.length;
    const lng = placed.reduce((s, l) => s + Number(l.longitude), 0) / placed.length;
    return { lat, lng };
  }, [placed]);

  if (!apiKey) {
    return (
      <div className="flex flex-col items-center justify-center bg-background-warm rounded-xl border border-border p-12 text-center" style={{ height }}>
        <Building2 className="h-10 w-10 text-foreground-subtle mb-3" />
        <h3 className="font-heading text-heading-sm font-semibold text-primary mb-1">Map unavailable</h3>
        <p className="text-body-sm text-foreground-muted max-w-md">
          Google Maps API key isn&apos;t configured. Set <code className="bg-background-cream px-1.5 py-0.5 rounded text-caption">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to enable the map view.
        </p>
      </div>
    );
  }

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

  return (
    <div className="relative rounded-xl overflow-hidden border border-border shadow-card" style={{ height }}>
      <APIProvider apiKey={apiKey}>
        <Map
          mapId="creco-listings-map"
          defaultCenter={initialCenter}
          defaultZoom={placed.length === 1 ? 14 : 9}
          gestureHandling="greedy"
          disableDefaultUI={false}
          fullscreenControl
          streetViewControl
          mapTypeControl
          clickableIcons={false}
          className="w-full h-full"
        >
          <BoundsFitter listings={placed} />
          {placed.map(l => {
            const style = TYPE_STYLE[l.property_type] ?? DEFAULT_STYLE;
            return (
              <AdvancedMarker
                key={l.id}
                position={{ lat: Number(l.latitude), lng: Number(l.longitude) }}
                onClick={() => setSelectedId(l.id)}
                title={l.title}
              >
                <Pin
                  background={style.bg}
                  borderColor={style.border}
                  glyph={style.glyph}
                  glyphColor={style.glyphColor}
                  scale={1.05}
                />
              </AdvancedMarker>
            );
          })}

          {selectedId && (() => {
            const sel = placed.find(l => l.id === selectedId);
            if (!sel) return null;
            return (
              <InfoWindow
                position={{ lat: Number(sel.latitude), lng: Number(sel.longitude) }}
                onCloseClick={() => setSelectedId(null)}
                pixelOffset={[0, -36]}
              >
                <ListingInfoCard listing={sel} />
              </InfoWindow>
            );
          })()}
        </Map>
      </APIProvider>

      <Legend />
    </div>
  );
}

/**
 * On listings-set change, fit the map's bounds to enclose every marker plus a
 * small viewport padding. Single-property case skips this — the defaultZoom
 * (14) already frames a single pin well.
 */
function BoundsFitter({ listings }: { listings: Listing[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || listings.length <= 1) return;
    const bounds = new google.maps.LatLngBounds();
    listings.forEach(l => {
      bounds.extend({ lat: Number(l.latitude), lng: Number(l.longitude) });
    });
    map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
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
    <div className="max-w-[240px]">
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
 * Floating legend pinned to the bottom-left of the map. Static — the four
 * most-common property types account for ~95% of CRE inventory and we don't
 * want the legend to balloon.
 */
function Legend() {
  const items: { label: string; type: keyof typeof TYPE_STYLE }[] = [
    { label: 'Industrial', type: 'warehouse' },
    { label: 'Office', type: 'office' },
    { label: 'Retail', type: 'retail' },
    { label: 'Flex', type: 'flex' },
    { label: 'Land', type: 'land' },
  ];
  return (
    <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur rounded-lg shadow-md border border-border px-3 py-2 z-10">
      <p className="text-caption uppercase tracking-widest font-semibold text-foreground-muted mb-1.5">Property type</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {items.map(i => {
          const s = TYPE_STYLE[i.type];
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
