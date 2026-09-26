/**
 * Shared layout for Texas city hub pages — Austin, Houston, Dallas, etc.
 *
 * Each page gets a hero, market overview, submarket grid, why-CRECO, and CTAs.
 * City-specific content is passed in via props so the layout stays consistent
 * across all three cities while the copy can be tailored to each market.
 */

import Link from 'next/link';
import React from 'react';
import { findGuide } from '@/lib/guides';
import { SourcesMethodology, asOfMonth } from '@/components/marketing/SourcesMethodology';
import {
  ArrowRight, MapPin, TrendingUp, Building2, Phone, BellRing,
  CheckCircle, BookOpen,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { jsonLd } from '@/lib/jsonLd';
import { AvailableListingsTable } from '@/components/marketing/AvailableListingsTable';

/**
 * Turn any phone number or email inside a proof-row string into a real link.
 *
 * The "Headquarters" row prints the office phone and email as part of a longer
 * sentence, so they rendered as dead text — a visitor on a phone could read the
 * number but not tap it. Rather than splitting the row into fields, this walks
 * the string and links what it finds, leaving everything else untouched.
 */
const CONTACT_RX = /(\(\d{3}\)\s?\d{3}-\d{4}|\d{3}-\d{3}-\d{4}|[\w.+-]+@[\w-]+\.[\w.]+)/g;

function linkifyContact(value: string): React.ReactNode {
  const parts = value.split(CONTACT_RX);
  if (parts.length === 1) return value;
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.includes('@')) {
      return (
        <a key={i} href={`mailto:${part}`} className="font-semibold text-gold-dark hover:underline">
          {part}
        </a>
      );
    }
    if (/^\(?\d{3}\)?[\s-]?\d{3}-\d{4}$/.test(part)) {
      return (
        <a key={i} href={`tel:+1${part.replace(/\D/g, '')}`} className="font-semibold text-gold-dark hover:underline">
          {part}
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}
import { InlineLeadForm } from '@/components/forms/InlineLeadForm';
import { GoogleReviews } from '@/components/marketing/GoogleReviews';
import { RepresentationBand } from '@/components/marketing/RepresentationBand';
import { filterListings, getAvailableListings } from '@/lib/public-listings';
import { BUSINESS, BUSINESS_ID, businessRef, listingSummary } from '@/lib/schema';

export interface SubmarketCard {
  name: string;
  description: string;
  /** Primary use case — "Industrial corridor", "Class A office", etc. */
  characterization: string;
  /** Optional internal link. When set, the card renders as a Link to
   *  the corresponding submarket detail page (typically a /markets/... child).
   *  Cross-linking from city pages → submarket pages strengthens internal
   *  SEO + lets visitors drill into a specific submarket. */
  href?: string;
}

export interface MarketStat {
  label: string;
  value: string;
  /** Optional context — "vs prior year" or sub-text */
  context?: string;
}

export interface CityHubConfig {
  /** Month the market figures on this page were last written, e.g. "May 2026" —
   *  renders the Sources & methodology block. Omit on pages with no figures. */
  sourcesAsOf?: string;
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
  /** Optional breadcrumb trail to display above the hero. Used by nested
   *  routes like /markets/[slug] where this component renders below a
   *  Home → Markets → {submarket} path. Static city pages (Houston,
   *  Austin, San Antonio, etc.) leave this undefined — they ARE the top
   *  geographic landing pages and don't need a crumb above them. */
  breadcrumbs?: { label: string; href?: string }[];
  /** Canonical path (e.g. "/austin-commercial-real-estate"). When set, the page
   *  emits Place + Article + BreadcrumbList JSON-LD. Optional so shared consumers
   *  without a canonical (e.g. the dynamic markets route) stay schema-free. */
  canonicalPath?: string;
  /** Optional answer-first summary (~40-60 words) rendered as a highlighted
   *  callout high on the page + fed to the Article schema description. This is
   *  the snippet AI assistants and featured snippets tend to lift verbatim. */
  quickAnswer?: string;
  /** City-specific FAQs. PREPENDED to a shared, city-interpolated baseline
   *  (baseCityFaqs) so every city hub renders a real FAQ section + FAQPage
   *  schema even when no page-specific questions are supplied. */
  faqs?: { q: string; a: string }[];
  /** Optional local-authority block: the complete answer to "who does
   *  commercial real estate / tenant rep / landlord rep in {city}?" —
   *  enumerated services + verifiable proof points. Emits Service schema. */
  authority?: {
    heading: string;
    intro: string;
    services: { title: string; description: string; href?: string }[];
    proof: { label: string; value: string }[];
  };
}

/**
 * Evergreen, factually-safe FAQs every Texas city hub can carry. Answer-first
 * and city-interpolated so the text differs per page. Grounded in process
 * facts (who pays a broker, typical timelines) + CRECO's own service model —
 * no market stats that would go stale — so they're safe to publish sitewide
 * and the kind of Q&A AI assistants cite. Page-specific faqs prepend to these.
 */
function baseCityFaqs(city: string): { q: string; a: string }[] {
  return [
    {
      q: `Do I need a commercial real estate broker in ${city}, and who pays for one?`,
      a: `As a tenant or buyer, representation in ${city} is almost always free to you — the landlord or seller pays the commission, and it's typically split whether or not you bring your own broker. So going unrepresented rarely saves money; it just means the listing broker is negotiating for the other side. CRECO represents your interests across the entire ${city} market, not one owner's building.`,
    },
    {
      q: `How long does it take to lease or buy commercial property in ${city}?`,
      a: `For a lease, plan on roughly 30–90 days from starting a focused search to signing — a second-generation space (already built out) moves fastest, while heavy build-out adds time. For a purchase, 60–120 days is typical once under contract, to allow for due diligence, financing, and closing. Defining your must-haves up front is the single biggest way to compress that timeline.`,
    },
    {
      q: `What types of commercial property does CRECO handle in ${city}?`,
      a: `Office, industrial and warehouse, retail, medical office, and flex space — for both lease and sale — plus land and investment property, including 1031-exchange replacements. We work all three sides of the market: tenant and buyer representation, owner services (leasing, management, disposition), and investment advisory across ${city} and the rest of Texas.`,
    },
    {
      q: `What size deals does CRECO work on in ${city}?`,
      a: `The same senior team handles a small suite and a multi-million-dollar investment sale — we don't hand smaller ${city} deals to junior staff after the pitch. Whether you're a business finding your first location, a growing tenant needing more room, or an owner with a portfolio, you get direct senior-broker attention.`,
    },
    {
      q: `How do I get started with CRECO in ${city}?`,
      a: `Tell us what you're trying to do — lease, buy, sell, or reposition — and we'll walk through your ${city} options with no pitch and no obligation. Use the "Get started" form or call (210) 817-3443. Not ready to talk yet? Set up property alerts and we'll email you when matching ${city} listings hit the market.`,
    },
  ];
}

export async function CityHubPage({ config }: { config: CityHubConfig }) {
  // Live CRECO inventory for this market — rendered as a table + ItemList and
  // summarized in the first FAQ so "what space is available in {city}?" has a
  // current, citable answer in the server HTML.
  const available = config.canonicalPath
    ? filterListings(await getAvailableListings(), { metro: config.city })
    : [];
  const availabilityFaq = config.canonicalPath
    ? [{
        q: `What commercial space is available in ${config.city} right now?`,
        a: available.length > 0
          ? `CRECO currently markets ${available.length} ${available.length === 1 ? 'property' : 'properties'} in the ${config.city} area: ${available.map(l => `${l.title} (${listingSummary(l)})`).join('; ')}. CRECO's tenant- and buyer-rep clients also get access to all other ${config.cityShort} inventory, including off-market space. Call ${BUSINESS.phoneDisplay}.`
          : `CRECO has no public listing in ${config.city} at this moment, but it represents tenants and buyers across the full ${config.cityShort} market — including LoopNet/CoStar inventory and off-market space. Call ${BUSINESS.phoneDisplay} or email ${BUSINESS.email} for a current availability survey.`,
      }]
    : [];
  // Structured data (Place + Article + BreadcrumbList) — these city hubs shipped
  // with no JSON-LD. heroSubhead feeds the description (no quickAnswer field on
  // this template). Only emitted when the caller supplies a canonical path.
  const pageUrl = config.canonicalPath ? `https://www.crecotx.com${config.canonicalPath}` : null;
  const crumbTrail = config.breadcrumbs && config.breadcrumbs.length > 0
    ? config.breadcrumbs
    : [{ label: config.city }];
  const faqs = [...availabilityFaq, ...(config.faqs ?? []), ...baseCityFaqs(config.cityShort)];
  const schemas: Record<string, unknown>[] = pageUrl ? [
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      '@id': `${pageUrl}#place`,
      name: `${config.city}, Texas`,
      description: config.heroSubhead,
      containedInPlace: { '@type': 'AdministrativeArea', name: 'Texas, United States' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${pageUrl}#article`,
      headline: `${config.city} Commercial Real Estate — Market Overview`,
      description: config.quickAnswer || config.heroSubhead,
      inLanguage: 'en-US',
      isAccessibleForFree: true,
      mainEntityOfPage: pageUrl,
      about: { '@id': `${pageUrl}#place` },
      datePublished: '2026-01-01',
      dateModified: '2026-08-01',
      author: {
        '@type': 'Organization',
        '@id': BUSINESS_ID,
        name: BUSINESS.name,
        url: 'https://www.crecotx.com/about',
      },
      publisher: { '@id': BUSINESS_ID },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.crecotx.com/' },
        ...crumbTrail.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: b.label,
          item: b.href ? `https://www.crecotx.com${b.href}` : pageUrl,
        })),
      ],
    },
  ] : [];

  if (pageUrl && config.authority) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${pageUrl}#services`,
      name: `CRECO commercial real estate services in ${config.city}`,
      itemListElement: config.authority.services.map((svc, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Service',
          name: `${svc.title} — ${config.city}`,
          serviceType: svc.title,
          description: svc.description,
          provider: businessRef,
          areaServed: { '@type': 'Place', name: `${config.city}, Texas` },
          ...(svc.href ? { url: `https://www.crecotx.com${svc.href}` } : {}),
        },
      })),
    });
  }

  // FAQPage schema — always emitted (the baseline guarantees faqs.length > 0).
  // The same questions render visibly below, which Google requires for FAQ rich
  // results and which gives AI answer engines clean Q&A pairs to quote.
  if (faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      ...(pageUrl ? { '@id': `${pageUrl}#faq` } : {}),
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(s) }} />
      ))}
      <Header />
      <main className="min-h-screen pt-20">
        {/* Optional breadcrumb strip — only renders when caller provides
            a trail. Markets/[slug] does; static city pages don't. */}
        {config.breadcrumbs && config.breadcrumbs.length > 0 && (
          <div className="border-b border-border bg-background-cream py-3">
            <Container>
              <Breadcrumbs items={config.breadcrumbs} />
            </Container>
          </div>
        )}

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
              <p className="max-w-2xl text-body-lg text-white/70 leading-relaxed mb-8">
                How CRECO works this market — and what that means for your next lease or sale.
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

        {/* Market Stats Strip — explicit 1→2→4 column ladder + nowrap on
            the value so currency / abbreviation strings like "$4.2B" never
            break mid-character on tight viewports. */}
        {config.marketStats.length > 0 && (
          <section className="bg-gold py-10 sm:py-12 text-primary">
            <Container>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
                {config.marketStats.map(stat => (
                  <div key={stat.label} className="text-center md:text-left">
                    <div className="font-heading text-display-sm font-bold whitespace-nowrap">{stat.value}</div>
                    <div className="text-body-sm font-semibold mt-1">{stat.label}</div>
                    {stat.context && <div className="text-caption opacity-70 mt-0.5">{stat.context}</div>}
                  </div>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* The hero's full subhead, verbatim. Relocated rather than rewritten:
            it carries this market's submarkets and coverage wording exactly as
            written, and still backs the page description. */}
        <section className="border-b border-border bg-background-cream py-8">
          <Container>
            <p className="max-w-4xl text-body leading-relaxed text-foreground-muted">{config.heroSubhead}</p>
          </Container>
        </section>

        {/* Answer-first summary — the concise snippet AI + featured results lift */}
        {config.quickAnswer && (
          <section className="bg-white border-b border-border py-8">
            <Container>
              <div className="max-w-3xl mx-auto flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-gold shrink-0 mt-1" />
                <p className="text-body-lg text-foreground leading-relaxed">
                  <span className="font-semibold text-primary">In short:</span> {config.quickAnswer}
                </p>
              </div>
            </Container>
          </section>
        )}

        <RepresentationBand place={config.city} />

        {config.authority && (
          <section className="section-luxury bg-background-cream" aria-labelledby="authority-heading">
            <Container>
              <div className="mx-auto max-w-5xl">
                <p className="overline mb-3">Local Authority</p>
                <h2 id="authority-heading" className="mb-4 font-heading text-display-sm font-bold text-primary">{config.authority.heading}</h2>
                <p className="mb-10 max-w-3xl text-body-lg leading-relaxed text-foreground">{config.authority.intro}</p>
                <h3 className="mb-5 font-heading text-heading-lg font-bold text-primary">Services in {config.cityShort}</h3>
                <ul className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {config.authority.services.map(svc => (
                    <li key={svc.title} className="rounded-xl border border-border bg-white p-5">
                      <h4 className="mb-2 font-heading text-heading-sm font-bold text-primary">
                        {svc.href ? <Link href={svc.href} className="hover:text-gold">{svc.title}</Link> : svc.title}
                      </h4>
                      <p className="text-body-sm leading-relaxed text-foreground-muted">{svc.description}</p>
                    </li>
                  ))}
                </ul>
                <h3 className="mb-5 font-heading text-heading-lg font-bold text-primary">Proof — verifiable facts</h3>
                <dl className="divide-y divide-border rounded-xl border border-border bg-white">
                  {config.authority.proof.map(p => (
                    <div key={p.label} className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-3 sm:gap-4">
                      <dt className="text-body-sm font-semibold text-primary">{p.label}</dt>
                      <dd className="text-body-sm text-foreground-muted sm:col-span-2">{linkifyContact(p.value)}</dd>
                    </div>
                  ))}
                </dl>
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
                {config.submarkets.map(s => {
                  const inner = (
                    <>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <span className="text-caption uppercase tracking-widest text-gold">{s.characterization}</span>
                      </div>
                      <h3 className="font-heading text-heading-sm font-bold text-primary mb-2 group-hover:text-gold transition-colors">{s.name}</h3>
                      <p className="text-body-sm text-foreground-muted leading-relaxed">{s.description}</p>
                      {s.href && (
                        <span className="mt-3 inline-flex items-center gap-1.5 text-caption font-semibold text-gold-dark group-hover:text-gold">
                          Explore submarket <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                        </span>
                      )}
                    </>
                  );
                  return s.href ? (
                    <Link
                      key={s.name}
                      href={s.href}
                      className="group surface-card surface-card-hover flex flex-col"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div key={s.name} className="group surface-card">
                      {inner}
                    </div>
                  );
                })}
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
                <ul className="space-y-3.5">
                  {config.whyBullets.map(b => {
                    // Split each bullet on the first em-dash, hyphen, or colon
                    // so the lead phrase reads stronger than the explanation.
                    // Tested separators in priority order — first match wins.
                    // If no separator: render the whole line plainly.
                    const sep = [' — ', ' – ', ': '].find(s => b.includes(s));
                    const [lead, rest] = sep ? b.split(sep) as [string, string] : [b, ''];
                    return (
                      <li key={b} className="flex items-start gap-3 text-body text-foreground leading-relaxed">
                        <CheckCircle className="h-5 w-5 text-gold shrink-0 mt-1" />
                        <span>
                          <span className="font-semibold text-primary">{lead}</span>
                          {rest && (
                            <>
                              <span className="text-foreground-muted"> {sep!.trim()} </span>
                              <span className="text-foreground">{rest}</span>
                            </>
                          )}
                        </span>
                      </li>
                    );
                  })}
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
                  className="group surface-card surface-card-hover flex items-start gap-5"
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

        {config.canonicalPath && (
          <AvailableListingsTable
            listings={available}
            path={config.canonicalPath}
            title={`${config.city} commercial listings represented by CRECO`}
            intro={`Currently available CRECO inventory in the ${config.city} area — retail, office, industrial, flex, and land.`}
            emptyText={`No public CRECO listing in ${config.city} right now. CRECO searches the entire ${config.cityShort} market, including off-market space, for tenant- and buyer-rep clients — call ${BUSINESS.phoneDisplay}.`}
            className="section-luxury bg-white border-t border-border"
          />
        )}

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
                    href={findGuide(post.slug) ? `/guides/${post.slug}` : `/insights/${post.slug}`}
                    className="group surface-card surface-card-hover flex flex-col"
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

        {/* FAQ — visible Q&A mirroring the FAQPage schema (required for rich
            results) and giving AI answer engines clean pairs to quote. */}
        {faqs.length > 0 && (
          <section className="section-luxury bg-white" id="faq" aria-labelledby="faq-heading">
            <Container>
              <div className="max-w-3xl mx-auto">
                <p className="overline mb-3">FAQ</p>
                <h2 id="faq-heading" className="font-heading text-display-sm font-bold text-primary mb-8">
                  {config.cityShort} commercial real estate — common questions
                </h2>
                <dl className="space-y-8">
                  {faqs.map((f, i) => (
                    <div key={i}>
                      <dt className="font-heading text-heading-sm font-bold text-primary mb-2">{f.q}</dt>
                      <dd className="text-body text-foreground leading-relaxed">{f.a}</dd>
                    </div>
                  ))}
                </dl>
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
                Texas commercial real estate · headquartered in Fair Oaks Ranch · serving the entire state
              </p>
            </div>
          </Container>
        </section>
        {/* Cold organic traffic lands on these pages and previously had only the
            footer newsletter to act on. Real reviews, then a short ask. */}
        <GoogleReviews className="section-luxury bg-background-cream" />

        <section className="section-luxury bg-white" aria-label="Contact CRECO">
          <Container>
            <div className="mx-auto max-w-3xl">
              <InlineLeadForm
                eyebrow={config.cityShort}
                heading={`Looking for space in ${config.city}?`}
                body={`Tell us what you need and a CRECO broker will send ${config.cityShort} options that match — including space that is not publicly listed.`}
                contextLabel="What are you looking for?"
                contextPlaceholder={`Type, size and timing — e.g. 5,000 SF retail in ${config.cityShort}, Q1`}
                source="tenant-needs"
                submitLabel="Send me options"
                surface={`${(config.canonicalPath || config.city).replace(/^\//, '')}-inline`}
              />
            </div>
          </Container>
        </section>

        {config.sourcesAsOf && <SourcesMethodology asOf={config.sourcesAsOf} />}
      </main>
      <Footer />
    </>
  );
}
