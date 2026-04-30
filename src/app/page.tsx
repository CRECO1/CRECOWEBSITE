export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Texas Commercial Real Estate | Retail, Industrial & Office | CRECO',
  description:
    'Texas commercial real estate — retail, industrial, and office properties for lease and sale. Tenant representation, owner services, and portfolio advisory for multi-property owners across Texas. Headquartered in San Antonio, working deals statewide.',
  keywords: [
    'Texas commercial real estate',
    'commercial real estate Texas',
    'commercial property Texas',
    'retail space for lease Texas',
    'industrial property for lease Texas',
    'office space for lease Texas',
    'commercial property for sale Texas',
    'tenant representation Texas',
    'commercial property owner services Texas',
    'portfolio commercial real estate Texas',
    'commercial real estate broker Texas',
    'San Antonio commercial real estate',
    'Austin commercial real estate',
    'Houston commercial real estate',
    'Dallas Fort Worth commercial real estate',
  ],
  openGraph: {
    title: 'Texas Commercial Real Estate | CRECO',
    description:
      'Retail, industrial, and office commercial property across Texas. Tenant representation, owner services, and portfolio advisory.',
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
  Briefcase, Warehouse, Store, Layers, LineChart, Wrench, Leaf, BadgeCheck,
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
    headline: '16,100 SF industrial warehouse with dock and grade doors',
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
    headline: 'Texas office building on 1.7 acres — owner / user opportunity',
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
    headline: '26,400 SF industrial warehouse, I-1 zoning',
    images: null,
    status: 'active',
  },
];

const DEMO_TESTIMONIALS = [
  { id: '1', client_name: 'Michael Reyes', client_location: 'Operations Director, South Texas Logistics', quote: 'CRECO found us a 24,000 SF Texas warehouse in Northeast San Antonio that fit our docking and clear-height needs perfectly — and negotiated three months free rent. Smooth from tour to keys.', rating: 5 },
  { id: '2', client_name: 'Janet Whitaker', client_location: 'Owner, Whitaker Family Holdings (12-property Texas portfolio)', quote: 'We were sitting on an underperforming retail strip for years. CRECO repositioned the tenant mix, raised NOI 22%, and sold above pro forma. They get how multi-property owners think.', rating: 5 },
  { id: '3', client_name: 'David Kim', client_location: 'Founder, Alamo Tech Studio', quote: 'First-time office lease for our team and they walked us through every line of the LOI. No pressure, no jargon — just straight advice.', rating: 5 },
];

// SERVICES — ordered by what brings owners and tenants in the door
const SERVICES = [
  { icon: Briefcase, title: 'Tenant Representation', description: 'We work for tenants — never landlords on the same deal — to find the right Texas commercial space at the right terms.' },
  { icon: Building2, title: 'Owner Services & Leasing', description: 'Owner-side leasing and sales across retail, industrial, office, and land. Marketing, negotiation, diligence to close.' },
  { icon: LineChart, title: 'Investment Advisory', description: 'Underwriting, market analysis, and portfolio strategy for multi-property owners and investors across Texas.' },
  { icon: Wrench, title: 'Property Management', description: 'Day-to-day operations and tenant relations for commercial assets — built for owners with multiple Texas properties.' },
  { icon: Layers, title: 'Property Development', description: 'Site selection, entitlements, pro forma, and construction coordination — concept through stabilization.' },
  { icon: Leaf, title: 'Sustainability Consulting', description: 'Energy audits, ESG strategy, and retrofit ROI analysis for commercial owners and institutional investors.' },
];

// PROPERTY_TYPES — retail first, then industrial, then office (per business priority)
const PROPERTY_TYPES = [
  { icon: Store, label: 'Retail', href: '/listings?type=retail', description: 'Strip centers, freestanding, restaurant, urban storefront' },
  { icon: Warehouse, label: 'Industrial', href: '/listings?type=warehouse', description: 'Warehouse, distribution, light manufacturing, flex-industrial' },
  { icon: Briefcase, label: 'Office', href: '/listings?type=office', description: 'Class A/B/C, medical, professional, executive suites' },
  { icon: Layers, label: 'Flex', href: '/listings?type=flex', description: 'Mixed office + warehouse / showroom configurations' },
  { icon: MapPin, label: 'Land', href: '/listings?type=land', description: 'Raw or improved land for commercial development' },
];

// Texas markets we serve — homepage geo grid for SEO
const TEXAS_MARKETS = [
  { city: 'San Antonio', headline: 'HQ', tagline: 'Northwest, North Central, Northeast, Downtown, Far West' },
  { city: 'Austin', headline: '', tagline: 'CBD, Northwest, Round Rock, Cedar Park' },
  { city: 'Houston', headline: '', tagline: 'Galleria, Energy Corridor, Northwest, Sugar Land' },
  { city: 'Dallas–Fort Worth', headline: '', tagline: 'Uptown, Las Colinas, Plano, Frisco, Arlington' },
  { city: 'New Braunfels', headline: '', tagline: 'I-35 corridor between Austin & San Antonio' },
  { city: 'Corpus Christi', headline: '', tagline: 'Coastal industrial and retail' },
];

const FAQS = [
  {
    q: 'What types of commercial real estate does CRECO handle in Texas?',
    a: 'CRECO is a full-service Texas commercial real estate firm. We handle retail (strip centers, restaurants, freestanding, urban storefronts), industrial and warehouse (distribution, light manufacturing, flex-industrial), office (Class A/B/C, medical, professional), flex space, and commercial land — for lease, sale, and investment.',
  },
  {
    q: 'Where in Texas do you work?',
    a: 'We are headquartered in San Antonio with active brokerage and advisory work across the major Texas commercial markets — including Austin, Houston, Dallas–Fort Worth, El Paso, Corpus Christi, New Braunfels, and the Hill Country. If your property or search is in Texas, we cover it.',
  },
  {
    q: 'Do you work with multi-property owners and investors?',
    a: 'Yes — multi-property owners are core to our practice. We provide portfolio strategy, hold/sell analysis, repositioning, 1031 exchange identification, tenant mix optimization, and ongoing property management for owners with 5 to 100+ commercial Texas properties. Our owner services are built for institutional-quality reporting at boutique-firm responsiveness.',
  },
  {
    q: 'How does tenant representation work?',
    a: 'When you hire CRECO as your tenant rep, we work for you exclusively on that transaction — never representing the landlord on the same deal. We identify candidate spaces across Texas, run financial comparison analyses, draft and negotiate the LOI and lease, and coordinate buildout. The landlord pays our commission per market convention, so tenant representation is typically free to the tenant.',
  },
  {
    q: 'How do I list my commercial property with CRECO?',
    a: 'Submit a property opinion request on our /sell page or call us at (210) 817-3443. We will tour the property, review your rent roll and operating history, benchmark recent comparable Texas transactions, and deliver a no-obligation Broker Opinion of Value (BOV) and recommended marketing strategy within one to two business days.',
  },
  {
    q: 'What makes CRECO different from CBRE, JLL, or Cushman & Wakefield?',
    a: 'The big national firms are great for institutional clients with $100M+ deals. CRECO serves the broad middle of the Texas market — entrepreneurs, family offices, multi-property owners with $1M to $50M assets, and growing tenants — with principal-level attention on every engagement. Every client works directly with a senior broker, not a junior associate handed off from someone you met at the pitch.',
  },
];

const DEFAULT_SETTINGS = {
  hero_headline: 'Texas Commercial Real Estate',
  hero_subheadline: 'Retail, industrial, and office properties for lease and sale across Texas. Tenant representation, owner services, and portfolio advisory — built for multi-property owners and growing tenants statewide.',
  hero_image_url: '/images/sa-hero.jpg' as string | null,
  stat_sf_transacted: '2.4M',
  stat_years_experience: 15,
  stat_satisfaction: '98%',
  stat_active_listings: 30,
  about_headline: 'A trailblazing approach to Texas commercial real estate.',
  about_text: 'CRECO is built on innovation, expertise, and a relentless commitment to client outcomes. We blend deep Texas market knowledge with the analytical rigor you would expect from a national firm — and we keep our roster small enough that every client works directly with a principal. From single-asset tenants to multi-property portfolio owners, we treat your assignment like our name is on the building.',
  cta_headline: 'Need space — or have space to fill?',
  cta_subheadline: 'Submit your tenant requirements or list your property in 2 minutes. A CRECO principal responds within one business day with vetted options or a no-obligation property opinion.',
  phone: '(210) 817-3443',
  email: 'info@crecotx.com',
  address: 'San Antonio, TX',
};

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
    { value: `${s.stat_years_experience ?? DEFAULT_SETTINGS.stat_years_experience}+`, label: 'Years in Texas CRE', icon: Award },
    { value: s.stat_satisfaction ?? DEFAULT_SETTINGS.stat_satisfaction, label: 'Client Satisfaction', icon: Star },
    { value: String(s.stat_active_listings ?? DEFAULT_SETTINGS.stat_active_listings), label: 'Active Listings', icon: TrendingUp },
  ];

  return (
    <>
      {/* FAQ Schema for "People Also Ask" featured snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      <Header variant="transparent" />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        {s.hero_image_url ? (
          <Image
            src={s.hero_image_url}
            alt="Texas commercial real estate"
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
          <p className="overline mb-6 animate-fade-in-down text-gold">Texas Commercial Real Estate · Statewide Coverage</p>
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
              <Link href="/listings">View Texas Properties <ArrowRight className="ml-2 h-5 w-5" /></Link>
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

      {/* ── Property Types Quick Browse (retail-first) ─────────────────── */}
      <section className="bg-white border-b border-border">
        <Container>
          <div className="py-8 text-center">
            <p className="overline mb-2 text-foreground-muted">Browse Texas Properties</p>
            <h2 className="font-heading text-heading-lg font-bold text-primary">Find your space, your way</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pb-10">
            {PROPERTY_TYPES.map(({ icon: Icon, label, href, description }) => (
              <Link
                key={label}
                href={href}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border p-5 transition-all hover:border-gold hover:bg-gold/5 text-center"
              >
                <Icon className="h-8 w-8 text-gold" />
                <span className="font-heading font-semibold text-primary group-hover:text-gold-dark">{label}</span>
                <span className="text-caption text-foreground-muted line-clamp-2">{description}</span>
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
              <p className="overline mb-3">Hand-Picked Texas Properties</p>
              <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">Featured Properties</h2>
              <p className="mx-auto mt-6 max-w-xl text-body text-foreground-muted">
                Retail, industrial, and office properties currently available across Texas — vetted by CRECO principals.
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
                        {listing.transaction_type === 'lease' ? 'For Lease' : listing.transaction_type === 'sale' ? 'For Sale' : 'Lease or Sale'}
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
                      <span className="flex items-center gap-1.5"><Layers className="h-4 w-4" />{(listing.sqft ?? 0).toLocaleString()} SF</span>
                      {listing.zoning && <span className="flex items-center gap-1.5">Zoning {listing.zoning}</span>}
                    </div>
                  </div>
                </Link>
              </RevealOnScroll>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link href="/listings">View All Texas Properties <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* ── Texas Markets We Serve ──────────────────────────────────── */}
      <section className="section-luxury bg-white">
        <Container>
          <RevealOnScroll>
            <div className="mb-14 text-center">
              <p className="overline mb-3">Statewide Coverage</p>
              <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">Texas Markets We Serve</h2>
              <p className="mx-auto mt-6 max-w-2xl text-body text-foreground-muted">
                Headquartered in San Antonio with active brokerage and advisory across the major Texas commercial real estate markets. If your deal is in Texas, we cover it.
              </p>
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEXAS_MARKETS.map((m, i) => (
              <RevealOnScroll key={m.city} delay={i * 80}>
                <div className="rounded-xl border border-border bg-white p-6 hover:border-gold hover:shadow-card-hover transition-all h-full">
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-1 h-5 w-5 text-gold shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading text-heading-sm font-bold text-primary">{m.city}, TX</h3>
                        {m.headline && (
                          <span className="rounded-full bg-gold/15 px-2 py-0.5 text-caption font-semibold text-gold-dark">{m.headline}</span>
                        )}
                      </div>
                      <p className="mt-1 text-caption text-foreground-muted">{m.tagline}</p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Services ─────────────────────────────────────────────────── */}
      <section className="section-luxury bg-background-cream">
        <Container>
          <RevealOnScroll>
            <div className="mb-14 text-center">
              <p className="overline mb-3">What We Do</p>
              <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">Texas Commercial Real Estate Services</h2>
              <p className="mx-auto mt-6 max-w-2xl text-body text-foreground-muted">
                A full-service Texas commercial real estate firm. Whether you&apos;re a tenant leasing your first office, an owner repositioning a portfolio, or an investor underwriting your tenth deal — we cover the full lifecycle.
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

      {/* ── Owner Services CTA Strip — speaks to dream client ─────────── */}
      <section className="bg-primary text-white py-12">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2">
              <p className="overline mb-2 text-gold">For Multi-Property Owners</p>
              <h2 className="font-heading text-display-sm font-bold mb-3">Built for Texas commercial property owners with portfolios.</h2>
              <p className="text-body text-white/70">
                Hold/sell analysis. Repositioning strategy. 1031 exchange identification. Tenant mix optimization. Property management with institutional-quality reporting at boutique-firm responsiveness. CRECO is your Texas commercial real estate operating partner.
              </p>
            </div>
            <div className="text-center lg:text-right">
              <Button size="lg" className="bg-gold text-primary hover:bg-gold-light" asChild>
                <Link href="/owner-services">Owner Services <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Why Us ───────────────────────────────────────────────────── */}
      <section className="section-luxury bg-white">
        <Container>
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
            <RevealOnScroll direction="left">
              <p className="overline mb-4 text-gold">Why CRECO</p>
              <h2 className="mb-6 font-heading text-display-sm font-bold text-primary">
                {s.about_headline}
              </h2>
              <p className="mb-8 text-body-lg text-foreground-muted">{s.about_text}</p>
              <ul className="space-y-4 mb-10">
                {[
                  'Statewide Texas market knowledge with deep San Antonio roots',
                  'Principal-level service on every engagement — never handed off',
                  'Owner-side and tenant-side fluency across retail, industrial, office, flex, and land',
                  'Portfolio-level reporting and strategy for multi-property owners',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-body text-foreground-muted">
                    <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-gold" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                <Button size="lg" asChild><Link href="/team">Meet the Team</Link></Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/sell">List My Property</Link>
                </Button>
              </div>
            </RevealOnScroll>
            <RevealOnScroll direction="right">
              <div className="grid grid-cols-2 gap-5">
                {STATS.map(({ value, label, icon: Icon }) => (
                  <div key={label} className="rounded-xl border border-border bg-background-cream p-6 text-center">
                    <Icon className="mx-auto mb-3 h-8 w-8 text-gold" />
                    <div className="font-heading text-display-sm font-bold text-primary">{value}</div>
                    <div className="mt-1 text-caption uppercase tracking-wider text-foreground-muted">{label}</div>
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

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="section-luxury bg-white">
        <Container>
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="overline mb-3">People Also Ask</p>
              <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">Texas Commercial Real Estate FAQ</h2>
            </div>
          </RevealOnScroll>
          <div className="mx-auto max-w-3xl space-y-3">
            {FAQS.map((faq, i) => (
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

      {/* ── CTA ────────────────────────────────────────────────────── */}
      <section className="section-compact bg-gold">
        <Container>
          <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div>
              <h2 className="font-heading text-display-sm font-bold text-primary">{s.cta_headline}</h2>
              <p className="mt-2 text-body text-primary/70">{s.cta_subheadline}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Button size="xl" className="bg-white text-primary hover:bg-white/90 shadow-lg font-bold" asChild>
                <Link href="/tenant-needs"><Sparkles className="mr-2 h-5 w-5 text-gold" />Find Space</Link>
              </Button>
              <Button size="xl" className="bg-primary text-white hover:bg-primary/90 shadow-lg font-bold" asChild>
                <Link href="/sell">List My Property</Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      <Footer />
    </>
  );
}
