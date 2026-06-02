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
    'https:',                   // permissive — listing photos, hero images, etc. live on supabase + may be referenced from various sources
  ],
  'font-src': [
    "'self'",
    'https://fonts.gstatic.com',
    'data:',
  ],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',             // Supabase API + Storage
    'https://*.supabase.in',
    'https://www.google-analytics.com',  // GA collect endpoint
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.clarity.ms',              // Clarity collect
    'https://www.googletagmanager.com',
    'https://api.resend.com',            // outbound from server-side, harmless to allow
    'https://va.vercel-scripts.com',
  ],
  'frame-src': [
    "'self'",
    'https://www.google.com',            // reCAPTCHA challenge iframe (if interactive falls back)
  ],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
  'upgrade-insecure-requests': [],
};

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
    key: 'X-XSS-Protection',
    value: '1; mode=block',
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
  images: {
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
  reactStrictMode: true, // Enable for better security and debugging
  experimental: {
    reactCompiler: false,
  },
  serverExternalPackages: ['sharp', 'graphql'],

  // Add security headers to all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default withPayload(nextConfig);
