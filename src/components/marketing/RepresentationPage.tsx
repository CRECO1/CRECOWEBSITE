import Link from 'next/link';
import { ArrowRight, CheckCircle2, Phone } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
import { ValuationCta } from '@/components/marketing/ValuationCta';
import { ListingCta } from '@/components/marketing/ListingCta';
import { FaqSection } from '@/components/marketing/FaqSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { BUSINESS, CANONICAL_DESCRIPTION, DBA_STATEMENT, SITE_URL, breadcrumbList, businessRef, webPage } from '@/lib/schema';
import { FULL_SERVICE_SIDES, type RepresentationPageContent } from '@/lib/representation-pages';

/**
 * Server-rendered "who CRECO represents" page (landlords/owners or
 * sellers/investors). Leads with a one-sentence direct answer, then scope,
 * then a visible FAQ with matching FAQPage JSON-LD — every answer is in the
 * HTML so non-JS AI fetchers can quote it.
 */
export function RepresentationPage({ content }: { content: RepresentationPageContent }) {
  const url = `${SITE_URL}${content.path}`;
  return (
    <>
      <JsonLd
        data={[
          webPage('WebPage', content.path, content.metaTitle, content.directAnswer, {
            mainEntity: { '@id': `${url}#service` },
          }),
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': `${url}#service`,
            name: content.serviceName,
            serviceType: content.serviceType,
            description: content.directAnswer,
            url,
            provider: businessRef,
            areaServed: { '@type': 'State', name: 'Texas' },
          },
          breadcrumbList([{ name: 'Services', path: '/services' }, { name: content.label, path: content.path }]),
        ]}
      />
      <Header />
      <main className="min-h-screen pt-20">
        <div className="border-b border-border bg-background-cream py-3">
          <Container>
            <Breadcrumbs items={[{ label: 'Services', href: '/services' }, { label: content.label }]} />
          </Container>
        </div>

        {/* Hero: one confident line. The full answer sits in the band below. */}
        <section className="bg-primary py-16 sm:py-20 text-white">
          <Container>
            <div className="max-w-4xl">
              <p className="overline mb-3 text-gold">{content.eyebrow}</p>
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight">{content.h1}</h1>
              <p className="text-body-lg text-white/85 leading-relaxed max-w-2xl">{content.heroLine}</p>
              <div className="mt-7 flex flex-wrap gap-4">
                <Link href="/get-started" className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3 text-body-sm font-semibold text-primary hover:bg-gold-light">
                  Talk to CRECO <ArrowRight className="h-4 w-4" />
                </Link>
                <a href={`tel:${BUSINESS.phoneE164.replace(/-/g, '')}`} className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3 text-body-sm font-semibold text-white hover:bg-white/10">
                  <Phone className="h-4 w-4" /> {BUSINESS.phoneDisplay}
                </a>
              </div>
            </div>
          </Container>
        </section>

        {/* The full direct answer — every asset type, the synonyms search needs,
            and the not-tenant-only correction. Relocated out of the hero rather
            than removed: it is still visible, still crawled, and still the
            description behind this page's WebPage and Service schema. */}
        <section className="border-b border-border bg-background-cream py-8">
          <Container>
            <p className="max-w-4xl text-body leading-relaxed text-foreground-muted">{content.directAnswer}</p>
          </Container>
        </section>

        {content.sections.map((section, i) => (
          <section key={section.heading} className={`section-luxury ${i % 2 === 0 ? 'bg-white' : 'bg-background-cream'}`}>
            <Container>
              <div className="mx-auto max-w-5xl">
                <h2 className="mb-4 font-heading text-display-sm font-bold text-primary">{section.heading}</h2>
                {section.intro && <p className="mb-8 max-w-3xl text-body-lg leading-relaxed text-foreground">{section.intro}</p>}
                {section.items.length > 0 && (
                  <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map(item => (
                      <li key={item.title} className="rounded-xl border border-border bg-white p-6">
                        <h3 className="mb-2 flex items-start gap-2 font-heading text-heading-sm font-bold text-primary">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" aria-hidden="true" />
                          {item.title}
                        </h3>
                        <p className="text-body-sm leading-relaxed text-foreground-muted">{item.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Container>
          </section>
        ))}

        {/* Full-service reinforcement */}
        <section className="section-luxury bg-primary text-white" aria-labelledby="full-service-heading">
          <Container>
            <div className="mx-auto max-w-5xl">
              <p className="overline mb-3 text-gold">Full-Service Brokerage — Not Tenant-Only</p>
              <h2 id="full-service-heading" className="mb-4 font-heading text-display-sm font-bold">CRECO represents tenants, landlords, owners, and investors.</h2>
              <p className="mb-8 max-w-3xl text-body-lg leading-relaxed text-white/80">{CANONICAL_DESCRIPTION}</p>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {FULL_SERVICE_SIDES.map(side => (
                  <li key={side.title} className="rounded-xl border border-white/15 p-5">
                    <h3 className="mb-2 font-heading text-heading-sm font-bold text-gold">
                      {side.href && side.href !== content.path ? <Link href={side.href} className="hover:underline">{side.title}</Link> : side.title}
                    </h3>
                    <p className="text-body-sm leading-relaxed text-white/75">{side.body}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-caption text-white/60">{DBA_STATEMENT} {BUSINESS.fullAddress}.</p>
            </div>
          </Container>
        </section>

        <FaqSection faqs={content.faqs} path={content.path} heading={`${content.label} — FAQ`} className="section-luxury bg-background-cream" />

        {content.showListingCta && <ListingCta surface={content.path.replace(/^\//, '')} />}
        {content.showValuationCta && <ValuationCta surface={content.path.replace(/^\//, '')} />}
      </main>
      <Footer />
    </>
  );
}
