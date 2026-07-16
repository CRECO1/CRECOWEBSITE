import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, FileText, Lock, BarChart3, BookOpen } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { SORTED_GUIDES, type Guide } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Texas Commercial Real Estate Guides & Market Reports | Free Downloads | CRECO',
  description:
    "Free in-depth guides and quarterly market reports for Texas commercial real estate — lease negotiation, disposition strategy, and Q3 2026 industrial, retail, office, and investment market data from CRECO's broker team.",
  keywords: [
    'texas commercial real estate guide',
    'commercial lease negotiation guide texas',
    'commercial property owner guide texas',
    'texas commercial real estate playbook',
    'texas commercial real estate market report',
    'q3 2026 texas market report',
    'creco guides',
  ],
  alternates: { canonical: 'https://www.crecotx.com/guides' },
};

/**
 * Market reports are identified by slug — every quarterly report uses the
 * `qN-YYYY-` prefix. Everything else is a strategy playbook. The current
 * quarter is featured; earlier quarters are surfaced separately as archive.
 */
const isMarketReport = (g: Guide) => /^q\d-\d{4}-/.test(g.slug);
const CURRENT_QUARTER_PREFIX = 'q3-2026-';
const isCurrentReport = (g: Guide) => g.slug.startsWith(CURRENT_QUARTER_PREFIX);

export default function GuidesIndex() {
  const marketReports = SORTED_GUIDES.filter(g => isMarketReport(g) && isCurrentReport(g));
  const earlierReports = SORTED_GUIDES.filter(g => isMarketReport(g) && !isCurrentReport(g));
  const playbooks = SORTED_GUIDES.filter(g => !isMarketReport(g));

  // CollectionPage + ItemList schema so Google sees this page as a hub
  // and can surface our guides in rich results.
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Texas Commercial Real Estate Guides & Market Reports',
    description: "CRECO's free guides and quarterly market reports for Texas commercial real estate.",
    url: 'https://www.crecotx.com/guides',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',   item: 'https://www.crecotx.com' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://www.crecotx.com/guides' },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: SORTED_GUIDES.length,
      itemListElement: SORTED_GUIDES.map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `https://www.crecotx.com/guides/${g.slug}`,
        name: g.title,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 sm:py-20 text-white">
          <Container>
            <p className="overline mb-3 text-gold">Texas Commercial Real Estate · Free Guides & Market Reports</p>
            <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-4">
              In-depth analysis for the decisions that matter.
            </h1>
            <p className="text-body-lg text-white/70 max-w-3xl leading-relaxed">
              Quarterly Texas CRE market reports plus practical strategy playbooks — written by CRECO's broker team. Each piece is the analysis we'd hand a client before our first conversation. Free in exchange for an email.
            </p>
          </Container>
        </section>

        {/* Market Reports */}
        {marketReports.length > 0 && (
          <section className="section-luxury bg-background-cream">
            <Container>
              <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <p className="overline mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" /> Quarterly Market Reports
                  </p>
                  <h2 className="font-heading text-display-sm font-bold text-primary">Q3 2026 Texas CRE market data.</h2>
                  <p className="mt-3 text-body text-foreground-muted max-w-2xl">
                    Rents, cap rates, vacancy, absorption, and deal-flow commentary across the four major Texas metros, broken down by asset class.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {marketReports.map(guide => (
                  <GuideCard key={guide.slug} guide={guide} accent="report" />
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* Earlier Reports — previous quarters kept live for reference */}
        {earlierReports.length > 0 && (
          <section className="py-12 sm:py-16 bg-white border-t border-border/40">
            <Container>
              <div className="mb-6">
                <p className="overline mb-2 text-foreground-muted">← Earlier reports</p>
                <h2 className="font-heading text-heading-lg font-bold text-primary">Previous quarterly reports</h2>
                <p className="mt-2 text-body-sm text-foreground-muted max-w-2xl">
                  Historical reference — still-useful reads on how the Texas market looked in prior quarters.
                </p>
              </div>
              <ul className="divide-y divide-border/50 border-y border-border/50">
                {earlierReports.map(guide => (
                  <li key={guide.slug}>
                    <Link
                      href={`/guides/${guide.slug}`}
                      className="flex items-center justify-between gap-4 py-4 group"
                    >
                      <div className="min-w-0">
                        <h3 className="font-heading text-body font-semibold text-primary group-hover:text-gold transition-colors truncate">
                          {guide.title}
                        </h3>
                        <p className="text-caption text-foreground-muted mt-0.5">
                          {guide.pageCount} pages · {guide.readingMinutes} min read
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gold flex-shrink-0 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Container>
          </section>
        )}

        {/* Strategy Playbooks */}
        {playbooks.length > 0 && (
          <section className="section-luxury bg-white">
            <Container>
              <div className="mb-10">
                <p className="overline mb-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> Strategy Playbooks
                </p>
                <h2 className="font-heading text-display-sm font-bold text-primary">The plays that move money.</h2>
                <p className="mt-3 text-body text-foreground-muted max-w-2xl">
                  Tactical playbooks for the high-stakes decisions — lease negotiation, disposition strategy, and the deal points that actually decide whether you got a good deal.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {playbooks.map(guide => (
                  <GuideCard key={guide.slug} guide={guide} accent="playbook" />
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* CTA */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-heading text-display-sm font-bold text-primary mb-4">Have a specific Texas commercial real estate situation?</h2>
              <p className="text-body text-foreground-muted leading-relaxed mb-8">
                Our guides cover the playbook. Your situation is specific. CRECO's brokers are happy to walk through the right approach for your tenancy, property, or portfolio — no obligation.
              </p>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-body-sm font-semibold text-white hover:bg-primary/90"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

function GuideCard({ guide, accent }: { guide: Guide; accent: 'report' | 'playbook' }) {
  const Icon = accent === 'report' ? BarChart3 : FileText;
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all p-8 flex flex-col border border-border/40"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-caption uppercase tracking-widest text-gold">For {guide.audience}s</span>
      </div>
      <h3 className="font-heading text-heading-lg font-bold text-primary mb-3 group-hover:text-gold transition-colors">
        {guide.title}
      </h3>
      <p className="text-body-sm text-foreground-muted leading-relaxed mb-6 flex-1">
        {guide.excerpt}
      </p>
      <div className="flex items-center gap-5 text-caption text-foreground-muted border-t border-border pt-4 mb-4">
        <span className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" /> {guide.pageCount} pages
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {guide.readingMinutes} min read
        </span>
        <span className="flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" /> Free w/ email
        </span>
      </div>
      <span className="inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark group-hover:text-gold transition-colors">
        {accent === 'report' ? 'Read the report' : 'Read the guide'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
