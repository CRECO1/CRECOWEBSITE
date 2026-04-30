import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, ArrowRight, BookOpen } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { SORTED_POSTS } from '@/lib/insights';

export const metadata: Metadata = {
  title: 'Insights | Texas Commercial Real Estate Analysis | CRECO',
  description:
    'Texas commercial real estate insights, market analysis, and strategic guidance from CRECO. Outlook reports, owner strategy, tenant strategy, and investment perspectives across retail, industrial, and office.',
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

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 text-white">
          <Container>
            <p className="overline mb-2 text-gold">Texas Commercial Real Estate · Insights</p>
            <h1 className="font-heading text-display-sm font-bold">CRECO Insights</h1>
            <p className="mt-3 max-w-2xl text-body text-white/60">
              Market analysis, strategic guidance, and on-the-ground perspectives on Texas commercial real estate. Written by CRECO principals for owners, tenants, and investors who want to think clearly about commercial real estate decisions.
            </p>
          </Container>
        </section>

        {/* Featured Post */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <RevealOnScroll>
              <p className="overline mb-3 text-foreground-muted">Most Recent</p>
            </RevealOnScroll>
            <Link href={`/insights/${featured.slug}`} className="group block rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                <div className="lg:col-span-2 bg-gradient-to-br from-primary to-primary/80 p-8 lg:p-12 flex flex-col justify-center text-white">
                  <BookOpen className="mb-4 h-10 w-10 text-gold" />
                  <p className="text-caption uppercase tracking-widest text-gold mb-2">{featured.category}</p>
                  <p className="text-body-sm text-white/70">By {featured.author}</p>
                </div>
                <div className="lg:col-span-3 p-8 lg:p-12">
                  <h2 className="font-heading text-display-sm font-bold text-primary mb-4 group-hover:text-gold transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-body text-foreground-muted leading-relaxed mb-6">{featured.excerpt}</p>
                  <div className="flex items-center gap-5 text-caption text-foreground-muted">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> {formatDate(featured.publishedAt)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {featured.readingMinutes} min read
                    </span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark group-hover:text-gold transition-colors">
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
                    <Link href={`/insights/${post.slug}`} className="group h-full block rounded-xl border border-border bg-white p-7 hover:border-gold hover:shadow-card-hover transition-all flex flex-col">
                      <p className="text-caption uppercase tracking-widest text-gold mb-3">{post.category}</p>
                      <h3 className="font-heading text-heading-sm font-bold text-primary group-hover:text-gold transition-colors mb-3 line-clamp-3">{post.title}</h3>
                      <p className="text-body-sm text-foreground-muted leading-relaxed mb-5 flex-1 line-clamp-4">{post.excerpt}</p>
                      <div className="flex items-center gap-4 text-caption text-foreground-muted border-t border-border pt-4">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {formatDate(post.publishedAt)}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" /> {post.readingMinutes} min</span>
                      </div>
                    </Link>
                  </RevealOnScroll>
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
