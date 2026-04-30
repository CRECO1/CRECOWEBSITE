import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle, Phone, Building2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { SERVICES } from '../page';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find(s => s.slug === slug);
  if (!service) return {};

  return {
    title: `${service.title} – Texas Commercial Real Estate | CRECO`,
    description: service.metaDescription,
    keywords: service.keywords,
    alternates: { canonical: `https://www.crecotx.com/services/${service.slug}` },
    openGraph: {
      title: `${service.title} | CRECO`,
      description: service.metaDescription,
      url: `https://www.crecotx.com/services/${service.slug}`,
      type: 'website',
    },
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = SERVICES.find(s => s.slug === slug);
  if (!service) notFound();

  const Icon = service.icon;
  const related = service.relatedSlugs
    .map(rs => SERVICES.find(s => s.slug === rs))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <>
      {/* Service Schema + FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Service',
                name: service.title,
                description: service.metaDescription,
                provider: { '@id': 'https://www.crecotx.com/#business' },
                areaServed: { '@type': 'State', name: 'Texas' },
                url: `https://www.crecotx.com/services/${service.slug}`,
              },
              {
                '@type': 'FAQPage',
                mainEntity: service.faqs.map(f => ({
                  '@type': 'Question',
                  name: f.q,
                  acceptedAnswer: { '@type': 'Answer', text: f.a },
                })),
              },
            ],
          }),
        }}
      />

      <Header variant="minimal" />
      <main className="min-h-screen pt-20">
        {/* Back */}
        <div className="border-b border-border bg-background-cream py-4">
          <Container>
            <Link href="/services" className="inline-flex items-center gap-2 text-body-sm text-foreground-muted hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> All Services
            </Link>
          </Container>
        </div>

        {/* Hero */}
        <section className="bg-primary py-16 text-white">
          <Container>
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-gold text-primary">
                <Icon className="h-7 w-7" />
              </div>
              <p className="overline mb-3 text-gold">CRECO Services · Texas Commercial Real Estate</p>
              <h1 className="font-heading text-display font-bold">{service.title}</h1>
              <p className="mt-4 text-body-lg text-white/80">{service.heroSubhead}</p>
            </div>
          </Container>
        </section>

        {/* Intro narrative */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="mx-auto max-w-3xl space-y-5">
              {service.intro.map((para, i) => (
                <p key={i} className="text-body-lg text-foreground-muted leading-relaxed">{para}</p>
              ))}
            </div>
          </Container>
        </section>

        {/* What's Included */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <RevealOnScroll direction="left">
                <p className="overline mb-3 text-gold">Service Scope</p>
                <h2 className="font-heading text-display-sm font-bold text-primary">What&apos;s Included</h2>
                <p className="mt-4 text-body text-foreground-muted">
                  Every {service.title.toLowerCase()} engagement includes the full scope of services below — calibrated to the specifics of your assignment.
                </p>
              </RevealOnScroll>
              <div className="lg:col-span-2">
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.body.map(item => (
                    <li key={item} className="flex items-start gap-3 text-body text-foreground-muted">
                      <CheckCircle className="mt-1 h-5 w-5 shrink-0 text-gold" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* Process */}
        <section className="section-luxury bg-white">
          <Container>
            <RevealOnScroll>
              <div className="mb-12 text-center">
                <p className="overline mb-3">Our Process</p>
                <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">How a {service.title} engagement works</h2>
              </div>
            </RevealOnScroll>
            <div className={`grid grid-cols-1 gap-6 ${service.process.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-5'}`}>
              {service.process.map((p, i) => (
                <RevealOnScroll key={p.step} delay={i * 80}>
                  <div className="text-center h-full">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-primary font-heading text-heading font-bold">
                      {p.step}
                    </div>
                    <h3 className="mb-3 font-heading text-heading-sm font-semibold text-primary">{p.title}</h3>
                    <p className="text-body-sm text-foreground-muted">{p.description}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* Use Cases */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <RevealOnScroll>
              <div className="mb-12 text-center">
                <p className="overline mb-3">Who This Is For</p>
                <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">Use Cases</h2>
              </div>
            </RevealOnScroll>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {service.useCases.map((uc, i) => (
                <RevealOnScroll key={uc.title} delay={i * 80}>
                  <div className="rounded-xl border border-border bg-white p-7 h-full">
                    <h3 className="mb-3 font-heading text-heading-sm font-bold text-primary">{uc.title}</h3>
                    <p className="text-body-sm text-foreground-muted leading-relaxed">{uc.description}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="section-luxury bg-white">
          <Container>
            <RevealOnScroll>
              <div className="mb-10 text-center">
                <p className="overline mb-3">People Also Ask</p>
                <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">{service.title} FAQ</h2>
              </div>
            </RevealOnScroll>
            <div className="mx-auto max-w-3xl space-y-3">
              {service.faqs.map((faq, i) => (
                <RevealOnScroll key={faq.q} delay={i * 50}>
                  <details className="group rounded-xl border border-border bg-white open:border-gold open:shadow-card-hover transition-all">
                    <summary className="flex cursor-pointer items-start justify-between gap-4 p-6 text-left font-heading text-heading-sm font-semibold text-primary marker:hidden list-none">
                      <span>{faq.q}</span>
                      <span className="shrink-0 text-2xl text-gold transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="px-6 pb-6 text-body text-foreground-muted leading-relaxed">{faq.a}</div>
                  </details>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* Related Services */}
        {related.length > 0 && (
          <section className="section-luxury bg-background-cream">
            <Container>
              <RevealOnScroll>
                <div className="mb-12 text-center">
                  <p className="overline mb-3">Explore More</p>
                  <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">Related Services</h2>
                </div>
              </RevealOnScroll>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {related.map(r => {
                  const RIcon = r.icon;
                  return (
                    <Link key={r.slug} href={`/services/${r.slug}`} className="group rounded-xl border border-border bg-white p-6 hover:border-gold hover:shadow-card-hover transition-all">
                      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold">
                        <RIcon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 font-heading text-heading-sm font-semibold text-primary group-hover:text-gold transition-colors">{r.title}</h3>
                      <p className="text-caption text-foreground-muted line-clamp-2">{r.shortDescription}</p>
                    </Link>
                  );
                })}
              </div>
            </Container>
          </section>
        )}

        {/* CTA */}
        <section className="section-compact bg-primary text-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-heading text-display-sm font-bold mb-4">Talk to a CRECO principal</h2>
              <p className="text-body text-white/70 mb-8">
                No-pressure consultation. We&apos;ll listen first and recommend an approach — even if that means pointing you somewhere else.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/contact">Schedule a Call <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <a href="tel:+12108173443"><Phone className="mr-2 h-4 w-4" />(210) 817-3443</a>
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

export function generateStaticParams() {
  return SERVICES.map(s => ({ slug: s.slug }));
}
