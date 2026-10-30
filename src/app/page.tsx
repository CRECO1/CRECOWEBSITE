// 30-min ISR — home reads the latest active listings + featured
// content. Re-rendered every 30 min instead of on every visit
// (which is what force-dynamic was doing). Saves edge-function
// quota without showing meaningfully-stale listings.
export const revalidate = 1800;

import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { jsonLd } from '@/lib/jsonLd';
import { CANONICAL_DESCRIPTION, listingSummary } from '@/lib/schema';

export const metadata: Metadata = {
  title: 'San Antonio & Hill Country Commercial Real Estate | CRECO',
  // The full CANONICAL_DESCRIPTION runs ~250 characters; this is the search-result length.
  description: 'Commercial real estate for San Antonio & the Texas Hill Country — leasing, sales and owner representation from the team that owns Fair Oaks Plaza.',
  keywords: [
    'San Antonio commercial real estate',
    'Texas Hill Country commercial real estate',
    'Fair Oaks Ranch commercial real estate',
    'Boerne commercial real estate',
    'commercial real estate broker San Antonio',
    'retail space for lease San Antonio',
    'office space for lease San Antonio',
    'industrial property for lease San Antonio',
    'commercial property for sale San Antonio',
    'tenant representation San Antonio',
    'landlord representation San Antonio',
    'Stone Oak commercial real estate',
    'New Braunfels commercial real estate',
  ],
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'CRECO - Commercial Real Estate Company | San Antonio & Texas Hill Country Commercial Real Estate',
    description: CANONICAL_DESCRIPTION,
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
  ArrowRight, Star, Building2, MapPin, Layers, BadgeCheck,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { getListings, supabase } from '@/lib/supabase';
import { withSyntheticListings, listingLinkProps } from '@/lib/featured-properties';
import { LeadMagnetBand } from '@/components/marketing/LeadMagnetBand';
import { GoogleReviews } from '@/components/marketing/GoogleReviews';
import { HEADWALL_TOBIN_HILL } from '@/lib/press';
import { CORE_ANSWERS } from '@/lib/answers';
import { AiWelcome } from '@/components/marketing/AiWelcome';
import { BUSINESS } from '@/lib/schema';
import { SHOW_GOOGLE_RATING, HERO_MIN_REVIEWS_TO_SHOW_COUNT } from '@/lib/hero-proof';
import { GOOGLE_RATING, GOOGLE_REVIEW_COUNT } from '@/lib/reviews';


// San Antonio & Hill Country markets — homepage geo grid. Every card links to
// an existing, indexable in-market page (Austin / Houston / DFW pages are
// noindex and deliberately not linked from here).
const LOCAL_MARKETS = [
  { name: 'Fair Oaks Ranch', badge: 'HQ', href: '/fair-oaks-ranch-commercial-real-estate', tagline: 'Our home base — Fair Oaks Plaza and the Elkhorn Point development' },
  { name: 'Boerne', badge: '', href: '/boerne-commercial-real-estate', tagline: 'Hill Country gateway on I-10 — retail, medical and service space' },
  { name: 'Leon Springs & the I-10 corridor', badge: '', href: '/submarkets/northwest', tagline: 'I-10 from La Cantera out to Leon Springs and the Loop 1604 interchange' },
  { name: 'Stone Oak', badge: '', href: '/markets/stone-oak', tagline: 'North Central San Antonio\'s suburban-growth corridor' },
  { name: 'Medical Center & NW San Antonio', badge: '', href: '/markets/northwest-san-antonio', tagline: 'USAA, UTSA and the South Texas Medical Center' },
  { name: 'New Braunfels', badge: '', href: '/markets/new-braunfels', tagline: 'The I-35 corridor\'s fastest-growing Hill Country market' },
];

const FAQS = [
  ...CORE_ANSWERS,
  {
    q: 'Does CRECO represent tenants or landlords?',
    a: 'Both — and investors. CRECO is a full-service brokerage, not a tenant-only firm: it represents tenants and buyers looking for space, landlords and owners leasing or selling property, and investors buying and selling commercial real estate, across retail, office, industrial, flex, and land. When both parties authorize it in writing, CRECO can act as an intermediary under Texas law. For tenants, representation is typically free because the landlord pays the commission.',
  },
  {
    q: 'Is CRECO a licensed real estate brokerage?',
    a: 'Yes. CRECO - Commercial Real Estate Company is a d/b/a of CRECO LLC, licensed by the Texas Real Estate Commission, TREC #9014367. Its broker and founder is Zachary A. Stovall (TREC #691174).',
  },
  {
    q: 'What types of commercial real estate does CRECO handle in Texas?',
    a: 'CRECO is a full-service Texas commercial real estate brokerage representing tenants, landlords, owners, and investors. We handle retail (strip centers, restaurants, freestanding, urban storefronts), industrial and warehouse (distribution, light manufacturing, flex-industrial), office (Class A/B/C, medical, professional), flex space, and commercial land — for lease, sale, and investment.',
  },
  {
    q: 'Do you work with multi-property owners and investors?',
    a: 'Yes. We provide portfolio strategy, hold/sell analysis, repositioning, 1031 exchange identification, tenant mix optimization, and ongoing property management. We manage our own centers — Fair Oaks Plaza and our Lytle center — and take on a select number of owners who want the same hands-on attention.',
  },
  {
    q: 'How does tenant representation work at CRECO?',
    a: 'When CRECO represents a tenant, it identifies candidate spaces across Texas, runs financial comparisons, negotiates the LOI and lease, and coordinates buildout — and the landlord typically pays the commission, so it is usually free to the tenant. Tenant representation is one of CRECO\'s service lines alongside landlord/owner representation and investment sales. If a tenant is interested in a property CRECO also represents for the owner, CRECO discloses that up front and, only with both parties\' written consent, acts as an intermediary under Texas law.',
  },
  {
    q: 'How do I list my commercial property with CRECO?',
    a: 'Submit a property opinion request on our /sell page or call us at (210) 817-3443. We will tour the property, review your rent roll and operating history, benchmark recent comparable Texas transactions, and deliver a no-obligation Broker Opinion of Value (BOV) and recommended marketing strategy within one to two business days.',
  },
  {
    q: 'How do I contact CRECO?',
    a: 'Call or text (210) 817-3443, email info@crecotx.com, or visit the office at 8000 Fair Oaks Pkwy, Suite 100, Fair Oaks Ranch, TX 78015 (Monday–Friday, 8:00 AM–5:30 PM Central). Our team responds personally.',
  },
  {
    q: 'What makes CRECO different from CBRE, JLL, or Cushman & Wakefield?',
    a: 'The big national firms are great for institutional clients with $100M+ deals. CRECO serves the broad middle of the Texas market — entrepreneurs, family offices, multi-property owners with $1M to $50M assets, and growing tenants — with principal-level attention on every engagement. Every client works directly with the people doing the deal, not a junior associate handed off from someone you met at the pitch.',
  },
];

const DEFAULT_SETTINGS = {
  hero_headline: 'Lease it. Buy it. Sell it.',
  hero_subheadline: 'Leasing, sales and owner representation from a team that owns and operates commercial property in Texas.',
  hero_image_url: '/images/sa-hero.jpg' as string | null,
  about_headline: 'A trailblazing approach to Texas commercial real estate.',
  about_text: 'CRECO is built on innovation, expertise, and a relentless commitment to client outcomes. We blend deep Texas market knowledge with the analytical rigor you would expect from a national firm — and we keep our roster small enough that every client works directly with a principal. From single-asset tenants to multi-property portfolio owners, we treat your assignment like our name is on the building.',
  cta_headline: 'Need space — or have space to fill?',
  cta_subheadline: 'Submit your tenant requirements or list your property in 2 minutes. Our team responds personally with vetted options or a no-obligation property opinion.',
  phone: '(210) 817-3443',
  email: 'info@crecotx.com',
  address: '8000 Fair Oaks Pkwy, Suite 100\nFair Oaks Ranch, TX 78015',
};

export default async function HomePage() {
  // Testimonials are no longer fetched here: the CMS-backed section below was
  // removed in favour of the real Google reviews, and the query was costing a
  // Supabase round-trip on every homepage render to populate a section that
  // could never display (every row in the table is featured = false).
  const [listingsResult, settingsResult] = await Promise.allSettled([
    getListings('active'),
    supabase.from('site_settings').select('*').eq('id', 1).single(),
  ]);

  // Pull active listings + prepend synthetic ones (Fair Oaks Plaza, etc.)
  // so a hand-curated property always anchors the Featured grid even when
  // the DB has fewer than 3 active rows. Slice to 3 for the homepage —
  // /listings shows the full set.
  //
  // No DEMO_LISTINGS fallback: it carried specs that had drifted from the
  // real rows (2250 Chipley at 26,400 SF against an actual 29,750; 1346
  // Parkridge shown active long after it leased), so a transient DB failure
  // would have published wrong square footage as live inventory. The
  // code-defined CRECO properties below are real and always render.
  const dbListings = listingsResult.status === 'fulfilled' ? listingsResult.value : [];

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
    '1353-w-french-pl',                     // Beacon Hill warehouse lease (DB) — owner wants it leased first
    '8000-fair-oaks-pkwy',                  // Plaza (synthetic) — owner wants more action here
    '2250-chipley-circle',                  // Chipley (DB)
    '1222-chulie-dr',                       // Chulie (DB)
    // Louis Pasteur's DB slug is `move-in-ready-medical-building`, not the street
    // address — the slug is keyed to the original headline.
    'move-in-ready-medical-building',        // Louis Pasteur (DB)
    '523-seventh-st',                        // Seventh St (DB)
    // Lytle and Elkhorn fall past the 6-slot grid; both keep their own landing
    // pages and stay on /listings.
    '15033-main-st-lytle',                   // Lytle (synthetic)
    '8923-dietz-elkhorn',                    // Elkhorn (synthetic)
  ];

  const allListings = withSyntheticListings(dbListings);
  const bySlug = new Map(allListings.map((l: any) => [l.slug, l]));
  const ordered = FEATURED_SLUG_ORDER
    .map(slug => bySlug.get(slug))
    .filter(Boolean);
  // Pad with anything not explicitly ordered so we always have 6
  // slots worth of content even if a slug in the curated list is
  // missing from the data source.
  const remaining = allListings.filter((l: any) => !FEATURED_SLUG_ORDER.includes(l.slug));
  const featuredListings = [...ordered, ...remaining].slice(0, 6);

  // Live-inventory answer for the question AI assistants ask most
  // ("what space does CRECO have in Fair Oaks Ranch / San Antonio?").
  const availableNow = allListings.filter((l: any) => l.status === 'active' || l.status === 'pending');
  const faqs = [
    {
      q: 'What commercial space is available in Fair Oaks Ranch and San Antonio right now?',
      a: availableNow.length > 0
        ? `CRECO currently markets: ${availableNow.map((l: any) => `${l.title} (${listingSummary(l)})`).join('; ')}. See all details at crecotx.com/listings or call (210) 817-3443.`
        : 'New inventory is being added — see crecotx.com/listings or call (210) 817-3443 for current and off-market options.',
    },
    ...FAQS,
  ];

  const s = (settingsResult.status === 'fulfilled' && settingsResult.value.data)
    ? settingsResult.value.data
    : DEFAULT_SETTINGS;

  // Every cell here has to be something a visitor could check for themselves.
  // This band previously read "2.4M+ SF Transacted / 25+ Years in Texas CRE /
  // 98% Client Satisfaction" from site_settings. CRECO was founded in 2024 and
  // its own agents table puts the founder at 9 years in the business, so the
  // years figure contradicted the site's own data, and there is no survey
  // behind a satisfaction percentage. Counts and commitments only — no
  // track-record metrics until there are real closed deals to total up.
  // Guard the nullable CMS hero fields. hero_headline in particular has
  // .includes()/.split() called on it below — if an editor ever blanks that
  // field, calling a string method on null would throw and drop the ENTIRE
  // homepage to error.tsx. Fall back to the defaults instead.
  // Hero H1 + intro are code-controlled positioning, NOT the site_settings CMS
  // row: AI assistants were describing CRECO as tenant-only, so the first
  // heading and paragraph must state full-service representation. Since Oct
  // 2026 the hero leads with the San Antonio & Hill Country focus (subhead
  // names leasing, sales and owner representation) and the two primary paths
  // (need space → tenant funnel, own property → valuation); the verbatim long
  // statements still render server-side in the FAQ below, the organization
  // schema, the representation pages and the llms feeds. The CMS hero fields
  // are ignored.
  const heroHeadline = DEFAULT_SETTINGS.hero_headline;
  const heroSubheadline = DEFAULT_SETTINGS.hero_subheadline;

  return (
    <>
      {/* FAQ Schema for "People Also Ask" featured snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            '@id': 'https://www.crecotx.com/#faq',
            mainEntity: faqs.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      <Header variant="transparent" />
      {/* Explicit <main> landmark — the homepage previously had none, so
          screen-reader landmark navigation had no "main content" target. */}
      <main>

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
      <section data-track-section="hero" className="relative flex min-h-[88svh] items-center justify-center overflow-hidden bg-primary pt-32 md:pt-24 pb-12 md:pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
        {s.hero_image_url ? (
          <Image
            src={s.hero_image_url}
            alt="Commercial real estate in San Antonio and the Texas Hill Country"
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
          <p className="overline mx-auto mb-6 w-fit animate-fade-in-down text-gold">CRECO · Commercial Real Estate Company</p>
          <h1 className="mb-6 animate-fade-in-up font-heading text-display-xl font-bold text-white text-shadow-hero fill-both">
            {heroHeadline.includes('\n')
              ? heroHeadline.split('\n').map((line: string, i: number) => (
                <span key={i}>{i > 0 && <br />}{line}</span>
              ))
              : <><span className="text-gradient-gold">{heroHeadline}</span></>
            }
          </h1>
          <p className="mx-auto mb-10 max-w-2xl animate-fade-in text-body-lg leading-relaxed text-white/85 delay-200 fill-both">
            {heroSubheadline}
          </p>
          {/* Only for visitors who arrived from an AI assistant (decided client-side after mount). */}
          <AiWelcome />

          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2 animate-fade-in delay-300 fill-both">
            <div className="flex flex-col items-center gap-2">
              <Button size="xl" fullWidth className="!text-primary" asChild>
                <Link href="/get-started?path=tenant" data-track-id="hero_need_space">I need space <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button size="xl" fullWidth className="!text-primary" asChild>
                <Link href="/property-valuation" data-track-id="hero_own_property"><Building2 className="mr-2 h-5 w-5" />I own property</Link>
              </Button>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-body text-white/90 animate-fade-in delay-300 fill-both">
            Prefer to talk?{' '}
            <a href={`sms:${BUSINESS.phoneE164.replace(/-/g, '')}`} data-track-id="hero_text" className="font-semibold text-gold underline-offset-4 hover:underline">Text</a>
            {' '}or{' '}
            <a href={`tel:${BUSINESS.phoneE164.replace(/-/g, '')}`} data-track-id="hero_call" className="font-semibold text-gold underline-offset-4 hover:underline">call {BUSINESS.phoneDisplay}</a>
          </p>
          {SHOW_GOOGLE_RATING && (
            <p className="mx-auto mt-2 max-w-2xl text-body-sm text-white/70 animate-fade-in delay-300 fill-both">
              <Star className="mr-1 inline h-4 w-4 fill-gold text-gold" />
              {GOOGLE_RATING.toFixed(1)} on Google{GOOGLE_REVIEW_COUNT >= HERO_MIN_REVIEWS_TO_SHOW_COUNT ? ` · ${GOOGLE_REVIEW_COUNT} reviews` : ''}
            </p>
          )}
          <Link
            href="/listings"
            data-track-id="hero_browse"
            className="mx-auto mt-3 flex min-h-[44px] w-fit items-center gap-1.5 text-body-sm font-medium text-white/60 underline-offset-4 hover:text-gold hover:underline animate-fade-in delay-300 fill-both"
          >
            Or browse properties <ArrowRight className="h-4 w-4" />
          </Link>

        </Container>

      </section>

      {/* ── Featured Listings ─────────────────────────────────────────── */}
      <section data-track-section="listings" className="section-luxury bg-background-cream">
        <Container>
          <RevealOnScroll>
            <div className="mb-14 text-center">
              <p className="overline mb-3">Hand-Picked Texas Properties</p>
              <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">Featured Properties</h2>
              <p className="mx-auto mt-6 max-w-xl text-body text-foreground-muted">
                Retail, industrial, and office properties currently available in San Antonio and the Hill Country — vetted by the CRECO team.
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

      {/* ── Lead-Magnet Band — loud dual capture (valuation + alerts),
          high on the page right after the featured properties. ─────────── */}
      <div data-track-section="lead_magnet">
        <LeadMagnetBand surface="homepage-featured" />
      </div>

      {/* ── Owner Services CTA Strip — speaks to dream client ─────────── */}
      <section data-track-section="owner" className="bg-primary text-white py-12">
        <Container>
          <div className="flex flex-col items-center justify-between gap-6 text-center lg:flex-row lg:text-left">
            <div className="max-w-2xl">
              <p className="overline mb-2 text-gold">For Property Owners</p>
              <h2 className="font-heading text-display-sm font-bold">Own commercial property in San Antonio or the Hill Country?</h2>
              <p className="mt-2 text-body text-white/70">Hold or sell, lease up or reposition: start with a valuation.</p>
            </div>
            <Button size="xl" className="shrink-0 bg-gold text-primary hover:bg-gold-light" asChild>
              <Link href="/property-valuation?from=home-owner" data-track-id="owner_strip_valuation">Request a valuation <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </Container>
      </section>

      {/* ── Why Us ───────────────────────────────────────────────────── */}
      <section data-track-section="why_us" className="section-luxury bg-white">
        <Container>
          <div className="mx-auto max-w-3xl">
            <RevealOnScroll>
              <p className="overline mb-4 text-gold">Why CRECO</p>
              <h2 className="mb-6 font-heading text-display-sm font-bold text-primary">
                {s.about_headline}
              </h2>
              <p className="mb-8 text-body-lg text-foreground-muted">{s.about_text}</p>
              <ul className="space-y-4 mb-6">
                {[
                  'Deep San Antonio and Hill Country market knowledge — we own and operate property here',
                  'Principal-level service on every engagement — never handed off',
                  'The same team on your file from first tour to closing — no handoff to a call center',
                  'Portfolio-level reporting and strategy for multi-property owners',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-body text-foreground-muted">
                    <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-gold" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mb-10 border-l-2 border-gold pl-4 text-body-sm text-foreground-muted">
                <span className="font-semibold text-primary">In the news:</span> {HEADWALL_TOBIN_HILL.summary}{' '}
                <a href={HEADWALL_TOBIN_HILL.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold-dark hover:underline">
                  — {HEADWALL_TOBIN_HILL.outlet}
                </a>
              </p>
              <div className="flex gap-4">
                <Button size="lg" asChild><Link href="/about#team">Meet the Team</Link></Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/sell">List My Property</Link>
                </Button>
              </div>
            </RevealOnScroll>

          </div>
        </Container>
      </section>

      {/* ── Google Reviews ───────────────────────────────────────────── */}
      <div data-track-section="reviews">
        <GoogleReviews askForReview />
      </div>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section data-track-section="faq" className="section-luxury bg-white">
        <Container>
          <RevealOnScroll>
            <div className="mb-12 text-center">
              <p className="overline mb-3">People Also Ask</p>
              <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">Texas Commercial Real Estate FAQ</h2>
            </div>
          </RevealOnScroll>
          <div className="mx-auto max-w-3xl space-y-3">
            {faqs.map((faq, i) => (
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
      <section data-track-section="closing_cta" className="section-compact bg-gold">
        <Container>
          <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
            <div>
              <h2 className="font-heading text-display-sm font-bold text-primary">{s.cta_headline}</h2>
              <p className="mt-2 text-body text-primary/70">{s.cta_subheadline}</p>
            </div>
            <div className="flex flex-col items-center gap-4 shrink-0">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="xl" className="bg-primary text-white hover:bg-primary/90 shadow-lg font-bold" asChild>
                  <Link href="/get-started?path=tenant" data-track-id="closing_need_space">I need space</Link>
                </Button>
                <Button size="xl" className="bg-primary text-white hover:bg-primary/90 shadow-lg font-bold" asChild>
                  <Link href="/property-valuation" data-track-id="closing_own_property">I own property</Link>
                </Button>
              </div>
              <p className="text-body text-primary">
                Or{' '}
                <a href={`sms:${BUSINESS.phoneE164.replace(/-/g, '')}`} className="font-semibold underline">text</a>
                {' '}/{' '}
                <a href={`tel:${BUSINESS.phoneE164.replace(/-/g, '')}`} className="font-semibold underline">call {BUSINESS.phoneDisplay}</a>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Where we work: compact link row (kept for local SEO) ─────── */}
      <section data-track-section="markets" className="bg-white border-t border-border py-10">
        <Container>
          <p className="overline mb-4 text-center text-foreground-muted">Where We Work</p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-body-sm">
            {LOCAL_MARKETS.map(m => (
              <li key={m.href}><Link href={m.href} className="text-foreground-muted hover:text-gold-dark hover:underline">{m.name}</Link></li>
            ))}
          </ul>
        </Container>
      </section>

      </main>
      <Footer />
    </>
  );
}
