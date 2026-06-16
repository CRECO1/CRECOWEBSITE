import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin, ArrowRight, Phone, Utensils, HeartPulse, Briefcase, ShoppingBag,
  TrendingUp, Users, Sparkles, FileText, Building2, Flame, Zap, Car, Sun,
  Check, ExternalLink,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { RetailLeasingInquiryForm } from '@/components/forms/RetailLeasingInquiryForm';

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
 * Conversion goal: prospect → tour. The lead form pre-qualifies on
 * concept category, SF, timeline, existing locations, and financing —
 * the broker's Hot / Warm / Aspirational signal.
 *
 * Distinct from /8000-fair-oaks-pkwy (which is a different CRECO
 * development across town). Both live as their own SEO landing pages
 * so they don't compete for the same keywords.
 */

const SITE_PLAN_PDF = '/site-plans/8979-dietz-elkhorn-site-plan.pdf';
const PHONE_DISPLAY = '(210) 817-3443';
const PHONE_HREF = 'tel:+12108173443';

export const metadata: Metadata = {
  title: '8979 Dietz Elkhorn — New Retail Center Pre-Leasing | Fair Oaks Ranch | CRECO',
  description:
    '8979 Dietz Elkhorn — a new ±20,000 SF neighborhood retail center in Fair Oaks Ranch, TX. Ten ±1,500 SF suites, demisable, with end-cap F&B and food-ready bays. Pre-leasing now — local operators welcome. Median HHI $168K, 2x Texas median. Represented by CRECO.',
  keywords: [
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
  ],
  alternates: { canonical: 'https://www.crecotx.com/8979-dietz-elkhorn' },
  openGraph: {
    title: '8979 Dietz Elkhorn — Now Pre-Leasing | Fair Oaks Ranch',
    description:
      '±20,000 SF neighborhood retail. Ten ±1,500 SF demisable suites. End-cap F&B + food-ready bays. Local operators welcome.',
    url: 'https://www.crecotx.com/8979-dietz-elkhorn',
    type: 'website',
  },
  robots: 'index,follow',
};

// ─── Section data ─────────────────────────────────────────────────────

const WHY_NOW = [
  {
    icon: TrendingUp,
    title: '$168K median household income',
    body: '2x the Texas median, 2x+ the US median. Captive daily-needs demand with discretionary spend that supports premium service + specialty concepts.',
  },
  {
    icon: Users,
    title: '~12,600 residents + Hill Country pull',
    body: 'Fair Oaks Ranch plus traffic from Leon Springs, Boerne, and NW Bexar. Median age 46 — established households, loyal to local operators they trust.',
  },
  {
    icon: Sparkles,
    title: 'Thin supply of quality small-bay retail',
    body: 'Area asking rents sit mid-$20s to $30 NNN with limited new inventory. A brand-new center with food-ready infrastructure is exactly what the market is short on.',
  },
  {
    icon: Building2,
    title: 'CRECO is the leasing team',
    body: "Local broker, local owner relationships, fast decisions. We're recruiting tenants, not waiting on listings. Tours are walked weekly.",
  },
];

const ASSET_SPEC = [
  { icon: Building2, label: 'Total GLA',           value: '±20,000 SF' },
  { icon: Sparkles,  label: 'Suites',              value: 'Ten ±1,500 SF bays' },
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

const FAQ = [
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
];

// ─── Page ─────────────────────────────────────────────────────────────

export default function DietzElkhornPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section
          className="relative bg-primary py-16 sm:py-24 text-white overflow-hidden"
          style={{
            backgroundImage: 'url(/site-plans/8979-dietz-elkhorn-site-plan.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Dark overlay so text stays readable */}
          <div className="absolute inset-0 bg-primary/70" />
          <Container className="relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight">
                8979 <span className="text-gold">Dietz Elkhorn.</span>
              </h1>
              <p className="text-body-lg text-white/80 leading-relaxed mb-4 max-w-2xl mx-auto">
                A new <strong className="text-white">±20,000 SF neighborhood retail center</strong> on
                Dietz Elkhorn in Fair Oaks Ranch — ten demisable ±1,500 SF suites, two F&B end caps with
                patio envelopes, and 2-3 food-ready bays.
              </p>
              <p className="overline mb-6 text-gold flex items-center justify-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Now Pre-Leasing · 8979 Dietz Elkhorn · Fair Oaks Ranch, TX
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href="#inquire"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-8 py-4 text-body-sm font-bold text-primary hover:bg-gold-light shadow-lg"
                >
                  Claim Your Suite — Inquire Now <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={PHONE_HREF}
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 text-body-sm font-bold text-primary hover:bg-white/90 shadow"
                >
                  <Phone className="h-4 w-4" /> Call {PHONE_DISPLAY}
                </a>
              </div>
              <p className="mt-5 text-body-sm text-white/50">
                Suites are limited — local operators get first pick of end caps and food-ready bays.
              </p>
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

        {/* Why now */}
        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="max-w-2xl mb-12 mx-auto text-center">
              <p className="overline mb-3 text-gold">Why this center, why now</p>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary leading-tight">
                A local-first center in a market that rewards local.
              </h2>
              <p className="mt-4 text-body text-foreground-muted leading-relaxed">
                Fair Oaks Ranch is not a value market and it is not a national-credit market.
                It is a high-income, relationship-driven community where residents
                champion businesses that feel like they belong. The leasing strategy
                leans into that.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {WHY_NOW.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-2xl border border-border bg-white p-6 sm:p-8">
                    <Icon className="h-6 w-6 text-gold mb-4" />
                    <h3 className="font-heading text-body-lg font-bold text-primary mb-2">{item.title}</h3>
                    <p className="text-body-sm text-foreground-muted leading-relaxed">{item.body}</p>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Tenant categories */}
        <section className="bg-primary py-16 sm:py-20 text-white">
          <Container>
            <div className="max-w-2xl mb-12 mx-auto text-center">
              <p className="overline mb-3 text-gold">Who fits here</p>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold leading-tight">
                Daily-needs, lifestyle, and discretionary — in that order.
              </h2>
              <p className="mt-4 text-body text-white/75 leading-relaxed">
                Build the mix around a high-income, time-pressed, 46-year-old household
                base. Below is what we&apos;re actively recruiting — your concept either
                slots into one of these or you tell us what we&apos;re missing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
              {TENANT_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <div key={cat.title} className="rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-8">
                    <div className="flex items-start justify-between mb-4">
                      <Icon className="h-7 w-7 text-gold" />
                      <span className="text-caption uppercase tracking-widest text-gold/80">{cat.suiteCount}</span>
                    </div>
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
        <section className="bg-background-cream py-16 sm:py-20 border-y border-border">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
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
                  href={SITE_PLAN_PDF}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg border border-primary px-5 py-2.5 text-body-sm font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  <FileText className="h-4 w-4" /> Download site plan (PDF) <ExternalLink className="h-3 w-3" />
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
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Site plan embed */}
        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="max-w-2xl mb-8 mx-auto text-center">
              <p className="overline mb-3 text-gold">Site plan</p>
              <h2 className="font-heading text-heading-xl font-bold text-primary leading-tight">
                Where everything sits.
              </h2>
              <p className="mt-3 text-body text-foreground-muted leading-relaxed">
                The site is configured for a retail building with adjacent daycare and
                pond, plus parking sized for F&B + fitness peak demand. Tap below for
                the full engineered PDF.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-background-cream overflow-hidden">
              <img
                src="/site-plans/8979-dietz-elkhorn-site-plan.png"
                alt="8979 Dietz Elkhorn site plan"
                className="w-full h-auto object-contain"
              />
            </div>
            <p className="text-caption text-foreground-muted text-center mt-3">
              Site plan: Headwall Investments / KFM Engineering. For reference; final site
              configuration subject to permit.
            </p>
          </Container>
        </section>

        {/* Lease terms */}
        <section className="bg-background-cream py-16 sm:py-20 border-y border-border">
          <Container>
            <div className="max-w-3xl mx-auto">
              <p className="overline mb-3 text-gold text-center">Deal framework</p>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary text-center leading-tight mb-3">
                Terms designed for local operators.
              </h2>
              <p className="text-body text-foreground-muted text-center leading-relaxed mb-10 max-w-2xl mx-auto">
                These are starting points, not take-it-or-leave-it. We concede on free
                rent and TI before cutting base rent — those are real tools to get the
                right tenant in.
              </p>

              <div className="rounded-2xl bg-white border border-border overflow-hidden">
                {TERMS.map((row, idx) => (
                  <div
                    key={row.label}
                    className={`grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 px-6 py-4 ${idx === TERMS.length - 1 ? '' : 'border-b border-border'}`}
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
        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="max-w-3xl mx-auto">
              <p className="overline mb-3 text-gold text-center">From inquiry to keys</p>
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

        {/* FAQ */}
        <section className="bg-background-cream py-16 sm:py-20 border-y border-border">
          <Container>
            <div className="max-w-3xl mx-auto">
              <p className="overline mb-3 text-gold text-center">Common questions</p>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary text-center leading-tight mb-12">
                What every local operator asks first.
              </h2>

              <div className="space-y-3">
                {FAQ.map(item => (
                  <details
                    key={item.q}
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
        <section id="inquire" className="bg-white py-16 sm:py-24 scroll-mt-20">
          <Container>
            <div className="max-w-3xl mx-auto">
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

              <div className="rounded-2xl border border-border bg-background-cream p-6 sm:p-8 lg:p-10">
                <RetailLeasingInquiryForm />
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
      <Footer />
    </>
  );
}

// ─── Small subcomponents ──────────────────────────────────────────────

function StatBlock({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div>
      <div className="font-heading text-display-sm sm:text-display font-bold text-primary leading-none">
        {value}
      </div>
      <div className="text-body-sm font-semibold text-primary mt-2">{label}</div>
      {sub && <div className="text-caption text-foreground-muted mt-0.5">{sub}</div>}
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
