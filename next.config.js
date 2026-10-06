import { withPayload } from '@payloadcms/next/withPayload';

/**
 * Content-Security-Policy
 *
 * Restricts what the browser is allowed to load and execute. Trying to be
 * sane-strict but not break GA / Clarity / Tailwind / Vercel toolbar.
 *
 *   - 'unsafe-inline' is permitted for scripts because Next.js + Tailwind
 *     emit inline scripts and we don't currently use a nonce strategy.
 *     Removing it would require refactoring; for a marketing site this
 *     posture is the standard tradeoff.
 *   - 'unsafe-eval' explicitly NOT allowed — modern Next/React doesn't
 *     need it. If a library breaks, that's a signal to investigate, not
 *     loosen the policy.
 *   - frame-ancestors 'self' is the modern replacement for X-Frame-Options.
 *   - Allow-lists for analytics domains are scoped narrowly.
 */
const cspDirectives = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",          // required for Tailwind + Next runtime
    'https://www.googletagmanager.com',  // Google Analytics
    'https://*.clarity.ms',              // Microsoft Clarity
    'https://www.google.com',            // reCAPTCHA (when enabled)
    'https://www.gstatic.com',           // reCAPTCHA assets
    'https://va.vercel-scripts.com',     // Vercel Analytics
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'",          // Tailwind/Next inject inline styles
    'https://fonts.googleapis.com',
  ],
  'img-src': [
    "'self'",
    'data:',                    // small inline data URIs (icons, etc.)
    'blob:',                    // for client-side cropped images before upload
    'https:',                   // permissive — listing photos, hero images, and the OSM/USGS map tiles (Leaflet) all load as plain <img>
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:',
  ],
  'connect-src': [
    "'self'",
    'https://www.fairoaksrealtygroup.com', // live pageview beacon → CRM ingest
    'https://*.supabase.co',             // Supabase API + Storage
    'https://*.supabase.in',
    'https://www.google-analytics.com',  // GA collect endpoint
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.clarity.ms',              // Clarity collect
    'https://www.google.com',            // reCAPTCHA's api2/clr beacon — script-src
                                         // and frame-src already allow this host;
                                         // without it every form page logs a CSP error
    'https://www.googletagmanager.com',
    'https://api.resend.com',            // outbound from server-side, harmless to allow
    'https://va.vercel-scripts.com',
  ],
  'frame-src': [
    "'self'",
    'https://www.google.com',            // reCAPTCHA challenge iframe (if interactive falls back)
  ],
  'object-src': ["'none'"],
  'worker-src': ["'self'", 'blob:'],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
  'upgrade-insecure-requests': [],
};

// `next dev` compiles the client with eval-based source maps, so the policy
// above blanks every page locally (hydration never runs). Allow eval in dev
// only; the production header is unchanged.
if (process.env.NODE_ENV !== 'production') {
  cspDirectives['script-src'].push("'unsafe-eval'");
}

const cspHeader = Object.entries(cspDirectives)
  .map(([dir, vals]) => (vals.length > 0 ? `${dir} ${vals.join(' ')}` : dir))
  .join('; ');

// Security headers for production
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // 0, deliberately. The legacy XSS auditor this enables was removed from
    // Chrome and Edge, and while it existed `1; mode=block` could itself be
    // turned into an information-disclosure primitive. The modern answer is
    // the CSP above; explicitly disabling the auditor is what OWASP and the
    // browser vendors now recommend over leaving it on.
    key: 'X-XSS-Protection',
    value: '0',
  },
  {
    // Severs window.opener between this origin and cross-origin pages, so a
    // page we link to (or that links to us) can't reach back into this
    // browsing context. allow-popups keeps OAuth-style popups working if we
    // ever add one; reCAPTCHA and Maps use iframes, which are unaffected.
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin-allow-popups',
  },
  {
    // No Flash/Acrobat cross-domain policy files here; say so explicitly.
    key: 'X-Permitted-Cross-Domain-Policies',
    value: 'none',
  },
  {
    // strict-origin-when-cross-origin sends only the origin (no path/query)
    // to cross-origin destinations and nothing on downgrade. Tighter than
    // origin-when-cross-origin which would leak the full referring origin
    // even when the destination is HTTP. Matches the W3C-recommended default.
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Disable every browser API we don't use. Each entry is a defense-in-depth
    // win — a future XSS or supply-chain compromise can't call these APIs
    // even if it gets script execution. List grows over time; review when
    // adding any new browser-feature integration.
    //   camera, microphone, geolocation — not used (CRE marketing/billing)
    //   payment, usb, magnetometer, gyroscope, accelerometer — not used
    //   ambient-light-sensor, autoplay — not used
    //   interest-cohort — opt out of FLoC / Topics API (privacy hygiene)
    //   midi, encrypted-media, picture-in-picture — not used
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'camera=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'interest-cohort=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=()',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()',
    ].join(', '),
  },
  {
    key: 'Content-Security-Policy',
    value: cspHeader,
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't fail the production build on ESLint errors. The .eslintrc.json
  // added on this branch surfaces ~100 pre-existing lint issues (mostly
  // react/no-unescaped-entities in marketing/form copy, plus an incomplete
  // @typescript-eslint plugin setup). Those are cleanup items, not runtime
  // bugs, and shouldn't block shipping. This matches `main`, which has no
  // build-time lint gate. Linting still runs in-editor and via `npm run lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    // AVIF first (≈20-30% smaller than WebP on these photo-heavy pages), WebP
    // fallback. Listing/hero photos are immutable once uploaded, so cache the
    // optimized variants for 30 days to cut repeat optimization + egress.
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        // Supabase Storage — agent photos, listing images, etc.
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
  },
  // Don't advertise the framework. x-powered-by told every scanner exactly
  // what stack and to go looking for its CVEs; it buys us nothing.
  poweredByHeader: false,
  // Next 15.2+ streams generateMetadata output (title, canonical, OG) into
  // <body> on dynamic pages for any UA not on its built-in "HTML-limited bot"
  // list, so crawlers outside that list (Googlebot among them) can read a
  // <head> with no title/canonical. Matching every UA keeps metadata blocking
  // and in <head> for all visitors.
  htmlLimitedBots: /.*/,
  reactStrictMode: true, // Enable for better security and debugging
  experimental: {
    reactCompiler: false,
  },
  serverExternalPackages: ['sharp', 'graphql'],

  // Canonicalize the apex domain to www. crecotx.com currently serves a 200
  // (duplicate-content split) while every canonical tag points to www — this
  // 308-redirects apex → www so the ranking signal consolidates onto one host.
  // The `has` host match is anchored to the bare apex, so www.crecotx.com does
  // NOT match and there's no redirect loop.
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'crecotx.com' }],
        destination: 'https://www.crecotx.com/:path*',
        permanent: true,
      },
      // The Elkhorn Point landing page moved from 8979 → 8923 Dietz Elkhorn
      // (2026-09-22) once the correct street number was confirmed. The old
      // slug is indexed and printed on collateral, so it 308s to the new one
      // rather than 404ing and dropping the accumulated ranking signal.
      {
        source: '/8979-dietz-elkhorn',
        destination: '/8923-dietz-elkhorn',
        permanent: true,
      },
      // Statewide quarterly market reports pulled 2026-10 — their figures
      // contradicted the site's own San Antonio numbers. Every report URL and
      // the /research section consolidate onto the San Antonio & Hill Country
      // brief rather than 404ing.
      ...[
        'q2-2026-texas-industrial-market-report',
        'q2-2026-texas-retail-market-report',
        'q2-2026-texas-office-market-report',
        'q2-2026-texas-investment-outlook-report',
        'q3-2026-texas-industrial-market-report',
        'q3-2026-texas-retail-market-report',
        'q3-2026-texas-office-market-report',
        'q3-2026-texas-investment-outlook-report',
      ].map(slug => ({ source: `/guides/${slug}`, destination: '/market-brief', permanent: true })),
      { source: '/research', destination: '/market-brief', permanent: true },
      { source: '/research/:path*', destination: '/market-brief', permanent: true },
      // Sustainability consulting was retired as a service line (2026-10).
      { source: '/services/sustainability', destination: '/services', permanent: true },
    ];
  },

  // Add security headers to all routes
  async headers() {
    const NOINDEX = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      // Private surfaces: never indexed, even when a URL is linked from elsewhere
      // (robots.txt only stops crawling, not indexing of a linked URL).
      { source: '/admin', headers: NOINDEX },
      { source: '/admin/:path*', headers: NOINDEX },
      { source: '/manage', headers: NOINDEX },
      { source: '/manage/:path*', headers: NOINDEX },
      { source: '/billing', headers: NOINDEX },
      { source: '/billing/:path*', headers: NOINDEX },
      { source: '/client/:path*', headers: NOINDEX },
      { source: '/api/:path*', headers: NOINDEX },
      { source: '/onboard/:path*', headers: NOINDEX },
      { source: '/signup', headers: NOINDEX },
      { source: '/compare', headers: NOINDEX },
    ];
  },

  // Proxy the CRM campaign unsubscribe endpoint to the Fair Oaks app, which
  // owns the unsubscribe-token logic and the CRM database. CRECO-branded
  // campaign emails link to crecotx.com/api/campaigns/unsubscribe; this rewrite
  // forwards those requests (query string included) to the handler at
  // fairoaksrealtygroup.com so CRECO unsubscribes work without duplicating the
  // token logic here. The confirmation page renders the correct brand based on
  // the client's business_unit.
  async rewrites() {
    return [
      {
        source: '/api/campaigns/unsubscribe',
        destination: 'https://www.fairoaksrealtygroup.com/api/campaigns/unsubscribe',
      },
    ];
  },
};

export default withPayload(nextConfig);
