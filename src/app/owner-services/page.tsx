import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2, LineChart, Wrench, RefreshCw, FileBarChart, Layers, ArrowRight,
  CheckCircle, Phone, Sparkles,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';

export const metadata: Metadata = {
  title: 'Texas Commercial Property Owner Services | Multi-Property Portfolio | CRECO',
  description:
    'Owner services for Texas commercial property investors with multi-property portfolios. Hold/sell analysis, repositioning strategy, 1031 exchange, tenant mix optimization, property management, and asset management — built for owners with 5 to 100+ Texas commercial properties.',
  keywords: [
    'commercial property owner services texas',
    'texas commercial property management',
    'portfolio commercial real estate texas',
    'commercial real estate asset management texas',
    'texas commercial property repositioning',
    'multi property owner services texas',
    '1031 exchange texas',
    'commercial real estate hold sell analysis',
    'tenant mix optimization texas',
    'commercial property owner advisor texas',
  ],
  alternates: { canonical: 'https://www.crecotx.com/owner-services' },
  openGraph: {
    title: 'Texas Commercial Property Owner Services | CRECO',
    description:
      'Strategic owner services for Texas commercial property investors with portfolios. Repositioning, 1031, tenant optimization, asset management.',
    url: 'https://www.crecotx.com/owner-services',
    type: 'website',
  },
};

const SERVICES = [
  {
    icon: LineChart,
    title: 'Portfolio Strategy & Asset Management',
    desc: 'Quarterly portfolio reviews, hold/sell analysis on every asset, tenant mix optimization, market-rent benchmarking, and capex planning. We treat your portfolio like our own.',
  },
  {
    icon: RefreshCw,
    title: 'Repositioning & Value-Add',
    desc: 'Tenant turnover plans, capital improvements with documented ROI, rebranding, leasing-velocity acceleration. Specifically: identifying which of your assets are underperforming and exactly what to do about it.',
  },
  {
    icon: Building2,
    title: 'Leasing & Renewals',
    desc: 'Owner-side leasing on retail, industrial, and office. Renewal negotiations to maximize tenant retention while pushing rents to market. Vacancy minimization through proactive tenant outreach 12+ months ahead of expirations.',
  },
  {
    icon: Wrench,
    title: 'Day-to-Day Property Management',
    desc: 'Vendor coordination, maintenance, lease administration, CAM reconciliations, monthly financial reporting, capital project oversight. Boutique-firm responsiveness with institutional-quality reporting.',
  },
  {
    icon: FileBarChart,
    title: 'Acquisition & Disposition Advisory',
    desc: 'Underwriting on potential acquisitions across Texas. Disposition strategy: BOV (Broker Opinion of Value), positioning, marketing, and offer negotiation. Off-market deal flow through our Texas owner and broker network.',
  },
  {
    icon: Layers,
    title: '1031 Exchanges & Tax Strategy',
    desc: 'Identification of replacement property within the 45-day window. Coordination with your CPA, qualified intermediary, and lender. Cost segregation studies, bonus depreciation, Opportunity Zone qualification on eligible properties.',
  },
];

const FAQS = [
  {
    q: 'How is CRECO different from a national property management firm?',
    a: 'National firms typically excel at managing single large institutional assets. CRECO is built for the multi-property Texas owner — entrepreneurs, family offices, and private investors with 5 to 100 commercial properties. You get principal-level attention on strategy and a tight property-management team that knows every asset, instead of being one of 10,000 buildings on a national platform.',
  },
  {
    q: 'What size portfolio does CRECO work with?',
    a: 'We work with Texas commercial property owners ranging from 3 properties to 75+. Our sweet spot is 10-50 property portfolios with mixed asset types (retail, industrial, office, mixed-use) where strategy across the portfolio matters as much as managing any single building. Smaller owners (1-5 properties) often engage us for advisory + leasing rather than full management.',
  },
  {
    q: 'What does CRECO charge for owner services?',
    a: 'Property management fees typically run 3-5% of effective gross income, depending on portfolio size and asset mix — multi-property engagements are tiered down. Leasing commissions follow market convention (typically 4-6% of total lease value, paid 50% on lease execution / 50% on tenant occupancy). Strategic advisory and acquisition / disposition is engagement-fee or success-fee based, structured per assignment.',
  },
  {
    q: 'Do you handle properties outside San Antonio?',
    a: 'Yes — CRECO is a Texas-wide owner services firm. We actively manage and advise on properties across San Antonio, Austin, Houston, DFW, El Paso, Corpus Christi, and the Hill Country. For owners with multi-market Texas portfolios, having one firm coordinating across all of them simplifies reporting, leasing strategy, and disposition timing.',
  },
  {
    q: 'Can I keep my existing property manager and just engage CRECO for strategy?',
    a: 'Absolutely. Many owners engage CRECO purely for strategic advisory — quarterly portfolio reviews, hold/sell calls on individual assets, tenant repositioning recommendations, disposition timing — while keeping their current PM in place for day-to-day operations. We work in whatever role the engagement requires.',
  },
  {
    q: 'How quickly can you take over property management for an existing portfolio?',
    a: 'Onboarding a new owner with an established Texas portfolio typically takes 30-60 days. We tour every asset, audit existing leases and rent rolls, transition vendor contracts, set up financial reporting in our system, and meet every tenant. The first 90 days post-onboarding includes a full portfolio review and a strategy memo recommending immediate wins.',
  },
];

export default function OwnerServicesPage() {
  return (
    <>
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />

      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-20 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-15"
            style={{ backgroundImage: "url('/images/sa-hero.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <Container className="relative z-10">
            <div className="max-w-3xl">
              <p className="overline mb-4 text-gold">Texas Commercial Real Estate · Owner Services</p>
              <h1 className="font-heading text-display font-bold mb-6">
                Built for Texas commercial property owners with portfolios.
              </h1>
              <p className="text-body-lg text-white/80 mb-8">
                Hold/sell analysis. Repositioning strategy. 1031 exchange identification. Tenant mix optimization. Property management with institutional-quality reporting at boutique-firm responsiveness. CRECO is the operating partner Texas commercial property owners trust to grow NOI across portfolios of 5 to 100+ properties.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link href="/contact">Schedule a Portfolio Review <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <a href="tel:+12108173443"><Phone className="mr-2 h-4 w-4" />(210) 817-3443</a>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        {/* The Pitch */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:items-center">
              <RevealOnScroll direction="left">
                <p className="overline mb-3 text-gold">For Multi-Property Owners</p>
                <h2 className="mb-6 font-heading text-display-sm font-bold text-primary">
                  Most Texas commercial owners outgrow generic property management.
                </h2>
                <p className="mb-4 text-body text-foreground-muted leading-relaxed">
                  When you owned one or two properties, a basic management firm was enough. But once you cross 5 — and certainly by 10 — properties, you start needing strategy, not just operations. Which assets are dragging your portfolio? When should you sell vs reposition? Where can you push rents? Are your tenants the right ones? When does a 1031 make sense?
                </p>
                <p className="mb-4 text-body text-foreground-muted leading-relaxed">
                  These are not questions a property manager answers. They are questions a principal-level commercial real estate firm answers — and that&apos;s what CRECO is built to be.
                </p>
                <p className="text-body text-foreground-muted leading-relaxed">
                  We sit in your seat. Every quarter, we walk your full Texas portfolio and tell you: keep, reposition, or sell. We make the case with hard numbers — submarket comps, tenant credit analysis, mark-to-market upside — and we execute the recommendations through our leasing, sales, and management teams.
                </p>
              </RevealOnScroll>
              <RevealOnScroll direction="right">
                <div className="rounded-2xl bg-background-cream p-8">
                  <Sparkles className="mb-4 h-8 w-8 text-gold" />
                  <h3 className="mb-4 font-heading text-heading-lg font-bold text-primary">What you get with CRECO</h3>
                  <ul className="space-y-3">
                    {[
                      'Principal-level relationship — every engagement is led by a senior CRECO broker',
                      'Quarterly portfolio strategy reviews with actionable recommendations',
                      'Texas-wide coverage: San Antonio, Austin, Houston, DFW, and beyond',
                      'Institutional reporting (monthly financials, leasing pipeline, capex tracking)',
                      'Off-market deal flow for acquisitions and 1031 up-legs',
                      'Direct broker access — no junior-associate handoffs',
                    ].map(item => (
                      <li key={item} className="flex items-start gap-3 text-body-sm text-foreground-muted">
                        <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealOnScroll>
            </div>
          </Container>
        </section>

        {/* Services Grid */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <RevealOnScroll>
              <div className="mb-12 text-center">
                <p className="overline mb-3">What We Do</p>
                <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">Owner Service Lines</h2>
              </div>
            </RevealOnScroll>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map(({ icon: Icon, title, desc }, i) => (
                <RevealOnScroll key={title} delay={i * 60}>
                  <div className="h-full rounded-xl border border-border bg-white p-7">
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-3 font-heading text-heading-sm font-semibold text-primary">{title}</h3>
                    <p className="text-body-sm text-foreground-muted leading-relaxed">{desc}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* The Process */}
        <section className="section-luxury bg-primary text-white">
          <Container>
            <RevealOnScroll>
              <div className="mb-12 text-center">
                <p className="overline mb-3 text-gold">How We Engage</p>
                <h2 className="font-heading text-display-sm font-bold gold-line gold-line-center inline-block pb-3">The CRECO Owner Onboarding</h2>
              </div>
            </RevealOnScroll>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
              {[
                { step: '01', title: 'Portfolio Walk', body: 'Tour every Texas property. Audit rent rolls, leases, operating history, and capex backlog. Meet existing PM and key tenants.' },
                { step: '02', title: 'Strategy Memo', body: 'Within 30 days: written strategy memo per asset (keep / reposition / sell), portfolio-level recommendations, immediate wins to execute in 90 days.' },
                { step: '03', title: 'Execution', body: 'Roll out new property management, kick off leasing campaigns, list dispositions, identify acquisitions / 1031 up-legs.' },
                { step: '04', title: 'Quarterly Review', body: 'Every 90 days: portfolio review meeting, NOI report, leasing pipeline update, capex status, strategic recommendations for next quarter.' },
              ].map((p, i) => (
                <RevealOnScroll key={p.step} delay={i * 100}>
                  <div className="text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-primary font-heading text-heading font-bold">
                      {p.step}
                    </div>
                    <h3 className="mb-3 font-heading text-heading-sm font-semibold">{p.title}</h3>
                    <p className="text-body-sm text-white/70">{p.body}</p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <RevealOnScroll>
              <div className="mb-10 text-center">
                <p className="overline mb-3">People Also Ask</p>
                <h2 className="font-heading text-display-sm font-bold text-primary gold-line gold-line-center inline-block pb-3">Owner Services FAQ</h2>
              </div>
            </RevealOnScroll>
            <div className="mx-auto max-w-3xl space-y-3">
              {FAQS.map((faq, i) => (
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

        {/* CTA */}
        <section className="section-compact bg-gold">
          <Container>
            <div className="flex flex-col items-center justify-between gap-8 text-center lg:flex-row lg:text-left">
              <div>
                <h2 className="font-heading text-display-sm font-bold text-primary">Schedule a no-obligation portfolio review.</h2>
                <p className="mt-2 text-body text-primary/70">A CRECO principal will tour your assets, review your rent rolls, and deliver a written strategic recommendation within two weeks.</p>
              </div>
              <Button size="xl" className="shrink-0 bg-primary text-white hover:bg-primary/90 shadow-lg font-bold" asChild>
                <Link href="/contact">Schedule Portfolio Review <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
