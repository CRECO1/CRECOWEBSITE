export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Building2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { getSubmarketBySlug, getListingsBySubmarket } from '@/lib/supabase';
import { formatSqft, formatLeaseRate, formatPrice, transactionLabel, propertyTypeLabel } from '@/lib/utils';

interface Props { params: Promise<{ slug: string }> }

export default async function SubmarketDetailPage({ params }: Props) {
  const { slug } = await params;
  const submarket = await getSubmarketBySlug(slug).catch(() => null);

  if (!submarket) notFound();

  const listings = await getListingsBySubmarket(submarket.name).catch(() => []);

  return (
    <>
      <Header variant="minimal" />
      <main className="min-h-screen pt-20">
        {/* Back */}
        <div className="border-b border-border bg-background-cream py-4">
          <Container>
            <Link href="/submarkets" className="inline-flex items-center gap-2 text-body-sm text-foreground-muted hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to Submarkets
            </Link>
          </Container>
        </div>

        {/* Hero */}
        <section className="relative bg-primary py-16 text-white overflow-hidden">
          {submarket.image_url && (
            <Image src={submarket.image_url} alt={submarket.name} fill className="object-cover opacity-30" priority />
          )}
          <Container className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-gold">
              <MapPin className="h-4 w-4" />
              <span className="overline">San Antonio Submarket</span>
            </div>
            <h1 className="font-heading text-display font-bold">{submarket.name}</h1>
            {submarket.description && (
              <p className="mt-4 max-w-2xl text-body-lg text-white/80">{submarket.description}</p>
            )}
            {Array.isArray(submarket.zip_codes) && submarket.zip_codes.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {submarket.zip_codes.map((z: string) => (
                  <span key={z} className="rounded-full bg-white/10 px-3 py-1 text-caption backdrop-blur-sm">{z}</span>
                ))}
              </div>
            )}
          </Container>
        </section>

        {/* Highlights */}
        {Array.isArray(submarket.highlights) && submarket.highlights.length > 0 && (
          <section className="bg-white border-b border-border py-8">
            <Container>
              <h2 className="mb-4 text-caption font-semibold uppercase tracking-widest text-gold">Submarket Highlights</h2>
              <div className="flex flex-wrap gap-3">
                {submarket.highlights.map((h: string) => (
                  <span key={h} className="rounded-full border border-border px-4 py-2 text-body-sm text-primary">{h}</span>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* Active Listings */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <h2 className="mb-8 font-heading text-display-sm font-bold text-primary">
              Available Properties in {submarket.name}
            </h2>
            {listings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
                <Building2 className="mx-auto mb-3 h-10 w-10 text-foreground-subtle" />
                <p className="text-body text-foreground-muted">
                  No active listings in {submarket.name} right now. <Link href="/tenant-needs" className="text-gold hover:text-gold-dark">Tell us what you&apos;re looking for</Link> and we&apos;ll bring options to you, including off-market.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map(listing => (
                  <Link key={listing.id} href={`/listings/${listing.slug}`} className="card-luxury group block">
                    <div className="image-luxury aspect-property bg-background-warm relative">
                      {listing.images && (listing.images as string[])[0] ? (
                        <Image src={(listing.images as string[])[0]} alt={listing.title} fill className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-foreground-subtle"><Building2 className="h-10 w-10" /></div>
                      )}
                      <span className="absolute top-3 left-3 rounded-full bg-gold px-3 py-1 text-caption font-semibold text-primary uppercase">
                        {transactionLabel(listing.transaction_type)}
                      </span>
                    </div>
                    <div className="p-6">
                      <p className="mb-1 text-caption text-foreground-muted">{propertyTypeLabel(listing.property_type)}</p>
                      <h3 className="mb-2 font-heading text-heading-sm font-semibold text-primary group-hover:text-gold transition-colors">{listing.title}</h3>
                      <p className="mb-3 price-tag">
                        {listing.transaction_type === 'sale' && listing.sale_price
                          ? formatPrice(listing.sale_price)
                          : listing.lease_rate
                            ? formatLeaseRate(listing.lease_rate, listing.lease_rate_basis)
                            : 'Contact for pricing'}
                      </p>
                      <p className="text-caption text-foreground-muted border-t border-border pt-3">{formatSqft(listing.sqft)}{listing.zoning ? ` · Zoning ${listing.zoning}` : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Container>
        </section>

        {/* CTA */}
        <section className="section-compact bg-primary text-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-heading text-display-sm font-bold mb-4">Looking for space in {submarket.name}?</h2>
              <p className="text-body text-white/70 mb-8">
                Tell us what you need — size, budget, must-haves — and a CRECO broker will respond within one business day.
              </p>
              <Button size="lg" asChild>
                <Link href="/tenant-needs">Submit Tenant Needs</Link>
              </Button>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
