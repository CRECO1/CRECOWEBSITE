import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileText, MapPin, Quote, ShieldCheck } from 'lucide-react';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { MarketReportCapture } from '@/components/marketing/MarketReportCapture';
import { JsonLd } from '@/components/seo/JsonLd';
import { FOUNDER, FOUNDER_ID, breadcrumbList, webPage } from '@/lib/schema';

/**
 * /market-brief — the San Antonio & Hill Country Market Brief, pre-launch.
 *
 * Replaces the statewide quarterly Texas reports (/guides/qN-2026-* and
 * /research, all 308 → here since Oct 2026). Deliberately honest: no figures
 * until the first edition is written and sourced. The signup reuses
 * MarketReportCapture (posts to /api/leads with source 'market-report' — a
 * subscription source, so no broker "new lead" alert; honeypot + reCAPTCHA
 * come with it).
 */

const TITLE = 'San Antonio & Hill Country Market Brief | CRECO';
const DESCRIPTION =
  "CRECO's quarterly brief on San Antonio and Texas Hill Country commercial real estate, written by broker Zachary A. Stovall with cited sources. First edition coming this quarter.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    'san antonio commercial real estate market',
    'san antonio commercial real estate market report',
    'texas hill country commercial real estate market',
    'boerne commercial real estate market',
    'fair oaks ranch commercial real estate',
    'san antonio retail office industrial market',
  ],
  alternates: { canonical: 'https://www.crecotx.com/market-brief' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'San Antonio & Hill Country Market Brief',
    description: DESCRIPTION,
    url: 'https://www.crecotx.com/market-brief',
    type: 'website',
  },
};

const COVERAGE = [
  {
    title: 'Retail, office and industrial',
    body: 'Leasing activity, availability and asking rents by property type — what is moving and what is sitting.',
  },
  {
    title: 'Submarket by submarket',
    body: 'Fair Oaks Ranch, Boerne, Leon Springs and the I-10 corridor, Stone Oak, the Medical Center and Northwest San Antonio, New Braunfels.',
  },
  {
    title: 'What it means for you',
    body: 'A short read for tenants weighing a renewal or a move, and for owners deciding whether to lease, hold or sell.',
  },
];

export default function MarketBriefPage() {
  return (
    <>
      <JsonLd
        data={[
          webPage('WebPage', '/market-brief', TITLE, DESCRIPTION, {
            author: { '@id': FOUNDER_ID },
          }),
          breadcrumbList([{ name: 'Market Brief', path: '/market-brief' }]),
        ]}
      />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 sm:py-20 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-3 text-gold flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> San Antonio · Texas Hill Country · Quarterly
              </p>
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight">
                San Antonio &amp; Hill Country Market Brief
              </h1>
              <p className="text-body-lg text-white/75 leading-relaxed">
                CRECO&apos;s quarterly brief on commercial real estate in San Antonio and the Texas Hill Country — written by {FOUNDER.name}, with every figure cited to its source. The first edition is coming this quarter.
              </p>
            </div>
          </Container>
        </section>

        <section className="bg-white border-b border-border/60">
          <Container>
            <Breadcrumbs items={[{ label: 'Market Brief' }]} className="py-4" />
          </Container>
        </section>

        {/* Signup + what's in it */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <p className="overline mb-3">What the brief covers</p>
                <h2 className="font-heading text-display-sm font-bold text-primary mb-6">
                  A local read, from people who own property here.
                </h2>
                <ul className="space-y-5">
                  {COVERAGE.map(item => (
                    <li key={item.title} className="flex items-start gap-4">
                      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-heading text-heading-sm font-semibold text-primary">{item.title}</h3>
                        <p className="mt-1 text-body-sm text-foreground-muted leading-relaxed">{item.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex items-start gap-3 rounded-xl border border-border bg-white p-5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <p className="text-body-sm text-foreground-muted leading-relaxed">
                    <span className="font-semibold text-primary">Sourced, not guessed.</span>{' '}
                    Every number in the brief names where it came from, so you can check it — and where we&apos;re giving our own read from deals we&apos;re working, we say so.
                  </p>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-28">
                  <MarketReportCapture variant="dark" surface="market-brief" />
                  <p className="mt-3 text-caption text-foreground-muted">
                    One email when each edition is published. Unsubscribe anytime.
                  </p>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* Author */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-background-cream p-7 sm:p-10">
              <Quote className="h-6 w-6 text-gold mb-4" />
              <p className="overline mb-2">Written by</p>
              <h2 className="font-heading text-heading-lg font-bold text-primary">
                {FOUNDER.name}, Broker &amp; Founder
              </h2>
              <p className="mt-1 text-caption text-foreground-muted">TREC #{FOUNDER.trecLicense}</p>
              <p className="mt-4 text-body text-foreground-muted leading-relaxed">
                CRECO owns and operates Fair Oaks Plaza in Fair Oaks Ranch and our Lytle center, and is developing Elkhorn Point. The brief is written from that seat — as owners, landlords and brokers in the same markets it covers.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/about#team"
                  className="inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark hover:text-gold"
                >
                  About the team <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/san-antonio-commercial-real-estate"
                  className="inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark hover:text-gold"
                >
                  San Antonio commercial real estate <ArrowRight className="h-4 w-4" />
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
