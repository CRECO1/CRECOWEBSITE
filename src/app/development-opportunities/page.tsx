import type { Metadata } from 'next';
import Link from 'next/link';
import { Phone, Handshake, Search, MessageSquare, FileSignature } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList, webPage, businessRef, BUSINESS, SITE_URL } from '@/lib/schema';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { DevelopmentOpportunityForm } from '@/components/forms/DevelopmentOpportunityForm';
import { DEVELOPMENT_POINTS } from '@/lib/owner-paths-copy';

export const revalidate = 3600;
const PATH = '/development-opportunities';

/**
 * Development opportunities — the third owner-side path, after leasing
 * (/list-your-space) and dispositions (/sell).
 *
 * Scope is exactly what the broker confirmed on 2026-09-20 — "represent
 * source advise negotiations terms" — and the page says so out loud: CRECO
 * represents, sources, advises and negotiates. No feasibility studies, no
 * capital or financing partners, no JV structuring, no entitlements, no
 * construction, no development track record. Do not widen without his word.
 */
export const metadata: Metadata = {
  title: 'Development Sites & Opportunities | CRECO',
  description:
    'Own land or an underused site, or looking for one to build on? CRECO represents owners and developers in Texas development transactions — sourcing opportunities, advising on the deal, and negotiating the terms.',
  keywords: [
    'commercial land san antonio',
    'development site san antonio',
    'development opportunity broker texas',
    'sell commercial land texas',
    'texas land broker commercial',
    'redevelopment site texas',
    'pad site for sale texas',
    'land for development hill country',
    'commercial development broker',
    'find development sites texas',
  ],
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Development Sites & Opportunities | CRECO',
    description:
      'Bring CRECO a site or an opportunity. We represent, source, advise and negotiate — on your side of the deal.',
    url: `${SITE_URL}${PATH}`,
    type: 'website',
  },
};

// represent · source · advise · negotiate
const ICONS = [Handshake, Search, MessageSquare, FileSignature];

const FAQS = [
  {
    q: 'What does CRECO actually do on a development opportunity?',
    a: 'Four things: represents you in the transaction as your broker, sources sites and opportunities through its Texas relationships, advises on the deal in front of you, and negotiates the terms. CRECO acts as broker and advisor on these engagements. It is not the developer — no feasibility studies, no capital or financing partners, no joint-venture structuring, no entitlement work and no construction.',
  },
  {
    q: 'I own land I am not using. Where do I start?',
    a: 'Send the address and roughly what you have. CRECO will tell you how a site like yours is likely to be received by the buyers who build, and what it would take to bring it to them. If you decide to move, CRECO represents you and negotiates the terms. There is no cost to that conversation.',
  },
  {
    q: 'I am a developer looking for sites. Can CRECO help?',
    a: 'Yes. Tell us the thesis — use, size, submarket, the economics you need — and CRECO works its Texas broker and owner relationships to find sites that fit, including conversations that never reach a listing platform.',
  },
  {
    q: 'Will you keep this confidential?',
    a: 'Yes. Site and development conversations are commonly sensitive, and nothing is marketed or disclosed without your instruction.',
  },
  {
    q: 'What types of sites does CRECO work with?',
    a: 'Raw land, underused or redevelopment sites, existing buildings suitable for repositioning, and pad sites — across retail, office, industrial, flex and mixed-use.',
  },
];

export default function DevelopmentOpportunitiesPage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbList([{ name: 'Development Opportunities', path: PATH }]),
          webPage('WebPage', PATH, 'Development Sites & Opportunities', metadata.description as string, {}),
          businessRef,
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': `${SITE_URL}${PATH}#service`,
            name: 'Development site brokerage and advisory',
            serviceType: [
              'Commercial land brokerage',
              'Development site disposition',
              'Development site acquisition',
              'Development transaction negotiation',
            ],
            provider: { '@id': `${SITE_URL}/#organization` },
            description: metadata.description as string,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            '@id': `${SITE_URL}${PATH}#faq`,
            mainEntity: FAQS.map(f => ({
              '@type': 'Question', name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
        ]}
      />
      <Header />
      <main className="min-h-screen pt-20">

        <section className="bg-primary py-16 sm:py-20 text-white">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="overline mb-3 text-gold">Owners &amp; Developers</p>
                <h1 className="font-heading text-display-md sm:text-display-lg font-bold leading-tight">
                  Bring us the site.
                </h1>
                <p className="mt-5 max-w-xl text-body-lg leading-relaxed text-white/80">
                  Land, an underused site, or a deal already in motion — CRECO represents you,
                  sources the opportunity, advises on the deal and negotiates the terms.
                </p>
                <div className="mt-7">
                  <a
                    href={`tel:${BUSINESS.phoneE164.replace(/-/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    <Phone className="h-4 w-4" /> {BUSINESS.phoneDisplay}
                  </a>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
                <h2 className="mb-1 font-heading text-heading-xl font-bold text-primary">Tell us about it</h2>
                <p className="mb-6 text-body-sm text-foreground-muted">
                  Reviewed confidentially by Zack himself.
                </p>
                <DevelopmentOpportunityForm />
              </div>
            </div>
          </Container>
        </section>

        <section className="section-luxury bg-white" aria-labelledby="dev-what">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 max-w-2xl">
                <p className="overline mb-2 text-gold">What CRECO does</p>
                <h2 id="dev-what" className="font-heading text-display-sm font-bold text-primary">
                  Broker and advisor — not the developer
                </h2>
                <p className="mt-4 text-body leading-relaxed text-foreground-muted">
                  Said plainly so nobody is misled: CRECO represents, sources, advises and
                  negotiates. No feasibility studies, no capital or financing partners, no joint
                  ventures, no entitlement work and no construction — those stay with your team.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
                {DEVELOPMENT_POINTS.map((p, i) => {
                  const Icon = ICONS[i] ?? Handshake;
                  return (
                    <div key={p.title} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15">
                        <Icon className="h-5 w-5 text-gold-dark" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-heading text-heading font-bold text-primary">{p.title}</h3>
                        <p className="text-body-sm leading-relaxed text-foreground-muted">{p.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        <section className="section-luxury bg-background-cream" aria-labelledby="dev-faq">
          <Container>
            <div className="mx-auto max-w-3xl">
              <h2 id="dev-faq" className="mb-8 font-heading text-display-xs font-bold text-primary">
                Site &amp; development questions
              </h2>
              <div className="space-y-3">
                {FAQS.map(f => (
                  <details key={f.q} className="group rounded-xl border border-border bg-white p-5">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 font-heading text-heading font-semibold text-primary">
                      {f.q}
                      <span className="shrink-0 text-gold-dark transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-body-sm leading-relaxed text-foreground-muted">{f.a}</p>
                  </details>
                ))}
              </div>
              <p className="mt-8 text-body-sm text-foreground-muted">
                Selling a built asset rather than a site?{' '}
                <Link href="/sell" className="font-semibold text-gold-dark hover:underline">Start a disposition</Link>.
                {' '}Leasing space?{' '}
                <Link href="/list-your-space" className="font-semibold text-gold-dark hover:underline">List it with CRECO</Link>.
              </p>
            </div>
          </Container>
        </section>

      </main>
      <Footer />
    </>
  );
}
