import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList } from '@/lib/schema';
import { HubLinks } from '@/components/marketing/HubLinks';
import { SERVICE_MARKET_LINKS } from '@/lib/hub-links';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { metaTitle, metaDescription } from '@/lib/seo-meta';
import { jsonLd } from '@/lib/jsonLd';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { SERVICES } from '../page';
import { BUSINESS_ID } from '@/lib/schema';
import { InlineLeadForm, type InlineLeadFormProps } from '@/components/forms/InlineLeadForm';
import { PhoneCallText } from '@/components/marketing/PhoneCallText';

/**
 * Each service page's own short form. These pages used to have no hero action
 * at all and closed on a "Schedule a Call" button that left for /contact; now
 * the hero button names the ask and jumps to the form at the foot of the page.
 * `source` reuses what /api/leads already types for the CRM: tenants →
 * tenant-needs, owner/investor-side services → listing-inquiry.
 */
type ServiceForm = Pick<InlineLeadFormProps, 'heading' | 'body' | 'contextLabel' | 'contextPlaceholder' | 'source' | 'submitLabel'> & {
  /** Hero button label — the same ask, phrased as an action. */
  cta: string;
};

const SERVICE_FORMS: Record<string, ServiceForm> = {
  'tenant-representation': {
    cta: 'Tell us what you need — free for tenants',
    heading: 'Tell us what you need — free for tenants',
    body: 'Type, size, area and timing. Our team sends matching Texas options, including off-market space. Tenant representation is typically paid by the landlord, not you.',
    contextLabel: 'What are you looking for?',
    contextPlaceholder: 'e.g. 4,000 SF office in North San Antonio, lease ends in March',
    source: 'tenant-needs',
    submitLabel: 'Send me options',
  },
  'investment-advisory': {
    cta: 'Share your investment criteria',
    heading: 'What are you looking to buy?',
    body: 'Asset type, price range, target yield and timing — including 1031 deadlines. Someone from our team follows up with on- and off-market options.',
    contextLabel: 'Your investment criteria',
    contextPlaceholder: 'e.g. NNN retail, $2–4M, San Antonio or Austin, 1031 identification by June',
    source: 'listing-inquiry',
    submitLabel: 'Send me opportunities',
  },
  'leasing-sales': {
    cta: 'Get a leasing or sale plan',
    heading: 'Leasing or selling a Texas property?',
    body: 'Tell us what you own and what you want from it. A CRECO principal comes back with a pricing view and a plan to lease or sell it.',
    contextLabel: 'What do you own?',
    contextPlaceholder: 'e.g. 22,000 SF retail strip in Boerne, 30% vacant — lease up or sell?',
    source: 'listing-inquiry',
    submitLabel: 'Get my plan',
  },
  'property-management': {
    cta: 'Request a management proposal',
    heading: 'Request a property management proposal',
    body: 'Tell us what you own and what is not working today. We reply with a scope and fee proposal for your portfolio.',
    contextLabel: 'What do you own?',
    contextPlaceholder: 'e.g. 3 office buildings in San Antonio, ~60,000 SF total',
    source: 'listing-inquiry',
    submitLabel: 'Request a proposal',
  },
  'development': {
    cta: 'Talk through your project',
    heading: 'Planning a development?',
    body: 'Site, concept and stage — even if it is just an idea and a parcel. Someone from our team will walk through feasibility and next steps with you.',
    contextLabel: 'About the project',
    contextPlaceholder: 'e.g. 4-acre pad on FM 3351, considering retail + flex',
    source: 'listing-inquiry',
    submitLabel: 'Talk through my project',
  },
};

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES.find(s => s.slug === slug);
  if (!service) return {};

  return {
    title: metaTitle(`${service.title} – Texas Commercial Real Estate | CRECO`),
    description: metaDescription(service.metaDescription),
    keywords: service.keywords,
    alternates: { canonical: `https://www.crecotx.com/services/${service.slug}` },
    openGraph: {
      images: [DEFAULT_OG_IMAGE],
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
  const form = SERVICE_FORMS[service.slug];
  const related = service.relatedSlugs
    .map(rs => SERVICES.find(s => s.slug === rs))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <>
      <JsonLd data={breadcrumbList([{ name: 'Services', path: '/services' }, { name: service.title, path: `/services/${service.slug}` }])} />
      {/* Service Schema + FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Service',
                name: service.title,
                description: service.metaDescription,
                provider: { '@id': BUSINESS_ID },
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
              {form && (
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
                  <Link
                    href="#service-form"
                    className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3 text-body-sm font-semibold text-primary hover:bg-gold-light"
                  >
                    {form.cta} <ArrowRight className="h-4 w-4" />
                  </Link>
                  <PhoneCallText variant="inline" tone="dark" surface={`service-${service.slug}-hero`} />
                </div>
              )}
            </div>
          </Container>
        </section>

        {/* Identity correction — server-rendered directly under the hero, above
            the intro, so it sits in the first screenful of copy an extractor
            reads. Plain <p>, no scroll-reveal wrapper: it must be in the static
            HTML, not gated behind a client-side animation. */}
        {service.positioningNote && (
          <section className="border-b border-border bg-background-cream py-6">
            <Container>
              <p className="mx-auto max-w-3xl text-body text-foreground-muted leading-relaxed">
                <span className="font-semibold text-primary">Full-service brokerage. </span>
                {service.positioningNote}
              </p>
            </Container>
          </section>
        )}

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

        {/* The page's own form — replaces a "Schedule a Call" button that left
            for the generic /contact page. */}
        {form && (
          <section id="service-form" className="section-luxury bg-primary scroll-mt-24" aria-label={form.heading}>
            <Container>
              <div className="mx-auto max-w-3xl">
                <InlineLeadForm
                  tone="dark"
                  eyebrow={service.title}
                  heading={form.heading}
                  body={form.body}
                  contextLabel={form.contextLabel}
                  contextPlaceholder={form.contextPlaceholder}
                  source={form.source}
                  submitLabel={form.submitLabel}
                  surface={`service-${service.slug}-inline`}
                />
              </div>
            </Container>
          </section>
        )}

        {/* Service pages linked to no market at all. A service is delivered
            somewhere, and these are the somewheres. */}
        <HubLinks
          links={SERVICE_MARKET_LINKS}
          label="Markets we serve"
          className="border-t border-border bg-white py-6"
        />
      </main>
      <Footer />
    </>
  );
}

export function generateStaticParams() {
  return SERVICES.map(s => ({ slug: s.slug }));
}
