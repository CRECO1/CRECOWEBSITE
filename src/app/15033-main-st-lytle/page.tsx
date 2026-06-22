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
 * /15033-main-st-lytle — leasing landing page for the multi-tenant
 * retail strip at 15033 Main St, Lytle, TX 78052.
 *
 * Property type: multi-tenant retail. CRECO is the OWNER + the
 * leasing broker (same owner-operator model as 8000 Fair Oaks Plaza
 * — the page intentionally mirrors that copy voice and "skin in the
 * game" trust signal).
 *
 * Audience: prospective LOCAL TENANTS looking at a Lytle / I-35
 * corridor / SA southwest metro location. Not investors — CRECO
 * owns it and isn't selling it. Spec/lease numbers come from the
 * SPECS constant below and stay "Contact for details" placeholders
 * until the owner provides the live numbers.
 *
 * Photos: none yet. When the 4 site photos land in
 *   /public/properties/15033-main-st-lytle/{aerial,front-wide,washateria,diner}.jpg
 * a follow-up edit can add the hero background + gallery section.
 */

// ─── Property + lease specs ──────────────────────────────────────────
// Single source of truth — update here when the live numbers come in.
const SPECS: { label: string; value: string }[] = [
  { label: 'Address',           value: '15033 Main St, Lytle, TX 78052' },
  { label: 'Property type',     value: 'Multi-tenant retail strip' },
  { label: 'Available SF',      value: 'Contact for current availability' },
  { label: 'Suite sizes',       value: 'Contact for details' },
  { label: 'Lease type',        value: 'NNN (triple net)' },
  { label: 'Base rent',         value: 'Call for current rates' },
  { label: 'Current co-tenants', value: '5 active local operators (see below)' },
  { label: 'Parking',           value: 'Surface lot on-site' },
  { label: 'Highway access',    value: 'I-35 corridor, walking distance' },
];

// ─── Co-tenant snapshot ───────────────────────────────────────────────
// The neighbors a new tenant would join. Important for prospective
// tenants because tenant mix drives cross-shopping traffic — a
// salon next to a barbershop is bad; a diner next to a barbershop
// is good (lunch crowd flows).
const TENANTS = [
  { icon: Shirt,    name: 'The Washateria',        category: 'Daily-needs laundry' },
  { icon: Shirt,    name: 'Dry Cleaners',          category: 'Service retail' },
  { icon: Scissors, name: '888 Classics Barbershop', category: 'Service retail' },
  { icon: Coffee,   name: "Naomi's Diner",         category: 'Food & beverage' },
  { icon: Store,    name: 'Small Town Girls Boutique', category: 'Specialty retail' },
];

const WHY_LEASE_HERE = [
  {
    icon: Users,
    title: 'Daily-needs traffic, not weekend traffic',
    body: "The current co-tenant mix — washateria, dry cleaner, barbershop, diner, boutique — pulls Lytle residents in for errands every week. A new tenant inherits that foot traffic rather than building it from zero.",
  },
  {
    icon: MapPin,
    title: 'I-35 corridor + Main St frontage',
    body: 'Lytle sits directly on the I-35 corridor between San Antonio and Cotulla. The center fronts Main Street with parking visible from the road. Commuter pull from the southwest metro plus local errands traffic.',
  },
  {
    icon: TrendingUp,
    title: 'Small-town market, durable demand',
    body: "Atascosa County tenants tend to sign long and stay. The market doesn't churn the way urban-core retail does — once you're the only place in town for your category, you generally stay that way.",
  },
  {
    icon: Sparkles,
    title: 'CRECO is the owner and the broker',
    body: "Same model as 8000 Fair Oaks Pkwy — we own it, we lease it, we make the call. No going up a chain of approvals to get a tenant improvement allowance approved or a build-out concept signed off. Owner-operator decisions, in the room.",
  },
];

const PHONE_DISPLAY = '(210) 817-3443';
const PHONE_HREF = 'tel:+12108173443';

// ─── SEO ─────────────────────────────────────────────────────────────
const BASE_KEYWORDS = [
  '15033 main st lytle',
  'lytle tx retail space for lease',
  'lytle texas retail leasing',
  'main street lytle commercial',
  'i-35 corridor retail space',
  'atascosa county retail leasing',
  'san antonio southwest retail',
  'lytle small business space',
  'creco owner-operator leasing',
];

export const metadata: Metadata = {
  title: '15033 Main St — Retail Space for Lease | Lytle, TX | CRECO',
  description:
    '15033 Main St in Lytle, TX — multi-tenant retail center now leasing on the I-35 corridor in the San Antonio southwest metro. Established co-tenants drive daily-needs traffic. Owned and represented by CRECO.',
  keywords: BASE_KEYWORDS,
  alternates: { canonical: 'https://www.crecotx.com/15033-main-st-lytle' },
  openGraph: {
    title: '15033 Main St — Now Leasing | Lytle, TX',
    description:
      'Multi-tenant retail center in Lytle, TX on the I-35 corridor. Now leasing — established co-tenants, owner-operator landlord. Represented by CRECO.',
    url: 'https://www.crecotx.com/15033-main-st-lytle',
    type: 'website',
  },
  robots: 'index,follow',
};

// ─── Schema markup ───────────────────────────────────────────────────
const REAL_ESTATE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateListing',
  name: '15033 Main St — Lytle Retail Leasing',
  url: 'https://www.crecotx.com/15033-main-st-lytle',
  description:
    'Multi-tenant retail center in Lytle, TX now leasing. Five active local co-tenants across daily-needs, F&B, and specialty retail. San Antonio metro / I-35 corridor. Owned and represented by CRECO.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '15033 Main St',
    addressLocality: 'Lytle',
    addressRegion: 'TX',
    postalCode: '78052',
    addressCountry: 'US',
  },
  // Approximate coords from public records — refine when the live data lands.
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
        {/* Hero — text-driven for now. Same pattern as Plaza:
            address pill + dramatic h1 + city supporter + lease-framing
            body copy. When the site photos arrive we can drop in an
            absolute <Image> + bg-primary/70 overlay. */}
        <section className="bg-primary py-16 sm:py-24 text-white">
          <Container>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-4 py-1.5 mb-5 text-body-sm uppercase tracking-widest text-gold font-bold">
                <MapPin className="h-4 w-4" />
                <span>Now Leasing · Lytle, TX</span>
              </div>
              <h1 className="font-heading text-display-lg sm:text-display-xl font-bold mb-3 leading-tight">
                15033 Main St.
              </h1>
              <p className="font-heading text-display-sm sm:text-display font-bold text-white mb-5 leading-tight">
                Lytle, TX
              </p>
              <p className="text-body-lg text-white/80 leading-relaxed mb-7 max-w-2xl">
                A multi-tenant retail center on the I-35 corridor in the San Antonio southwest metro
                — <strong className="text-white">five active local co-tenants</strong> across daily-needs, F&amp;B, and specialty
                retail. Owned and operated by CRECO.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#inquiry"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-bold text-primary hover:bg-gold-light shadow-lg"
                >
                  Inquire about a suite <ArrowRight className="h-4 w-4" />
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

        {/* Status strip — leasing-framed status bar matching the
            Plaza page's visual rhythm. */}
        <section className="bg-gold py-6 text-primary">
          <Container>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
              <span className="font-heading text-heading-sm font-bold uppercase tracking-wider">
                Now Leasing
              </span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">Multi-Tenant Retail</span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">I-35 Corridor</span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">Owner-Represented by CRECO</span>
            </div>
          </Container>
        </section>

        {/* Property snapshot — lease-relevant spec table. Update SPECS
            constant up top when the live numbers (suite sizes, base
            rent, available SF) come in. */}
        <section className="bg-background-cream py-16 sm:py-20 border-b border-border">
          <Container>
            <div className="max-w-3xl mx-auto mb-10 text-center">
              <p className="overline mb-3 text-gold">The property</p>
              <h2 className="font-heading text-display-sm font-bold text-primary mb-4">
                Established daily-needs retail on Lytle&apos;s Main Street.
              </h2>
              <p className="text-body text-foreground-muted leading-relaxed">
                A clean, working strip with five durable co-tenants. The kind of small-town main-street
                position where a new business inherits real foot traffic on day one.
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

        {/* Co-tenant snapshot — "your neighbors" framing. For a tenant
            deciding whether to lease in, who they sit next to matters
            more than the building shell. */}
        <section className="bg-white py-16 sm:py-20">
          <Container>
            <div className="max-w-2xl mb-10 mx-auto text-center">
              <p className="overline mb-3 text-gold">Your neighbors</p>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary leading-tight">
                Established co-tenants. Daily-needs mix.
              </h2>
              <p className="mt-4 text-body text-foreground-muted leading-relaxed">
                The current tenant lineup at 15033 Main St. A new tenant joins this mix —
                ideally bringing a complementary category that cross-shops with the operators
                already in place.
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

        {/* Why lease here — tenant-framed value prop. Same 4-card
            layout as Plaza's "Why this center" section. */}
        <section className="bg-background-cream py-16 sm:py-20 border-y border-border">
          <Container>
            <div className="max-w-2xl mb-12 mx-auto text-center">
              <p className="overline mb-3 text-gold">Why lease here</p>
              <h2 className="font-heading text-heading-xl sm:text-display-sm font-bold text-primary leading-tight">
                Inherit foot traffic. Sign with the owner directly.
              </h2>
            </div>
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {WHY_LEASE_HERE.map(item => {
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
            listing_title="15033 Main St — Lytle Retail Leasing". */}
        <section id="inquiry" className="bg-white py-16 sm:py-24 scroll-mt-20">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 max-w-5xl mx-auto">
              <div className="lg:col-span-2">
                <p className="overline mb-3 text-gold">Inquire about a suite</p>
                <h2 className="font-heading text-display-sm font-bold text-primary leading-tight mb-4">
                  Tell us about your concept.
                </h2>
                <p className="text-body text-foreground-muted leading-relaxed mb-6">
                  Drop your details and CRECO — the owner — will follow up within one business day
                  with current availability, suite sizes, lease terms, and timing. Owner-operator
                  conversation; no third-party handoff.
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
                  <ListingContactForm listingTitle="15033 Main St — Lytle Retail Leasing" />
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Lead magnets — same band as Plaza + Elkhorn for the visitor
            who's scoping the market but isn't ready to inquire on a
            specific suite yet. */}
        <section className="bg-background-cream py-12 border-t border-border">
          <Container>
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarketReportCapture variant="light" surface="15033-main-st-lytle-bottom" />
              <PropertyAlertsInline variant="light" surface="15033-main-st-lytle-bottom" />
            </div>
          </Container>
        </section>

        {/* Cross-link to the broader inventory. */}
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
