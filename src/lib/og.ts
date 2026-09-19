// The site's share card (1200×630), served as a static file. It replaced the
// edge-rendered /opengraph-image route, which responded 200 with an empty body —
// so every crecotx.com link shared without a preview image.
//
// Next.js drops the layout's openGraph.images for any page that sets its own
// openGraph object, so page-level openGraph blocks include this explicitly.
export const DEFAULT_OG_IMAGE = {
  url: '/images/og-default.png',
  width: 1200,
  height: 630,
  alt: 'CRECO - Commercial Real Estate Company',
};
