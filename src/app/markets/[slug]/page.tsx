import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { metaTitle, metaDescription } from '@/lib/seo-meta';
import { jsonLd } from '@/lib/jsonLd';
import { notFound } from 'next/navigation';
import { CityHubPage } from '@/components/marketing/CityHubPage';
import {
  findSubmarket, SUBMARKETS, PARENT_METRO_LABELS,
} from '@/lib/submarkets-content';
import { BUSINESS_ID } from '@/lib/schema';

/**
 * /markets/[slug] — individual submarket landing page.
 *
 * Reads from src/lib/submarkets-content.ts and renders via the same
 * CityHubPage component the major-city pages use. Per-page metadata
 * generated from the submarket entry. JSON-LD includes Place (the
 * submarket), Service (provided by the sitewide CRECO @id, areaServed = this submarket),
 * and BreadcrumbList.
 *
 * SSG via generateStaticParams so every submarket page is pre-rendered
 * at build time — faster TTFB + better Lighthouse for SEO.
 */

export async function generateStaticParams() {
  return SUBMARKETS.map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = findSubmarket(slug);
  if (!entry) {
    return { title: 'Market not found | CRECO' };
  }
  return {
    title: metaTitle(entry.metaTitle),
    description: metaDescription(entry.metaDescription),
    keywords: entry.keywords,
    alternates: { canonical: `https://www.crecotx.com/markets/${entry.slug}` },
    openGraph: {
      images: [DEFAULT_OG_IMAGE],
      title: entry.metaTitle,
      description: entry.metaDescription,
      url: `https://www.crecotx.com/markets/${entry.slug}`,
      type: 'website',
    },
  };
}

export default async function SubmarketPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = findSubmarket(slug);
  if (!entry) notFound();

  // Structured data:
  //   Place — describes the geographic area (the submarket)
  //   Service — CRECO's brokerage service scoped to the submarket
  //   BreadcrumbList — Home > Markets > [submarket]
  // All three help search engines understand the page and qualify for
  // rich results (local pack, breadcrumbs in search, organization card).
  const jsonLdData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: entry.config.city,
      description: entry.metaDescription,
      address: { '@type': 'PostalAddress', addressRegion: 'TX', addressCountry: 'US' },
      containedInPlace: { '@type': 'AdministrativeArea', name: PARENT_METRO_LABELS[entry.parentMetro] },
    },
    {
      // Service scoped to this submarket, provided by the ONE sitewide business
      // entity (@id) — previously a second LocalBusiness node per market page,
      // which split CRECO into 20 look-alike entities for knowledge graphs.
      '@context': 'https://schema.org',
      '@type': 'Service',
      '@id': `https://www.crecotx.com/markets/${entry.slug}#service`,
      name: `Commercial real estate brokerage in ${entry.config.city}, Texas`,
      serviceType: 'Commercial real estate brokerage — tenant representation, leasing, sales, and investment advisory',
      provider: { '@id': BUSINESS_ID },
      areaServed: { '@type': 'Place', name: `${entry.config.city}, Texas` },
      url: `https://www.crecotx.com/markets/${entry.slug}`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',                                     item: 'https://www.crecotx.com' },
        { '@type': 'ListItem', position: 2, name: 'Markets',                                  item: 'https://www.crecotx.com/markets' },
        { '@type': 'ListItem', position: 3, name: entry.shortLabel, item: `https://www.crecotx.com/markets/${entry.slug}` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(jsonLdData) }}
      />
      <CityHubPage
        config={{
          ...entry.config,
          // Figures in submarkets-content.ts were last written May 2026 (git history).
          sourcesAsOf: 'May 2026',
          // Visible breadcrumb mirrors the BreadcrumbList JSON-LD above.
          breadcrumbs: [
            { label: 'Markets', href: '/markets' },
            { label: entry.shortLabel },
          ],
        }}
      />
    </>
  );
}
