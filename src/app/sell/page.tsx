import Link from 'next/link';
import { TrendingUp, Building2, FileText, Users, CheckCircle, ArrowRight, Phone, Calculator } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { ValuationCta } from '@/components/marketing/ValuationCta';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { SellInquiryForm } from './SellInquiryForm';
import { Testimonials } from '@/components/marketing/Testimonials';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqSection } from '@/components/marketing/FaqSection';
import { BUSINESS, breadcrumbList, businessRef } from '@/lib/schema';

const SELL_FAQS = [
  {
    q: 'How do I sell or lease my commercial property in Texas with CRECO?',
    a: `Request a broker opinion of value on this page or call ${BUSINESS.phoneDisplay}. CRECO tours the property, reviews the rent roll and operating history, benchmarks comparable Texas transactions, and delivers a no-obligation value range and marketing strategy — typically within one to two business days.`,
  },
  {
    q: 'How will CRECO market my property?',
    a: 'Broker book, professional and drone photography, a property website, syndication on CoStar, LoopNet, and Crexi, and direct outreach to qualified buyers and tenants in CRECO\'s Texas owner and broker network — including principals who never search public listings.',
  },
  {
    q: 'What types of commercial property does CRECO sell and lease for owners?',
    a: 'Retail centers and freestanding retail, office and medical office, industrial and warehouse, flex, land, and investment property anywhere in Texas, with the deepest coverage in San Antonio, Austin, Houston, and Dallas–Fort Worth.',
  },
  {
    q: 'Can CRECO help me with a 1031 exchange when I sell?',
    a: 'Yes. CRECO coordinates the sale timeline with your qualified intermediary and identifies replacement properties across Texas within the 45-day identification window.',
  },
];

const STEPS = [
  { number: '01', title: 'Property Evaluation', description: 'We tour the asset, review rent rolls and operating history, and benchmark against comparable transactions to establish a defensible value range.' },
  { number: '02', title: 'Positioning Strategy', description: 'We craft the marketing narrative — broker book, property website, drone & professional photography, and a tenant/buyer profile.' },
  { number: '03', title: 'Targeted Marketing', description: 'CoStar, LoopNet, our principal-broker network, and direct outreach to qualified principals — your asset gets in front of the right eyes.' },
  { number: '04', title: 'Offer Negotiation', description: 'We tee up multiple LOIs when possible, walk you through tradeoffs (price vs. terms vs. certainty), and negotiate aggressively.' },
  { number: '05', title: 'Diligence to Close', description: 'We coordinate with your attorney, accountant, lender, and the buyer\'s diligence team — and we don\'t disappear after the contract is signed.' },
];

// Checkable facts only. This band previously read "2.4M+ SF Transacted /
// 25+ Years in Texas CRE / 30+ Active Listings / 98% Client Satisfaction"
// from the operator-set site_settings values. CRECO was founded in 2024, the
// agents table puts the founder at 9 years in the business, the site has
// never had 30 active listings (it has 9), and no client-satisfaction survey
// exists. Track-record numbers go back only when there are closed deals to
// total.
const STATS = [
  { icon: Building2, value: 'Full-service', label: 'Leasing & investment sales' },
  { icon: FileText, value: `TREC #${BUSINESS.trecLicense}`, label: 'Licensed Texas brokerage' },
  { icon: TrendingUp, value: 'No-obligation', label: 'Broker opinion of value' },
  { icon: Users, value: 'Same day', label: 'Response, business days' },
];
export default function SellPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': 'https://www.crecotx.com/sell#service',
            name: 'Commercial property disposition and owner leasing — Texas',
            serviceType: 'Commercial real estate listing brokerage (sale and lease)',
            provider: businessRef,
            areaServed: { '@type': 'State', name: 'Texas' },
            url: 'https://www.crecotx.com/sell',
          },
          breadcrumbList([{ name: 'Sell or Lease Your Property', path: '/sell' }]),
        ]}
      />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-20 text-white">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="overline mb-4 text-gold">List Your Property</p>
                <h1 className="mb-6 font-heading text-display font-bold text-white">
                  Sell or Lease<br />
                  <span className="text-gradient-gold">Your Commercial Asset</span>
                </h1>
                <p className="mb-8 max-w-lg text-body-lg text-white/70">
                  Whether you&apos;re disposing of a stabilized asset, leasing up vacant space, or testing the market — CRECO brings institutional-quality marketing and the relationships to close.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" asChild>
                    <a href="#valuation">Get a Property Opinion</a>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                    <a href="tel:+12108173443"><Phone className="mr-2 h-4 w-4" />(210) 817-3443</a>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {STATS.map(({ icon: Icon, value, label }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur-sm">
                    <Icon className="mx-auto mb-3 h-8 w-8 text-gold" />
                    <div className="font-heading text-display-sm font-bold text-white">{value}</div>
                    <div className="mt-1 text-caption uppercase tracking-wider text-white/50">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Free valuation tool callout */}
        <section className="bg-background-warm py-14 border-y border-gold/30">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 flex items-start gap-5">
                <div className="hidden sm:inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold-dark">
                  <Calculator className="h-6 w-6" />
                </div>
                <div>
                  <p className="overline mb-2 text-gold-dark">Not ready to talk to a broker yet?</p>
                  <h2 className="font-heading text-heading-xl font-bold text-primary mb-2">Get an instant preliminary value range first.</h2>
                  <p className="text-body text-foreground-muted">
                    Our free valuation tool produces a cap-rate-based value range in 60 seconds — no contact info required to see the number. Once you have it, you can decide whether to request the full broker opinion below.
                  </p>
                </div>
              </div>
              <div className="text-center lg:text-right">
                <Button size="lg" variant="outline" asChild>
                  <Link href="/property-valuation">Value my property <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* Process */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <RevealOnScroll>
              <div className="mb-14 text-center">
                <p className="overline mb-3">Our Process</p>
                <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">
                  How We List & Close
                </h2>
              </div>
            </RevealOnScroll>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((step, i) => (
                <RevealOnScroll key={step.number} delay={i * 100}>
                  <div className="text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-primary font-heading text-heading font-bold">
                      {step.number}
                    </div>
                    <h3 className="mb-3 font-heading text-heading-sm font-semibold text-primary">{step.title}</h3>
                    <p className="text-body-sm text-foreground-muted">{step.description}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* Benefits */}
        <section className="section-compact bg-white">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
              <RevealOnScroll direction="left">
                <p className="overline mb-3 text-gold">Why CRECO</p>
                <h2 className="mb-6 font-heading text-display-sm font-bold text-primary">
                  The CRECO Difference
                </h2>
                <ul className="space-y-4">
                  {[
                    'Professional photography, drone, and broker-grade marketing materials',
                    'Custom property website and broker book for every listing',
                    'CoStar, LoopNet, and direct principal outreach included',
                    'Quarterly market updates and quarterly tenant retention check-ins',
                    'Tenant- and owner-side fluency across office, industrial, retail, and land',
                    'Principal-level attention from contract to close',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-body text-foreground-muted">
                      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                      {item}
                    </li>
                  ))}
                </ul>
              </RevealOnScroll>

              {/* Owner Inquiry Form (client island) */}
              <RevealOnScroll direction="right">
                <SellInquiryForm />
              </RevealOnScroll>
            </div>
          </Container>
        </section>

        {/* Real client testimonials — social proof close to the ask. Renders
            nothing if there are no featured testimonials. */}
        <Testimonials
          eyebrow="Client Stories"
          heading="Owners and tenants we've represented"
          bg="bg-background-cream"
        />
        <FaqSection faqs={SELL_FAQS} path="/sell" heading="Selling or leasing your property — FAQ" className="section-luxury bg-white" />
      </main>
      <ValuationCta surface="sell" />
      <Footer />
    </>
  );
}
