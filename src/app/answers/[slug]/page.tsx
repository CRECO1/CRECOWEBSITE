import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Calendar } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { TalkToBroker } from '@/components/marketing/TalkToBroker';
import { JsonLd } from '@/components/seo/JsonLd';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { metaTitle, metaDescription } from '@/lib/seo-meta';
import { ANSWER_PAGES, findAnswer } from '@/lib/answer-pages';
import { BRIEF_UPDATED } from '@/lib/brief-meta';
import { FOUNDER, FOUNDER_ID, breadcrumbList, faqPage, webPage } from '@/lib/schema';

interface Props { params: Promise<{ slug: string }> }

export function generateStaticParams() { return ANSWER_PAGES.map(p => ({ slug: p.slug })); }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = findAnswer(slug);
  if (!p) return {};
  return {
    title: metaTitle(`${p.question} | CRECO`),
    description: metaDescription(p.answer),
    alternates: { canonical: `https://www.crecotx.com/answers/${p.slug}` },
    openGraph: { images: [DEFAULT_OG_IMAGE], title: p.question, description: metaDescription(p.answer), url: `https://www.crecotx.com/answers/${p.slug}`, type: 'article' },
  };
}

const fmt = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export default async function AnswerPage({ params }: Props) {
  const { slug } = await params;
  const p = findAnswer(slug);
  if (!p) notFound();
  const path = `/answers/${p.slug}`;
  return (
    <>
      <JsonLd data={[
        webPage('WebPage', path, p.question, p.answer, { author: { '@id': FOUNDER_ID }, reviewedBy: { '@id': FOUNDER_ID }, dateModified: BRIEF_UPDATED, lastReviewed: BRIEF_UPDATED }),
        faqPage([{ q: p.question, a: p.answer }], path),
        breadcrumbList([{ name: 'Answers', path: '/answers' }, { name: p.short, path }]),
      ]} />
      <Header />
      <main className="min-h-screen pt-20">
        <section className="border-b border-border/60 bg-white">
          <Container><Breadcrumbs items={[{ label: 'Answers', href: '/answers' }, { label: p.short }]} className="py-4" /></Container>
        </section>
        <section className="section-luxury bg-background-cream">
          <Container>
            <article className="mx-auto max-w-3xl">
              <p className="overline mb-3 text-gold-dark">Answer · San Antonio &amp; Hill Country commercial real estate</p>
              <h1 className="font-heading text-display-md font-bold leading-tight text-primary">{p.question}</h1>
              <p className="mt-6 rounded-2xl border border-gold/40 bg-white p-6 text-body-lg leading-relaxed text-primary">{p.answer}</p>
              <p className="mt-3 flex items-center gap-1.5 text-caption text-foreground-muted">
                <Calendar className="h-3.5 w-3.5" /> Q2 2026 data · Reviewed by {FOUNDER.name}, TREC #{FOUNDER.trecLicense} · Last updated {fmt(BRIEF_UPDATED)}
              </p>

              <h2 className="mt-10 font-heading text-heading-lg font-bold text-primary">The details</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-body leading-relaxed text-foreground-muted marker:text-gold">
                {p.points.map(x => <li key={x}>{x}</li>)}
              </ul>

              {p.sources.length > 0 && (
                <>
                  <h2 className="mt-10 font-heading text-heading-lg font-bold text-primary">Sources</h2>
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-body-sm text-foreground-muted marker:text-gold">
                    {p.sources.map(s => (
                      <li key={s.label}>
                        {s.url
                          ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-gold-dark underline underline-offset-2 hover:text-gold">{s.label}</a>
                          : s.label}
                      </li>
                    ))}
                  </ul>
                </>
              )}

              <h2 className="mt-10 font-heading text-heading-lg font-bold text-primary">Related</h2>
              <ul className="mt-3 space-y-2">
                {p.related.map(r => (
                  <li key={r.href}><Link href={r.href} className="inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark hover:text-gold">{r.label} <ArrowRight className="h-4 w-4" /></Link></li>
                ))}
              </ul>
            </article>
          </Container>
        </section>
        <TalkToBroker surface="answers" path="exploring" heading="Need numbers for a specific property or submarket?" body="Call or text a broker for current San Antonio and Hill Country availability and rents, or tell us what you are looking for." />
      </main>
      <Footer />
    </>
  );
}
