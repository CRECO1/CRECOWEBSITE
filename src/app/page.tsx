// 30-min ISR — home reads the latest active listings + featured
// content. Re-rendered every 30 min instead of on every visit
// (which is what force-dynamic was doing). Saves edge-function
// quota without showing meaningfully-stale listings.
export const revalidate = 1800;

import type { Metadata } from 'next';
import { jsonLd } from '@/lib/jsonLd';

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
  ArrowRight, Star, Building2, Award, Sparkles, MapPin,
  Briefcase, Warehouse, Store, Layers, LineChart, Wrench, Leaf, BadgeCheck,
  BarChart3, Calculator,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { getListings, getTestimonials, supabase } from '@/lib/supabase';
import { withSyntheticListings, listingLinkProps } from '@/lib/featured-properties';
import { TrustStrip } from '@/components/marketing/TrustStrip';

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
    a: 'We are headquartered at 8000 Fair Oaks Pkwy in Fair Oaks Ranch, with active brokerage and advisory work across the major Texas commercial markets — San Antonio, Austin, Houston, Dallas–Fort Worth, El Paso, Corpus Christi, New Braunfels, Boerne, and the Hill Country. If your property or search is in Texas, we cover it.',
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
  about_headline: 'A trailblazing approach to Texas commercial real estate.',
  about_text: 'CRECO is built on innovation, expertise, and a relentless commitment to client outcomes. We blend deep Texas market knowledge with the analytical rigor you would expect from a national firm — and we keep our roster small enough that every client works directly with a principal. From single-asset tenants to multi-property portfolio owners, we treat your assignment like our name is on the building.',
  cta_headline: 'Need space — or have space to fill?',
  cta_subheadline: 'Submit your tenant requirements or list your property in 2 minutes. A CRECO principal responds within one business day with vetted options or a no-obligation property opinion.',
  phone: '(210) 817-3443',
  email: 'info@crecotx.com',
  address: '8000 Fair Oaks Pkwy, Suite 102\nFair Oaks Ranch, TX 78015',
};

export default async function HomePage() {
  const [listingsResult, testimonialsResult, settingsResult] = await Promise.allSettled([
    getListings('active'),
    getTestimonials(true),
    supabase.from('site_settings').select('*').eq('id', 1).single(),
  ]);

  // Pull active listings + prepend synthetic ones (Fair Oaks Plaza, etc.)
  // so a hand-curated property always anchors the Featured grid even when
  // the DB has fewer than 3 active rows. Slice to 3 for the homepage —
  // /listings shows the full set.
  //
  // The cast to `any` is intentional: DEMO_LISTINGS is a stripped-down
  // partial Listing shape used purely as a fallback for the card UI, and
  // the homepage cards already render with `as any` casts on every field
  // read. withSyntheticListings only inspects `slug` for dedupe, so the
  // partial shape is safe here.
  const dbListings = listingsResult.status === 'fulfilled' && listingsResult.value.length > 0
    ? listingsResult.value
    : (DEMO_LISTINGS as any[]);

  // Curated order for the homepage Featured grid. Synthetics and DB
  // listings are interleaved deliberately — the default
  // "synthetics-first" ordering from withSyntheticListings clustered
  // all the bespoke landing-page properties at the top, which made
  // the grid feel front-loaded. Mixing in DB listings (Chipley,
  // Louis Pasteur, Seventh St) inside the synthetic block gives the
  // page a more varied visual rhythm and prevents the synthetics
  // from looking like an island.
  //
  // To change the order: shuffle the slugs in this array. Anything
  // not listed here gets appended at the end so the slice stays at
  // 6 even if some slugs are absent (e.g. a synthetic gets removed
  // or a DB listing isn't active).
  const FEATURED_SLUG_ORDER = [
    '8000-fair-oaks-pkwy',                  // Plaza (synthetic)
    '2250-chipley-circle',                   // Chipley (DB)
    // Louis Pasteur's DB slug is `move-in-ready-medical-building`,
    // not `7830-louis-pasteur` — the slug is keyed to the headline
    // not the street address. Previous order used the wrong slug,
    // which is why Louis was getting pushed to the end of the
    // curated list (no match in the bySlug map) and Elkhorn was
    // floating into position 3 to fill its slot.
    'move-in-ready-medical-building',        // Louis Pasteur (DB)
    '523-seventh-st',                        // Seventh St (DB)
    '15033-main-st-lytle',                   // Lytle (synthetic)
    // Elkhorn moves to the end per owner request — swap Louis ↔
    // Elkhorn from the prior visible order. Elkhorn was previously
    // position 3 (incorrectly, due to the Louis slug mismatch
    // above); now it's position 6 as intended.
    '8979-dietz-elkhorn',                    // Elkhorn (synthetic)
  ];

  const allListings = withSyntheticListings(dbListings as any);
  const bySlug = new Map(allListings.map((l: any) => [l.slug, l]));
  const ordered = FEATURED_SLUG_ORDER
    .map(slug => bySlug.get(slug))
    .filter(Boolean);
  // Pad with anything not explicitly ordered so we always have 6
  // slots worth of content even if a slug in the curated list is
  // missing from the data source.
  const remaining = allListings.filter((l: any) => !FEATURED_SLUG_ORDER.includes(l.slug));
  const featuredListings = [...ordered, ...remaining].slice(0, 6);

  const featuredTestimonials = testimonialsResult.status === 'fulfilled' && testimonialsResult.value.length > 0
    ? testimonialsResult.value.slice(0, 3) : DEMO_TESTIMONIALS;

  const s = (settingsResult.status === 'fulfilled' && settingsResult.value.data)
    ? settingsResult.value.data
    : DEFAULT_SETTINGS;

  const STATS = [
    { value: `${s.stat_sf_transacted ?? DEFAULT_SETTINGS.stat_sf_transacted}+`, label: 'SF Transacted', icon: Building2 },
    { value: `${s.stat_years_experience ?? DEFAULT_SETTINGS.stat_years_experience}+`, label: 'Years in Texas CRE', icon: Award },
    { value: s.stat_satisfaction ?? DEFAULT_SETTINGS.stat_satisfaction, label: 'Client Satisfaction', icon: Star },
  ];

  return (
    <>
      {/* FAQ Schema for "People Also Ask" featured snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
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
      {/* pt-32 md:pt-24 guarantees the eyebrow + headline never crash into
          the fixed Header zone regardless of viewport height. Previously
          we relied on `min-h-screen items-center` to center content, but
          on shorter viewports the centered block could push the top
          eyebrow up behind the transparent header. */}
      {/* min-h-[100svh] uses the SMALL viewport height (URL bar
          visible), not the large one. On mobile Safari/Chrome, the
          previous `min-h-screen` (100vh) sized the hero to the URL-bar-
          hidden height — so when the browser first loaded and the URL
          bar was visible, the hero was taller than the visible area
          and users had to scroll to see the fold. svh eliminates that. */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-primary pt-32 md:pt-24 pb-12 md:pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        {s.hero_image_url ? (
          <Image
            src={s.hero_image_url}
            alt="Texas commercial real estate — office, industrial, and retail property across San Antonio, Austin, Houston, and Dallas–Fort Worth"
            fill
            sizes="100vw"
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

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-fade-in delay-300 fill-both">
            <Button size="lg" asChild>
              <Link href="/listings">Browse Texas Properties <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/get-started"><Building2 className="mr-2 h-5 w-5" />Tell us what you need</Link>
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-6 animate-fade-in delay-500 fill-both">
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

      {/* ── Trust Strip ───────────────────────────────────────────────── */}
      {/* Server component — fetches the live active-listings count + the
          operator-curated stats on every render so the band is honest
          without anyone hand-maintaining the numbers. */}
      <TrustStrip />

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
                {/* listingLinkProps handles both internal landing pages
                    (e.g. /8000-fair-oaks-pkwy) and external standalone
                    sites (e.g. elkhornpoint.com) — external ones spread
                    target="_blank" rel="noopener noreferrer" so the
                    visitor doesn't lose context of crecotx.com behind
                    them. Next.js Link silently treats external hrefs
                    as plain <a>, so this works without splitting the
                    JSX into two branches. */}
                {/* Featured card layout — h-full flex flex-col so every
                    card in the row stretches to the tallest one (grid
                    align-items: stretch is the default, but the inner
                    Link needed to opt in via h-full). The content area
                    is also flex-col with mt-auto on the bottom row so
                    the property type / SF chips anchor to the bottom
                    edge of the card regardless of title or description
                    line count. Title clamps to 2 lines, description to
                    1 — produces visually uniform cards even when the
                    underlying data has variable copy length. */}
                <Link {...listingLinkProps(listing)} className="card-luxury group block h-full flex flex-col">
                  <div className="image-luxury aspect-property bg-background-warm relative shrink-0">
                    {listing.images && (listing.images as string[])[0] ? (
                      <Image src={(listing.images as string[])[0]} alt={listing.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-foreground-subtle"><Building2 className="h-12 w-12" /></div>
                    )}
                    {listing.transaction_type && (
                      <span className="absolute top-3 left-3 rounded-full bg-gold px-3 py-1 text-caption font-semibold text-primary">
                        {listing.transaction_type === 'lease' ? 'For Lease' : listing.transaction_type === 'sale' ? 'For Sale' : 'Lease or Sale'}
                      </span>
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="mb-1 text-caption uppercase tracking-wider text-foreground-muted">
                      <MapPin className="mr-1 inline h-3 w-3" />{listing.city ?? 'San Antonio'}, TX
                    </p>
                    {/* min-h reserves space for a 2-line title so 1-line
                        and 2-line titles produce identical card heights.
                        line-clamp-2 caps overflow on extra-long ones. */}
                    <h3 className="mb-2 font-heading text-heading font-semibold text-primary group-hover:text-gold transition-colors line-clamp-2 min-h-[3.5rem]">
                      {listing.title}
                    </h3>
                    {/* Description always renders with a 1-line clamp
                        for visual consistency. Falls back to a derived
                        property-type sentence when no headline is set
                        (e.g. DB listings that haven't been written up
                        yet), so the layout never collapses that row. */}
                    <p className="mb-4 text-body-sm text-foreground-muted line-clamp-1">
                      {listing.headline
                        || `${(listing.property_type ?? 'Commercial').toString().replace(/^./, (c: string) => c.toUpperCase())} property in ${listing.city ?? 'Texas'}`}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-3 text-caption text-foreground-muted border-t border-border pt-4">
                      <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{(listing.property_type ?? '').toString().replace(/^./, (c: string) => c.toUpperCase())}</span>
                      {listing.sqft ? (
                        <span className="flex items-center gap-1.5"><Layers className="h-4 w-4" />{listing.sqft.toLocaleString()} SF</span>
                      ) : null}
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

      {/* ── Free Tools: Valuation + Market Reports ────────────────────── */}
      <section className="section-luxury bg-background-cream">
        <Container>
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="overline mb-3">Free for Texas Commercial Owners & Investors</p>
              <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">
                Tools and data, no obligation.
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-body text-foreground-muted">
                We publish what we know about Texas commercial real estate — quarterly market reports, strategy playbooks, and an instant cap-rate-based valuation tool. Use them whether you ever talk to a CRECO broker or not.
              </p>
            </div>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <RevealOnScroll>
              <Link
                href="/property-valuation"
                className="group h-full block rounded-2xl bg-white p-8 shadow-card hover:shadow-card-hover transition-all border border-border/40"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <Calculator className="h-6 w-6" />
                </div>
                <h3 className="mb-3 font-heading text-heading-lg font-bold text-primary group-hover:text-gold transition-colors">
                  What's my property worth?
                </h3>
                <p className="mb-5 text-body-sm text-foreground-muted leading-relaxed">
                  Instant preliminary value range using current Texas cap rates by property type and submarket. 60 seconds. No contact info required to see the number.
                </p>
                <span className="inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark group-hover:text-gold transition-colors">
                  Try the valuation tool <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </RevealOnScroll>
            <RevealOnScroll delay={80}>
              <Link
                href="/guides"
                className="group h-full block rounded-2xl bg-white p-8 shadow-card hover:shadow-card-hover transition-all border border-border/40"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <h3 className="mb-3 font-heading text-heading-lg font-bold text-primary group-hover:text-gold transition-colors">
                  Q2 2026 Texas market reports
                </h3>
                <p className="mb-5 text-body-sm text-foreground-muted leading-relaxed">
                  Industrial, retail, office, and a cross-asset investment outlook. Rents, cap rates, vacancy, and deal flow across the four major Texas metros. Free with email.
                </p>
                <span className="inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark group-hover:text-gold transition-colors">
                  Read the reports <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </RevealOnScroll>
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
                <Button size="lg" asChild><Link href="/about#team">Meet the Team</Link></Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/sell">List My Property</Link>
                </Button>
              </div>
            </RevealOnScroll>
            <RevealOnScroll direction="right">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
                <Link href="/get-started"><Sparkles className="mr-2 h-5 w-5 text-gold" />Find Space</Link>
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
