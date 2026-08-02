import type { Metadata } from 'next';
import { jsonLd } from '@/lib/jsonLd';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, FileText, ArrowRight } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { findGuide, GUIDES } from '@/lib/guides';
import { GuideReader } from './GuideReader';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GUIDES.map(g => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return { title: 'Guide not found | CRECO' };
  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: guide.keywords,
    alternates: { canonical: `https://www.crecotx.com/guides/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.excerpt,
      url: `https://www.crecotx.com/guides/${guide.slug}`,
      type: 'article',
    },
    twitter: { card: 'summary_large_image', title: guide.title, description: guide.excerpt },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();

  // Article JSON-LD — the single highest-value E-E-A-T schema for guide
  // content. LLMs (Perplexity, ChatGPT, Google AI Overviews) parse this
  // to attribute authorship + recency when citing a CRE explainer.
  // Author Person + publisher Organization both reference IDs declared
  // in the root layout's @graph so the entity graph stays coherent.
  //
  // Date strategy: guides are evergreen, so we use a stable published
  // date (Jan 2026 — the original drop) and an annually-refreshed
  // dateModified. If a guide ever needs a "Last updated YYYY-MM-DD"
  // surfaced in the UI, add publishedAt/updatedAt to the Guide
  // interface and read from there.
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `https://www.crecotx.com/guides/${guide.slug}#article`,
    headline: guide.title,
    description: guide.excerpt,
    keywords: guide.keywords.join(', '),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    url: `https://www.crecotx.com/guides/${guide.slug}`,
    mainEntityOfPage: `https://www.crecotx.com/guides/${guide.slug}`,
    wordCount: guide.pageCount * 300, // approx — 300 words/page is the standard editorial estimate
    datePublished: '2026-01-15',
    dateModified: '2026-06-01',
    author: {
      '@type': 'Organization',
      '@id': 'https://www.crecotx.com/#business',
      name: 'CRECO',
      url: 'https://www.crecotx.com/team',
    },
    publisher: { '@id': 'https://www.crecotx.com/#business' },
    about: { '@type': 'Thing', name: `Texas commercial real estate · ${guide.audience} guidance` },
  };

  // BreadcrumbList — gives Google + LLMs the explicit Home → Guides →
  // {Title} path. Matches the visible breadcrumb component we'll add
  // separately so schema + UI tell the same story.
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',  item: 'https://www.crecotx.com/' },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://www.crecotx.com/guides' },
      { '@type': 'ListItem', position: 3, name: guide.title, item: `https://www.crecotx.com/guides/${guide.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }}
      />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Breadcrumb — visible counterpart to the BreadcrumbList JSON-LD
            above. Lives on a light strip above the dark hero so the
            crumbs read clearly. */}
        <div className="bg-background-cream border-b border-border py-3">
          <Container>
            <Breadcrumbs
              items={[
                { label: 'Guides', href: '/guides' },
                { label: guide.title },
              ]}
            />
          </Container>
        </div>

        {/* Hero */}
        <section className="bg-primary py-12 sm:py-16 text-white">
          <Container>
            <Link href="/guides" className="inline-flex items-center gap-2 text-caption text-gold hover:text-gold-light mb-4">
              ← All guides
            </Link>
            <p className="overline mb-3 text-gold">For Texas Commercial Real Estate {guide.audience}s</p>
            <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-4 max-w-4xl">
              {guide.title}
            </h1>
            <p className="text-body-lg text-white/70 max-w-3xl mb-6 leading-relaxed">
              {guide.excerpt}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-white/60">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-gold" /> {guide.pageCount} pages
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gold" /> {guide.readingMinutes} min read
              </span>
              <span className="text-gold">By CRECO</span>
            </div>
          </Container>
        </section>

        {/* Body */}
        <article className="bg-background-cream py-12 sm:py-16">
          <Container>
            <div className="max-w-3xl mx-auto">
              {/* Teaser — always visible */}
              <div className="prose-creco">
                {guide.teaser.map((p, i) => (
                  <p key={i} className="text-body text-foreground leading-relaxed mb-5">{p}</p>
                ))}
              </div>

              {/* Email gate + full content (client-side) */}
              <GuideReader guide={guide} />
            </div>
          </Container>
        </article>

        {/* Related */}
        <section className="bg-white py-12 border-t border-border">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-heading text-heading-lg font-bold text-primary mb-3">Want CRECO's read on your specific situation?</h2>
              <p className="text-body text-foreground-muted mb-6">
                The guide covers the framework. We're happy to walk through the specifics — no obligation, no pitch.
              </p>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3 text-body-sm font-semibold text-white hover:bg-primary/90"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
