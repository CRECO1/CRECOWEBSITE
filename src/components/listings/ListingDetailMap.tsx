'use client';

/**
 * Per-listing mini-map: a single zoomed-in marker showing where the property
 * sits, with a "Get directions" link that opens Google Maps. Used on the
 * listing detail page — small enough not to dominate, big enough to give
 * shoppers a quick sense of location, freeway access, and neighborhood.
 *
 * If the listing has no geocoded coordinates this component renders nothing
 * so the detail page stays clean instead of showing a broken empty map.
 */

import { useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { ExternalLink } from 'lucide-react';
import { googleMapsUrl } from '@/lib/utils';

interface Props {
  latitude: number;
  longitude: number;
  address: string;
  title: string;
  propertyType: string;
  height?: string;
}

const PROPERTY_PIN: Record<string, { bg: string; border: string; glyph: string; glyphColor: string }> = {
  warehouse: { bg: '#1E40AF', border: '#0F2A6B', glyph: 'W', glyphColor: '#FFFFFF' },
  industrial: { bg: '#1E40AF', border: '#0F2A6B', glyph: 'I', glyphColor: '#FFFFFF' },
  office:    { bg: '#0F1B33', border: '#050B1A', glyph: 'O', glyphColor: '#F4C04E' },
  retail:    { bg: '#C9A14A', border: '#8C6F26', glyph: 'R', glyphColor: '#0F1B33' },
  flex:      { bg: '#7C3AED', border: '#4C1D95', glyph: 'F', glyphColor: '#FFFFFF' },
  land:      { bg: '#16A34A', border: '#14532D', glyph: 'L', glyphColor: '#FFFFFF' },
};
const DEFAULT_PIN = { bg: '#475569', border: '#1E293B', glyph: '•', glyphColor: '#FFFFFF' };

export function ListingDetailMap({
  latitude, longitude, address, title, propertyType, height = '320px',
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const pos = useMemo(() => ({ lat: Number(latitude), lng: Number(longitude) }), [latitude, longitude]);
  const pin = PROPERTY_PIN[propertyType] ?? DEFAULT_PIN;

  if (!apiKey) return null;

  return (
    <div>
      <div className="rounded-xl overflow-hidden border border-border shadow-card" style={{ height }}>
        <APIProvider apiKey={apiKey}>
          <Map
            mapId="creco-listing-detail-map"
            defaultCenter={pos}
            defaultZoom={15}
            gestureHandling="cooperative"
            disableDefaultUI={false}
            fullscreenControl
            streetViewControl
            mapTypeControl={false}
            clickableIcons={false}
            className="w-full h-full"
          >
            <AdvancedMarker position={pos} title={title}>
              <Pin
                background={pin.bg}
                borderColor={pin.border}
                glyph={pin.glyph}
                glyphColor={pin.glyphColor}
                scale={1.1}
              />
            </AdvancedMarker>
          </Map>
        </APIProvider>
      </div>
      <a
        href={googleMapsUrl(address)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-dark hover:text-gold"
      >
        Get directions on Google Maps
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}
