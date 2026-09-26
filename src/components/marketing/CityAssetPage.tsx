import Link from 'next/link';
import { SourcesMethodology } from '@/components/marketing/SourcesMethodology';
import { ArrowRight, BarChart3, Building2, MapPin, Phone, CheckCircle2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { jsonLd } from '@/lib/jsonLd';
import { InlineLeadForm } from '@/components/forms/InlineLeadForm';
import { GoogleReviews } from '@/components/marketing/GoogleReviews';
import { FaqSection } from '@/components/marketing/FaqSection';
import { AvailableListingsTable } from '@/components/marketing/AvailableListingsTable';
import { RepresentationBand } from '@/components/marketing/RepresentationBand';
import { filterListings, getAvailableListings } from '@/lib/public-listings';
import { BUSINESS, BUSINESS_ID, listingSummary, type Faq } from '@/lib/schema';
import type { Listing } from '@/lib/supabase';

/**
 * CityAssetPage — shared template for city × asset-class landing pages
 * like /austin-office-space, /houston-industrial-space, /san-antonio-
 * medical-office. These are the long-tail SEO pages that capture
 * intent like "industrial space for lease houston" without trying to
 * compete with LoopNet on transactional inventory queries.
 *
 * Designed for the 2026 AI-citation playbook:
 *   - Hero with one-sentence definition (LLMs cite this verbatim)
 *   - Stats strip with vacancy / rent / market temperature
 *   - Key takeaways bullets directly under the stats
 *   - Long-form market context split into named sections
 *   - Submarket grid cross-linking to the deeper submarket pages
 *   - Why-CRECO bullets specific to this city × asset combination
 *
 * Important honesty rule: use range-based stats ("$28-42/SF NNN") and
 * qualitative commentary, not invented precision. Google's 2026 spam
 * updates de-rank programmatic pages with fabricated specifics; pages
 * with honest ranges + genuine market judgment survive.
 */

export interface CityAssetStat {
  label: string;
  value: string;
  note?: string;
}

export interface CityAssetSubmarketCard {
  name: string;
  characterization: string;
  description: string;
  href?: string;
}

export interface CityAssetConfig {
  /** Month the market figures on this page were last written, e.g. "April 2026" —
   *  renders the Sources & methodology block. */
  sourcesAsOf?: string;
  /** "Austin", "Houston", "San Antonio" */
  city: string;
  /** "office", "industrial", "retail", "medical office", "flex" */
  asset: string;
  heroEyebrow: string;
  /** Definitional sentence — LLMs cite this. ~30 words. */
  quickAnswer: string;
  /** 4-6 market stats — range-based, not fake-precise. */
  stats: CityAssetStat[];
  /** 3-5 punchy bullets. */
  keyTakeaways: string[];
  /** Long-form: 2-4 paragraphs of market context. */
  marketContext: string[];
  /** Long-form: 2-3 paragraphs of what CRECO does in this city × asset. */
  servicesIntro: string[];
  /** Submarkets / districts most relevant for this asset class. */
  submarkets: CityAssetSubmarketCard[];
  /** Why CRECO bullets tailored to this city × asset. */
  whyBullets: string[];
  /** Cross-link to the listings page, filtered to this asset + city. */
  listingsLink: { label: string; href: string };
  /** Cross-link to the city hub. */
  cityHubLink: { label: string; href: string };
  /** Breadcrumb trail (Home is auto-prepended). */
  breadcrumbs: { label: string; href?: string }[];
  /** Canonical path (e.g. "/austin-office-space"). When set, the page emits
   *  Place + Article + BreadcrumbList JSON-LD (matching the submarket template).
   *  Optional so shared consumers without a canonical stay schema-free. */
  canonicalPath?: string;
  /** Optional page-specific FAQs, prepended to the data-derived set. */
  faqs?: Faq[];
}

/**
 * Answer-shaped FAQs built from the page's own config (stats, submarkets) and
 * live inventory — so every answer is consistent with what the page shows and
 * never goes stale relative to the listings table.
 */
function cityAssetFaqs(config: CityAssetConfig, listings: Listing[]): Faq[] {
  const { city, asset } = config;
  const statLine = config.stats.map(s => `${s.label}: ${s.value}${s.note ? ` (${s.note})` : ''}`).join('; ');
  return [
    ...(config.faqs ?? []),
    {
      q: `What are current ${asset} lease rates and vacancy in ${city}?`,
      a: `CRECO's current ${city} ${asset} benchmarks — ${statLine}. These are market ranges from CRECO's deal flow and published data, not quotes; actual rent depends on building class, submarket, term, and concessions. ${config.quickAnswer}`,
    },
    {
      q: `What ${asset} space is available in ${city} right now?`,
      a: listings.length > 0
        ? `CRECO currently markets: ${listings.map(l => `${l.title} (${listingSummary(l)})`).join('; ')}. CRECO's tenant-rep clients also see every other ${city} ${asset} option on the market, including off-market space.`
        : `CRECO has no public ${asset} listing in ${city} at this moment, but as a tenant-representation brokerage it searches the entire ${city} ${asset} market — including LoopNet/CoStar inventory and off-market space — for its clients. Call ${BUSINESS.phoneDisplay} for a current availability survey.`,
    },
    {
      q: `Which ${city} submarkets are best for ${asset} space?`,
      a: `${config.submarkets.map(sm => `${sm.name} — ${sm.characterization}`).join('; ')}. The right fit depends on labor, access, customer base, and budget; CRECO shortlists by submarket before touring.`,
    },
    {
      q: `Does CRECO represent tenants or landlords for ${city} ${asset} deals?`,
      a: `Both — and investors. CRECO is a full-service brokerage, not a tenant-only firm: it represents tenants and buyers searching for ${asset} space (tenant rep is typically paid by the landlord), represents landlords and owners leasing or selling ${asset} property in ${city}, and handles investment sales. When both parties authorize it in writing, CRECO can act as an intermediary under Texas law. Licensed Texas brokerage, ${BUSINESS.trecLicenseDisplay}.`,
    },
    {
      q: `How do I contact CRECO about ${asset} space in ${city}?`,
      a: `Call ${BUSINESS.phoneDisplay}, email ${BUSINESS.email}, or use the Get Started form at crecotx.com/get-started. CRECO is headquartered at ${BUSINESS.fullAddress} and works ${city} and statewide Texas; a broker responds personally.`,
    },
  ];
}

export async function CityAssetPage({ config }: { config: CityAssetConfig }) {
  const available = filterListings(await getAvailableListings(), { metro: config.city, asset: config.asset });
  const faqs = cityAssetFaqs(config, available);
  // Structured data (Place + Article + BreadcrumbList) — ports the submarket
  // template's AI-citation pattern to these city × asset pages, which shipped
  // with no JSON-LD at all. quickAnswer feeds the answer-first description.
  const pageUrl = config.canonicalPath ? `https://www.crecotx.com${config.canonicalPath}` : null;
  const schemas: Record<string, unknown>[] = pageUrl ? [
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      '@id': `${pageUrl}#place`,
      name: `${config.city}, Texas`,
      description: config.quickAnswer,
      containedInPlace: { '@type': 'AdministrativeArea', name: 'Texas, United States' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      '@id': `${pageUrl}#article`,
      headline: `${config.city} ${config.asset} space for lease — market guide`,
      description: config.quickAnswer,
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
        ...config.breadcrumbs.map((b, i) => ({
          '@type': 'ListItem',
          position: i + 2,
          name: b.label,
          item: b.href ? `https://www.crecotx.com${b.href}` : pageUrl,
        })),
      ],
    },
  ] : [];

  return (
    <>
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(s) }} />
      ))}
      <Header />
      <main className="min-h-screen pt-20">
        {/* Breadcrumb */}
        <div className="border-b border-border bg-background-cream py-3">
          <Container>
            <Breadcrumbs items={config.breadcrumbs} />
          </Container>
        </div>

        {/* Hero with answer-first definition */}
        <section className="bg-primary py-16 sm:py-20 text-white">
          <Container>
            <div className="max-w-4xl">
              <p className="overline mb-3 text-gold flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> {config.heroEyebrow}
              </p>
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight">
                {config.city} {config.asset} space for lease.
              </h1>
              <p className="text-body-lg text-white/80 leading-relaxed max-w-2xl">
                What&apos;s available, what it costs, and how CRECO works the market.
              </p>
              <div className="mt-7 flex flex-wrap gap-4">
                <Link
                  href="/get-started"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="tel:+12108173443"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3 text-body-sm font-semibold text-white hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" /> (210) 817-3443
                </a>
              </div>
            </div>
          </Container>
        </section>

        {/* The full quick answer, verbatim. Moved out of the hero, not
            rewritten: it carries this market's specifics and every geographic
            reference exactly as written, and it still feeds the page schema
            and the rent-benchmark FAQ. */}
        <section className="border-b border-border bg-background-cream py-8">
          <Container>
            <p className="max-w-4xl text-body leading-relaxed text-foreground-muted">
              <span className="font-semibold text-primary">In short:</span> {config.quickAnswer}
            </p>
          </Container>
        </section>

        {/* Stats strip — the answer-first centerpiece. Range-based
            numbers are honest about the precision a quarterly snapshot
            can claim. LLMs cite this table directly when summarizing
            "average office rent in austin." */}
        <section className="bg-gold py-10 sm:py-12 text-primary">
          <Container>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-8">
              {config.stats.map(s => (
                <div key={s.label} className="text-center md:text-left">
                  <div className="font-heading text-heading-md font-bold whitespace-nowrap">{s.value}</div>
                  <div className="text-caption font-semibold mt-1">{s.label}</div>
                  {s.note && <div className="text-caption opacity-70 mt-0.5 leading-snug">{s.note}</div>}
                </div>
              ))}
            </div>
          </Container>
        </section>

        <RepresentationBand place={config.city} className="bg-background-cream border-b border-border py-12" />

        {/* Key takeaways */}
        <section className="bg-white py-10 sm:py-12">
          <Container>
            <div className="max-w-3xl">
              <h2 className="font-heading text-heading-lg font-bold text-primary mb-5 inline-flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-gold" /> Key takeaways
              </h2>
              <ul className="space-y-3">
                {config.keyTakeaways.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-body text-foreground-muted leading-relaxed">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        {/* Market context */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div>
                <p className="overline mb-3 text-gold">Market Context</p>
                <h2 className="font-heading text-heading-xl font-bold text-primary">
                  The {config.city} {config.asset} market today.
                </h2>
              </div>
              <div className="lg:col-span-2 space-y-5">
                {config.marketContext.map((p, i) => (
                  <p key={i} className="text-body-lg text-foreground-muted leading-relaxed">{p}</p>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Submarket grid */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="mb-10">
              <p className="overline mb-3 text-gold">Where to Look</p>
              <h2 className="font-heading text-heading-xl font-bold text-primary">
                {config.city} {config.asset} submarkets we cover.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {config.submarkets.map(sm => {
                const card = (
                  <div className="rounded-xl border border-border bg-white p-5 h-full hover:border-gold hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-1 h-5 w-5 shrink-0 text-gold" />
                      <div>
                        <h3 className="font-heading text-heading-sm font-bold text-primary">{sm.name}</h3>
                        <p className="text-caption text-gold-dark mt-0.5 font-semibold">{sm.characterization}</p>
                        <p className="mt-3 text-body-sm text-foreground-muted leading-relaxed">{sm.description}</p>
                      </div>
                    </div>
                  </div>
                );
                return sm.href
                  ? <Link key={sm.name} href={sm.href} className="block h-full">{card}</Link>
                  : <div key={sm.name}>{card}</div>;
              })}
            </div>
          </Container>
        </section>

        {/* What CRECO does */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div>
                <p className="overline mb-3 text-gold">CRECO Approach</p>
                <h2 className="font-heading text-heading-xl font-bold text-primary">
                  How we work {config.city} {config.asset} deals.
                </h2>
              </div>
              <div className="lg:col-span-2 space-y-5">
                {config.servicesIntro.map((p, i) => (
                  <p key={i} className="text-body-lg text-foreground-muted leading-relaxed">{p}</p>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Why CRECO bullets */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="max-w-4xl">
              <h2 className="font-heading text-heading-xl font-bold text-primary mb-6">
                Why CRECO for {config.city} {config.asset}.
              </h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.whyBullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3 text-body text-foreground-muted leading-relaxed">
                    <CheckCircle2 className="mt-1 h-5 w-5 text-gold shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>

        {config.canonicalPath && (
          <AvailableListingsTable
            listings={available}
            path={config.canonicalPath}
            title={`${config.city} ${config.asset} listings represented by CRECO`}
            intro={`Live CRECO inventory for ${config.asset} space in the ${config.city} area. Tenant-rep clients also get access to every other option on the market.`}
            emptyText={`No public CRECO ${config.asset} listing in ${config.city} right now — CRECO searches the full market (including off-market space) for tenant-rep clients. Call ${BUSINESS.phoneDisplay}.`}
          />
        )}

        {/* Reviews then a short ask — cold search traffic lands here and had
            only the footer newsletter to act on. */}
        <GoogleReviews className="section-luxury bg-background-cream border-t border-border" />

        <section className="section-luxury bg-white" aria-label="Contact CRECO">
          <Container>
            <div className="mx-auto max-w-3xl">
              <InlineLeadForm
                eyebrow={`${config.city} ${config.asset}`}
                heading={`Looking for ${config.asset} space in ${config.city}?`}
                body={`Tell us your size and timing and a CRECO broker will send matching ${config.city} ${config.asset} options — including space that is not publicly listed.`}
                contextLabel="What are you looking for?"
                contextPlaceholder={`Size, submarket and timing — e.g. 8,000 SF ${config.asset} near the airport, Q2`}
                source="tenant-needs"
                submitLabel="Send me options"
                surface={`${(config.canonicalPath || `${config.city}-${config.asset}`).replace(/^\//, '')}-inline`}
              />
            </div>
          </Container>
        </section>

        <FaqSection
          faqs={faqs}
          path={config.canonicalPath}
          heading={`${config.city} ${config.asset} space — FAQ`}
          className="section-luxury bg-background-cream border-t border-border"
        />

        {/* Cross-links */}
        <section className="section-luxury bg-white border-t border-border">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Link
                href={config.listingsLink.href}
                className="rounded-xl border border-border bg-white p-6 hover:border-gold hover:bg-gold/5 transition-colors inline-flex items-center justify-between gap-3"
              >
                <span>
                  <p className="overline text-gold-dark mb-1">See Listings</p>
                  <p className="font-heading text-heading-sm font-bold text-primary">{config.listingsLink.label}</p>
                </span>
                <ArrowRight className="h-5 w-5 text-gold-dark shrink-0" />
              </Link>
              <Link
                href={config.cityHubLink.href}
                className="rounded-xl border border-border bg-white p-6 hover:border-gold hover:bg-gold/5 transition-colors inline-flex items-center justify-between gap-3"
              >
                <span>
                  <p className="overline text-gold-dark mb-1">City Overview</p>
                  <p className="font-heading text-heading-sm font-bold text-primary">{config.cityHubLink.label}</p>
                </span>
                <ArrowRight className="h-5 w-5 text-gold-dark shrink-0" />
              </Link>
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="bg-primary py-12 text-white">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-heading text-heading-lg font-bold mb-3">
                Leasing, buying, or selling {config.asset} property in {config.city}?
              </h2>
              <p className="text-body text-white/70 mb-6">
                Tenants: we filter the market to the 4-5 properties worth a tour, typically at no cost to you. Owners and investors: we lease and sell {config.asset} property in {config.city}.
              </p>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3 text-body-sm font-semibold text-primary hover:bg-gold-light"
              >
                Start with CRECO <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Container>
        </section>
        {config.sourcesAsOf && <SourcesMethodology asOf={config.sourcesAsOf} />}
      </main>
      <Footer />
    </>
  );
}
