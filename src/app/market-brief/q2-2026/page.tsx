import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MapPin } from 'lucide-react';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { FOUNDER, FOUNDER_ID, breadcrumbList, webPage } from '@/lib/schema';
import { BriefContentQ2, BRIEF_SECTIONS_Q2 } from '../BriefContentQ2';

/**
 * /market-brief/q2-2026 — Issue 1 of the San Antonio & Hill Country Market Brief, kept as an archive now that
 * /market-brief carries the current edition. Figures are as first published (some brokerage figures have since
 * been revised; see "What changed since Issue 1" in the current edition).
 */

const TITLE = 'San Antonio & Hill Country Market Brief, Issue 1 (Q2 2026) | CRECO';
const DESCRIPTION =
  'Archive: Issue 1 of the San Antonio and Hill Country Market Brief with Q2 2026 retail, office, industrial and flex vacancy, rents and absorption from CBRE, Cushman & Wakefield and Partners. Every figure sourced.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://www.crecotx.com/market-brief/q2-2026' },
  openGraph: { images: [DEFAULT_OG_IMAGE], title: TITLE, description: DESCRIPTION, url: 'https://www.crecotx.com/market-brief/q2-2026', type: 'article' },
};

export default function MarketBriefQ2Page() {
  return (
    <>
      <JsonLd
        data={[
          webPage('WebPage', '/market-brief/q2-2026', TITLE, DESCRIPTION, { author: { '@id': FOUNDER_ID }, dateModified: '2026-11-05' }),
          breadcrumbList([{ name: 'Market Brief', path: '/market-brief' }, { name: 'Issue 1 (Q2 2026)', path: '/market-brief/q2-2026' }]),
        ]}
      />
      <Header />
      <main className="min-h-screen pt-20">
        <section className="bg-primary py-10 sm:py-16 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-3 text-gold flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> San Antonio · Texas Hill Country · Archive
              </p>
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight">
                Market Brief, Issue 1 (Q2 2026)
              </h1>
              <p className="text-body-lg text-white/75 leading-relaxed">
                Archive. Issue 1 · Q2 2026 data · Published October 2026, written by {FOUNDER.name}. Figures are as first published; some have since been revised. The current edition is Issue 2 (Q3 2026).
              </p>
              <Link href="/market-brief" className="mt-5 inline-flex items-center gap-2 text-body-sm font-semibold text-gold hover:text-white">
                Read the current Q3 2026 edition <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Container>
        </section>
        <section className="bg-white border-b border-border/60">
          <Container>
            <Breadcrumbs items={[{ label: 'Market Brief', href: '/market-brief' }, { label: 'Issue 1 (Q2 2026)' }]} className="py-4" />
          </Container>
        </section>
        <section className="section-luxury bg-background-cream">
          <Container>
            <nav aria-label="Brief sections" className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-body-sm">
              {BRIEF_SECTIONS_Q2.map(sec => (
                <a key={sec.id} href={`#${sec.id}`} className="font-semibold text-gold-dark hover:text-gold">{sec.label}</a>
              ))}
            </nav>
            <BriefContentQ2 />
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
