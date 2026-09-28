'use client';

/**
 * Shared pieces for the Leaflet maps on the public site (listing detail
 * mini-map + the /listings map view).
 *
 * Why Leaflet + open tiles instead of Google Maps: the CRECO Google Cloud
 * project has no billing account, so every Maps JS load rendered a greyed
 * "for development purposes only" canvas or 503'd on tiles. These layers
 * need no API key and no billing:
 *   - Street: OpenStreetMap standard tiles (ODbL; attribution required,
 *     light website use permitted by the OSMF tile-usage policy).
 *   - Aerial: USGS National Map imagery + topo labels (public domain).
 * Both are plain <img> tile requests, so the existing `img-src https:` CSP
 * directive covers them — no script-src / connect-src exceptions needed.
 */

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type Basemap = 'street' | 'aerial';

export const BASEMAPS: Record<Basemap, { url: string; attribution: string; maxNativeZoom: number }> = {
  street: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxNativeZoom: 19,
  },
  aerial: {
    url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; <a href="https://www.usgs.gov/programs/national-geospatial-program/national-map" target="_blank" rel="noopener noreferrer">USGS The National Map</a>',
    maxNativeZoom: 16,
  },
};

// Per-property-type pin styling. Background fills the pin body, border darkens
// the outline, glyph is the inner letter. Picked to read against both the OSM
// street layer and aerial imagery.
export const PROPERTY_PIN: Record<string, { bg: string; border: string; glyph: string; glyphColor: string }> = {
  warehouse:   { bg: '#1E40AF', border: '#0F2A6B', glyph: 'W', glyphColor: '#FFFFFF' },
  industrial:  { bg: '#1E40AF', border: '#0F2A6B', glyph: 'I', glyphColor: '#FFFFFF' },
  office:      { bg: '#0F1B33', border: '#050B1A', glyph: 'O', glyphColor: '#F4C04E' },
  'medical office': { bg: '#0F1B33', border: '#050B1A', glyph: 'M', glyphColor: '#F4C04E' },
  retail:      { bg: '#C9A14A', border: '#8C6F26', glyph: 'R', glyphColor: '#0F1B33' },
  flex:        { bg: '#7C3AED', border: '#4C1D95', glyph: 'F', glyphColor: '#FFFFFF' },
  land:        { bg: '#16A34A', border: '#14532D', glyph: 'L', glyphColor: '#FFFFFF' },
  'mixed-use': { bg: '#DB2777', border: '#831843', glyph: 'M', glyphColor: '#FFFFFF' },
  multifamily: { bg: '#EA580C', border: '#9A3412', glyph: 'A', glyphColor: '#FFFFFF' },
};
export const DEFAULT_PIN = { bg: '#475569', border: '#1E293B', glyph: '•', glyphColor: '#FFFFFF' };

/**
 * A teardrop marker drawn as inline SVG so no image assets are needed (the
 * default Leaflet marker PNGs break under bundlers). Anchored at the tip.
 */
export function pinIcon(propertyType: string, scale = 1): L.DivIcon {
  const s = PROPERTY_PIN[propertyType] ?? DEFAULT_PIN;
  const w = Math.round(30 * scale);
  const h = Math.round(40 * scale);
  const html = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 30 40" aria-hidden="true" style="display:block;filter:drop-shadow(0 2px 2px rgba(0,0,0,.35))">
      <path d="M15 1C7.3 1 1 7.2 1 14.9c0 9.9 12.2 22.5 13.2 23.6a1.1 1.1 0 0 0 1.6 0C16.8 37.4 29 24.8 29 14.9 29 7.2 22.7 1 15 1z" fill="${s.bg}" stroke="${s.border}" stroke-width="1.5"/>
      <text x="15" y="19.5" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="13" font-weight="700" fill="${s.glyphColor}">${s.glyph}</text>
    </svg>`;
  return L.divIcon({
    html,
    className: 'creco-pin',
    iconSize: [w, h],
    iconAnchor: [w / 2, h],
    popupAnchor: [0, -h + 4],
  });
}

/** Street / Aerial switch, positioned over the map's top-right corner. */
export function BasemapToggle({ value, onChange }: { value: Basemap; onChange: (b: Basemap) => void }) {
  const opts: { key: Basemap; label: string }[] = [
    { key: 'street', label: 'Map' },
    { key: 'aerial', label: 'Aerial' },
  ];
  return (
    <div
      className="absolute top-3 right-3 z-[500] inline-flex rounded-lg border border-border bg-white/95 shadow-md backdrop-blur overflow-hidden"
      role="group"
      aria-label="Map style"
    >
      {opts.map(o => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          aria-pressed={value === o.key}
          className={
            'px-3 py-1.5 text-caption font-semibold uppercase tracking-wide transition-colors ' +
            (value === o.key ? 'bg-primary text-white' : 'text-primary hover:bg-background-cream')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
