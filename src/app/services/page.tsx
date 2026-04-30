import type { Metadata } from 'next';
import Link from 'next/link';
import { Briefcase, LineChart, Building2, Wrench, Layers, Leaf, ArrowRight } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';

export const metadata: Metadata = {
  title: 'Commercial Real Estate Services in San Antonio | CRECO',
  description:
    'CRECO offers tenant representation, investment advisory, leasing & sales, property management, property development, and sustainability consulting across San Antonio commercial real estate.',
  alternates: { canonical: 'https://www.crecotx.com/services' },
};

export const SERVICES = [
  {
    slug: 'tenant-representation',
    icon: Briefcase,
    title: 'Tenant Representation',
    description: 'We work for tenants — never landlords on the same deal — to find the right space at the right terms.',
    body: [
      'Site selection across all submarkets and property types',
      'LOI strategy and negotiation',
      'Lease comp analysis and concessions benchmarking',
      'Buildout coordination and tenant improvement allowances',
      'Renewal vs. relocation analyses',
    ],
  },
  {
    slug: 'investment-advisory',
    icon: LineChart,
    title: 'Investment Advisory',
    description: 'Market analysis, underwriting, and strategic guidance for owners and investors.',
    body: [
      'Acquisition and disposition strategy',
      'Underwriting and pro forma modeling',
      'Submarket comp analysis',
      '1031 exchange identification',
      'Hold/sell analysis for stabilized assets',
    ],
  },
  {
    slug: 'leasing-sales',
    icon: Building2,
    title: 'Leasing & Sales',
    description: 'Owner-side and tenant-side representation across office, industrial, retail, and land.',
    body: [
      'Custom marketing materials (broker book, website, drone)',
      'CoStar, LoopNet, and direct principal outreach',
      'Aggressive offer negotiation',
      'Tenant credit and use evaluation',
      'Coordinated diligence to close',
    ],
  },
  {
    slug: 'property-management',
    icon: Wrench,
    title: 'Property Management',
    description: 'Operational oversight, maintenance coordination, and tenant relations for commercial assets.',
    body: [
      'Day-to-day building operations',
      'Vendor and maintenance coordination',
      'Tenant relations and lease administration',
      'CAM reconciliations and financial reporting',
      'Capital project oversight',
    ],
  },
  {
    slug: 'development',
    icon: Layers,
    title: 'Property Development',
    description: 'From conceptualization through completion — site selection, entitlements, and construction.',
    body: [
      'Site identification and acquisition',
      'Zoning and entitlement strategy',
      'Pro forma and feasibility analysis',
      'Architect, engineer, and GC coordination',
      'Lease-up and stabilization',
    ],
  },
  {
    slug: 'sustainability',
    icon: Leaf,
    title: 'Sustainability Consulting',
    description: 'Energy audits, ESG strategy, and eco-friendly retrofit planning.',
    body: [
      'Building energy benchmarking',
      'LEED and ENERGY STAR pathway evaluation',
      'Retrofit ROI analysis',
      'ESG reporting frameworks for institutional owners',
      'Tenant engagement on sustainability initiatives',
    ],
  },
];

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-20 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-4 text-gold">What We Do</p>
              <h1 className="font-heading text-display font-bold">
                Full-service commercial real estate.
              </h1>
              <p className="mt-6 text-body-lg text-white/80">
                Whether you&apos;re leasing your first office, repositioning a portfolio, or breaking ground on a development — CRECO covers the full lifecycle, with principal-level attention on every engagement.
              </p>
            </div>
          </Container>
        </section>

        {/* Services Grid */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {SERVICES.map(({ slug, icon: Icon, title, description, body }, i) => (
                <RevealOnScroll key={slug} delay={i * 60}>
                  <div className="h-full rounded-xl border border-border bg-white p-8 transition-all hover:border-gold hover:shadow-card-hover flex flex-col">
                    <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h2 className="mb-3 font-heading text-heading-lg font-semibold text-primary">{title}</h2>
                    <p className="mb-5 text-body-sm text-foreground-muted">{description}</p>
                    <ul className="mb-6 space-y-2">
                      {body.map(item => (
                        <li key={item} className="flex items-start gap-2 text-body-sm text-foreground-muted">
                          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-auto">
                      <Link href={`/services/${slug}`} className="inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark hover:text-gold transition-colors">
                        Learn more <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="section-compact bg-primary text-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-heading text-display-sm font-bold mb-4">Not sure which service fits?</h2>
              <p className="text-body text-white/70 mb-8">
                Start with a conversation. We&apos;ll listen, ask the right questions, and recommend an approach — even if that means pointing you somewhere else.
              </p>
              <Button size="lg" asChild>
                <Link href="/contact">Get in Touch</Link>
              </Button>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
