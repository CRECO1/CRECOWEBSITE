// 30-min ISR — copy + spec edits go live without a redeploy.
export const revalidate = 1800;

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  MapPin, Phone, ArrowRight, Store, Scissors, Coffee, Shirt,
  Building2, TrendingUp, Users, Sparkles,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { ListingContactForm } from '@/app/listings/[slug]/ListingContactForm';
import { MarketReportCapture } from '@/components/marketing/MarketReportCapture';
import { PropertyAlertsInline } from '@/components/marketing/PropertyAlertsInline';

/**
 * /15033-main-st-lytle — investment-sale landing page for the
 * multi-tenant retail strip at 15033 Main St, Lytle, TX 78052.
 *
 * Source: LoopNet listing #37635743. The LoopNet page is gated so the
 * exact specs (price, SF, lot size, NOI/cap rate, year built) aren't
 * pulled in automatically — those are "Contact for details" placeholders
 * until the owner provides them, at which point the SPECS constant
 * below is the single place to update them.
 *
 * Photos: none yet. Once the owner drops the 4 site photos at
 *   /public/properties/15033-main-st-lytle/{aerial,front-wide,washateria,diner}.jpg
 * a follow-up edit can add the hero background + gallery section.
 *
 * Audience: commercial real-estate investors looking at stabilized,
 * cash-flowing multi-tenant retail in the San Antonio metro / I-35
 * corridor. Lytle is ~25 minutes southwest of downtown SA in Atascosa
 * County — small-town main-street retail with national-tenant traffic
 * spillover from a nearby big-box anchor + I-35 frontage proximity.
 */

// ─── Property specs ──────────────────────────────────────────────────
// Single source of truth — update here when the LoopNet numbers come in.
// "—" or "Contact for details" placeholders are intentional so the page
// reads honestly rather than guessing.
const SPECS: { label: string; value: string }[] = [
  { label: 'Address',         value: '15033 Main St, Lytle, TX 78052' },
  { label: 'Property type',   value: 'Multi-tenant retail strip' },
  { label: 'Transaction',     value: 'Investment sale' },
  { label: 'Asking price',    value: 'Contact for pricing' },
  { label: 'Building SF',     value: 'Contact for details' },
  { label: 'Lot size',        value: 'Contact for details' },
  { label: 'Year built',      value: 'Contact for details' },
  { label: 'Occupancy',       value: 'Multi-tenant — see rent roll' },
  { label: 'Cap rate / NOI',  value: 'Contact for details' },
];

// ─── Tenant snapshot ──────────────────────────────────────────────────
// Pulled from the property photos. Investor-relevant — the rent roll
// is the asset on a deal like this, not the building shell.
const TENANTS = [
  { icon: Shirt,    name: 'The Washateria',        category: 'Daily-needs laundry' },
  { icon: Shirt,    name: 'Dry Cleaners',          category: 'Service retail' },
  { icon: Scissors, name: '888 Classics Barbershop', category: 'Service retail' },
  { icon: Coffee,   name: "Naomi's Diner",         category: 'Food & beverage' },
  { icon: Store,    name: 'Small Town Girls Boutique', category: 'Specialty retail' },
];

const WHY_THIS_DEAL = [
  {
    icon: TrendingUp,
    title: 'Stabilized multi-tenant cash flow',
    body: 'In-place rent roll across five active local tenants — daily-needs services and F&B that anchor a small-town main street. The kind of mix that survives rate cycles because it serves errands, not discretionary spend.',
  },
  {
    icon: MapPin,
    title: 'I-35 corridor positioning',
    body: 'Lytle sits on Main Street with direct access to I-35 traffic and visibility from the adjacent retail/grocery anchor on McDonald Street. Daily commuter pull from the San Antonio southwest corridor.',
  },
  {
    icon: Users,
    title: 'Captive small-town demographics',
    body: "Lytle and the surrounding Atascosa County market is exactly the kind of small-town retail base where local operators run multi-year leases and don't churn — and where a stabilized rent roll is durable.",
  },
  {
    icon: Sparkles,
    title: 'CRECO is the deal team',
    body: "CRECO handles investment sales across the San Antonio metro. We can underwrite this asset alongside you — comparable sales, rent comps, projected cap rate at stabilized occupancy, and 1031 considerations if applicable.",
  },
];

const PHONE_DISPLAY = '(210) 817-3443';
const PHONE_HREF = 'tel:+12108173443';

// ─── SEO ─────────────────────────────────────────────────────────────
const BASE_KEYWORDS = [
  '15033 main st lytle',
  'lytle tx retail for sale',
  'lytle texas commercial real estate',
  'atascosa county retail investment',
  'multi-tenant retail san antonio metro',
  'i-35 corridor commercial real estate',
  'lytle main street retail',
  'small town retail investment texas',
  'creco investment sale',
];

export const metadata: Metadata = {
  title: '15033 Main St — Multi-Tenant Retail Investment | Lytle, TX | CRECO',
  description:
    '15033 Main St in Lytle, TX — a stabilized multi-tenant retail strip on the I-35 corridor in the San Antonio southwest metro. Five active local tenants across daily-needs, F&B, and specialty retail. Investment sale represented by CRECO.',
  keywords: BASE_KEYWORDS,
  alternates: { canonical: 'https://www.crecotx.com/15033-main-st-lytle' },
  openGraph: {
    title: '15033 Main St — Investment Sale | Lytle, TX',
    description:
      'Multi-tenant retail investment opportunity in Lytle, TX. Stabilized rent roll, I-35 corridor positioning. Represented by CRECO.',
    url: 'https://www.crecotx.com/15033-main-st-lytle',
    type: 'website',
  },
  robots: 'index,follow',
};

// ─── Schema markup ───────────────────────────────────────────────────
const REAL_ESTATE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateListing',
  name: '15033 Main St — Lytle Investment Sale',
  url: 'https://www.crecotx.com/15033-main-st-lytle',
  description:
    'Multi-tenant retail investment property in Lytle, TX. Five active tenants across daily-needs and F&B. San Antonio metro / I-35 corridor.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '15033 Main St',
    addressLocality: 'Lytle',
    addressRegion: 'TX',
    postalCode: '78052',
    addressCountry: 'US',
  },
  // Approximate coords from public records — refine when LoopNet specs land.
  geo: { '@type': 'GeoCoordinates', latitude: 29.2347, longitude: -98.7944 },
  broker: {
    '@type': 'RealEstateAgent',
    name: 'CRECO',
    url: 'https://www.crecotx.com',
    telephone: '+1-210-817-3443',
  },
  areaServed: { '@type': 'City', name: 'Lytle' },
};

// ─── Page ─────────────────────────────────────────────────────────────

export default function LytleMainStPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(REAL_ESTATE_SCHEMA) }}
      />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero — text-driven for now. When the 4 site photos arrive
            we can drop in an absolute <Image> + bg-primary/70 overlay
            (same pattern as Plaza + Elkhorn) to give the hero the
            same photographic anchor. Until then a primary-color
            section with the address pill + dramatic h1 carries it. */}
        <section className="bg-primary py-16 sm:py-24 text-white">
          <Container>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-4 py-1.5 mb-5 text-body-sm uppercase tracking-widest text-gold font-bold">
                <MapPin className="h-4 w-4" />
                <span>Investment Sale · Lytle, TX</span>
              </div>
              <h1 className="font-heading text-display-lg sm:text-display-xl font-bold mb-3 leading-tight">
                15033 Main St.
              </h1>
              <p className="font-heading text-display-sm sm:text-display font-bold text-white mb-5 leading-tight">
                Lytle, TX
              </p>
              <p className="text-body-lg text-white/80 leading-relaxed mb-7 max-w-2xl">
                A stabilized multi-tenant retail strip on the I-35 corridor in the San Antonio
                southwest metro — five active local tenants across daily-needs, F&amp;B, and specialty
                retail. Represented by CRECO.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#inquiry"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-bold text-primary hover:bg-gold-light shadow-lg"
                >
                  Inquire about this property <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={PHONE_HREF}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 text-body-sm font-semibold text-white hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>
          </Container>
        </section>

        {/* Status strip — same visual rhythm as the Plaza page so the
            two investment / leasing landing pages feel like a family. */}
        <section className="bg-gold py-6 text-primary">
          <Container>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
              <span className="font-heading text-heading-sm font-bold uppercase tracking-wider">
                Investment Sale
              </span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">5 Active Tenants</span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">I-35 Corridor</span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">San Antonio Southwest Metro</span>
            </div>
          </Container>
        </section>

        {/* Property snapshot — the spec sheet. Most "Contact for details"
            for now since LoopNet's behind a login; the SPECS constant
            up top is the single edit point when the numbers land. */}
        <section className="bg-background-cream py-16 sm:py-20 border-b border-border">
          <Container>
            <div className="max-w-3xl mx-auto mb-10 text-center">
              <p className="overline mb-3 text-gold">The property</p>
              <h2 className="font-heading text-display-sm font-bold text-primary mb-4">
                Stabilized multi-tenant retail on Main Street.
              </h2>
              <p className="text-body text-foreground-muted leading-relaxed">
                Five tenants in place, durable daily-needs mix, walking distance to the I-35 corridor.
                A clean, cash-flowing main-street asset in the kind of small-town Texas market that
                doesn&apos;t churn.
              </p>
            </div>
            <div className="max-w-4xl mx-auto rounded-2xl bg-white border border-border overflow-hidden">
              {SPECS.map((row, idx) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 px-5 sm:px-6 py-4 ${idx === SPECS.length - 1 ? '' : 'border-b border-border'}`}
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
          </Container>
        </section>

        {/* Tenant snapshot — the rent roll IS the asset for an investor,
            so the tenant mix is front-and-center. Logos / individual
            tenant sales aren't public; presenting categories is the
            honest read until a confidentiality agreement opens the
            full rent roll. */}
        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="max-w-2xl mb-10 mx-auto text-center">
              <p className="overline mb-3 text-gold">Current tenants</p>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary leading-tight">
                Five active tenants. Daily-needs mix.
              </h2>
              <p className="mt-4 text-body text-foreground-muted leading-relaxed">
                Full rent roll, lease terms, and remaining-term schedule available under NDA.
                Request the confidential investment package below.
              </p>
            </div>
            <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TENANTS.map(t => {
                const Icon = t.icon;
                return (
                  <div key={t.name} className="rounded-xl bg-background-cream border border-border p-5">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold shrink-0">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-heading text-body font-bold text-primary mb-0.5">
                          {t.name}
                        </h3>
                        <p className="text-caption text-foreground-muted">{t.category}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* Why this deal — investor-framed value prop. Same card pattern
            as the Plaza "Why" section so the firm's marketing voice
            stays consistent across properties. */}
        <section className="bg-background-cream py-16 sm:py-20 border-y border-border">
          <Container>
            <div className="max-w-2xl mb-12 mx-auto text-center">
              <p className="overline mb-3 text-gold">Why this deal</p>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary leading-tight">
                Durable cash flow in a corridor most investors overlook.
              </h2>
            </div>
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {WHY_THIS_DEAL.map(item => {
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

        {/* Inquiry form — reuses ListingContactForm so submissions land
            in the same /api/leads pipeline + GA event stream as every
            other listing. Tracks as `listing_inquiry_submitted` with
            listing_title="15033 Main St — Lytle Investment Sale". */}
        <section id="inquiry" className="bg-white py-16 sm:py-24 scroll-mt-20">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
              <div className="lg:col-span-2">
                <p className="overline mb-3 text-gold">Investment package</p>
                <h2 className="font-heading text-display-sm font-bold text-primary leading-tight mb-4">
                  Request the rent roll + financials.
                </h2>
                <p className="text-body text-foreground-muted leading-relaxed mb-6">
                  Drop your details and a CRECO principal will follow up within one business day
                  with the confidential investment package — full rent roll, lease term schedule,
                  T-12, and our underwriting read on the asset.
                </p>
                <p className="text-body-sm text-foreground-muted mb-2">
                  <strong className="text-primary">Prefer to talk?</strong>
                </p>
                <a
                  href={PHONE_HREF}
                  className="inline-flex items-center gap-2 text-gold-dark hover:text-gold font-semibold text-body-sm"
                >
                  <Phone className="h-4 w-4" /> {PHONE_DISPLAY}
                </a>
              </div>
              <div className="lg:col-span-3">
                <div className="rounded-2xl border border-border bg-background-cream p-6 sm:p-8">
                  <ListingContactForm listingTitle="15033 Main St — Lytle Investment Sale" />
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Lead magnets — same band as Plaza + Elkhorn for the
            visitor who's window-shopping investments but isn't ready
            to request a specific package yet. */}
        <section className="bg-background-cream py-12 border-t border-border">
          <Container>
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarketReportCapture variant="light" surface="15033-main-st-lytle-bottom" />
              <PropertyAlertsInline variant="light" surface="15033-main-st-lytle-bottom" />
            </div>
          </Container>
        </section>

        {/* Cross-link to other CRECO properties — small visual closer
            so the visitor exits this page into the broader inventory
            rather than the footer. */}
        <section className="bg-primary py-12 text-white">
          <Container>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="overline mb-2 text-gold">More from CRECO</p>
                <h3 className="font-heading text-body-lg font-bold">Browse all Texas properties</h3>
                <p className="text-body-sm text-white/70 mt-1">
                  Office, retail, industrial, and investment sales across San Antonio, Austin, Houston, and DFW.
                </p>
              </div>
              <Link
                href="/listings"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-white/10"
              >
                See the full grid <Building2 className="h-4 w-4" />
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
