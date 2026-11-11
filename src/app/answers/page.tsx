import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { JsonLd } from '@/components/seo/JsonLd';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { ANSWER_PAGES } from '@/lib/answer-pages';
import { FOUNDER_ID, breadcrumbList, webPage } from '@/lib/schema';

const TITLE = 'Commercial Real Estate Answers: San Antonio & Hill Country | CRECO';
const DESCRIPTION = 'Direct, sourced answers to common Texas and San Antonio commercial real estate questions: retail cap rates, Class A office rents, vacancy rates, asking rents, Boerne, New Braunfels and Fair Oaks Ranch.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: 'https://www.crecotx.com/answers' },
  openGraph: { images: [DEFAULT_OG_IMAGE], title: TITLE, description: DESCRIPTION, url: 'https://www.crecotx.com/answers', type: 'website' },
};

export default function AnswersIndex() {
  return (
    <>
      <JsonLd data={[
        webPage('CollectionPage', '/answers', TITLE, DESCRIPTION, { author: { '@id': FOUNDER_ID } }),
        breadcrumbList([{ name: 'Answers', path: '/answers' }]),
      ]} />
      <Header />
      <main className="min-h-screen pt-20">
        <section className="border-b border-border/60 bg-white">
          <Container><Breadcrumbs items={[{ label: 'Answers' }]} className="py-4" /></Container>
        </section>
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="mx-auto max-w-3xl">
              <h1 className="font-heading text-display-md font-bold text-primary">Commercial real estate answers</h1>
              <p className="mt-4 text-body-lg text-foreground-muted">Short, sourced answers to what people ask about San Antonio and Hill Country commercial real estate. Each links to the original reports. The full picture is in the <Link href="/market-brief" className="font-semibold text-gold-dark underline underline-offset-2">Market Brief</Link>.</p>
              <ul className="mt-8 space-y-3">
                {ANSWER_PAGES.map(p => (
                  <li key={p.slug}>
                    <Link href={`/answers/${p.slug}`} className="block rounded-xl border border-border bg-white p-5 transition-all hover:border-gold hover:shadow-card-hover">
                      <h2 className="font-heading text-heading-sm font-semibold text-primary">{p.question}</h2>
                      <p className="mt-1 text-body-sm text-foreground-muted">{p.answer}</p>
                      <span className="mt-2 inline-flex items-center gap-1 text-body-sm font-semibold text-gold-dark">Read the answer <ArrowRight className="h-4 w-4" /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
