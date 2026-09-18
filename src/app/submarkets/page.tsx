// Hourly ISR — submarkets are edited rarely; an hour of staleness
// on the index is well under operator-visible threshold.
export const revalidate = 3600;

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Building2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { getSubmarkets } from '@/lib/supabase';

import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList } from '@/lib/schema';
export const metadata: Metadata = {
  title: 'San Antonio Commercial Real Estate Submarkets | CRECO',
  description:
    'Explore the major commercial real estate submarkets of San Antonio — Northwest, North Central, Northeast, Downtown, South Side, and Far West — with available properties, market commentary, and submarket profiles.',
  alternates: { canonical: 'https://www.crecotx.com/submarkets' },
};

export default async function SubmarketsPage() {
  // The submarkets table is the source of truth and drives /submarkets/[slug],
  // so there is no demo fallback: listing submarkets that have no record behind
  // them would link to pages that cannot render.
  const submarkets = await getSubmarkets().catch(() => []);

  return (
    <>
      <JsonLd data={breadcrumbList([{ name: 'San Antonio Submarkets', path: '/submarkets' }])} />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <div className="bg-primary py-16 text-white">
          <Container>
            <p className="overline mb-2 text-gold">Where We Work</p>
            <h1 className="font-heading text-display-sm font-bold">San Antonio Submarkets</h1>
            <p className="mt-3 max-w-xl text-body text-white/60">
              San Antonio is not one market — it&apos;s a dozen. Office demand looks different in Stone Oak than in Downtown; warehouse fundamentals on the I-35 corridor are nothing like Far West. We work all of them.
            </p>
          </Container>
        </div>

        {/* Grid */}
        <section className="section-luxury bg-background-cream">
          <Container>
            {submarkets.length === 0 && (
              <p className="text-center text-body text-foreground-muted">
                Submarket guides aren&apos;t available right now. Tell us the area you&apos;re targeting on the{' '}
                <Link href="/get-started" className="text-gold underline">Get Started</Link> form and we&apos;ll bring options across any San Antonio submarket.
              </p>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {submarkets.map((s: any, i: number) => (
                <RevealOnScroll key={s.id} delay={i * 80}>
                  <Link href={`/submarkets/${s.slug}`}
                    className="group relative overflow-hidden rounded-xl bg-primary aspect-[4/3] flex flex-col justify-end p-6 text-white">
                    {s.image_url ? (
                      <Image src={s.image_url} alt={s.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary" />
                    )}
                    <div className="gradient-card absolute inset-0" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-gold" />
                        <span className="text-caption uppercase tracking-widest text-gold">San Antonio</span>
                      </div>
                      <h3 className="font-heading text-heading-lg font-bold">{s.name}</h3>
                      {s.description && <p className="mt-2 text-body-sm text-white/80 line-clamp-2">{s.description}</p>}
                      {Array.isArray(s.highlights) && s.highlights.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(s.highlights as string[]).slice(0, 2).map((h: string) => (
                            <span key={h} className="rounded-full bg-white/20 px-3 py-1 text-caption backdrop-blur-sm">{h}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="section-compact bg-white border-t border-border">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <Building2 className="mx-auto mb-4 h-10 w-10 text-gold" />
              <h2 className="font-heading text-display-sm font-bold text-primary mb-4">Don&apos;t see your target submarket?</h2>
              <p className="text-body text-foreground-muted mb-6">
                Submit your tenant needs and we&apos;ll bring vetted options across any submarket — including off-market opportunities.
              </p>
              <Link href="/get-started" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 transition-colors">
                Get Started
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
