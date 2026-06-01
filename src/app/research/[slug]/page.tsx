import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight, BarChart3, Calendar, FileText, TrendingUp, TrendingDown, Minus, Download, BookOpen,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { findMarketReport, MARKET_REPORTS, type MarketReport } from '@/lib/market-reports';

/**
 * /research/[slug] — individual quarterly market report.
 *
 * Page structure follows the answer-first 2026 SEO pattern:
 * Breadcrumb → Hero (title + quickAnswer) → Stats grid → Key takeaways →
 * Long-form sections → PDF download CTA → Cross-links.
 *
 * Schema stack:
 * - Article (the main event — named author, dates, wordCount estimate)
 * - BreadcrumbList (mirrors the visible breadcrumb)
 * - LocalBusiness reference (so the report attributes back to CRECO)
 *
 * SSG via generateStaticParams — every report URL is prerendered at
 * build time for fast TTFB. Tradeoff: a fresh report requires a redeploy
 * (which is fine for quarterly cadence).
 */

interface PageProps { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return MARKET_REPORTS.map(r => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const report = findMarketReport(slug);
  if (!report) return { title: 'Market report not found | CRECO' };
  return {
    title: report.metaTitle,
    description: report.metaDescription,
    keywords: report.keywords,
    alternates: { canonical: `https://www.crecotx.com/research/${report.slug}` },
    openGraph: {
      title: report.metaTitle,
      description: report.metaDescription,
      url: `https://www.crecotx.com/research/${report.slug}`,
      type: 'article',
      publishedTime: report.publishedAt,
      authors: [report.author.name],
    },
    twitter: {
      card: 'summary_large_image',
      title: report.metaTitle,
      description: report.metaDescription,
    },
  };
}

function TrendIcon({ trend }: { trend?: MarketReport['stats'][number]['trend'] }) {
  if (trend === 'up')   return <TrendingUp   className="h-4 w-4 text-green-700"  aria-label="up" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-700"    aria-label="down" />;
  if (trend === 'flat') return <Minus        className="h-4 w-4 text-foreground-muted" aria-label="flat" />;
  return null;
}

export default async function MarketReportPage({ params }: PageProps) {
  const { slug } = await params;
  const report = findMarketReport(slug);
  if (!report) notFound();

  const assetLabel = report.assetClass.charAt(0).toUpperCase() + report.assetClass.slice(1).replace('-', ' ');
  const title = `${report.submarketLabel} ${assetLabel} Market Report — ${report.quarter} ${report.year}`;

  // Article schema — the heart of the SEO/AI-citation payload. Named
  // author, real dates, wordCount estimate, publisher Organization,
  // about = a Place subject (the submarket). LLMs cite Articles with
  // real publication metadata far more often than generic blog posts.
  const wordCount = report.sections
    .reduce((sum, s) => sum + s.paragraphs.reduce((p, t) => p + t.split(/\s+/).length, 0), 0)
    + report.quickAnswer.split(/\s+/).length
    + report.keyTakeaways.reduce((s, t) => s + t.split(/\s+/).length, 0);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `https://www.crecotx.com/research/${report.slug}#article`,
    headline: title,
    description: report.quickAnswer,
    keywords: report.keywords.join(', '),
    inLanguage: 'en-US',
    isAccessibleForFree: true,
    url: `https://www.crecotx.com/research/${report.slug}`,
    mainEntityOfPage: `https://www.crecotx.com/research/${report.slug}`,
    wordCount,
    datePublished: report.publishedAt,
    dateModified: report.publishedAt,
    author: {
      '@type': 'Organization',
      '@id': 'https://www.crecotx.com/#business',
      name: report.author.name,
      url: 'https://www.crecotx.com/team',
    },
    publisher: { '@id': 'https://www.crecotx.com/#business' },
    about: {
      '@type': 'Place',
      name: `${report.submarketLabel}, Texas`,
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',     item: 'https://www.crecotx.com/' },
      { '@type': 'ListItem', position: 2, name: 'Research', item: 'https://www.crecotx.com/research' },
      { '@type': 'ListItem', position: 3, name: title,      item: `https://www.crecotx.com/research/${report.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header variant="minimal" />
      <main className="min-h-screen pt-20">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-background-cream py-4">
          <Container>
            <Breadcrumbs
              items={[
                { label: 'Research', href: '/research' },
                { label: `${report.quarter} ${report.year} · ${report.submarketLabel} ${assetLabel}` },
              ]}
            />
          </Container>
        </div>

        {/* Hero */}
        <section className="bg-primary py-12 sm:py-16 text-white">
          <Container>
            <p className="overline mb-3 text-gold flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5" /> {report.quarter} {report.year} Market Report
            </p>
            <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 max-w-4xl leading-tight">
              {title}
            </h1>
            <p className="text-body-lg text-white/80 max-w-3xl mb-6 leading-relaxed">
              {report.quickAnswer}
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-caption text-white/60">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-gold" /> By {report.author.name}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gold" />
                Published{' '}
                <time dateTime={report.publishedAt}>
                  {new Date(report.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </time>
              </span>
              {report.downloadUrl && (
                <a
                  href={report.downloadUrl}
                  className="inline-flex items-center gap-1.5 text-gold hover:text-gold-light"
                  rel="noopener"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF
                </a>
              )}
            </div>
          </Container>
        </section>

        {/* Stats grid — the answer-first centerpiece. LLMs lift this
            table verbatim when answering "what was Q2 2026 vacancy in
            San Antonio Northwest." */}
        <section className="bg-gold py-10 sm:py-12 text-primary">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-8">
              {report.stats.map(s => (
                <div key={s.label} className="text-center md:text-left">
                  <div className="inline-flex items-baseline gap-2 font-heading text-heading-md font-bold whitespace-nowrap">
                    {s.value}
                    {s.trend && <TrendIcon trend={s.trend} />}
                  </div>
                  <div className="text-caption font-semibold mt-1">{s.label}</div>
                  {s.note && <div className="text-caption opacity-70 mt-0.5 leading-snug">{s.note}</div>}
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Key takeaways — bullets directly under the stats so the
            "scan the page in 15 seconds" reader gets the full picture
            without scrolling into long-form. */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="max-w-3xl">
              <h2 className="font-heading text-heading-lg font-bold text-primary mb-5">
                Key takeaways
              </h2>
              <ul className="space-y-3">
                {report.keyTakeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-body text-foreground-muted leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        {/* Long-form sections */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="max-w-3xl space-y-12">
              {report.sections.map((sec, i) => (
                <div key={i}>
                  <h2 className="font-heading text-heading-lg font-bold text-primary mb-4">
                    {sec.heading}
                  </h2>
                  <div className="space-y-4">
                    {sec.paragraphs.map((p, j) => (
                      <p key={j} className="text-body text-foreground-muted leading-relaxed">{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Cross-links */}
        {report.relatedSubmarketSlugs && report.relatedSubmarketSlugs.length > 0 && (
          <section className="section-luxury bg-white border-t border-border">
            <Container>
              <h2 className="font-heading text-heading-lg font-bold text-primary mb-6">
                Related submarket profiles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.relatedSubmarketSlugs.map(s => (
                  <Link
                    key={s}
                    href={`/submarkets/${s}`}
                    className="rounded-xl border border-border bg-white p-5 hover:border-gold hover:bg-gold/5 transition-colors inline-flex items-center justify-between gap-3"
                  >
                    <span className="font-semibold text-primary">{s.replace(/-/g, ' ')}</span>
                    <ArrowRight className="h-4 w-4 text-gold-dark" />
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* CTA */}
        <section className="bg-primary py-12 text-white">
          <Container>
            <div className="max-w-3xl text-center mx-auto">
              <FileText className="mx-auto h-10 w-10 text-gold mb-4" />
              <h2 className="font-heading text-heading-lg font-bold mb-3">Want CRECO's read on your specific situation?</h2>
              <p className="text-body text-white/70 mb-6">
                The report covers the submarket; we're happy to walk through what it means for your space, your lease, or your portfolio.
              </p>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3 text-body-sm font-semibold text-primary hover:bg-gold-light"
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
