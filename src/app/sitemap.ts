import { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

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
    { url: `${BASE_URL}/owner-services`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9  },
    // Standard pages
    { url: `${BASE_URL}/services`,                    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9  },
    { url: `${BASE_URL}/sell`,                        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9  },
    { url: `${BASE_URL}/tenant-needs`,                lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9  },
    { url: `${BASE_URL}/contact`,                     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.85 },
    { url: `${BASE_URL}/submarkets`,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE_URL}/sold`,                        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${BASE_URL}/team`,                        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/about`,                       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/insights`,                    lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.85 },
    { url: `${BASE_URL}/privacy`,                     lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3  },
  ];

  const insightSlugs = ['texas-commercial-real-estate-outlook-2026', 'lease-vs-buy-texas-business', 'multi-property-owner-strategy'];
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

  return [...staticPages, ...servicePages, ...insightPages, ...listingPages, ...submarketPages];
}
