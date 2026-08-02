// 30-min ISR — admin edits to the landing_pages row show up live within
// half an hour without a redeploy, but we still skip a server render on
// every visit.
export const revalidate = 1800;

import type { Metadata } from 'next';
import { jsonLd } from '@/lib/jsonLd';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, ArrowRight, Utensils, HeartPulse, Briefcase, ShoppingBag,
  TrendingUp, Users, Sparkles, FileText, Building2, Flame, Zap, Car, Sun,
  Check, ExternalLink,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { RetailLeasingInquiryForm } from '@/components/forms/RetailLeasingInquiryForm';
import { BrokerCard } from '@/components/marketing/BrokerCard';
import { ClaimSuiteButton } from '@/components/marketing/ClaimSuiteButton';
import { MarketReportCapture } from '@/components/marketing/MarketReportCapture';
import { PropertyAlertsInline } from '@/components/marketing/PropertyAlertsInline';
import { StickyPropertyCTABar } from '@/components/marketing/StickyPropertyCTABar';
import { getLandingPage } from '@/lib/supabase';

/**
 * /8979-dietz-elkhorn — pre-leasing landing page for the upcoming
 * ±20,000 SF neighborhood retail center at 8979 Dietz Elkhorn,
 * Fair Oaks Ranch, TX.
 *
 * Audience: LOCAL BUSINESS OWNERS evaluating a Fair Oaks Ranch suite.
 * NOT residential, NOT investors, NOT national-credit reps. Copy and
 * structure follow the CRECO × Fair Oaks Realty Group leasing strategy
 * (local-first, ~10 demisable suites, end caps for F&B, food-ready
 * bays). The landing page is referenced from the on-site "Now Pre-Leasing"
 * signage QR code per Section 5.B of the strategy.
 *
 * Distinct from /8000-fair-oaks-pkwy (which is a different CRECO
 * development across town). Both live as their own SEO landing pages
 * so they don't compete for the same keywords.
 *
 * ── Admin editability ──
 * The text-heavy fields (SEO meta, hero overline/headline/subhead, the
 * 4 "Why now" cards, and the FAQ list) are sourced from the
 * `landing_pages` table with slug='8979-dietz-elkhorn'. The admin edits
 * them at /admin?tab=landing_pages. Structural sections (stats, asset
 * spec grid, tenant categories, lease terms, process, lead form) stay
 * in code — those rarely change and changing them visually needs code
 * anyway. The hardcoded defaults below are the canonical seed and the
 * fallback when the DB row hasn't been created yet.
 */

// Site plan asset — the cropped PNG, which is the property only (no
// engineering letterhead / KFM branding). The original engineered PDF
// lives outside the public folder so it can't be downloaded by URL.
const SITE_PLAN_PNG = '/site-plans/8979-dietz-elkhorn-site-plan.png';
const PHONE_DISPLAY = '(210) 817-3443';
const PHONE_HREF = 'tel:+12108173443';

// ─── Editable defaults (used as the seed + as fallback) ──────────────
// These mirror the columns on the landing_pages row. Keep this in sync
// with the seed SQL — when the row is present, DB wins; when it's not,
// the page still renders identically with this copy.

const FALLBACK = {
  meta_title: '8979 Dietz Elkhorn — New Retail Center Pre-Leasing | Fair Oaks Ranch | CRECO',
  meta_description:
    '8979 Dietz Elkhorn — a new ±20,000 SF neighborhood retail center in Fair Oaks Ranch, TX. Ten ±1,500 SF suites, demisable, with end-cap F&B and food-ready bays. Pre-leasing now — local operators welcome. Median HHI $168K, 2x Texas median. Represented by CRECO.',
  eyebrow: 'Now Pre-Leasing',
  h1: '8979 Dietz Elkhorn.',
  subhead:
    'A new ±20,000 SF neighborhood retail center on Dietz Elkhorn in Fair Oaks Ranch.',
  market_bullets: [
    {
      title: '$168K median household income',
      body: '2x the Texas median, 2x+ the US median. Captive daily-needs demand with discretionary spend that supports premium service + specialty concepts.',
    },
    {
      title: '~12,600 residents + Hill Country pull',
      body: 'Fair Oaks Ranch plus traffic from Leon Springs, Boerne, and NW Bexar. Median age 46 — established households, loyal to local operators they trust.',
    },
    {
      title: 'Thin supply of quality small-bay retail',
      body: 'Quality small-bay retail in the trade area is in short supply, and new inventory is thin. A brand-new center with food-ready infrastructure is exactly what the market is missing.',
    },
    {
      title: 'CRECO is the leasing team',
      body: "Local broker, local owner relationships, fast decisions. We're recruiting tenants, not waiting on listings. Tours are walked weekly.",
    },
  ],
  faqs: [
    {
      q: 'How big are the suites and can I combine them?',
      a: 'Standard bays are ±1,500 SF with demising walls designed to combine. Pair two for ±3,000 SF, three for ±4,500 SF — common asks from restaurants, fitness studios, and medical users. End caps and food-ready bays are limited; the earliest LOIs get first pick.',
    },
    {
      q: 'Can my food concept work here?',
      a: 'Yes. We are pre-plumbing 2-3 suites with grease lines, venting, and 3-phase power so F&B operators do not have to retrofit. End caps include a patio envelope. Coffee, fast-casual, brunch, bakery, and wine bar concepts are all in scope.',
    },
    {
      q: 'What does NNN actually cost me?',
      a: 'Triple-net is the tenant share of taxes, insurance, and common-area maintenance. We will share a current NNN estimate when we send the LOI; for centers of this size it typically lands meaningfully below the base rent.',
    },
    {
      q: 'When does the center open?',
      a: 'Delivery is in active planning. We are pre-leasing now toward a target of 40-50% committed before delivery and 90% within 12 months of opening. The fastest path to picking your suite is to start the conversation now.',
    },
    {
      q: 'What kind of operators are you looking for?',
      a: 'Phase 1 is local-first: established operators from Fair Oaks Ranch, Boerne, Leon Springs, Stone Oak, and greater NW San Antonio who want a Fair Oaks Ranch location. National and franchise tenants enter selectively in Phase 2 after stabilization.',
    },
    {
      q: 'Do I need a tenant rep broker?',
      a: 'You do not. CRECO represents the landlord and works directly with owner-operators, but we co-broke with tenant-rep brokers at a market commission if that is your preference. Either path gets you the same straight answers.',
    },
  ],
};

// Icons for the 4 Why-Now cards — matched to market_bullets by index.
// If the admin adds a 5th bullet it'll render without an icon; we never
// throw on missing icons.
const WHY_NOW_ICONS = [TrendingUp, Users, Sparkles, Building2];

// Structural sections (not in DB — change in code if they need updating)
const ASSET_SPEC: { icon: typeof Building2; label: string; value: string; sub?: string }[] = [
  { icon: Building2, label: 'Total GLA',           value: '±20,000 SF' },
  { icon: Sparkles,  label: 'Suites',              value: 'Built-to-suit' },
  { icon: Zap,       label: 'Demisable',           value: 'Combine to 3,000 / 4,500 SF' },
  { icon: Flame,     label: 'Food-ready bays',     value: '2-3 with grease + venting' },
  { icon: Sun,       label: 'End caps',            value: 'Two — F&B with patio envelope' },
  { icon: Car,       label: 'Parking',             value: 'Supports F&B + fitness peaks' },
];

const TENANT_CATEGORIES = [
  {
    icon: Utensils,
    title: 'Food & Beverage',
    suiteCount: '2-3 suites (incl. end caps)',
    concepts: 'Specialty coffee, bakery, fast-casual, juice / smoothie, brunch, wine + charcuterie bar',
    tag: 'Anchor energy — highest priority',
  },
  {
    icon: HeartPulse,
    title: 'Health & Wellness',
    suiteCount: '3-4 suites',
    concepts: 'Boutique fitness / Pilates, med-spa, nail + hair salon, massage, physical therapy, IV / wellness',
    tag: 'Daily-needs traffic',
  },
  {
    icon: Briefcase,
    title: 'Professional Services',
    suiteCount: '2-3 suites',
    concepts: 'Insurance, financial / wealth advisor, real estate, dental, optometry, boutique medical',
    tag: 'High-income household demand',
  },
  {
    icon: ShoppingBag,
    title: 'Retail & Specialty',
    suiteCount: '2-3 suites',
    concepts: "Women's boutique, pet supply + grooming, home decor / gift, children's, golf / outdoor",
    tag: 'Discretionary spend',
  },
];

const TERMS = [
  { label: 'Base rent (in-line)', value: 'Call for pricing — contact CRECO for current rates' },
  { label: 'Lease type',          value: 'Triple net (NNN)' },
  { label: 'Term',                value: '3-5 yr initial with renewal options' },
  { label: 'Escalations',         value: '4% annual base escalation' },
  { label: 'TI allowance',        value: 'Scaled to deal — more for anchors + F&B' },
  { label: 'Exclusive use',       value: 'Granted narrowly to protect category leaders' },
];

// ─── Metadata ────────────────────────────────────────────────────────
// Async so admin edits to meta_title/meta_description go live without a
// redeploy. Falls back to the FALLBACK values if the row doesn't exist.

const BASE_KEYWORDS = [
  '8979 dietz elkhorn',
  'dietz elkhorn retail',
  'fair oaks ranch retail center',
  'fair oaks ranch retail space for lease',
  'fair oaks ranch new development',
  'fair oaks ranch restaurant space',
  'fair oaks ranch coffee shop space',
  'fair oaks ranch fitness space',
  'fair oaks ranch boutique space',
  'fair oaks ranch medical office',
  'new retail center fair oaks ranch',
  'fair oaks ranch end cap restaurant',
  'creco leasing',
];

export async function generateMetadata(): Promise<Metadata> {
  const db = await getLandingPage('8979-dietz-elkhorn').catch(() => null);
  const title = db?.meta_title || FALLBACK.meta_title;
  const description = db?.meta_description || FALLBACK.meta_description;
  return {
    title,
    description,
    keywords: BASE_KEYWORDS,
    alternates: { canonical: 'https://www.crecotx.com/8979-dietz-elkhorn' },
    openGraph: {
      title: '8979 Dietz Elkhorn — Now Pre-Leasing | Fair Oaks Ranch',
      description: description,
      url: 'https://www.crecotx.com/8979-dietz-elkhorn',
      type: 'website',
    },
    robots: 'index,follow',
  };
}

// ─── Page ─────────────────────────────────────────────────────────────

export default async function DietzElkhornPage() {
  // Read editable content. If the row doesn't exist or the DB call
  // fails for any reason, fall back to FALLBACK so the page always
  // renders.
  const db = await getLandingPage('8979-dietz-elkhorn').catch(() => null);

  const eyebrow = db?.eyebrow || FALLBACK.eyebrow;
  const h1 = db?.h1 || FALLBACK.h1;
  const subhead = db?.subhead || FALLBACK.subhead;
  const marketBullets = (db?.market_bullets?.length ? db.market_bullets : FALLBACK.market_bullets);
  const faqs = (db?.faqs?.length ? db.faqs : FALLBACK.faqs);

  // RealEstateListing + FAQPage schema. The first gives the page
  // rich-result eligibility (price omitted intentionally — "Call for
  // pricing"). The FAQPage feeds Google's People Also Ask box AND
  // lets AI assistants (chatgpt.com, copilot.com) deep-link the right
  // Q&A directly. FAQs come from the same source the page renders, so
  // schema stays in sync with displayed copy.
  const REAL_ESTATE_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: 'Elkhorn Point — 8979 Dietz Elkhorn',
    url: 'https://www.crecotx.com/8979-dietz-elkhorn',
    image: ['https://www.crecotx.com/site-plans/8979-dietz-elkhorn-site-plan.png'],
    description:
      'New ±20,000 SF neighborhood retail center pre-leasing on Dietz Elkhorn in Fair Oaks Ranch, TX. Ten demisable suites, two F&B end caps with patio envelopes, and 2-3 food-ready bays.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '8979 Dietz Elkhorn Rd',
      addressLocality: 'Fair Oaks Ranch',
      addressRegion: 'TX',
      postalCode: '78015',
      addressCountry: 'US',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 29.7506, longitude: -98.6920 },
    broker: {
      '@type': 'RealEstateAgent',
      name: 'CRECO',
      url: 'https://www.crecotx.com',
      telephone: '+1-210-817-3443',
    },
    areaServed: { '@type': 'City', name: 'Fair Oaks Ranch' },
  };
  const FAQ_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f: { q: string; a: string }) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(REAL_ESTATE_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(FAQ_SCHEMA) }}
      />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero — py-12 on mobile so the section doesn't feel cavernous
            below the H1 stack on a phone. sm:py-24 keeps the dramatic
            desktop chrome. */}
        <section className="relative bg-primary py-12 sm:py-24 text-white overflow-hidden">
          {/* Background photo as an absolute <img> instead of CSS
              background-image. object-cover gives pixel-perfect width +
              height coverage, avoiding the sub-pixel gap on the right
              edge where the dark bg-primary used to peek through with
              background-size: cover. */}
          {/* next/image fill + priority — LCP element. WebP conversion
              + responsive srcset + preload hint. Layout coverage
              identical to the raw <img absolute inset-0 w-full h-full>
              pattern via fill. */}
          <Image
            src={SITE_PLAN_PNG}
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Dark overlay so text stays readable */}
          <div className="absolute inset-0 bg-primary/70" />
          <Container className="relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              {/* "Now Pre-Leasing" pill sits ABOVE the address. Short
                  pin-style tag that draws the eye into the H1; the
                  city/state already lives directly under the H1 so the
                  pill doesn't repeat the property name or location.
                  Bumped from text-caption to text-body-sm so the pill
                  has real visual weight above the H1 instead of feeling
                  like a tiny tag — padding nudged up to match. */}
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-5 py-2 mb-5 text-body-sm uppercase tracking-widest text-gold font-bold no-underline">
                <MapPin className="h-4 w-4" />
                <span>{eyebrow}</span>
              </div>
              {/* Hero text scale bumped one notch — everything below
                  the H1 reads more substantial without making the H1
                  itself overflow on smaller desktop widths. */}
              <h1 className="font-heading text-display-lg sm:text-display-xl font-bold mb-2 leading-tight">
                {h1}
              </h1>
              <p className="font-heading text-display-sm sm:text-display font-bold text-white mb-5 leading-tight">
                Fair Oaks Ranch, TX
              </p>
              {/* Mobile: text-body-lg keeps subhead readable without
                  overwhelming the H1 stack on a narrow viewport. Bumps
                  up to text-heading on sm+. lg:whitespace-nowrap forces
                  a single line only when the column can actually fit it. */}
              <p className="text-body-lg sm:text-heading text-white leading-relaxed mb-7 max-w-7xl mx-auto whitespace-pre-line lg:whitespace-nowrap">
                {subhead}
              </p>
              {/* Single flowing sentence with an em-dash instead of a
                  hard <br/>. The previous hard break forced a two-line
                  layout even when the viewport could fit the whole line,
                  and read awkwardly on mobile where it wrapped to 3-4
                  lines. The em-dash version wraps naturally — clean
                  whatever the width. */}
              <p className="text-body text-gold font-bold mb-7 max-w-xl mx-auto leading-snug">
                Suites are limited — local operators get first pick of end caps and food-ready bays.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <ClaimSuiteButton />
              </div>
            </div>
          </Container>
        </section>

        {/* Market snapshot — numbers row */}
        <section className="bg-background-cream py-12 sm:py-16 border-b border-border">
          <Container>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <StatBlock value="$168K+" label="Median household income" sub="2x the Texas median" />
              <StatBlock value="12,600" label="Residents" sub="Plus Boerne + Leon Springs pull" />
              <StatBlock value="46" label="Median age" sub="Established, loyal households" />
              <StatBlock value="Call" label="for Pricing" sub={PHONE_DISPLAY} />
            </div>
          </Container>
        </section>

        {/* Why now — driven by landing_pages.market_bullets */}
        <section className="bg-white py-12 sm:py-20">
          <Container>
            <div className="max-w-2xl mb-12 mx-auto text-center">
              <FlankedEyebrow>Why this center, why now</FlankedEyebrow>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary leading-tight">
                Where local belongs—and the market rewards it.
              </h2>
              <p className="mt-4 text-body text-foreground-muted leading-relaxed">
                Fair Oaks Ranch is not a value market and it is not a national-credit market.
                It is a high-income, relationship-driven community where residents
                champion businesses that feel like they belong. The leasing strategy
                leans into that.
              </p>
            </div>
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {marketBullets.map((item, idx) => {
                const Icon = WHY_NOW_ICONS[idx];
                return (
                  <div key={`${item.title}-${idx}`} className="rounded-2xl border border-border bg-white p-5 sm:p-8 text-center">
                    {Icon && <Icon className="h-6 w-6 text-gold mb-4 mx-auto" />}
                    <h3 className="font-heading text-body-lg font-bold text-primary mb-2">{item.title}</h3>
                    <p className="text-body-sm text-foreground-muted leading-relaxed">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Tenant categories */}
        <section className="bg-primary py-12 sm:py-20 text-white">
          <Container>
            <div className="max-w-2xl mb-12 mx-auto text-center">
              <FlankedEyebrow tone="onDark">Who fits here</FlankedEyebrow>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold leading-tight">
                Daily-needs, lifestyle, and discretionary — in that order.
              </h2>
              <p className="mt-4 text-body text-white/75 leading-relaxed">
                Build the mix around a high-income, time-pressed, 46-year-old household
                base. Below is what we&apos;re actively recruiting — your concept either
                slots into one of these or you tell us what we&apos;re missing.
              </p>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              {TENANT_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <div key={cat.title} className="rounded-2xl bg-white/5 border border-white/10 p-5 sm:p-8 text-center">
                    <Icon className="h-7 w-7 text-gold mx-auto mb-3" />
                    <span className="block text-caption uppercase tracking-widest text-gold/80 mb-3">{cat.suiteCount}</span>
                    <h3 className="font-heading text-body-lg font-bold text-white mb-2">{cat.title}</h3>
                    <p className="text-body-sm text-white/75 leading-relaxed mb-3">{cat.concepts}</p>
                    <p className="text-caption text-gold/90 font-semibold">{cat.tag}</p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* The asset / suite plan */}
        <section className="bg-background-cream py-12 sm:py-20 border-y border-border">
          <Container>
            {/* gap-8 on mobile (when the two columns stack vertically) keeps
                the "Ten suites" intro tight against the spec grid below it
                — gap-12 on mobile was creating a hard visual break. lg:gap-12
                preserves the desktop spacing where the two columns sit
                side-by-side and need the larger gutter to feel intentional. */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
              <div className="lg:col-span-2">
                <p className="overline mb-3 text-gold">The center</p>
                <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary leading-tight mb-5">
                  Ten suites, designed to combine.
                </h2>
                <p className="text-body text-foreground-muted leading-relaxed mb-4">
                  The shell is engineered so suites can stand alone at ±1,500 SF or combine
                  into 3,000 / 4,500 SF for restaurants, fitness studios, and medical users.
                  End caps get patio envelopes; food-ready bays come pre-plumbed for grease,
                  venting, and 3-phase power so you don&apos;t retrofit later.
                </p>
                <p className="text-body-sm text-foreground-muted leading-relaxed">
                  The goal is complementary tenants that cross-shop — a coffee or lunch
                  spot that feeds traffic to the salon, the boutique, and the medical
                  office next door — with no two direct competitors fighting for the
                  same dollar.
                </p>
                <a
                  href={SITE_PLAN_PNG}
                  target="_blank"
                  rel="noreferrer noopener"
                  download
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-primary px-5 py-2.5 text-body-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  <FileText className="h-4 w-4" /> Download site plan <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ASSET_SPEC.map(item => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className="rounded-xl bg-white border border-border p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="h-4 w-4 text-gold" />
                          <div className="text-caption uppercase tracking-widest text-foreground-muted">{item.label}</div>
                        </div>
                        <div className="font-heading text-body-lg font-bold text-primary">{item.value}</div>
                        {item.sub && (
                          <div className="mt-1 text-body-sm text-gold font-semibold">{item.sub}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Site plan embed */}
        <section className="bg-white py-12 sm:py-20">
          <Container>
            <div className="max-w-2xl mb-8 mx-auto text-center">
              <FlankedEyebrow>Site plan</FlankedEyebrow>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary leading-tight">
                Where everything sits.
              </h2>
              <p className="mt-3 text-body text-foreground-muted leading-relaxed">
                The site is configured for a retail building with adjacent daycare and
                pond, plus parking sized for F&B + fitness peak demand. Tap below for
                the full engineered PDF.
              </p>
            </div>

            <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-background-cream overflow-hidden">
              {/* next/image with explicit width/height so the browser
                  reserves space before load (no CLS) and we still get
                  WebP + responsive srcset. width/height are the source
                  PNG's nominal dimensions; rendered size is governed
                  by w-full + h-auto via className. */}
              <Image
                src={SITE_PLAN_PNG}
                alt="8979 Dietz Elkhorn site plan"
                width={1687}
                height={1133}
                sizes="(min-width: 1024px) 56rem, 100vw"
                className="w-full h-auto object-contain mx-auto"
              />
            </div>
          </Container>
        </section>

        {/* Lease terms */}
        <section className="bg-background-cream py-12 sm:py-20 border-y border-border">
          <Container>
            <div className="max-w-3xl mx-auto">
              <FlankedEyebrow>Deal framework</FlankedEyebrow>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary text-center leading-tight mb-3">
                Terms designed for local operators.
              </h2>
              <p className="text-body text-foreground-muted text-center leading-relaxed mb-10 max-w-2xl mx-auto">
                These are starting points, not take-it-or-leave-it.
              </p>

              <div className="rounded-2xl bg-white border border-border overflow-hidden">
                {TERMS.map((row, idx) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 px-5 sm:px-6 py-4 ${idx === TERMS.length - 1 ? '' : 'border-b border-border'}`}
                  >
                    <div className="text-caption uppercase tracking-widest text-foreground-muted">
                      {row.label}
                    </div>
                    <div className="sm:col-span-2 text-body-sm text-primary font-medium">
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </Container>
        </section>

        {/* Process */}
        <section className="bg-white py-12 sm:py-20">
          <Container>
            <div className="max-w-3xl mx-auto">
              <FlankedEyebrow>From inquiry to keys</FlankedEyebrow>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary text-center leading-tight mb-12">
                What happens after you fill out the form.
              </h2>

              <ol className="space-y-6">
                <ProcessStep n={1} title="Pre-qualifying call (~15 min)" body="A CRECO broker reviews your concept, SF, timeline, and financing posture. We tell you honestly whether you're a fit — and which suite is a fit for you." />
                <ProcessStep n={2} title="Site tour" body="We walk you the whole center, not just the bay. You see the co-tenancy story, talk through buildout, and visualize signage + patio + flow." />
                <ProcessStep n={3} title="1-2 page LOI" body="A clean, owner-friendly LOI covers suite, term, base rent, escalations, NNN, TI, free rent, and exclusive use. No 40-page document required to get to yes." />
                <ProcessStep n={4} title="Lease + buildout" body="We use a consistent NNN lease form across the center, so we move fast. Buildout is collaborative — landlord and tenant work split per the LOI." />
                <ProcessStep n={5} title="Open the doors" body="Soft launch with your neighbors, then a coordinated center-wide opening push. Phase 1 tenants get the most pre-open marketing lift." />
              </ol>
            </div>
          </Container>
        </section>

        {/* FAQ — driven by landing_pages.faqs */}
        <section className="bg-background-cream py-12 sm:py-20 border-y border-border">
          <Container>
            <div className="max-w-3xl mx-auto">
              <FlankedEyebrow>Common questions</FlankedEyebrow>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary text-center leading-tight mb-12">
                What every local operator asks first.
              </h2>

              <div className="space-y-3">
                {faqs.map((item, idx) => (
                  <details
                    key={`${item.q}-${idx}`}
                    className="group rounded-xl bg-white border border-border p-5 sm:p-6 [&_summary]:cursor-pointer"
                  >
                    <summary className="flex items-start justify-between gap-4 list-none">
                      <h3 className="font-heading text-body font-bold text-primary">{item.q}</h3>
                      <span className="text-gold text-2xl leading-none mt-[-2px] group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="mt-3 text-body-sm text-foreground-muted leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Lead capture */}
        <section id="inquire" className="bg-white py-12 sm:py-24 scroll-mt-20">
          <Container>
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <p className="overline mb-3 text-gold">Pre-lease your suite</p>
                <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary leading-tight mb-4">
                  Tell us about your concept.
                </h2>
                <p className="text-body text-foreground-muted leading-relaxed max-w-xl mx-auto">
                  A CRECO broker will follow up within one business day. Established
                  operators with strong concepts get first pick of end caps and
                  food-ready bays.
                </p>
              </div>

              {/* Two-column: form on left, broker card on right. The
                  named broker tile next to a form is a top-3 trust
                  lift in CRE conversion research — visitors submit
                  more readily when they know exactly who's replying. */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
                <div className="lg:col-span-2 rounded-2xl border border-border bg-background-cream p-5 sm:p-8 lg:p-10">
                  <RetailLeasingInquiryForm />
                </div>
                <div className="lg:sticky lg:top-24">
                  <BrokerCard intro="Your inquiry is going to:" />
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center text-body-sm text-foreground-muted">
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-gold" /> CRECO is the leasing team
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-gold" /> Tours walked weekly
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-gold" /> Co-broke welcome at market commission
                </span>
              </div>

              <p className="text-caption text-foreground-muted text-center mt-8">
                Prefer to talk first? Call{' '}
                <a href={PHONE_HREF} className="text-gold-dark hover:underline font-semibold">
                  {PHONE_DISPLAY}
                </a>{' '}
                or email{' '}
                <a href="mailto:info@crecotx.com" className="text-gold-dark hover:underline font-semibold">
                  info@crecotx.com
                </a>.
              </p>
            </div>
          </Container>
        </section>

        {/* Passive lead-magnets — for visitors who read the whole page
            but aren't ready to claim a specific suite yet. Same pair as
            Plaza so brokers see a consistent lead taxonomy across
            properties. Light variant against the cream/white sections
            on either side. */}
        <section className="bg-white py-12 sm:py-16">
          <Container>
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarketReportCapture variant="light" surface="8979-dietz-elkhorn-bottom" />
              <PropertyAlertsInline variant="light" surface="8979-dietz-elkhorn-bottom" />
            </div>
          </Container>
        </section>

        {/* Cross-link to other CRECO Fair Oaks development */}
        <section className="bg-primary py-12 text-white">
          <Container>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="overline mb-2 text-gold">Also from CRECO in Fair Oaks Ranch</p>
                <h3 className="font-heading text-body-lg font-bold">8000 Fair Oaks Pkwy</h3>
                <p className="text-body-sm text-white/70 mt-1">
                  4-bay retail + executive office suites, walk-up access on Fair Oaks Pkwy.
                </p>
              </div>
              <Link
                href="/8000-fair-oaks-pkwy"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-white/10"
              >
                See that center <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Container>
        </section>
      </main>
      {/* Sticky inquiry pill — same modal as the hero "Claim Your Suite"
          CTA. Anchored to the bottom of the viewport after the visitor
          scrolls past the hero; auto-hides once the inline #inquire
          form enters view so we don't compete with ourselves. */}
      <StickyPropertyCTABar property="8979-dietz-elkhorn" hideWhenVisible="#inquire">
        <ClaimSuiteButton />
      </StickyPropertyCTABar>
      <Footer />
    </>
  );
}

// ─── Small subcomponents ──────────────────────────────────────────────

function StatBlock({ value, label, sub }: { value: string; label: string; sub?: string }) {
  // text-center on the whole block so short values ("Call", "46") sit
  // visually centered in their grid cell instead of clumping to the
  // left edge — fixes the "more room on the right than the left"
  // perception across the 4-column stat row.
  return (
    <div className="text-center">
      <div className="font-heading text-display-sm sm:text-display font-bold text-primary leading-none">
        {value}
      </div>
      <div className="text-body-sm font-semibold text-primary mt-2">{label}</div>
      {sub && <div className="text-caption text-foreground-muted mt-0.5">{sub}</div>}
    </div>
  );
}

/**
 * FlankedEyebrow — overline text with a thin gold line BELOW the text,
 * centered. Reads as a small underline accent rather than flanking lines.
 * Same component name kept so the call sites don't need to change.
 *
 * `tone="onDark"` keeps the color logic in one place in case we ever need
 * to swap line opacity for a different section background.
 */
function FlankedEyebrow({ children, tone = 'onLight' }: { children: React.ReactNode; tone?: 'onLight' | 'onDark' }) {
  const lineCls = tone === 'onDark' ? 'bg-gold/50' : 'bg-gold/40';
  return (
    <div className="text-center mb-3">
      <span className="overline text-gold">{children}</span>
      <span className={`block h-px w-12 mx-auto mt-2 ${lineCls}`} aria-hidden="true" />
    </div>
  );
}

function ProcessStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex items-start gap-4">
      <span className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full bg-gold text-primary font-heading font-bold">
        {n}
      </span>
      <div>
        <h3 className="font-heading text-body-lg font-bold text-primary mb-1">{title}</h3>
        <p className="text-body-sm text-foreground-muted leading-relaxed">{body}</p>
      </div>
    </li>
  );
}
