'use client';

/**
 * Per-listing mini-map: a single zoomed-in marker showing where the property
 * sits, with a Map / Aerial toggle and a "Get directions" link that opens
 * Google Maps (a plain URL — no API involved). Loaded client-only through
 * ListingDetailMap.tsx because Leaflet touches `window` at import time.
 */

import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { ExternalLink } from 'lucide-react';
import { googleMapsUrl } from '@/lib/utils';
import { BASEMAPS, BasemapToggle, pinIcon, type Basemap } from './map-base';

export interface ListingDetailMapProps {
  latitude: number;
  longitude: number;
  address: string;
  title: string;
  propertyType: string;
  height?: string;
}

export default function ListingDetailMapInner({
  latitude, longitude, address, title, propertyType, height = '320px',
}: ListingDetailMapProps) {
  const [basemap, setBasemap] = useState<Basemap>('street');
  const pos = useMemo<[number, number]>(() => [Number(latitude), Number(longitude)], [latitude, longitude]);
  const icon = useMemo(() => pinIcon(propertyType, 1.1), [propertyType]);
  const layer = BASEMAPS[basemap];

  return (
    <div>
      <div className="relative isolate rounded-xl overflow-hidden border border-border shadow-card" style={{ height }}>
        <MapContainer
          center={pos}
          zoom={15}
          minZoom={8}
          maxZoom={19}
          scrollWheelZoom={false}
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
          <Marker position={pos} icon={icon} title={title} alt={title} />
        </MapContainer>
        <BasemapToggle value={basemap} onChange={setBasemap} />
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
