import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ArrowRight, BellRing, Building2, TrendingUp, Phone, Sparkles } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { DevelopmentInterestForm } from '@/components/forms/DevelopmentInterestForm';

export const metadata: Metadata = {
  title: '8000 Fair Oaks Pkwy — CRECO Retail Development | Fair Oaks Ranch, TX',
  description:
    "8000 Fair Oaks Pkwy — CRECO's retail development in Fair Oaks Ranch, Texas. Register your interest as a tenant prospect. Bringing the right retail, restaurant, and service tenants to one of the most affluent submarkets in greater San Antonio.",
  keywords: [
    '8000 fair oaks pkwy',
    '8000 fair oaks parkway',
    'fair oaks ranch retail development',
    'fair oaks ranch retail space',
    'fair oaks ranch new retail',
    'fair oaks pkwy commercial',
    'fair oaks ranch restaurant space',
    'creco fair oaks development',
  ],
  alternates: { canonical: 'https://www.crecotx.com/8000-fair-oaks-pkwy' },
  openGraph: {
    title: '8000 Fair Oaks Pkwy — CRECO Retail Development',
    description:
      "CRECO's retail development at 8000 Fair Oaks Pkwy in Fair Oaks Ranch, TX. Register your interest as a tenant prospect.",
    url: 'https://www.crecotx.com/8000-fair-oaks-pkwy',
    type: 'website',
  },
};

const VALUE_PROPS = [
  {
    icon: TrendingUp,
    title: 'Demographics that punch above their weight',
    body: 'Fair Oaks Ranch household incomes are among the highest in Texas — and the trade area\'s spending currently leaves the submarket every day for retail and dining elsewhere. The right retail concept here serves a market that has been waiting for it.',
  },
  {
    icon: MapPin,
    title: 'Fair Oaks Pkwy frontage',
    body: "8000 Fair Oaks Pkwy sits on the spine of the residential community — the natural location for community-serving retail, restaurants, and services. Visibility, access, and proximity to the Fair Oaks Ranch resident base.",
  },
  {
    icon: Building2,
    title: 'CRECO is the developer and the broker',
    body: "Most retail centers separate the developer from the leasing team. We do both. That means tenants get straight answers about timeline, buildout, and economics — and decisions don't get stuck waiting on a third party.",
  },
  {
    icon: Sparkles,
    title: 'Curated, not just leased-up',
    body: "We're not chasing whoever signs first. We're building a tenant mix that makes the project work for everyone — the right anchor concepts, complementary daily-needs tenants, and destination uses that drive cross-traffic.",
  },
];

export default function FairOaksDevPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 sm:py-24 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-3 text-gold flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> CRECO Development · Fair Oaks Ranch, TX
              </p>
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight">
                8000 Fair Oaks Pkwy.
              </h1>
              <p className="text-body-lg text-white/70 leading-relaxed mb-8 max-w-2xl">
                CRECO is developing retail at 8000 Fair Oaks Pkwy — bringing the right restaurants, services, and specialty retail to one of the most affluent and underserved submarkets in greater San Antonio. Tenant prospects can register interest now while we finalize design, anchor positioning, and leasing details.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#interest"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  Register tenant interest
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="tel:+12108173443"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 text-body-sm font-semibold text-white hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                  (210) 817-3443
                </a>
              </div>
            </div>
          </Container>
        </section>

        {/* Status strip */}
        <section className="bg-gold py-6 text-primary">
          <Container>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center">
              <span className="font-heading text-heading-sm font-bold uppercase tracking-wider">
                Pre-Leasing Inquiries Open
              </span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">Building specs + availability finalizing</span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">Tenant LOI conversations underway</span>
            </div>
          </Container>
        </section>

        {/* Vision */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="max-w-3xl mx-auto">
              <p className="overline mb-3">The Vision</p>
              <h2 className="font-heading text-display-sm font-bold text-primary mb-6">
                The retail Fair Oaks Ranch has been quietly waiting for.
              </h2>
              <div className="space-y-5">
                <p className="text-body text-foreground leading-relaxed">
                  Fair Oaks Ranch has, for years, had a structural mismatch between residential demographics and retail supply. Household incomes are among the highest in the state. The community is growing through master-planned expansion. And yet the trade area's spending — restaurants, daily-needs, services, specialty retail — leaves the submarket every day for The Rim, 1604, or up to Boerne.
                </p>
                <p className="text-body text-foreground leading-relaxed">
                  8000 Fair Oaks Pkwy is CRECO's response. We bought the building because we believe the retail thesis here is real — and because we'd rather build the project ourselves than wait for someone else to figure it out. Our approach: a curated mix of community-serving retail, dining, and service tenants that match the demographics of the surrounding community, programmed and built to the standard the residents already expect.
                </p>
                <p className="text-body text-foreground leading-relaxed">
                  We're talking with prospective tenants now. If you're operating a concept that fits — restaurant, fast-casual, coffee, fitness, medical, specialty retail, or professional service — get in touch. Bringing strong tenants in early shapes the project.
                </p>
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
                A retail location with the demographic backing to underwrite it.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
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

        {/* Interest form */}
        <section id="interest" className="section-luxury bg-background-cream scroll-mt-24">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <div className="rounded-2xl bg-white shadow-card p-7 sm:p-10">
                  <p className="overline mb-3">Register Interest</p>
                  <h2 className="font-heading text-heading-xl font-bold text-primary mb-2">Tell us about your concept.</h2>
                  <p className="text-body text-foreground-muted mb-8">
                    Quick form. Takes about 30 seconds. A CRECO broker will follow up directly with current development status, available space, and timeline as soon as we have specifics for you.
                  </p>
                  <DevelopmentInterestForm />
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-2xl bg-primary text-white p-7">
                  <BellRing className="h-8 w-8 text-gold mb-4" />
                  <h3 className="font-heading text-heading-sm font-bold mb-2">Why register early?</h3>
                  <p className="text-body-sm text-white/70 leading-relaxed">
                    The tenant mix is being built now, not after construction. Early-conversation tenants get first pick of locations, influence on adjacent uses, and the ability to shape buildout before designs are locked.
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-border p-7">
                  <h3 className="font-heading text-heading-sm font-bold text-primary mb-4">Looking elsewhere?</h3>
                  <p className="text-body-sm text-foreground-muted mb-4 leading-relaxed">
                    If 8000 Fair Oaks Pkwy isn't the right fit, CRECO covers the surrounding market. Our broker team can show you what's available across Fair Oaks Ranch, Boerne, and the I-10 corridor.
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

        {/* About CRECO context */}
        <section className="bg-primary py-16 text-white">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <p className="overline mb-3 text-gold">About CRECO</p>
              <h2 className="font-heading text-display-sm font-bold mb-4">
                We don't just broker the deal. We're investing here too.
              </h2>
              <p className="text-body-lg text-white/70 leading-relaxed mb-8">
                CRECO is a Texas commercial real estate firm headquartered in San Antonio, with practice areas in tenant representation, owner services, investment advisory, leasing & sales, property management, and development. 8000 Fair Oaks Pkwy is one of the projects where we're not just brokering — we're putting our own capital behind a thesis we believe in.
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
      <Footer />
    </>
  );
}
