// Hourly ISR — sold-deal records change slowly; an hour of staleness
// is acceptable and saves the per-visit server render that
// force-dynamic was costing.
export const revalidate = 3600;

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recently Closed Deals | CRECO Commercial Real Estate San Antonio',
  description:
    'Recent commercial real estate transactions closed by CRECO in San Antonio — leases and sales across office, warehouse, flex, retail, and land.',
  keywords: [
    'CRECO closed deals',
    'San Antonio commercial real estate transactions',
    'CRECO sold properties',
    'commercial real estate sales San Antonio',
    'commercial leases San Antonio',
  ],
  openGraph: {
    title: 'Recently Closed Deals | CRECO',
    description: 'Recent CRECO transactions across the San Antonio commercial market.',
    url: 'https://www.crecotx.com/sold',
    type: 'website',
  },
  alternates: { canonical: 'https://www.crecotx.com/sold' },
};

import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Building2, TrendingUp, Award } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { getClosedDeals } from '@/lib/supabase';
import { formatPrice, formatSqft, transactionLabel, propertyTypeLabel } from '@/lib/utils';

import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList } from '@/lib/schema';
export default async function SoldPage() {
  // No demo fallback: an empty result renders an empty state rather than
  // presenting invented transactions as CRECO's track record.
  const properties = await getClosedDeals(12).catch(() => []);

  return (
    <>
      <JsonLd data={breadcrumbList([{ name: 'Closed Deals', path: '/sold' }])} />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <div className="bg-primary py-16 text-white">
          <Container>
            <p className="overline mb-2 text-gold">Track Record</p>
            <h1 className="font-heading text-display-sm font-bold">Recently Closed</h1>
            <p className="mt-3 max-w-xl text-body text-white/60">
              A look at recent transactions CRECO has closed across the San Antonio commercial market.
            </p>
          </Container>
        </div>

        {/* Grid */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <RevealOnScroll>
              <h2 className="mb-12 font-heading text-display font-bold text-primary text-center gold-line gold-line-center pb-4">
                Closed Transactions
              </h2>
            </RevealOnScroll>

            {properties.length === 0 && (
              <p className="text-center text-body text-foreground-muted">
                Recently closed transactions aren&apos;t listed here right now. Please{' '}
                <Link href="/contact" className="text-gold underline">contact us</Link> and a CRECO principal will walk you through comparable deals we&apos;ve closed.
              </p>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {properties.map((p: any, i: number) => (
                <RevealOnScroll key={p.id} delay={i * 80}>
                  <div className="card-luxury overflow-hidden">
                    <div className="relative aspect-property bg-background-warm">
                      {p.image_url ? (
                        <Image src={p.image_url} alt={p.address} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-foreground-subtle">
                          <Building2 className="h-10 w-10" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="rounded-full bg-primary/80 px-6 py-2 text-body-sm font-bold uppercase tracking-widest text-gold backdrop-blur-sm">
                          {p.transaction_type === 'lease' ? 'LEASED' : 'SOLD'}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-caption text-foreground-muted">
                        {propertyTypeLabel(p.property_type)} · {transactionLabel(p.transaction_type)}
                      </p>
                      <h3 className="mt-1 font-heading text-heading-sm font-semibold text-primary">{p.address}</h3>
                      <p className="text-caption text-foreground-muted mt-0.5">{p.city}, TX</p>
                      <p className="mt-3 font-heading text-heading font-bold text-gold">
                        {p.sale_price ? formatPrice(p.sale_price) : 'Lease — terms confidential'}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-caption text-foreground-muted border-t border-border pt-3">
                        {p.sqft && <span>{formatSqft(p.sqft)}</span>}
                        {p.closed_date && <span className="ml-auto">Closed {new Date(p.closed_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>}
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="section-compact bg-primary text-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-heading text-display-sm font-bold text-white mb-4">
                Have a property to sell or lease?
              </h2>
              <p className="text-body text-white/60 mb-8">
                Get a no-obligation Broker Opinion of Value or leasing strategy from a CRECO principal.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/sell">Request a Property Opinion</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link href="/contact">Talk to a Broker</Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
