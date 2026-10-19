import { TalkToBroker } from '@/components/marketing/TalkToBroker';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MapPin, Quote } from 'lucide-react';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { MarketReportCapture } from '@/components/marketing/MarketReportCapture';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqSection } from '@/components/marketing/FaqSection';
import { MARKET_BRIEF_FAQS } from '@/lib/answers';
import { FOUNDER, FOUNDER_ID, breadcrumbList, webPage } from '@/lib/schema';
import { BriefContent, BRIEF_SECTIONS } from './BriefContent';

/**
 * /market-brief — the San Antonio & Hill Country Market Brief. Issue 1 (Q2 2026 data)
 * is published here in full, no gate; the signup is for the NEXT edition. Content lives
 * in ./BriefContent.tsx. The signup reuses MarketReportCapture (posts to /api/leads with
 * source 'market-report' — a subscription source, so no broker "new lead" alert; honeypot
 * + reCAPTCHA come with it).
 */

const TITLE = 'San Antonio & Hill Country Market Brief | CRECO';
const DESCRIPTION =
  "Issue 1 (Q2 2026): San Antonio and Texas Hill Country retail, office, industrial and flex vacancy, rents and absorption from CBRE, Cushman & Wakefield and Partners side by side, plus Boerne, Fair Oaks Ranch and New Braunfels. Every figure sourced.";

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
                Issue 1 · Q2 2026 data · Published October 2026. Retail, office, industrial and flex across San Antonio and the Hill Country, with CBRE, Cushman &amp; Wakefield and Partners side by side and every figure cited. Written by {FOUNDER.name}.
              </p>
            </div>
          </Container>
        </section>

        <section className="bg-white border-b border-border/60">
          <Container>
            <Breadcrumbs items={[{ label: 'Market Brief' }]} className="py-4" />
          </Container>
        </section>

        {/* The brief + signup for the next edition */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <nav aria-label="Brief sections" className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-body-sm">
              {BRIEF_SECTIONS.map(sec => (
                <a key={sec.id} href={`#${sec.id}`} className="font-semibold text-gold-dark hover:text-gold">{sec.label}</a>
              ))}
            </nav>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
              <div className="lg:col-span-3 -mt-8">
                <BriefContent />
              </div>
              <div className="lg:col-span-2">
                <div className="lg:sticky lg:top-28 space-y-4">
                  <MarketReportCapture variant="dark" surface="market-brief" />
                  <p className="text-caption text-foreground-muted">
                    One email when the next edition is published — Q3 figures once the major brokerages release them. Unsubscribe anytime.
                  </p>
                  <div className="rounded-xl border border-border bg-white p-5">
                    <p className="text-body-sm font-semibold text-primary">Want this applied to your property or search?</p>
                    <p className="mt-1 text-body-sm text-foreground-muted leading-relaxed">Call or text a broker for current availability and rents near you — we own and operate property in these markets.</p>
                    <Link href="/get-started" className="mt-3 inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark hover:text-gold">
                      Talk to a broker <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
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
        <TalkToBroker
          surface="market-brief"
          path="exploring"
          heading="Need numbers for a specific property or submarket?"
          body="Call or text a broker for current San Antonio and Hill Country availability and rents, or tell us what you are looking for."
        />
        <FaqSection faqs={MARKET_BRIEF_FAQS} path="/market-brief" heading="About the Market Brief" className="section-luxury bg-background-cream" />
      </main>
      <Footer />
    </>
  );
}
