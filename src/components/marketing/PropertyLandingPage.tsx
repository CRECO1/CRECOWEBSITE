/**
 * Reusable landing-page template for keyword-focused property type pages.
 * Used by /texas-retail-space-for-lease, /texas-industrial-property-for-lease,
 * /texas-office-space-for-lease, /texas-commercial-property-for-sale.
 *
 * Each instance:
 *  - Renders an SEO-optimized hero with the target keyword as the H1
 *  - Pulls live listings filtered to the relevant property_type / transaction_type
 *  - Falls back to demo content if the DB has nothing in this category yet
 *  - Includes an FAQ block + FAQ schema for "People Also Ask" featured snippets
 *  - Cross-links to related pages and the tenant-needs / sell forms
 */

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Building2, Layers, MapPin, CheckCircle, Phone, Sparkles,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import {
  formatPrice, formatSqft, formatLeaseRate, transactionLabel, propertyTypeLabel,
} from '@/lib/utils';
import type { Listing, PropertyType, TransactionType, LandingPageContent } from '@/lib/supabase';
import { getListings } from '@/lib/supabase';

export interface LandingFAQ { q: string; a: string }

export interface PropertyLandingConfig {
  /** Used in <title> and H1 — must contain the primary target keyword. */
  h1: string;
  /** Hero subheadline — supporting paragraph that reinforces intent. */
  subhead: string;
  /** Eyebrow text above the H1, e.g. "Texas Commercial Real Estate". */
  eyebrow: string;
  /** Filter to apply when fetching listings. */
  filterPropertyTypes?: PropertyType[];
  filterTransactionType?: TransactionType | null;   // null = sale OR both
  /** Demo listings if DB is empty. */
  demoListings: Partial<Listing>[];
  /** "Why Texas" market-context bullet points. */
  marketBullets: { title: string; body: string }[];
  /** "Why CRECO" advantage bullet points. */
  whyBullets: string[];
  faqs: LandingFAQ[];
  /** Related pages to link in the cross-link footer. */
  relatedLinks: { href: string; label: string }[];
  /** Primary CTA — typically /tenant-needs for lease pages, /sell for sale pages. */
  primaryCta: { href: string; label: string };
  /** Secondary CTA. */
  secondaryCta?: { href: string; label: string };
}

interface Props {
  config: PropertyLandingConfig;
  /**
   * Optional admin-editable content from the landing_pages table. When present,
   * fields override the corresponding config fields below. Pass `null` if the
   * DB row is missing — the page falls back to the hardcoded config.
   */
  dbContent?: LandingPageContent | null;
}

/**
 * Merge admin-editable DB content into the hardcoded fallback config.
 * DB wins on each field; if DB field is empty, falls back to config.
 */
function mergeConfig(config: PropertyLandingConfig, db: LandingPageContent | null | undefined): PropertyLandingConfig {
  if (!db) return config;
  return {
    ...config,
    eyebrow: db.eyebrow || config.eyebrow,
    h1: db.h1 || config.h1,
    subhead: db.subhead || config.subhead,
    marketBullets: (db.market_bullets && db.market_bullets.length > 0) ? db.market_bullets : config.marketBullets,
    whyBullets: (db.why_bullets && db.why_bullets.length > 0) ? db.why_bullets : config.whyBullets,
    faqs: (db.faqs && db.faqs.length > 0) ? db.faqs : config.faqs,
  };
}

export async function PropertyLandingPage({ config: configIn, dbContent }: Props) {
  const config = mergeConfig(configIn, dbContent);
  // Fetch listings and apply the configured filters
  const allListings = await getListings('active').catch(() => [] as Listing[]);
  const filtered = allListings.filter(l => {
    const typeOk = !config.filterPropertyTypes || config.filterPropertyTypes.includes(l.property_type);
    const txnOk = !config.filterTransactionType
      || l.transaction_type === config.filterTransactionType
      || l.transaction_type === 'both';
    return typeOk && txnOk;
  });

  const listings = filtered.length > 0 ? filtered.slice(0, 6) : config.demoListings;

  return (
    <>
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: config.faqs.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-20 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-15"
            style={{ backgroundImage: "url('/images/sa-hero.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <Container className="relative z-10">
            <div className="max-w-3xl">
              <p className="overline mb-4 text-gold">{config.eyebrow}</p>
              <h1 className="font-heading text-display font-bold mb-6">{config.h1}</h1>
              <p className="text-body-lg text-white/80 mb-8">{config.subhead}</p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href={config.primaryCta.href}>
                    {config.primaryCta.label} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                {config.secondaryCta && (
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                    <Link href={config.secondaryCta.href}>
                      <Phone className="mr-2 h-4 w-4" /> {config.secondaryCta.label}
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </Container>
        </section>

        {/* Live listings of this category */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <RevealOnScroll>
              <div className="mb-10 text-center">
                <p className="overline mb-3">Currently Available</p>
                <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">Available Properties</h2>
                <p className="mx-auto mt-4 max-w-xl text-body text-foreground-muted">
                  {listings.length > 0
                    ? `${listings.length} properties available now — vetted by CRECO principals.`
                    : 'New properties coming soon. Submit your requirements and we will bring vetted options to you.'}
                </p>
              </div>
            </RevealOnScroll>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing: any, i: number) => (
                <RevealOnScroll key={listing.id ?? i} delay={i * 80}>
                  <Link href={`/listings/${listing.slug}`} className="card-luxury group block">
                    <div className="image-luxury aspect-property bg-background-warm relative">
                      {listing.images && (listing.images as string[])[0] ? (
                        <Image src={(listing.images as string[])[0]} alt={listing.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-foreground-subtle">
                          <Building2 className="h-12 w-12" />
                        </div>
                      )}
                      {listing.transaction_type && (
                        <span className="absolute top-3 left-3 rounded-full bg-gold px-3 py-1 text-caption font-semibold text-primary uppercase">
                          {transactionLabel(listing.transaction_type)}
                        </span>
                      )}
                    </div>
                    <div className="p-6">
                      <p className="mb-1 text-caption text-foreground-muted">
                        <MapPin className="mr-1 inline h-3 w-3" />
                        {listing.city ?? 'San Antonio'}, TX
                      </p>
                      <h3 className="mb-2 font-heading text-heading-sm font-semibold text-primary group-hover:text-gold transition-colors">
                        {listing.title}
                      </h3>
                      {listing.headline && (
                        <p className="mb-4 text-body-sm text-foreground-muted line-clamp-2">{listing.headline}</p>
                      )}
                      <p className="mb-3 price-tag">
                        {listing.transaction_type === 'sale' && listing.sale_price
                          ? formatPrice(listing.sale_price)
                          : listing.lease_rate
                            ? formatLeaseRate(listing.lease_rate, listing.lease_rate_basis)
                            : 'Contact for pricing'}
                      </p>
                      <div className="flex items-center gap-3 text-caption text-foreground-muted border-t border-border pt-3">
                        <span>{propertyTypeLabel(listing.property_type)}</span>
                        <span>·</span>
                        <span>{formatSqft(listing.sqft)}</span>
                      </div>
                    </div>
                  </Link>
                </RevealOnScroll>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" asChild>
                <Link href="/listings">View All Texas Properties <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </Container>
        </section>

        {/* Market context */}
        <section className="section-luxury bg-white">
          <Container>
            <RevealOnScroll>
              <div className="mb-12 text-center">
                <p className="overline mb-3">Texas Market Context</p>
                <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">Why this market matters</h2>
              </div>
            </RevealOnScroll>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {config.marketBullets.map((m, i) => (
                <RevealOnScroll key={m.title} delay={i * 80}>
                  <div className="rounded-xl border border-border bg-white p-6 h-full">
                    <h3 className="mb-3 font-heading text-heading-sm font-bold text-primary">{m.title}</h3>
                    <p className="text-body-sm text-foreground-muted leading-relaxed">{m.body}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* Why CRECO */}
        <section className="section-luxury bg-primary text-white">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <RevealOnScroll direction="left">
                <p className="overline mb-3 text-gold">Why CRECO</p>
                <h2 className="mb-6 font-heading text-display-sm font-bold">
                  Texas commercial real estate, principal-led.
                </h2>
                <p className="mb-6 text-body-lg text-white/70">
                  Every CRECO engagement is led by a principal broker — not handed off to a junior associate. We blend deep Texas market knowledge with the analytical rigor you would expect from a national firm.
                </p>
                <ul className="space-y-3">
                  {config.whyBullets.map(item => (
                    <li key={item} className="flex items-start gap-3 text-body text-white/80">
                      <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </RevealOnScroll>
              <RevealOnScroll direction="right">
                <div className="rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-8">
                  <Sparkles className="mb-4 h-8 w-8 text-gold" />
                  <h3 className="mb-3 font-heading text-heading-lg font-bold">Talk to a Texas CRE principal</h3>
                  <p className="mb-6 text-body text-white/70">
                    No-pressure consultation. We&apos;ll listen to your needs and recommend an approach — even if that means pointing you somewhere else.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="md" fullWidth asChild>
                      <Link href={config.primaryCta.href}>{config.primaryCta.label}</Link>
                    </Button>
                    <a
                      href="tel:+12108173443"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 font-semibold hover:bg-white/10 transition-colors"
                    >
                      <Phone className="h-4 w-4" /> (210) 817-3443
                    </a>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <RevealOnScroll>
              <div className="mb-10 text-center">
                <p className="overline mb-3">People Also Ask</p>
                <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">Frequently Asked Questions</h2>
              </div>
            </RevealOnScroll>
            <div className="mx-auto max-w-3xl space-y-3">
              {config.faqs.map((faq, i) => (
                <RevealOnScroll key={faq.q} delay={i * 50}>
                  <details className="group rounded-xl border border-border bg-white open:border-gold open:shadow-card-hover transition-all">
                    <summary className="flex cursor-pointer items-start justify-between gap-4 p-6 text-left font-heading text-heading-sm font-semibold text-primary marker:hidden list-none">
                      <span>{faq.q}</span>
                      <span className="shrink-0 text-2xl text-gold transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="px-6 pb-6 text-body text-foreground-muted leading-relaxed">{faq.a}</div>
                  </details>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* Related pages — internal linking for SEO */}
        <section className="bg-white py-12 border-y border-border">
          <Container>
            <p className="overline mb-4 text-center">Explore More</p>
            <div className="flex flex-wrap justify-center gap-3">
              {config.relatedLinks.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-full border border-border px-5 py-2.5 text-body-sm text-primary hover:border-gold hover:bg-gold/5 transition-all"
                >
                  {l.label} <Layers className="inline ml-1 h-3 w-3" />
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
