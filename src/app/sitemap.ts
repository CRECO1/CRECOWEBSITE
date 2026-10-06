import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { SYNTHETIC_LISTINGS } from '@/lib/featured-properties';
import { IN_MARKET_SUBMARKETS } from '@/lib/submarkets-content';
import { PUBLISHED_GUIDES } from '@/lib/guides';
import { POSTS } from '@/lib/insights';

const BASE_URL = 'https://www.crecotx.com';

/**
 * lastmod for pages whose content lives in this repo rather than in a table.
 *
 * These used to pass `new Date()`, which — with revalidate below — meant the
 * sitemap re-stamped roughly 88 of its ~100 URLs with the current time every
 * half hour. That tells a crawler the entire site changed minutes ago, every
 * time it looks, which is both false and self-defeating: a lastmod that is
 * always now carries no information, and Google is documented as ignoring the
 * signal outright once it stops being trustworthy.
 *
 * Bump this when the copy on the code-backed pages actually changes. Anything
 * with a genuine date of its own — listings, submarkets, insight posts —
 * uses that instead.
 */
const CONTENT_REVISED = new Date('2026-10-06T00:00:00.000Z');

// Rebuilt every 30 minutes (same cadence as /listings). Without this the sitemap was
// frozen at deploy time, so a listing added between deploys was invisible to crawlers
// until the next release.
export const revalidate = 1800;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                                  lastModified: CONTENT_REVISED, changeFrequency: 'daily',   priority: 1.0  },
    { url: `${BASE_URL}/listings`,                    lastModified: CONTENT_REVISED, changeFrequency: 'daily',   priority: 0.95 },
    // Highest-impression organic page on the site (valuation tool + FAQ) — was
    // missing from the sitemap; add it explicitly so Google prioritizes crawling.
    { url: `${BASE_URL}/property-valuation`,          lastModified: CONTENT_REVISED, changeFrequency: 'weekly',  priority: 0.92 },
    // High-priority keyword landing pages
    { url: `${BASE_URL}/texas-retail-space-for-lease`,        lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/texas-industrial-property-for-lease`, lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/texas-office-space-for-lease`,        lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/texas-commercial-property-for-sale`,  lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.95 },
    // City hub pages — San Antonio first since it's CRECO's HQ city and
    // the flagship geographic landing page on the site. The Austin / Houston /
    // DFW hubs and their city × asset pages are noindex (outside the San
    // Antonio & Hill Country focus) and deliberately absent from this file.
    { url: `${BASE_URL}/san-antonio-commercial-real-estate`,  lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.95 },
    // Hill Country gateway submarkets — Fair Oaks Ranch + Boerne
    { url: `${BASE_URL}/fair-oaks-ranch-commercial-real-estate`, lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/boerne-commercial-real-estate`,        lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.9  },
    // City × asset-class long-tail landing pages — pilot batch. Each
    // captures intent like "office space for lease san antonio" that
    // marketplaces (LoopNet / Crexi) don't optimize for. Expand to the
    // full 15-page set as the Q3 2026 data refresh lands.
    { url: `${BASE_URL}/san-antonio-office-space`,             lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.92 },
    { url: `${BASE_URL}/san-antonio-industrial-space`,         lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.92 },
    { url: `${BASE_URL}/san-antonio-retail-space`,             lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.92 },
    // CRECO development — 8000 Fair Oaks Pkwy
    { url: `${BASE_URL}/8000-fair-oaks-pkwy`,                  lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.95 },
    // CRECO development — 8923 Dietz Elkhorn (Fair Oaks Ranch retail, pre-leasing)
    { url: `${BASE_URL}/8923-dietz-elkhorn`,                   lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.95 },
    // CRECO property — 15033 Main St (Lytle retail leasing). Owner-operator
    // multi-tenant strip on the I-35 corridor in the SA southwest metro.
    { url: `${BASE_URL}/15033-main-st-lytle`,                  lastModified: CONTENT_REVISED, changeFrequency: 'weekly', priority: 0.9  },
    // "Not tenant-only" answer pages — landlord/owner and seller/investor representation
    { url: `${BASE_URL}/landlord-representation`,        lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.9  },
    { url: `${BASE_URL}/seller-investor-representation`, lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.9  },
    { url: `${BASE_URL}/owner-services`,              lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.9  },
    { url: `${BASE_URL}/list-your-space`,             lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/development-opportunities`,   lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.85 },
    // Standard pages
    { url: `${BASE_URL}/services`,                    lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.9  },
    { url: `${BASE_URL}/sell`,                        lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.9  },
    { url: `${BASE_URL}/get-started`,                 lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.95 },
    { url: `${BASE_URL}/contact`,                     lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/submarkets`,                  lastModified: CONTENT_REVISED, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE_URL}/markets`,                     lastModified: CONTENT_REVISED, changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/sold`,                        lastModified: CONTENT_REVISED, changeFrequency: 'weekly',  priority: 0.75 },
    // /team intentionally NOT in the sitemap — the route is a 308
    // redirect to /about#team since the team grid was folded into the
    // About page. Search engines follow the redirect and consolidate
    // authority on /about; keeping the redirect URL in the sitemap
    // would create a duplicate-content signal we don't want.
    { url: `${BASE_URL}/about`,                       lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/insights`,                    lastModified: CONTENT_REVISED, changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE_URL}/guides`,                      lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.85 },
    // /research and the statewide quarterly reports were pulled (308 → here).
    { url: `${BASE_URL}/market-brief`,                lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/property-alerts`,             lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/careers`,                     lastModified: CONTENT_REVISED, changeFrequency: 'monthly', priority: 0.7  },
    // /compare omitted — the route is noindex,nofollow because it's a
    // session tool (only meaningful with shortlisted listings already
    // saved to localStorage), not a destination for organic search.
    { url: `${BASE_URL}/privacy`,                     lastModified: CONTENT_REVISED, changeFrequency: 'yearly',  priority: 0.3  },
    { url: `${BASE_URL}/terms`,                       lastModified: CONTENT_REVISED, changeFrequency: 'yearly',  priority: 0.3  },
  ];

  // Straight from PUBLISHED_GUIDES — the hand-maintained slug list here could
  // (and did) drift from the guides that actually exist.
  const guidePages: MetadataRoute.Sitemap = PUBLISHED_GUIDES.map(g => ({
    url: `${BASE_URL}/guides/${g.slug}`,
    lastModified: CONTENT_REVISED,
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  // Each post carries its own publishedAt, which is the honest lastmod.
  const insightPages: MetadataRoute.Sitemap = POSTS.map(p => ({
    url: `${BASE_URL}/insights/${p.slug}`,
    lastModified: new Date(p.publishedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const serviceSlugs = ['tenant-representation', 'investment-advisory', 'leasing-sales', 'property-management', 'development'];
  const servicePages: MetadataRoute.Sitemap = serviceSlugs.map(slug => ({
    url: `${BASE_URL}/services/${slug}`,
    lastModified: CONTENT_REVISED,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Dynamic listing pages
  let listingPages: MetadataRoute.Sitemap = [];
  try {
    const { data } = await supabase.from('listings').select('slug, updated_at').in('status', ['active', 'pending']);
    if (data) {
      listingPages = data.map(l => ({
        url: `${BASE_URL}/listings/${l.slug}`,
        lastModified: new Date(l.updated_at),
        changeFrequency: 'daily' as const,
        priority: 0.8,
      }));
    }
  } catch {}

  // Synthetic listings that own a real detail page here (no landing_url) — e.g.
  // the Elkhorn Pointe ±2-acre pad. Not in the DB, so enumerate them explicitly.
  for (const l of SYNTHETIC_LISTINGS) {
    if (!l.landing_url) {
      listingPages.push({
        url: `${BASE_URL}/listings/${l.slug}`,
        lastModified: CONTENT_REVISED,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      });
    }
  }

  // Dynamic submarket pages
  let submarketPages: MetadataRoute.Sitemap = [];
  try {
    const { data } = await supabase.from('submarkets').select('slug, updated_at');
    if (data) {
      submarketPages = data.map(s => ({
        url: `${BASE_URL}/submarkets/${s.slug}`,
        lastModified: new Date(s.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      }));
    }
  } catch {}

  // Static submarket hub pages (file-backed in src/lib/submarkets-content.ts),
  // San Antonio & Hill Country only — the rest are noindex.
  const marketHubPages: MetadataRoute.Sitemap = IN_MARKET_SUBMARKETS.map(s => ({
    url: `${BASE_URL}/markets/${s.slug}`,
    lastModified: CONTENT_REVISED,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  return [...staticPages, ...servicePages, ...insightPages, ...guidePages, ...marketHubPages, ...listingPages, ...submarketPages];
}
