import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Calendar, Clock, BookOpen, Phone } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { POSTS, findPost } from '@/lib/insights';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return {};
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    keywords: post.keywords,
    alternates: { canonical: `https://www.crecotx.com/insights/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: `https://www.crecotx.com/insights/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default async function InsightDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  const related = (post.relatedSlugs ?? []).map(s => findPost(s)).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      {/* Article Schema for rich results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: post.metaDescription,
            datePublished: post.publishedAt,
            dateModified: post.publishedAt,
            author: { '@type': 'Organization', name: post.author, url: 'https://www.crecotx.com' },
            publisher: {
              '@type': 'Organization',
              name: 'CRECO',
              logo: { '@type': 'ImageObject', url: 'https://www.crecotx.com/images/creco-logo.jpg' },
            },
            mainEntityOfPage: `https://www.crecotx.com/insights/${post.slug}`,
            articleSection: post.category,
          }),
        }}
      />

      <Header variant="minimal" />
      <main className="min-h-screen pt-20">
        {/* Back */}
        <div className="border-b border-border bg-background-cream py-4">
          <Container>
            <Link href="/insights" className="inline-flex items-center gap-2 text-body-sm text-foreground-muted hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> All Insights
            </Link>
          </Container>
        </div>

        {/* Hero */}
        <section className="bg-primary py-16 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-3 text-gold">CRECO Insights · {post.category}</p>
              <h1 className="font-heading text-display font-bold mb-6">{post.title}</h1>
              <p className="text-body-lg text-white/80 mb-6">{post.excerpt}</p>
              <div className="flex flex-wrap items-center gap-5 text-caption text-white/60">
                <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> By {post.author}</span>
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.publishedAt)}</span>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {post.readingMinutes} min read</span>
              </div>
            </div>
          </Container>
        </section>

        {/* Article body */}
        <section className="section-luxury bg-white">
          <Container>
            <article className="mx-auto max-w-3xl">
              {/* Intro */}
              <div className="mb-12 space-y-5">
                {post.intro.map((para, i) => (
                  <p key={i} className="text-body-lg text-foreground-muted leading-relaxed">{para}</p>
                ))}
              </div>

              {/* Sections */}
              {post.sections.map((section, i) => (
                <section key={i} className="mb-12">
                  <h2 className="mb-5 font-heading text-heading-xl font-bold text-primary border-b border-border pb-3">
                    {section.heading}
                  </h2>
                  <div className="space-y-4">
                    {section.paragraphs.map((p, j) => (
                      <p key={j} className="text-body text-foreground-muted leading-relaxed">{p}</p>
                    ))}
                    {section.bullets && section.bullets.length > 0 && (
                      <ul className="space-y-2 pt-2">
                        {section.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-3 text-body text-foreground-muted">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}

              {/* Conclusion */}
              <div className="mt-12 pt-8 border-t border-border space-y-4">
                {post.conclusion.map((p, i) => (
                  <p key={i} className="text-body-lg text-primary leading-relaxed">{p}</p>
                ))}
              </div>

              {/* CTA inline */}
              <div className="mt-12 rounded-2xl bg-background-cream p-8 text-center">
                <h3 className="font-heading text-heading-lg font-bold text-primary mb-3">Have a Texas commercial real estate question?</h3>
                <p className="text-body text-foreground-muted mb-6 max-w-xl mx-auto">
                  CRECO works retail, industrial, and office across Texas — for tenants, owners, and investors. Get in touch and we&apos;ll share our perspective without expectation.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" asChild>
                    <Link href="/contact">Get in Touch <ArrowRight className="ml-2 h-5 w-5" /></Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="tel:+12108173443"><Phone className="mr-2 h-4 w-4" />(210) 817-3443</a>
                  </Button>
                </div>
              </div>
            </article>
          </Container>
        </section>

        {/* Related */}
        {related.length > 0 && (
          <section className="section-luxury bg-background-cream">
            <Container>
              <h2 className="mb-10 text-center font-heading text-display-sm font-bold text-primary">Related Insights</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {related.map(r => (
                  <Link key={r.slug} href={`/insights/${r.slug}`} className="group h-full block rounded-xl border border-border bg-white p-6 hover:border-gold hover:shadow-card-hover transition-all">
                    <p className="text-caption uppercase tracking-widest text-gold mb-3">{r.category}</p>
                    <h3 className="font-heading text-heading-sm font-bold text-primary group-hover:text-gold transition-colors mb-3 line-clamp-3">{r.title}</h3>
                    <p className="text-caption text-foreground-muted line-clamp-3">{r.excerpt}</p>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

export function generateStaticParams() {
  return POSTS.map(p => ({ slug: p.slug }));
}
