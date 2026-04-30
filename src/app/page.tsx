export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'San Antonio Commercial Real Estate | CRECO',
  description:
    'CRECO is a San Antonio commercial real estate company specializing in office, warehouse, flex, retail, and land — for tenants, owners, and investors across South Texas. Where your real estate ventures find the support they deserve.',
  keywords: [
    'San Antonio commercial real estate',
    'CRECO',
    'commercial property San Antonio',
    'San Antonio office space for lease',
    'San Antonio warehouse for lease',
    'San Antonio flex space for lease',
    'San Antonio retail space for lease',
    'tenant representation San Antonio',
    'commercial property management San Antonio',
    'San Antonio investment property',
  ],
  openGraph: {
    title: 'San Antonio Commercial Real Estate | CRECO',
    description:
      'Office, warehouse, flex, retail and land in San Antonio. Tenant representation, investment advisory, leasing & sales, development, and property management.',
    url: 'https://www.crecotx.com',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.crecotx.com',
  },
};

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Star, Building2, TrendingUp, Award, Sparkles, MapPin,
  Briefcase, Warehouse, Store, Layers, LineChart, Wrench, Leaf,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { getListings, getTestimonials, supabase } from '@/lib/supabase';

const DEMO_LISTINGS = [
  {
    id: '1',
    title: '1222 Chulie Dr',
    slug: '1222-chulie-dr',
    address: '1222 Chulie Dr, San Antonio, TX',
    city: 'San Antonio',
    property_type: 'warehouse',
    transaction_type: 'lease',
    sqft: 16100,
    lot_size: null,
    zoning: 'I-1',
    headline: '16,100 SF warehouse with dock and grade doors',
    images: null,
    status: 'active',
  },
  {
    id: '2',
    title: '1346 Parkridge Dr',
    slug: '1346-parkridge-dr',
    address: '1346 Parkridge Dr, San Antonio, TX',
    city: 'San Antonio',
    property_type: 'office',
    transaction_type: 'sale',
    sqft: 2475,
    lot_size: 1.7,
    zoning: 'C-2',
    headline: '1.7 acres with 2,475 SF office building',
    images: null,
    status: 'active',
  },
  {
    id: '3',
    title: '2250 Chipley Circle',
    slug: '2250-chipley-circle',
    address: '2250 Chipley Cir, San Antonio, TX',
    city: 'San Antonio',
    property_type: 'warehouse',
    transaction_type: 'lease',
    sqft: 26400,
    lot_size: null,
    zoning: 'I-1',
    headline: '26,400 SF warehouse, I-1 zoning',
    images: null,
    status: 'active',
  },
];

const DEMO_TESTIMONIALS = [
  { id: '1', client_name: 'Michael Reyes', client_location: 'Operations Director, South Texas Logistics', quote: 'CRECO found us a 24,000 SF warehouse in Northeast San Antonio that fit our docking and clear-height needs perfectly — and they negotiated three months free rent. Smooth from tour to keys.', rating: 5 },
  { id: '2', client_name: 'Janet Whitaker', client_location: 'Owner, Whitaker Family Holdings', quote: 'We were sitting on an underperforming retail strip for years. CRECO repositioned the tenant mix, raised NOI 22%, and sold above pro forma. Real expertise.', rating: 5 },
  { id: '3', client_name: 'David Kim', client_location: 'Founder, Alamo Tech Studio', quote: 'First-time office lease for our team and they walked us through every line of the LOI. No pressure, no jargon — just straight advice.', rating: 5 },
];

const SERVICES = [
  { icon: Briefcase, title: 'Tenant Representation', description: 'We work for tenants — never landlords on the same deal — to find the right space at the right terms.' },
  { icon: LineChart, title: 'Investment Advisory', description: 'Market analysis, underwriting, and strategic guidance for owners and investors.' },
  { icon: Building2, title: 'Leasing & Sales', description: 'Owner-side and tenant-side representation across office, industrial, retail, and land.' },
  { icon: Wrench, title: 'Property Management', description: 'Operational oversight, maintenance coordination, and tenant relations for commercial assets.' },
  { icon: Layers, title: 'Property Development', description: 'From conceptualization through completion — site selection, entitlements, and construction.' },
  { icon: Leaf, title: 'Sustainability Consulting', description: 'Energy audits, ESG strategy, and eco-friendly retrofit planning.' },
];

const PROPERTY_TYPES = [
  { icon: Briefcase, label: 'Office', href: '/listings?type=office' },
  { icon: Warehouse, label: 'Warehouse', href: '/listings?type=warehouse' },
  { icon: Layers, label: 'Flex', href: '/listings?type=flex' },
  { icon: Store, label: 'Retail', href: '/listings?type=retail' },
  { icon: MapPin, label: 'Land', href: '/listings?type=land' },
];

const DEFAULT_SETTINGS = {
  hero_headline: 'San Antonio Commercial Real Estate',
  hero_subheadline: 'Where your real estate ventures find the support they deserve. Office, warehouse, flex, retail, and land — for tenants, owners, and investors across South Texas.',
  hero_image_url: '/images/sa-hero.jpg' as string | null,
  stat_sf_transacted: '2.4M',
  stat_years_experience: 15,
  stat_satisfaction: '98%',
  stat_active_listings: 30,
  about_headline: 'A trailblazing approach to commercial real estate.',
  about_text: 'CRECO is built on innovation, expertise, and a relentless commitment to client outcomes. We blend deep San Antonio market knowledge with the analytical rigor you would expect from a national firm — and we keep our roster small enough that every client works directly with a principal.',
  cta_headline: 'Need space? Tell us what you\'re looking for.',
  cta_subheadline: 'Submit your tenant needs in 2 minutes and we\'ll send vetted options that match your size, budget, and submarket.',
  phone: '(210) 817-3443',
  email: 'info@crecotx.com',
  address: 'San Antonio, TX',
};

function formatSqft(n: number | null | undefined) {
  if (!n) return '—';
  return `${n.toLocaleString()} SF`;
}

function txnLabel(t: string | null | undefined) {
  if (!t) return '';
  if (t === 'lease') return 'For Lease';
  if (t === 'sale') return 'For Sale';
  if (t === 'both') return 'Lease or Sale';
  return t;
}

export default async function HomePage() {
  const [listingsResult, testimonialsResult, settingsResult] = await Promise.allSettled([
    getListings('active'),
    getTestimonials(true),
    supabase.from('site_settings').select('*').eq('id', 1).single(),
  ]);

  const featuredListings = listingsResult.status === 'fulfilled' && listingsResult.value.length > 0
    ? listingsResult.value.slice(0, 3) : DEMO_LISTINGS;

  const featuredTestimonials = testimonialsResult.status === 'fulfilled' && testimonialsResult.value.length > 0
    ? testimonialsResult.value.slice(0, 3) : DEMO_TESTIMONIALS;

  const s = (settingsResult.status === 'fulfilled' && settingsResult.value.data)
    ? settingsResult.value.data
    : DEFAULT_SETTINGS;

  const STATS = [
    { value: `${s.stat_sf_transacted ?? DEFAULT_SETTINGS.stat_sf_transacted}+`, label: 'SF Transacted', icon: Building2 },
    { value: `${s.stat_years_experience ?? DEFAULT_SETTINGS.stat_years_experience}+`, label: 'Years in San Antonio', icon: Award },
    { value: s.stat_satisfaction ?? DEFAULT_SETTINGS.stat_satisfaction, label: 'Client Satisfaction', icon: Star },
    { value: String(s.stat_active_listings ?? DEFAULT_SETTINGS.stat_active_listings), label: 'Active Listings', icon: TrendingUp },
  ];

  return (
    <>
      <Header variant="transparent" />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        {s.hero_image_url ? (
          <Image
            src={s.hero_image_url}
            alt="San Antonio skyline"
            fill
            className="object-cover opacity-40"
            priority
          />
        ) : (
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "url('/images/sa-hero.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        <div className="hero-overlay-luxury absolute inset-0" />

        <Container className="relative z-10 text-center text-white">
          <p className="overline mb-6 animate-fade-in-down text-gold">San Antonio Commercial Real Estate</p>
          <h1 className="mb-6 animate-fade-in-up font-heading text-display-xl font-bold text-white text-shadow-hero fill-both">
            {s.hero_headline.includes('\n')
              ? s.hero_headline.split('\n').map((line: string, i: number) => (
                <span key={i}>{i > 0 && <br />}{line}</span>
              ))
              : <><span className="text-gradient-gold">{s.hero_headline}</span></>
            }
          </h1>
          <p className="mx-auto mb-10 max-w-2xl animate-fade-in text-body-lg text-white/80 delay-200 fill-both">
            {s.hero_subheadline}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-fade-in delay-300 fill-both">
            <Button size="lg" asChild>
              <Link href="/listings">View Properties <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/tenant-needs"><Building2 className="mr-2 h-5 w-5" />Find My Space</Link>
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4 animate-fade-in delay-500 fill-both">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="mb-1 font-heading text-3xl font-bold text-gold">{value}</div>
                <div className="text-caption uppercase tracking-widest text-white/60">{label}</div>
              </div>
            ))}
          </div>
        </Container>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-10 w-6 rounded-full border-2 border-white/30 flex items-center justify-center">
            <div className="h-2 w-0.5 rounded-full bg-white/60" />
          </div>
        </div>
      </section>

      {/* ── Property Types Quick Browse ──────────────────────────────── */}
      <section className="bg-white border-b border-border">
        <Container>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 py-10">
            {PROPERTY_TYPES.map(({ icon: Icon, label, href }) => (
              <Link
                key={label}
                href={href}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border p-5 transition-all hover:border-gold hover:bg-gold/5"
              >
                <Icon className="h-8 w-8 text-gold" />
                <span className="font-heading font-semibold text-primary group-hover:text-gold-dark">{label}</span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Featured Listings ─────────────────────────────────────────── */}
      <section className="section-luxury bg-background-cream">
        <Container>
          <RevealOnScroll>
            <div className="mb-14 text-center">
              <p className="overline mb-3">Hand-Picked Properties</p>
              <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">Featured Properties</h2>
              <p className="mx-auto mt-6 max-w-xl text-body text-foreground-muted">
                Office, warehouse, flex, retail, and land currently available across the San Antonio market.
              </p>
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featuredListings.map((listing: any, i: number) => (
              <RevealOnScroll key={listing.id} delay={i * 100}>
                <Link href={`/listings/${listing.slug}`} className="card-luxury group block">
                  <div className="image-luxury aspect-property bg-background-warm relative">
                    {listing.images && (listing.images as string[])[0] ? (
                      <Image src={(listing.images as string[])[0]} alt={listing.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-foreground-subtle"><Building2 className="h-12 w-12" /></div>
                    )}
                    {listing.transaction_type && (
                      <span className="absolute top-3 left-3 rounded-full bg-gold px-3 py-1 text-caption font-semibold text-primary">
                        {txnLabel(listing.transaction_type)}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <p className="mb-1 text-caption uppercase tracking-wider text-foreground-muted">
                      <MapPin className="mr-1 inline h-3 w-3" />{listing.city ?? 'San Antonio'}, TX
                    </p>
                    <h3 className="mb-2 font-heading text-heading font-semibold text-primary group-hover:text-gold transition-colors">{listing.title}</h3>
                    {listing.headline && (
                      <p className="mb-4 text-body-sm text-foreground-muted line-clamp-2">{listing.headline}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-caption text-foreground-muted border-t border-border pt-4">
                      <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{(listing.property_type ?? '').toString().replace(/^./, (c: string) => c.toUpperCase())}</span>
                      <span className="flex items-center gap-1.5"><Layers className="h-4 w-4" />{formatSqft(listing.sqft)}</span>
                      {listing.zoning && <span className="flex items-center gap-1.5">Zoning {listing.zoning}</span>}
                    </div>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/listings">View All Properties <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* ── Services ─────────────────────────────────────────────────── */}
      <section className="section-luxury bg-white">
        <Container>
          <RevealOnScroll>
            <div className="mb-14 text-center">
              <p className="overline mb-3">What We Do</p>
              <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">Our Services</h2>
              <p className="mx-auto mt-6 max-w-2xl text-body text-foreground-muted">
                A full-service commercial real estate firm. Whether you&apos;re leasing your first office, repositioning a portfolio, or breaking ground on a development — we cover the full lifecycle.
              </p>
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, title, description }, i) => (
              <RevealOnScroll key={title} delay={i * 80}>
                <div className="h-full rounded-xl border border-border bg-white p-7 transition-all hover:border-gold hover:shadow-card-hover">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 font-heading text-heading font-semibold text-primary">{title}</h3>
                  <p className="text-body-sm text-foreground-muted leading-relaxed">{description}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/services">Explore All Services <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* ── Why Us ───────────────────────────────────────────────────── */}
      <section className="section-luxury bg-primary text-white">
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <RevealOnScroll direction="left">
              <p className="overline mb-4 text-gold">Why CRECO</p>
              <h2 className="mb-6 font-heading text-display-sm font-bold text-white">
                {s.about_headline}
              </h2>
              <p className="mb-8 text-body-lg text-white/70">{s.about_text}</p>
              <ul className="space-y-4 mb-10">
                {[
                  'Hyper-local San Antonio market knowledge',
                  'Principal-level service on every engagement',
                  'Tenant- and owner-side fluency across all asset types',
                  'Transparent underwriting and honest counsel',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-body text-white/80">
                    <span className="mt-1 h-5 w-5 rounded-full bg-gold flex items-center justify-center shrink-0">
                      <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                <Button size="lg" asChild><Link href="/team">Meet the Team</Link></Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link href="/sell">List My Property</Link>
                </Button>
              </div>
            </RevealOnScroll>
            <RevealOnScroll direction="right">
              <div className="grid grid-cols-2 gap-5">
                {STATS.map(({ value, label, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
                    <Icon className="mx-auto mb-3 h-8 w-8 text-gold" />
                    <div className="font-heading text-display-sm font-bold text-white">{value}</div>
                    <div className="mt-1 text-caption uppercase tracking-wider text-white/50">{label}</div>
                  </div>
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </Container>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────── */}
      <section className="section-luxury bg-background-cream">
        <Container>
          <RevealOnScroll>
            <div className="mb-14 text-center">
              <p className="overline mb-3">Client Stories</p>
              <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">What Our Clients Say</h2>
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {featuredTestimonials.map((t: any, i: number) => (
              <RevealOnScroll key={t.id} delay={i * 100}>
                <div className="rounded-xl bg-white p-8 shadow-card h-full flex flex-col">
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: t.rating ?? 5 }).map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="quote-luxury flex-1 text-foreground-muted">{t.quote}</p>
                  <div className="mt-6 pt-6 border-t border-border">
                    <p className="font-semibold text-primary">{t.client_name}</p>
                    {t.client_location && <p className="text-caption text-foreground-muted">{t.client_location}</p>}
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Tenant Needs CTA ────────────────────────────────────────── */}
      <section className="section-compact bg-gold">
        <Container>
          <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div>
              <h2 className="font-heading text-display-sm font-bold text-primary">{s.cta_headline}</h2>
              <p className="mt-2 text-body text-primary/70">{s.cta_subheadline}</p>
            </div>
            <Button size="xl" className="shrink-0 bg-white text-primary hover:bg-white/90 shadow-lg font-bold" asChild>
              <Link href="/tenant-needs"><Sparkles className="mr-2 h-5 w-5 text-gold" />Submit Tenant Needs</Link>
            </Button>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}
