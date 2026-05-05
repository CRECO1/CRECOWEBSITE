/**
 * Shared layout for Texas city hub pages — Austin, Houston, Dallas, etc.
 *
 * Each page gets a hero, market overview, submarket grid, why-CRECO, and CTAs.
 * City-specific content is passed in via props so the layout stays consistent
 * across all three cities while the copy can be tailored to each market.
 */

import Link from 'next/link';
import {
  ArrowRight, MapPin, TrendingUp, Building2, Phone, BellRing,
  CheckCircle, BookOpen,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';

export interface SubmarketCard {
  name: string;
  description: string;
  /** Primary use case — "Industrial corridor", "Class A office", etc. */
  characterization: string;
}

export interface MarketStat {
  label: string;
  value: string;
  /** Optional context — "vs prior year" or sub-text */
  context?: string;
}

export interface CityHubConfig {
  city: string;
  /** Short noun phrase like "Austin", "Houston", "Dallas–Fort Worth" */
  cityShort: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubhead: string;
  /** 2-3 paragraphs of market context */
  marketIntro: string[];
  marketStats: MarketStat[];
  /** What CRECO does in this city specifically */
  servicesIntro: string[];
  /** Submarkets / districts within the city */
  submarkets: SubmarketCard[];
  /** Why-CRECO bullets, tailored to the market */
  whyBullets: string[];
  /** Slug-form related insight posts to surface */
  relatedInsights: { slug: string; title: string; category: string }[];
  /** Property type quick-link cards */
  propertyLinks: { label: string; href: string; description: string }[];
}

export function CityHubPage({ config }: { config: CityHubConfig }) {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 sm:py-24 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-3 text-gold flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> {config.heroEyebrow}
              </p>
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight">
                {config.heroTitle}
              </h1>
              <p className="text-body-lg text-white/70 leading-relaxed mb-8">
                {config.heroSubhead}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/get-started"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
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

        {/* Market Stats Strip */}
        {config.marketStats.length > 0 && (
          <section className="bg-gold py-8 sm:py-10 text-primary">
            <Container>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {config.marketStats.map(stat => (
                  <div key={stat.label} className="text-center md:text-left">
                    <div className="font-heading text-display-sm font-bold">{stat.value}</div>
                    <div className="text-body-sm font-semibold mt-1">{stat.label}</div>
                    {stat.context && <div className="text-caption opacity-70 mt-0.5">{stat.context}</div>}
                  </div>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* Market Intro */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="max-w-3xl mx-auto">
              <p className="overline mb-3">Market Overview</p>
              <h2 className="font-heading text-display-sm font-bold text-primary mb-6">
                {config.cityShort} commercial real estate, in plain English.
              </h2>
              <div className="prose-creco space-y-5">
                {config.marketIntro.map((p, i) => (
                  <p key={i} className="text-body text-foreground leading-relaxed">{p}</p>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Submarkets */}
        {config.submarkets.length > 0 && (
          <section className="section-luxury bg-white">
            <Container>
              <div className="max-w-3xl mx-auto text-center mb-12">
                <p className="overline mb-3">Submarkets</p>
                <h2 className="font-heading text-display-sm font-bold text-primary mb-3">
                  Where {config.cityShort} commercial real estate lives.
                </h2>
                <p className="text-body text-foreground-muted">
                  Each {config.cityShort} submarket has its own personality. The right one for you depends on what your business needs — and we know the differences cold.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {config.submarkets.map(s => (
                  <div key={s.name} className="rounded-xl border border-border bg-white p-7 hover:border-gold hover:shadow-card-hover transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <span className="text-caption uppercase tracking-widest text-gold">{s.characterization}</span>
                    </div>
                    <h3 className="font-heading text-heading-sm font-bold text-primary mb-2">{s.name}</h3>
                    <p className="text-body-sm text-foreground-muted leading-relaxed">{s.description}</p>
                  </div>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* What CRECO does in this city */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div>
                <p className="overline mb-3">CRECO in {config.cityShort}</p>
                <h2 className="font-heading text-display-sm font-bold text-primary mb-6">
                  Texas-wide reach. {config.cityShort} expertise.
                </h2>
                <div className="prose-creco space-y-4 mb-8">
                  {config.servicesIntro.map((p, i) => (
                    <p key={i} className="text-body text-foreground leading-relaxed">{p}</p>
                  ))}
                </div>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-sm font-semibold text-white hover:bg-primary/90"
                >
                  All services
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-2xl bg-white border border-border p-7 sm:p-9">
                <p className="overline mb-3">Why CRECO</p>
                <h3 className="font-heading text-heading-lg font-bold text-primary mb-5">
                  What you get working with us.
                </h3>
                <ul className="space-y-3">
                  {config.whyBullets.map(b => (
                    <li key={b} className="flex items-start gap-3 text-body text-foreground">
                      <CheckCircle className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* Property Links */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="text-center mb-12">
              <p className="overline mb-3">{config.cityShort} Listings</p>
              <h2 className="font-heading text-display-sm font-bold text-primary">
                Browse by property type
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {config.propertyLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-xl border border-border bg-white p-7 hover:border-gold hover:shadow-card-hover transition-all flex items-start gap-5"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold group-hover:bg-gold group-hover:text-primary transition-colors shrink-0">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-heading-sm font-bold text-primary mb-1 group-hover:text-gold transition-colors">
                      {link.label}
                    </h3>
                    <p className="text-body-sm text-foreground-muted leading-relaxed">{link.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-foreground-muted group-hover:text-gold transition-all group-hover:translate-x-1 shrink-0" />
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* Related Insights */}
        {config.relatedInsights.length > 0 && (
          <section className="section-luxury bg-background-cream">
            <Container>
              <div className="text-center mb-12">
                <p className="overline mb-3">Related Insights</p>
                <h2 className="font-heading text-display-sm font-bold text-primary">
                  Read up on the {config.cityShort} market
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {config.relatedInsights.map(post => (
                  <Link
                    key={post.slug}
                    href={`/insights/${post.slug}`}
                    className="group rounded-xl border border-border bg-white p-7 hover:border-gold hover:shadow-card-hover transition-all flex flex-col"
                  >
                    <BookOpen className="h-7 w-7 text-gold mb-4" />
                    <p className="text-caption uppercase tracking-widest text-gold mb-2">{post.category}</p>
                    <h3 className="font-heading text-heading-sm font-bold text-primary mb-4 group-hover:text-gold transition-colors flex-1">
                      {post.title}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-gold-dark group-hover:text-gold">
                      Read article <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* Final CTA */}
        <section className="bg-primary py-16 text-white">
          <Container>
            <div className="max-w-2xl mx-auto text-center">
              <p className="overline mb-3 text-gold">Ready when you are</p>
              <h2 className="font-heading text-display-sm sm:text-display-md font-bold mb-4">
                Let's talk about your {config.cityShort} commercial real estate needs.
              </h2>
              <p className="text-body-lg text-white/70 leading-relaxed mb-8">
                Whether you're scouting your first {config.cityShort} location, repositioning an existing property, or building a Texas-wide portfolio — CRECO is happy to walk through your specific situation. No pitch, no obligation.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/get-started"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/property-alerts"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 text-body-sm font-semibold text-white hover:bg-white/10"
                >
                  <BellRing className="h-4 w-4" />
                  Set up property alerts
                </Link>
              </div>
              <p className="mt-8 text-caption text-white/50 flex items-center justify-center gap-2">
                <TrendingUp className="h-3 w-3 text-gold" />
                Texas commercial real estate · headquartered in San Antonio · serving the entire state
              </p>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
