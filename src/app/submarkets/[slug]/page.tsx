export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MapPin, Building2, BarChart3, Users } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { getSubmarketBySlug, getListingsBySubmarket } from '@/lib/supabase';
import { formatSqft, formatLeaseRate, formatPrice, transactionLabel, propertyTypeLabel } from '@/lib/utils';
import { getSubmarketContent } from '@/lib/submarket-content';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const submarket = await getSubmarketBySlug(slug).catch(() => null);
  const richContent = getSubmarketContent(slug);
  const name = submarket?.name ?? slug;
  return {
    title: `San Antonio ${name} Commercial Real Estate | Submarket Profile | CRECO`,
    description:
      richContent?.overview[0]?.substring(0, 160)
      ?? `Commercial real estate in San Antonio's ${name} submarket — retail, industrial, office, and flex properties for lease and sale. Submarket profile, market fundamentals, and current listings from CRECO.`,
    keywords: [
      `${name.toLowerCase()} san antonio commercial real estate`,
      `${name.toLowerCase()} commercial property`,
      `${name.toLowerCase()} retail space for lease`,
      `${name.toLowerCase()} office space for lease`,
      `${name.toLowerCase()} warehouse for lease`,
    ],
    alternates: { canonical: `https://www.crecotx.com/submarkets/${slug}` },
  };
}

export default async function SubmarketDetailPage({ params }: Props) {
  const { slug } = await params;
  const submarket = await getSubmarketBySlug(slug).catch(() => null);

  if (!submarket) notFound();

  const richContent = getSubmarketContent(slug);
  const listings = await getListingsBySubmarket(submarket.name).catch(() => []);

  return (
    <>
      {/* FAQ Schema */}
      {richContent?.faqs && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: richContent.faqs.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />
      )}

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
            <Image src={submarket.image_url} alt={`${submarket.name} San Antonio`} fill sizes="100vw" className="object-cover opacity-30" priority />
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

        {/* Rich market overview */}
        {richContent?.overview && (
          <section className="section-luxury bg-white">
            <Container>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div>
                  <p className="overline mb-3 text-gold">Market Overview</p>
                  <h2 className="font-heading text-heading-xl font-bold text-primary">About {submarket.name}</h2>
                </div>
                <div className="lg:col-span-2 space-y-5">
                  {richContent.overview.map((para, i) => (
                    <p key={i} className="text-body-lg text-foreground-muted leading-relaxed">{para}</p>
                  ))}
                </div>
              </div>
            </Container>
          </section>
        )}

        {/* Market fundamentals */}
        {richContent?.fundamentals && (
          <section className="section-luxury bg-background-cream">
            <Container>
              <div className="mb-10">
                <p className="overline mb-3">Market Data</p>
                <h2 className="font-heading text-heading-xl font-bold text-primary flex items-center gap-3">
                  <BarChart3 className="h-7 w-7 text-gold" />
                  {submarket.name} Market Fundamentals
                </h2>
                <p className="mt-2 text-caption text-foreground-muted">Estimates based on recent CRECO transactions and Texas market analysis. Refresh periodically.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {richContent.fundamentals.map(f => (
                  <div key={f.label} className="rounded-xl bg-white border border-border p-5">
                    <div className="text-caption uppercase tracking-wider text-foreground-muted mb-2">{f.label}</div>
                    <div className="font-heading text-heading-sm font-bold text-primary">{f.value}</div>
                    {f.note && <div className="mt-1 text-caption text-foreground-muted">{f.note}</div>}
                  </div>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* Key buildings */}
        {richContent?.keyBuildings && (
          <section className="section-luxury bg-white">
            <Container>
              <div className="mb-10">
                <p className="overline mb-3">Notable Properties</p>
                <h2 className="font-heading text-heading-xl font-bold text-primary">Key {submarket.name} Buildings & Districts</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {richContent.keyBuildings.map(b => (
                  <div key={b.name} className="rounded-xl border border-border bg-white p-6">
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-1 h-5 w-5 shrink-0 text-gold" />
                      <div>
                        <h3 className="font-heading text-heading-sm font-bold text-primary">{b.name}</h3>
                        <p className="mt-2 text-body-sm text-foreground-muted leading-relaxed">{b.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* Typical tenants */}
        {richContent?.typicalTenants && (
          <section className="section-luxury bg-background-cream">
            <Container>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div>
                  <p className="overline mb-3">Tenant Profile</p>
                  <h2 className="font-heading text-heading-xl font-bold text-primary flex items-start gap-3">
                    <Users className="mt-1 h-7 w-7 text-gold" />
                    Who Leases in {submarket.name}
                  </h2>
                </div>
                <div className="lg:col-span-2">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {richContent.typicalTenants.map(t => (
                      <li key={t} className="flex items-start gap-3 text-body text-foreground-muted">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Container>
          </section>
        )}

        {/* Active Listings */}
        <section className="section-luxury bg-white">
          <Container>
            <h2 className="mb-8 font-heading text-display-sm font-bold text-primary">
              Available Properties in {submarket.name}
            </h2>
            {listings.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background-cream p-12 text-center">
                <Building2 className="mx-auto mb-3 h-10 w-10 text-foreground-subtle" />
                <p className="text-body text-foreground-muted">
                  No active listings in {submarket.name} right now. <Link href="/tenant-needs" className="text-gold hover:text-gold-dark font-semibold">Tell us what you&apos;re looking for</Link> and we&apos;ll bring options to you, including off-market.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map(listing => (
                  <Link key={listing.id} href={`/listings/${listing.slug}`} className="card-luxury group block">
                    <div className="image-luxury aspect-property bg-background-warm relative">
                      {listing.images && (listing.images as string[])[0] ? (
                        <Image src={(listing.images as string[])[0]} alt={listing.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
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

        {/* FAQ */}
        {richContent?.faqs && (
          <section className="section-luxury bg-background-cream">
            <Container>
              <div className="mb-10 text-center">
                <p className="overline mb-3">People Also Ask</p>
                <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">
                  {submarket.name} FAQ
                </h2>
              </div>
              <div className="mx-auto max-w-3xl space-y-3">
                {richContent.faqs.map(faq => (
                  <details key={faq.q} className="group rounded-xl border border-border bg-white open:border-gold open:shadow-card-hover transition-all">
                    <summary className="flex cursor-pointer items-start justify-between gap-4 p-6 text-left font-heading text-heading-sm font-semibold text-primary marker:hidden list-none">
                      <span>{faq.q}</span>
                      <span className="shrink-0 text-2xl text-gold transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="px-6 pb-6 text-body text-foreground-muted leading-relaxed">{faq.a}</div>
                  </details>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* CTA */}
        <section className="section-compact bg-primary text-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-heading text-display-sm font-bold mb-4">Looking for space in {submarket.name}?</h2>
              <p className="text-body text-white/70 mb-8">
                Tell us what you need — size, budget, must-haves — and a CRECO broker will respond within one business day with vetted options across the {submarket.name} submarket.
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
