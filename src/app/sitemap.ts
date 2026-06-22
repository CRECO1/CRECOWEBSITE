import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';
import { SUBMARKETS } from '@/lib/submarkets-content';

const BASE_URL = 'https://www.crecotx.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                                  lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0  },
    { url: `${BASE_URL}/listings`,                    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.95 },
    // High-priority keyword landing pages
    { url: `${BASE_URL}/texas-retail-space-for-lease`,        lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/texas-industrial-property-for-lease`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/texas-office-space-for-lease`,        lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/texas-commercial-property-for-sale`,  lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    // City hub pages — San Antonio first since it's CRECO's HQ city and
    // the flagship geographic landing page on the site.
    { url: `${BASE_URL}/san-antonio-commercial-real-estate`,  lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/austin-commercial-real-estate`,       lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9  },
    { url: `${BASE_URL}/houston-commercial-real-estate`,      lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9  },
    { url: `${BASE_URL}/dallas-commercial-real-estate`,       lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9  },
    // Hill Country gateway submarkets — Fair Oaks Ranch + Boerne
    { url: `${BASE_URL}/fair-oaks-ranch-commercial-real-estate`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${BASE_URL}/boerne-commercial-real-estate`,        lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9  },
    // City × asset-class long-tail landing pages — pilot batch. Each
    // captures intent like "office space for lease san antonio" that
    // marketplaces (LoopNet / Crexi) don't optimize for. Expand to the
    // full 15-page set as the Q3 2026 data refresh lands.
    { url: `${BASE_URL}/san-antonio-office-space`,             lastModified: new Date(), changeFrequency: 'weekly', priority: 0.92 },
    { url: `${BASE_URL}/houston-industrial-space`,             lastModified: new Date(), changeFrequency: 'weekly', priority: 0.92 },
    { url: `${BASE_URL}/austin-office-space`,                  lastModified: new Date(), changeFrequency: 'weekly', priority: 0.92 },
    // CRECO development — 8000 Fair Oaks Pkwy
    { url: `${BASE_URL}/8000-fair-oaks-pkwy`,                  lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    // CRECO development — 8979 Dietz Elkhorn (Fair Oaks Ranch retail, pre-leasing)
    { url: `${BASE_URL}/8979-dietz-elkhorn`,                   lastModified: new Date(), changeFrequency: 'weekly', priority: 0.95 },
    // CRECO property — 15033 Main St (Lytle retail leasing). Owner-operator
    // multi-tenant strip on the I-35 corridor in the SA southwest metro.
    { url: `${BASE_URL}/15033-main-st-lytle`,                  lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9  },
    { url: `${BASE_URL}/owner-services`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9  },
    // Standard pages
    { url: `${BASE_URL}/services`,                    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9  },
    { url: `${BASE_URL}/sell`,                        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9  },
    { url: `${BASE_URL}/get-started`,                 lastModified: new Date(), changeFrequency: 'monthly', priority: 0.95 },
    { url: `${BASE_URL}/tenant-needs`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5  }, // legacy redirect
    { url: `${BASE_URL}/contact`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/submarkets`,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE_URL}/markets`,                     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/sold`,                        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.75 },
    // /team intentionally NOT in the sitemap — the route is a 308
    // redirect to /about#team since the team grid was folded into the
    // About page. Search engines follow the redirect and consolidate
    // authority on /about; keeping the redirect URL in the sitemap
    // would create a duplicate-content signal we don't want.
    { url: `${BASE_URL}/about`,                       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/insights`,                    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE_URL}/guides`,                      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/research`,                    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9  },
    { url: `${BASE_URL}/property-alerts`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8  },
    { url: `${BASE_URL}/careers`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7  },
    // /compare omitted — the route is noindex,nofollow because it's a
    // session tool (only meaningful with shortlisted listings already
    // saved to localStorage), not a destination for organic search.
    { url: `${BASE_URL}/privacy`,                     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3  },
  ];

  const guideSlugs = [
    'texas-tenant-lease-negotiation-playbook',
    'texas-owner-disposition-strategy-guide',
    'q2-2026-texas-industrial-market-report',
    'q2-2026-texas-retail-market-report',
    'q2-2026-texas-office-market-report',
    'q2-2026-texas-investment-outlook-report',
  ];
  const guidePages: MetadataRoute.Sitemap = guideSlugs.map(slug => ({
    url: `${BASE_URL}/guides/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.75,
  }));

  const insightSlugs = [
    'texas-commercial-real-estate-outlook-2026',
    'lease-vs-buy-texas-business',
    'multi-property-owner-strategy',
    'texas-industrial-warehouse-leasing-2026',
    'texas-1031-exchange-strategy',
    'texas-retail-leasing-fundamentals-2026',
  ];
  const insightPages: MetadataRoute.Sitemap = insightSlugs.map(slug => ({
    url: `${BASE_URL}/insights/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const serviceSlugs = ['tenant-representation', 'investment-advisory', 'leasing-sales', 'property-management', 'development', 'sustainability'];
  const servicePages: MetadataRoute.Sitemap = serviceSlugs.map(slug => ({
    url: `${BASE_URL}/services/${slug}`,
    lastModified: new Date(),
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

  // Static submarket hub pages (file-backed in src/lib/submarkets-content.ts)
  const marketHubPages: MetadataRoute.Sitemap = SUBMARKETS.map(s => ({
    url: `${BASE_URL}/markets/${s.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // Quarterly market reports — every report at /research/{slug} gets
  // enumerated so search engines + LLM crawlers find them as they
  // accumulate. Reports are static / file-backed so we can include them
  // without a DB hit. lastModified comes from the report's publishedAt
  // since reports are point-in-time snapshots — once published they
  // don't get updated.
  const { MARKET_REPORTS } = await import('@/lib/market-reports');
  const reportPages: MetadataRoute.Sitemap = MARKET_REPORTS.map(r => ({
    url: `${BASE_URL}/research/${r.slug}`,
    lastModified: new Date(r.publishedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }));

  return [...staticPages, ...servicePages, ...insightPages, ...guidePages, ...marketHubPages, ...listingPages, ...submarketPages, ...reportPages];
}
