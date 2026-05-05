import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, FileText, ArrowRight } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
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

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
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
