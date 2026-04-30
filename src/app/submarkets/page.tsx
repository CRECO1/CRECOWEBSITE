export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Building2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { getSubmarkets } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'San Antonio Commercial Real Estate Submarkets | CRECO',
  description:
    'Explore the major commercial real estate submarkets of San Antonio — Northwest, North Central, Northeast, Downtown, South Side, and Far West — with available properties, market commentary, and submarket profiles.',
  alternates: { canonical: 'https://www.crecotx.com/submarkets' },
};

const DEMO_SUBMARKETS = [
  { id: '1', name: 'Northwest', slug: 'northwest', description: 'I-10 corridor, La Cantera, UTSA — strong office and medical demand, growing flex inventory.', image_url: null, highlights: ['Class A office demand', 'Medical concentration', 'High-end retail'], zip_codes: ['78230', '78249', '78256', '78257'], featured: true, order: 1 },
  { id: '2', name: 'North Central', slug: 'north-central', description: 'Loop 410, Stone Oak, San Pedro — established office market with infill retail and multifamily activity.', image_url: null, highlights: ['Established office', 'Strong demographics', 'Infill development'], zip_codes: ['78213', '78216', '78217', '78232', '78258'], featured: true, order: 2 },
  { id: '3', name: 'Northeast', slug: 'northeast', description: 'I-35 industrial corridor — bulk distribution, warehouse, and last-mile logistics.', image_url: null, highlights: ['Industrial corridor', 'Distribution & logistics', 'I-35 access'], zip_codes: ['78219', '78220', '78233', '78239'], featured: true, order: 3 },
  { id: '4', name: 'Downtown / Central', slug: 'downtown', description: 'CBD, River Walk, Pearl District — historic core with adaptive reuse, hospitality, and creative office.', image_url: null, highlights: ['Adaptive reuse', 'Hospitality', 'Creative office'], zip_codes: ['78205', '78215'], featured: true, order: 4 },
  { id: '5', name: 'South Side', slug: 'south-side', description: 'I-35/I-37 — emerging industrial and Toyota corridor activity.', image_url: null, highlights: ['Emerging industrial', 'Toyota corridor', 'Affordability'], zip_codes: ['78214', '78221', '78223'], featured: false, order: 5 },
  { id: '6', name: 'Far West / 1604', slug: 'far-west', description: 'Loop 1604 NW — newer flex, retail growth, and large land tracts for development.', image_url: null, highlights: ['Newer flex', 'Retail growth', 'Land for development'], zip_codes: ['78023', '78254', '78255', '78269'], featured: false, order: 6 },
];

export default async function SubmarketsPage() {
  const result = await getSubmarkets().catch(() => []);
  const submarkets = result.length > 0 ? result : DEMO_SUBMARKETS;

  return (
    <>
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
              <Link href="/tenant-needs" className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 transition-colors">
                Submit Tenant Needs
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
