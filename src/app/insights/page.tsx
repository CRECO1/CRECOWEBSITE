import type { Metadata } from 'next';
import { jsonLd } from '@/lib/jsonLd';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList, webPage } from '@/lib/schema';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { SORTED_POSTS } from '@/lib/insights';
import { MarketReportCapture } from '@/components/marketing/MarketReportCapture';

export const metadata: Metadata = {
  title: 'Insights | Texas Commercial Real Estate Analysis | CRECO',
  description:
    'Texas commercial real estate insights, market analysis, and strategic guidance from CRECO.',
  keywords: [
    'texas commercial real estate insights',
    'texas commercial real estate market analysis',
    'commercial real estate blog texas',
    'cre market outlook texas',
    'texas commercial real estate trends',
    'creco insights',
  ],
  alternates: { canonical: 'https://www.crecotx.com/insights' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function InsightsIndex() {
  const featured = SORTED_POSTS[0];
  const rest = SORTED_POSTS.slice(1);

  // CollectionPage + ItemList — gives Google + Bing the same context
  // we already provide on /guides. Each insight post then carries its
  // own Article schema (added per-page elsewhere).
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'CRECO Insights — Texas Commercial Real Estate Analysis',
    description: 'Texas commercial real estate insights and market analysis from CRECO.',
    url: 'https://www.crecotx.com/insights',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',     item: 'https://www.crecotx.com' },
        { '@type': 'ListItem', position: 2, name: 'Insights', item: 'https://www.crecotx.com/insights' },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: SORTED_POSTS.length,
      itemListElement: SORTED_POSTS.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://www.crecotx.com/insights/${p.slug}`,
        name: p.title,
      })),
    },
  };

  return (
    <>
      <JsonLd
        data={[
          webPage('CollectionPage', '/insights', 'Insights | Texas Commercial Real Estate Analysis | CRECO', 'Texas commercial real estate insights, market analysis, and strategic guidance from CRECO.'),
          breadcrumbList([{ name: 'Insights', path: '/insights' }]),
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(collectionSchema) }}
      />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 text-white">
          <Container>
            <p className="overline mb-2 text-gold">Texas Commercial Real Estate · Insights</p>
            <h1 className="font-heading text-display-sm font-bold">CRECO Insights</h1>
            <p className="mt-3 max-w-2xl text-body text-white/60">
              Texas commercial real estate, read by the principals who work it — for owners, tenants and investors.
            </p>
          </Container>
        </section>

        {/* Featured Post */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <RevealOnScroll>
              <p className="overline mb-3 text-foreground-muted">Most Recent</p>
            </RevealOnScroll>
            <Link href={`/insights/${featured.slug}`} className="group block overflow-hidden rounded-2xl bg-white shadow-card transition-all hover:shadow-card-hover">
              <div className="grid grid-cols-1 lg:grid-cols-5">
                <div className="relative min-h-[240px] bg-primary lg:col-span-2 lg:min-h-[420px]">
                  {featured.cover && (
                    <Image
                      src={featured.cover.src}
                      alt={featured.cover.alt}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{ objectPosition: featured.cover.position }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-primary/10 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full bg-gold px-3.5 py-1.5 text-caption font-semibold uppercase tracking-widest text-primary">
                    {featured.category}
                  </span>
                </div>
                <div className="flex flex-col justify-center p-8 lg:col-span-3 lg:p-12">
                  <p className="mb-3 text-caption font-semibold uppercase tracking-widest text-gold-dark">Featured · By {featured.author}</p>
                  <h2 className="mb-4 font-heading text-display-sm font-bold text-primary transition-colors group-hover:text-gold">
                    {featured.title}
                  </h2>
                  <p className="mb-6 text-body leading-relaxed text-foreground-muted">{featured.excerpt}</p>
                  <div className="flex items-center gap-5 text-caption text-foreground-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(featured.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {featured.readingMinutes} min read
                    </span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark transition-colors group-hover:text-gold">
                    Read article <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          </Container>
        </section>

        {/* Rest of Posts */}
        {rest.length > 0 && (
          <section className="section-luxury bg-white">
            <Container>
              <RevealOnScroll>
                <h2 className="mb-12 font-heading text-display-sm font-bold text-primary text-center gold-line gold-line-center inline-block pb-3">More Insights</h2>
              </RevealOnScroll>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post, i) => (
                  <RevealOnScroll key={post.slug} delay={i * 80}>
                    <Link href={`/insights/${post.slug}`} className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-white transition-all hover:border-gold hover:shadow-card-hover">
                      <div className="relative aspect-[16/10] overflow-hidden bg-primary">
                        {post.cover && (
                          <Image
                            src={post.cover.src}
                            alt={post.cover.alt}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            style={{ objectPosition: post.cover.position }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
                        <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-caption font-semibold uppercase tracking-widest text-primary">
                          {post.category}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-6">
                        <h3 className="mb-3 line-clamp-3 font-heading text-heading-sm font-bold text-primary transition-colors group-hover:text-gold">{post.title}</h3>
                        <p className="mb-5 line-clamp-3 flex-1 text-body-sm leading-relaxed text-foreground-muted">{post.excerpt}</p>
                        <div className="flex items-center justify-between border-t border-border pt-4 text-caption text-foreground-muted">
                          <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {formatDate(post.publishedAt)}</span>
                          <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {post.readingMinutes} min</span>
                        </div>
                      </div>
                    </Link>
                  </RevealOnScroll>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* Market-report capture at the bottom of /insights — natural
            home for the lead magnet. Visitors who scrolled through
            posts have shown intent for analytical content; the report
            is the same kind of artifact. Dark variant so it pops
            against the white "More Insights" section above and breaks
            up the rhythm before the footer. */}
        <section className="bg-primary py-16">
          <Container>
            <div className="max-w-2xl mx-auto">
              <MarketReportCapture variant="dark" surface="insights-bottom" />
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
