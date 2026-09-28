'use client';

/**
 * Client-only loader for the listing detail mini-map. The detail page is a
 * server component and Leaflet needs `window`, so the real map lives in
 * ListingDetailMapInner and is pulled in with ssr:false. The placeholder
 * keeps the page from shifting while the map chunk loads.
 */

import dynamic from 'next/dynamic';
import type { ListingDetailMapProps } from './ListingDetailMapInner';

const Inner = dynamic(() => import('./ListingDetailMapInner'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center rounded-xl border border-border bg-background-cream"
      style={{ height: '320px' }}
      aria-busy="true"
    >
      <p className="text-body-sm text-foreground-muted">Loading map…</p>
    </div>
  ),
});

export function ListingDetailMap(props: ListingDetailMapProps) {
  return <Inner {...props} />;
}
