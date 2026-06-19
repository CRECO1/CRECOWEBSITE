import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, ArrowRight, Phone, Store, Briefcase, Building2,
  TrendingUp, Users, Sparkles, Coffee, FileText, Download,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { DevelopmentInterestForm } from '@/components/forms/DevelopmentInterestForm';
import { DevelopmentInquiryButton } from '@/components/marketing/DevelopmentInquiryButton';
import { TrackedAnchor } from '@/components/analytics/TrackedAnchor';
import { MarketReportCapture } from '@/components/marketing/MarketReportCapture';
import { PropertyAlertsInline } from '@/components/marketing/PropertyAlertsInline';
import { StickyPropertyCTABar } from '@/components/marketing/StickyPropertyCTABar';

// ─── Property photos ────────────────────────────────────────────────────
// Site-shot photo set of 8000 Fair Oaks Plaza, taken on-site. Sourced
// from PlazaPhotos/ on the owner's desktop, compressed to ~600KB-1.1MB
// each (sips -Z 2000 -s formatOptions 80) and renamed to semantic names
// so the component code stays readable.
//
// Building mapping per the monument sign + observation:
//   - retail-strip-* → Building 1 (the 4-bay retail center on Fair Oaks
//     Pkwy frontage, tenants: Spotted Deer Coffee, Parker's Ice Creams,
//     Blume Haus, etc.)
//   - realty-group-* → Building 2 (the older 2-story stone+wood exec
//     suite building; current CRECO + Fair Oaks Realty Group office)
//   - executive-suites-south → Building 3 (the newer modern stone exec
//     suite building, marked "3" on its facade)
//   - monument-sign → the "Fair Oaks Plaza 8000" pylon sign at the
//     property entrance; used as the hero background
const PHOTOS = {
  monumentSign:           '/properties/8000-fair-oaks-pkwy/monument-sign.jpg',
  realtyGroupExterior:    '/properties/8000-fair-oaks-pkwy/realty-group-exterior.jpg',
  realtyGroupEntry:       '/properties/8000-fair-oaks-pkwy/realty-group-entry.jpg',
  realtyGroupSign:        '/properties/8000-fair-oaks-pkwy/realty-group-sign.jpg',
  retailStripParkers:     '/properties/8000-fair-oaks-pkwy/retail-strip-parkers.jpg',
  retailStripSpottedDeer: '/properties/8000-fair-oaks-pkwy/retail-strip-spotted-deer.jpg',
  retailStripWide:        '/properties/8000-fair-oaks-pkwy/retail-strip-wide.jpg',
  executiveSuitesSouth:   '/properties/8000-fair-oaks-pkwy/executive-suites-south.jpg',
} as const;

// Downloadable leasing flyer (PDF) — kept in the property's public folder.
const FLYER_PDF = '/properties/8000-fair-oaks-pkwy/8000-fair-oaks-pkwy-for-lease-flyer.pdf';

const GALLERY = [
  { src: PHOTOS.monumentSign,           alt: 'Fair Oaks Plaza 8000 monument sign listing tenants — Spotted Deer Coffee, Parker\'s Ice Creams, Fair Oaks Salon, Blume Haus, Fair Oaks Realty Group' },
  { src: PHOTOS.retailStripWide,        alt: 'Wide view of the 4-bay retail center at 8000 Fair Oaks Pkwy with morning light through the oak trees' },
  { src: PHOTOS.retailStripSpottedDeer, alt: 'Spotted Deer Coffee Company storefront in the 8000 Fair Oaks Pkwy retail center' },
  { src: PHOTOS.retailStripParkers,     alt: 'Parker\'s Ice Creams and adjacent retail tenants on the strip at 8000 Fair Oaks Pkwy' },
  { src: PHOTOS.realtyGroupExterior,    alt: 'Fair Oaks Realty Group / CRECO executive suite building (Building 2) with mature oak tree' },
  { src: PHOTOS.realtyGroupEntry,       alt: 'Building 2 entry walkway at 8000 Fair Oaks Pkwy executive suites' },
  { src: PHOTOS.executiveSuitesSouth,   alt: 'Building 3 — the south executive office suite building at 8000 Fair Oaks Pkwy' },
  { src: PHOTOS.realtyGroupSign,        alt: 'Fair Oaks Realty Group Information Center / Real Estate Sales sign at 8000 Fair Oaks Pkwy' },
];

export const metadata: Metadata = {
  title: '8000 Fair Oaks Pkwy — Retail Bays + Executive Office Suites | Fair Oaks Ranch | CRECO',
  description:
    "8000 Fair Oaks Pkwy in Fair Oaks Ranch, TX — a mixed-use commercial center with a 4-bay retail building and two two-story executive office suite buildings. Now leasing retail bays and executive suites. Owned and represented by CRECO.",
  keywords: [
    '8000 fair oaks pkwy',
    '8000 fair oaks parkway',
    'fair oaks ranch retail space for lease',
    'fair oaks ranch office space for lease',
    'fair oaks ranch executive suites',
    'fair oaks ranch executive office',
    'executive suite fair oaks ranch',
    'fair oaks pkwy commercial',
    'fair oaks ranch restaurant space',
    'creco fair oaks pkwy',
  ],
  alternates: { canonical: 'https://www.crecotx.com/8000-fair-oaks-pkwy' },
  openGraph: {
    title: '8000 Fair Oaks Pkwy — Retail Bays + Executive Office Suites',
    description:
      "Mixed-use commercial center in Fair Oaks Ranch, TX — 4 retail bays + two two-story executive office suite buildings. Owned and represented by CRECO.",
    url: 'https://www.crecotx.com/8000-fair-oaks-pkwy',
    type: 'website',
  },
};

const RETAIL_USE_FITS = [
  'Coffee / quick-service',
  'Fast-casual restaurant',
  'Boutique fitness / studio',
  'Medical / dental practice',
  'Specialty retail',
  'Service business (salon, spa, dry cleaner)',
  'Professional services storefront',
];

const SUITE_FEATURES = [
  'Private offices in two two-story buildings',
  'Walk-up access on Fair Oaks Pkwy frontage',
  'Adjacent to active retail center — clients can grab coffee or lunch on-site',
  'Parking on-site',
  'Suited for solo professionals, small teams, satellite offices',
  'Flexible lease terms',
];

const WHY_HERE = [
  {
    icon: TrendingUp,
    title: 'Demographics that punch above their weight',
    body: 'Fair Oaks Ranch household incomes are among the highest in Texas. Trade area spending power is real — and the right tenant captures customers who currently drive elsewhere for daily needs.',
  },
  {
    icon: MapPin,
    title: 'Fair Oaks Pkwy frontage',
    body: '8000 Fair Oaks Pkwy sits on the residential community spine. Visibility, access, and proximity to a captive customer base of Fair Oaks Ranch residents.',
  },
  {
    icon: Users,
    title: 'A real tenant mix, not a vacancy chase',
    body: "We're curating tenants that work together — retail and dining that draw daytime traffic, professional suites whose clients become retail customers and vice versa.",
  },
  {
    icon: Sparkles,
    title: 'CRECO is the owner and the broker',
    body: "Most centers separate the owner from the leasing team. We do both. Tenants get straight answers, faster decisions, and an owner who has skin in the game.",
  },
];

// RealEstateListing schema — gives this page rich-result eligibility +
// AI assistant deep-link discoverability (chatgpt.com referrals are
// already in the GA mix, this widens that channel). Mirrors the
// schema shape used on /listings/[slug] for consistency.
const REAL_ESTATE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateListing',
  name: '8000 Fair Oaks Plaza',
  url: 'https://www.crecotx.com/8000-fair-oaks-pkwy',
  image: [
    'https://www.crecotx.com/properties/8000-fair-oaks-pkwy/monument-sign.jpg',
    'https://www.crecotx.com/properties/8000-fair-oaks-pkwy/retail-strip-wide.jpg',
  ],
  description:
    'Mixed-use commercial center in Fair Oaks Ranch, TX — 4-bay retail building plus two two-story executive office suite buildings, owned and operated by CRECO. Now leasing retail bays and executive office suites.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '8000 Fair Oaks Pkwy',
    addressLocality: 'Fair Oaks Ranch',
    addressRegion: 'TX',
    postalCode: '78015',
    addressCountry: 'US',
  },
  geo: { '@type': 'GeoCoordinates', latitude: 29.7456, longitude: -98.6739 },
  broker: {
    '@type': 'RealEstateAgent',
    name: 'CRECO',
    url: 'https://www.crecotx.com',
    telephone: '+1-210-817-3443',
  },
  areaServed: { '@type': 'City', name: 'Fair Oaks Ranch' },
};

export default function FairOaksDevPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(REAL_ESTATE_SCHEMA) }}
      />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero — monument sign photo as the background. Site-shot
            "Fair Oaks Plaza 8000" pylon with the tenant list is the
            single most recognizable visual for the property and the
            most credible anchor for the H1. Same overlay pattern as the
            8979 Dietz Elkhorn hero: absolute <img> + bg-primary/70
            wash, so text stays readable without losing the photo. */}
        {/* min-h-[560px] sm:min-h-[680px] — scaled back from 640/760
            because the prior version felt slightly too tall. flex
            items-center still centers the trimmed copy + CTAs vertically. */}
        <section className="relative bg-primary py-16 sm:py-24 text-white overflow-hidden min-h-[560px] sm:min-h-[680px] flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* object-position: 50% 20% — between fully-top (0%) and
              center (50%). Fully anchored to the top pushed the photo
              too far up; this nudges the sign back down slightly so
              the "Fair Oaks Plaza" plaque is still visible but the
              middle of the sign sits closer to the optical center of
              the hero. */}
          {/* next/image fill + priority — this is the LCP element on
              the page. Automatic WebP conversion shaves ~35% off the
              JPG payload, sizes="100vw" generates a responsive srcset
              so a 375px phone doesn't download a 2000px desktop image,
              and the priority hint pre-loads it instead of waiting
              for layout. object-cover + object-[center_20%] preserved
              identically. */}
          <Image
            src={PHOTOS.monumentSign}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_20%]"
          />
          <div className="absolute inset-0 bg-primary/70" />
          <Container className="relative z-10">
            <div className="max-w-3xl">
              <p className="overline mb-3 text-gold flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Now Leasing · Fair Oaks Ranch, TX
              </p>
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight">
                8000 Fair Oaks Pkwy.
              </h1>
              {/* Secondary "Now leasing retail bays for restaurant…
                  Now leasing executive office suites for…" paragraph
                  removed — the next-section status strip and the two
                  CTAs immediately below already convey what's being
                  leased. The hero reads tighter without it. */}
              <p className="text-body-lg text-white/70 leading-relaxed mb-8 max-w-2xl">
                A mixed-use commercial address in Fair Oaks Ranch — <strong className="text-white">a 4-bay retail center plus two two-story executive office suite buildings</strong>, all on one lot, owned and operated by CRECO.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#retail"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  <Store className="h-4 w-4" />
                  Retail bays
                </a>
                <a
                  href="#suites"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-body-sm font-semibold text-primary hover:bg-white/90"
                >
                  <Briefcase className="h-4 w-4" />
                  Executive suites
                </a>
                <TrackedAnchor
                  href={FLYER_PDF}
                  target="_blank"
                  rel="noreferrer noopener"
                  event="flyer_downloaded"
                  params={{ property: '8000-fair-oaks-pkwy', surface: 'hero' }}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 text-body-sm font-semibold text-white hover:bg-white/10"
                >
                  <FileText className="h-4 w-4" />
                  Download flyer
                </TrackedAnchor>
                {/* Hero phone CTA removed — the header already carries
                    the phone number, and the inquiry section further
                    down has a dedicated "Prefer to talk?" card. Three
                    hero CTAs (Retail / Suites / Flyer) read cleaner
                    than four on mobile. */}
              </div>
            </div>
          </Container>
        </section>

        {/* Status strip */}
        <section className="bg-gold py-6 text-primary">
          <Container>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center">
              <span className="font-heading text-heading-sm font-bold uppercase tracking-wider">
                Now Leasing
              </span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">4-Bay Retail Center</span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">Two Executive Suite Buildings</span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">One Fair Oaks Pkwy Address</span>
            </div>
          </Container>
        </section>

        {/* Property Overview */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="max-w-3xl mx-auto mb-10 text-center">
              <p className="overline mb-3">The Property</p>
              <h2 className="font-heading text-display-sm font-bold text-primary mb-4">
                Three buildings, one address, complementary uses.
              </h2>
              <p className="text-body text-foreground-muted leading-relaxed">
                The lot is configured as a single mixed-use commercial address. The retail center activates the street, drives daytime traffic, and gives the office tenants on-site amenities. The two executive suite buildings serve a different but adjacent market — professionals whose clients are exactly the customers visiting the retail bays.
              </p>
            </div>
            {/* Three building cards — each now leads with a real photo
                of that specific building so the prospect can see exactly
                what they'd be leasing into. Using next/image so we get
                automatic responsive srcsets + WebP conversion for the
                large source photos. aspect-[4/3] keeps the grid tidy
                regardless of source aspect ratio. */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="rounded-2xl bg-white shadow-card flex flex-col overflow-hidden">
                <div className="relative w-full aspect-[4/3] bg-background-cream">
                  <Image
                    src={PHOTOS.retailStripWide}
                    alt="The 4-bay retail center at 8000 Fair Oaks Pkwy — Building 1"
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-7 flex flex-col flex-1">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gold/10 text-gold mb-4">
                    <Store className="h-5 w-5" />
                  </div>
                  <p className="text-caption uppercase tracking-widest text-gold mb-1">Building 1</p>
                  <h3 className="font-heading text-heading-md font-bold text-primary mb-2">4-Bay Retail Center</h3>
                  <p className="text-body-sm text-foreground-muted leading-relaxed flex-1">
                    Fronting Fair Oaks Pkwy. Suited for restaurant, fast-casual, coffee, fitness, retail, and service concepts that want visibility and a captive Fair Oaks Ranch resident customer base.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-white shadow-card flex flex-col overflow-hidden">
                <div className="relative w-full aspect-[4/3] bg-background-cream">
                  <Image
                    src={PHOTOS.realtyGroupExterior}
                    alt="Building 2 — CRECO + Fair Oaks Realty Group executive office suites"
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-7 flex flex-col flex-1">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gold/10 text-gold mb-4">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <p className="text-caption uppercase tracking-widest text-gold mb-1">Building 2</p>
                  <h3 className="font-heading text-heading-md font-bold text-primary mb-2">Executive Office Suites — North Building</h3>
                  <p className="text-body-sm text-foreground-muted leading-relaxed flex-1">
                    Two-story building of private executive suites. Designed for solo professionals, small teams, and satellite offices that want a Fair Oaks Ranch business address with the convenience of on-site amenities.
                  </p>
                </div>
              </div>
              <div className="rounded-2xl bg-white shadow-card flex flex-col overflow-hidden">
                <div className="relative w-full aspect-[4/3] bg-background-cream">
                  <Image
                    src={PHOTOS.executiveSuitesSouth}
                    alt="Building 3 — the south executive office suite building at 8000 Fair Oaks Pkwy"
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-7 flex flex-col flex-1">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gold/10 text-gold mb-4">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <p className="text-caption uppercase tracking-widest text-gold mb-1">Building 3</p>
                  <h3 className="font-heading text-heading-md font-bold text-primary mb-2">Executive Office Suites — South Building</h3>
                  <p className="text-body-sm text-foreground-muted leading-relaxed flex-1">
                    Second two-story executive suite building, configured for additional professional office tenants. Walking distance to the retail center for client meetings, lunch, and coffee.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Why */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="overline mb-3">Why 8000 Fair Oaks Pkwy</p>
              <h2 className="font-heading text-display-sm font-bold text-primary">
                A Fair Oaks Ranch business address with the demographics to underwrite it.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {WHY_HERE.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-border bg-white p-7">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-heading-sm font-bold text-primary mb-2">{title}</h3>
                  <p className="text-body-sm text-foreground-muted leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Photo gallery — site-shot tour of the plaza. Sits between
            "Why" (sets context) and "Retail Bays" (starts the leasing
            pitch) because by this point a prospect is bought in on the
            opportunity and ready to see the actual property before
            reading lease specifics. Asymmetric grid (first photo wider)
            so the monument-sign hero shot anchors the section visually,
            with the rest arranged as a clean 2×3 grid on desktop. */}
        <section id="gallery" className="section-luxury bg-white scroll-mt-24">
          <Container>
            <div className="max-w-3xl mx-auto text-center mb-10">
              <p className="overline mb-3">A look around</p>
              <h2 className="font-heading text-display-sm font-bold text-primary mb-4">
                Site-shot tour of the plaza.
              </h2>
              <p className="text-body text-foreground-muted leading-relaxed">
                No renderings. These are real photos of the existing tenant
                mix, building exteriors, and frontage so you know exactly
                what you'd be leasing into.
              </p>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GALLERY.map((photo, idx) => (
                <div
                  key={photo.src}
                  className={`relative overflow-hidden rounded-xl bg-background-cream ${
                    idx === 0 ? 'sm:col-span-2 aspect-[16/9]' : 'aspect-[4/3]'
                  }`}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes={idx === 0
                      ? '(min-width: 640px) 66vw, 100vw'
                      : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
                    className="object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* Retail Bays Section */}
        <section id="retail" className="section-luxury bg-background-cream scroll-mt-24">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className="overline mb-3 flex items-center gap-2">
                  <Store className="h-4 w-4 text-gold" /> Retail Bay Leasing
                </p>
                <h2 className="font-heading text-display-sm font-bold text-primary mb-5">
                  Four bays, fronting Fair Oaks Pkwy. Curated tenant mix.
                </h2>
                <p className="text-body text-foreground leading-relaxed mb-5">
                  The retail center is the front door of the property — the building that activates the street and serves the Fair Oaks Ranch trade area on a daily basis. We're building a tenant mix that drives cross-traffic and complements the executive suite tenants in the buildings behind it.
                </p>
                <p className="text-body text-foreground leading-relaxed mb-6">
                  We're talking with prospective retail tenants now. Bays available; specific size and configuration depend on use.
                </p>
                <p className="text-body-sm font-semibold text-primary mb-3">Strong fits include:</p>
                <ul className="space-y-2 mb-8">
                  {RETAIL_USE_FITS.map(use => (
                    <li key={use} className="flex items-start gap-2.5 text-body-sm text-foreground-muted">
                      <Coffee className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                      <span>{use}</span>
                    </li>
                  ))}
                </ul>
                {/* Popup-modal CTA instead of an anchor jump. Catches
                    the high-intent retail prospect inline and presets
                    the inquiry form to the retail track so they don't
                    have to re-pick a radio they already implied. */}
                <DevelopmentInquiryButton
                  label="Inquire about a retail bay"
                  variant="primary"
                  modalTitle="Tell us about your retail concept."
                  modalEyebrow="Now Leasing — Retail Bays"
                  initialInterest="retail"
                />
              </div>
              <div className="rounded-2xl bg-primary text-white p-8 lg:p-10">
                <Building2 className="h-9 w-9 text-gold mb-4" />
                <h3 className="font-heading text-heading-lg font-bold mb-4">What we offer retail tenants</h3>
                <ul className="space-y-3 text-body-sm">
                  <li className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" /><span>Fair Oaks Pkwy frontage with visibility to the residential community spine</span></li>
                  <li className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" /><span>On-site daytime customer base from the executive suite tenants</span></li>
                  <li className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" /><span>Owner-operator landlord — we negotiate, we sign, we get it done</span></li>
                  <li className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" /><span>Tenant improvement coordination through CRECO's broker team</span></li>
                  <li className="flex items-start gap-3"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" /><span>Demographics: among the highest household incomes in Texas</span></li>
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* Executive Suites Section */}
        <section id="suites" className="section-luxury bg-white scroll-mt-24">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="lg:order-2">
                <p className="overline mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gold" /> Executive Office Suites
                </p>
                <h2 className="font-heading text-display-sm font-bold text-primary mb-5">
                  Two buildings of private offices for professionals who want a Fair Oaks Ranch address.
                </h2>
                <p className="text-body text-foreground leading-relaxed mb-5">
                  The two two-story buildings behind the retail center hold our executive office suites — private offices for solo professionals, small teams, and businesses that need a Fair Oaks Ranch presence without the overhead of a standalone office building.
                </p>
                <p className="text-body text-foreground leading-relaxed mb-6">
                  Particularly strong fits: real estate, financial services, legal, accounting, insurance, therapy and counseling, consulting, and other professional services where a Fair Oaks Ranch address signals quality to clients.
                </p>
                {/* Same popup pattern as the retail CTA above, but
                    preset to the executive-suite track. The two
                    buttons feel parallel visually and behaviorally
                    while each pre-filtering for the right inquiry. */}
                <DevelopmentInquiryButton
                  label="Inquire about an executive suite"
                  variant="primary"
                  modalTitle="Tell us about your business."
                  modalEyebrow="Now Leasing — Executive Office Suites"
                  initialInterest="suite"
                />
              </div>
              <div className="rounded-2xl bg-background-cream p-8 lg:p-10 lg:order-1">
                <Briefcase className="h-9 w-9 text-gold mb-4" />
                <h3 className="font-heading text-heading-lg font-bold text-primary mb-4">What's included</h3>
                <ul className="space-y-3 text-body-sm text-foreground-muted">
                  {SUITE_FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* Inquiry form */}
        <section id="inquiry" className="section-luxury bg-background-cream scroll-mt-24">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <div className="rounded-2xl bg-white shadow-card p-7 sm:p-10">
                  <p className="overline mb-3">Inquire</p>
                  <h2 className="font-heading text-heading-xl font-bold text-primary mb-2">Tell us about your situation.</h2>
                  <p className="text-body text-foreground-muted mb-8">
                    Quick form — about 30 seconds. A CRECO broker will follow up directly with current availability, rates, and next steps.
                  </p>
                  <DevelopmentInterestForm />
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-2xl bg-primary text-white p-7">
                  <Phone className="h-8 w-8 text-gold mb-4" />
                  <h3 className="font-heading text-heading-sm font-bold mb-2">Prefer to talk?</h3>
                  <p className="text-body-sm text-white/70 leading-relaxed mb-4">
                    Call or text and we'll walk you through current availability, pricing, and timing. Faster than email if you're moving on a tight timeline.
                  </p>
                  <a href="tel:+12108173443" className="inline-flex items-center gap-2 text-gold font-semibold hover:text-gold-light">
                    (210) 817-3443
                  </a>
                </div>
                <div className="rounded-2xl bg-white border border-border p-7">
                  <FileText className="h-8 w-8 text-gold mb-4" />
                  <h3 className="font-heading text-heading-sm font-bold text-primary mb-2">Leasing flyer</h3>
                  <p className="text-body-sm text-foreground-muted mb-4 leading-relaxed">
                    Download the 8000 Fair Oaks Pkwy leasing flyer — property overview, photos, and contact info in one PDF.
                  </p>
                  <TrackedAnchor
                    href={FLYER_PDF}
                    target="_blank"
                    rel="noreferrer noopener"
                    event="flyer_downloaded"
                    params={{ property: '8000-fair-oaks-pkwy', surface: 'inquiry_section' }}
                    className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-dark hover:text-gold"
                  >
                    <Download className="h-4 w-4" /> Download flyer (PDF)
                  </TrackedAnchor>
                </div>
                <div className="rounded-2xl bg-white border border-border p-7">
                  <h3 className="font-heading text-heading-sm font-bold text-primary mb-4">Looking elsewhere?</h3>
                  <p className="text-body-sm text-foreground-muted mb-4 leading-relaxed">
                    If 8000 Fair Oaks Pkwy isn't the right fit, CRECO covers the surrounding market — Fair Oaks Ranch, Boerne, and the I-10 corridor.
                  </p>
                  <Link
                    href="/property-alerts"
                    className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-dark hover:text-gold"
                  >
                    Set up property alerts <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </aside>
            </div>
          </Container>
        </section>

        {/* Passive lead-magnets — for the visitor who reads the whole
            page but isn't ready to inquire about a specific suite yet.
            Pair: market report (email for the quarterly read) and
            property alerts (email for new Texas listings). Both
            fire-and-replace inline, no popup. */}
        <section className="bg-white py-16">
          <Container>
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarketReportCapture variant="light" surface="8000-fair-oaks-pkwy-bottom" />
              <PropertyAlertsInline variant="light" surface="8000-fair-oaks-pkwy-bottom" />
            </div>
          </Container>
        </section>

        {/* About CRECO context */}
        <section className="bg-primary py-16 text-white">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <p className="overline mb-3 text-gold">About CRECO</p>
              <h2 className="font-heading text-display-sm font-bold mb-4">
                We're not just brokering Fair Oaks Ranch. We're operating here.
              </h2>
              <p className="text-body-lg text-white/70 leading-relaxed mb-8">
                CRECO is a Texas commercial real estate firm headquartered at 8000 Fair Oaks Pkwy in Fair Oaks Ranch — the same mixed-use commercial center we own and operate. Our practice spans tenant representation, owner services, investment advisory, leasing & sales, property management, and development across Texas. We're not just brokering this property — we live in it. That conviction is what we bring to every Fair Oaks Ranch and Boerne client.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/fair-oaks-ranch-commercial-real-estate"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  Fair Oaks Ranch commercial real estate
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 text-body-sm font-semibold text-white hover:bg-white/10"
                >
                  About CRECO
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
      {/* Sticky inquiry pill — catches the scroll-past-hero visitor.
          Wraps the same DevelopmentInquiryButton the inline retail-bay
          CTA uses so the modal + form + attribution path is identical. */}
      <StickyPropertyCTABar property="8000-fair-oaks-pkwy" hideWhenVisible="#inquiry">
        <DevelopmentInquiryButton
          label="Inquire now"
          variant="gold"
          modalTitle="Tell us about your concept."
          modalEyebrow="Now Leasing — 8000 Fair Oaks Plaza"
          initialInterest="either"
        />
      </StickyPropertyCTABar>
      <Footer />
    </>
  );
}
