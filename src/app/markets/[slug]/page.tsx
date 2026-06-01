import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CityHubPage } from '@/components/marketing/CityHubPage';
import {
  findSubmarket, SUBMARKETS, PARENT_METRO_LABELS,
} from '@/lib/submarkets-content';

/**
 * /markets/[slug] — individual submarket landing page.
 *
 * Reads from src/lib/submarkets-content.ts and renders via the same
 * CityHubPage component the major-city pages use. Per-page metadata
 * generated from the submarket entry. JSON-LD includes Place (the
 * submarket), LocalBusiness (CRECO with areaServed = this submarket),
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
    title: entry.metaTitle,
    description: entry.metaDescription,
    keywords: entry.keywords,
    alternates: { canonical: `https://www.crecotx.com/markets/${entry.slug}` },
    openGraph: {
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
  //   LocalBusiness — CRECO's local presence serving the submarket
  //   BreadcrumbList — Home > Markets > [submarket]
  // All three help search engines understand the page and qualify for
  // rich results (local pack, breadcrumbs in search, organization card).
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: entry.config.city,
      description: entry.metaDescription,
      address: { '@type': 'PostalAddress', addressRegion: 'TX', addressCountry: 'US' },
      containedInPlace: { '@type': 'AdministrativeArea', name: PARENT_METRO_LABELS[entry.parentMetro] },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `https://www.crecotx.com/markets/${entry.slug}#localbusiness`,
      name: 'CRECO – Commercial Real Estate Company',
      url: `https://www.crecotx.com/markets/${entry.slug}`,
      telephone: '+1-210-817-3443',
      areaServed: { '@type': 'Place', name: `${entry.config.city}, Texas` },
      address: {
        '@type': 'PostalAddress',
        streetAddress: '8000 Fair Oaks Pkwy, Suite 102',
        addressLocality: 'Fair Oaks Ranch',
        addressRegion: 'TX',
        postalCode: '78015',
        addressCountry: 'US',
      },
      priceRange: '$$$',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CityHubPage
        config={{
          ...entry.config,
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
