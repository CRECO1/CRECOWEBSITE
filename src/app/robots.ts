import { MetadataRoute } from 'next';

/**
 * robots.txt.
 *
 * /admin, /manage, /api/   — internal surfaces, never index
 * /billing                 — operator-facing billing/admin pages (also auth-gated)
 * /client/                 — token-based client portal URLs. The portal pages
 *                            carry a `<meta robots="noindex,nofollow">` tag too,
 *                            but the robots.txt belt-and-suspenders prevents
 *                            crawlers from ever fetching a token URL in the
 *                            first place (which would also surface tokens in
 *                            referrer logs, GSC, etc.).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/manage', '/api/', '/billing', '/client/'],
      },
    ],
    sitemap: 'https://www.crecotx.com/sitemap.xml',
    host: 'https://www.crecotx.com',
  };
}
