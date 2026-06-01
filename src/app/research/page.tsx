import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BarChart3, Calendar, FileText } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { MARKET_REPORTS_SORTED, type MarketReport } from '@/lib/market-reports';

/**
 * /research — index of quarterly market reports.
 *
 * The compounding-content URL: every quarter adds new reports under
 * /research/{submarket}-{asset}-q{N}-{yyyy}. By Q4 2027 there are
 * 30+ URLs; by 2029 there are 75+. That historical depth is what
 * makes a research index outrank generic CRE thought leadership.
 */
export const metadata: Metadata = {
  title: 'Texas Commercial Real Estate Market Reports | CRECO Research',
  description:
    'Quarterly market reports for Texas commercial real estate — submarket vacancy, asking rents, absorption, and concession data across San Antonio, Austin, Houston, and Dallas-Fort Worth. Proprietary CRECO data refreshed each quarter.',
  keywords: [
    'texas commercial real estate market report',
    'san antonio office market report',
    'austin office market report',
    'houston industrial market report',
    'dallas commercial real estate market data',
    'texas cre quarterly report',
    'texas vacancy rates 2026',
  ],
  alternates: { canonical: 'https://www.crecotx.com/research' },
  openGraph: {
    title: 'Texas Commercial Real Estate Market Reports | CRECO',
    description:
      'Quarterly market reports — vacancy, asking rents, absorption, and concession data across Texas commercial real estate submarkets.',
    url: 'https://www.crecotx.com/research',
    type: 'website',
  },
};

function formatPubDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ResearchIndexPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 sm:py-24 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-3 text-gold flex items-center gap-2">
                <BarChart3 className="h-3.5 w-3.5" /> Texas Commercial Real Estate Research
              </p>
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight">
                Quarterly market reports — Texas CRE, submarket by submarket.
              </h1>
              <p className="text-body-lg text-white/70 leading-relaxed">
                Vacancy, asking rents, net absorption, and concession depth — pulled from the deals CRECO is actually closing each quarter. Free to read, no email required, with downloadable PDFs for your records.
              </p>
            </div>
          </Container>
        </section>

        {/* Reports grid */}
        <section className="section-luxury bg-background-cream">
          <Container>
            {MARKET_REPORTS_SORTED.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-foreground-muted mb-3" />
                <p className="text-body text-foreground-muted">
                  Research drops here at the start of each quarter — first reports landing Q3 2026.
                </p>
              </div>
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MARKET_REPORTS_SORTED.map(r => (
                  <li key={r.slug}>
                    <ReportCard report={r} />
                  </li>
                ))}
              </ul>
            )}
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ReportCard({ report }: { report: MarketReport }) {
  return (
    <Link
      href={`/research/${report.slug}`}
      className="block h-full rounded-xl border border-border bg-white p-6 hover:border-gold hover:shadow-md transition-all"
    >
      <p className="overline mb-3 text-gold-dark">
        {report.quarter} {report.year} · {report.submarketLabel} · {report.assetClass}
      </p>
      <h2 className="font-heading text-heading-sm font-bold text-primary mb-3 leading-tight">
        {report.submarketLabel} {capitalize(report.assetClass)} Market Report — {report.quarter} {report.year}
      </h2>
      <p className="text-body-sm text-foreground-muted line-clamp-4 mb-5 leading-relaxed">
        {report.quickAnswer}
      </p>
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-border text-caption text-foreground-muted">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3 w-3 text-gold" /> {formatPubDate(report.publishedAt)}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-gold-dark">
          Read report <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ');
}
