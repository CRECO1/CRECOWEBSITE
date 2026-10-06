import type { Metadata } from 'next';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import Link from 'next/link';
import { ArrowRight, Phone, ShieldCheck, TrendingUp, Calculator, Building2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { CapRateTable } from '@/components/marketing/CapRateTable';
import { PropertyValuationForm } from '@/components/forms/PropertyValuationForm';
import { BrokerTrustLine } from '@/components/marketing/BrokerCard';
import { PRIMARY_BROKER } from '@/lib/broker';
import { PhoneCallText } from '@/components/marketing/PhoneCallText';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { Testimonials } from '@/components/marketing/Testimonials';
import { jsonLd } from '@/lib/jsonLd';

import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList } from '@/lib/schema';
export const metadata: Metadata = {
  title: "What's My Commercial Property Worth? | CRECO",
  description:
    "What's your commercial property worth? Tell us about it in 20 seconds and get a free Broker Opinion of Value from CRECO's broker — San Antonio & the Texas Hill Country.",
  keywords: [
    'commercial property valuation texas',
    'what is my commercial property worth',
    'commercial real estate appraisal texas',
    'cap rate calculator texas',
    'texas commercial property value',
    'free commercial property valuation',
    'industrial property value texas',
    'retail property value texas',
    'office building value texas',
    'creco valuation',
  ],
  alternates: { canonical: 'https://www.crecotx.com/property-valuation' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: "What's My Commercial Property Worth? | CRECO",
    description:
      'Get an instant preliminary valuation for your Texas commercial property — industrial, retail, office, flex. Free, no obligation.',
    url: 'https://www.crecotx.com/property-valuation',
    type: 'website',
  },
};

const HOW_IT_WORKS = [
  {
    icon: Calculator,
    title: 'Tell us about the property',
    body: "Address, type, size and how it's used — no financials needed. If it's leased, add the annual rent for an instant range. About 20 seconds.",
  },
  {
    icon: TrendingUp,
    title: 'See where you stand',
    body: "Leased properties get an instant cap-rate range on the spot. Owner-occupied, vacant and land get the value drivers for their market.",
  },
  {
    icon: Building2,
    title: 'Zack sends the real number',
    body: "Zachary A. Stovall, CRECO's broker/owner, prepares your Broker Opinion of Value from actual comparable sales — usually the same business day. No charge, no obligation.",
  },
];

const TRUST = [
  'Texas-licensed broker since day one — TREC #9014367',
  "Founder operates from his own commercial center at 8000 Fair Oaks Pkwy",
  'Cap rates pulled from active 2026 Texas market activity, not stale data',
  'Your inputs stay confidential — never shared, never sold',
];

// Answer-first, Texas-specific FAQ — the substantive, indexable content that
// helps this page (28% of the site's search impressions but stuck on page 3)
// rank for valuation queries, and gives AI answer engines clean pairs to cite.
const FAQS: { q: string; a: string }[] = [
  {
    q: 'How is commercial property valued?',
    a: "Most income-producing commercial real estate is valued with the income approach: divide the property's annual net operating income (NOI) by a market capitalization (“cap”) rate. If a building nets $200,000 a year and comparable properties trade at an 8% cap rate, its indicated value is $200,000 ÷ 0.08 = $2.5 million. Owner-user and special-use properties lean more on the sales-comparison or cost approaches, but for leased retail, industrial, office, and flex, the income approach drives the number.",
  },
  {
    q: 'What is a cap rate, and how does it affect value?',
    a: "A capitalization rate is the ratio of a property's annual net operating income to its price — effectively the unleveraged yield a buyer accepts. Lower cap rates mean higher prices (buyers pay more per dollar of income for lower-risk assets); higher cap rates mean lower prices. Cap rates move with interest rates, tenant credit, lease term, location, and condition, which is why the same NOI can support very different values.",
  },
  {
    q: 'What cap rates is Texas commercial real estate trading at in 2026?',
    a: "These are CRECO estimates, not figures from a third-party data service. As a rough 2026 guide for stabilized Texas assets we work with: industrial and multi-tenant retail generally around 6.5–8.5%, single-tenant net-lease depending heavily on tenant credit and remaining term, and Class B office wider at roughly 8–10.5%. Value-add, distressed, or special-use properties trade outside these bands. The tool applies these ranges by property type and submarket tier — the right cap rate for your specific asset still depends on lease structure and condition.",
  },
  {
    q: 'How accurate is an instant online valuation versus a broker appraisal?',
    a: "An instant range is a directional starting point — it tells you whether your asset is roughly where you think it is. It can't see your actual lease terms, tenant credit, deferred maintenance, recent comparable sales, or current buyer demand, all of which routinely move the number 10–20% either way. A full broker valuation or formal appraisal accounts for those. Use the instant range to ground the conversation, not to set a list price.",
  },
  {
    q: 'What information do I need to value my commercial property?',
    a: "At minimum, the property type and submarket. For an income-based estimate, your annual net operating income (NOI) gives the tightest result; if you don't have NOI handy, gross income — or square footage plus approximate rent per SF — works too. The more accurate your income figure, the tighter the range.",
  },
  {
    q: 'Does property type change how value is calculated?',
    a: "The income approach applies across industrial, retail, office, flex, and mixed-use, but each type carries different market cap rates and value drivers. Industrial value hinges on clear height, dock access, and location on distribution corridors; retail on tenant mix, co-tenancy, and traffic; office on class, submarket, and lease term. The tool applies the appropriate cap-rate band for the type you select.",
  },
  {
    q: 'How does location affect commercial property value in Texas?',
    a: "Submarket is one of the biggest value levers. The same building supports a different price in a primary submarket (strong demand, lower cap rates) than in a secondary or tertiary one. Texas metros each have their own dynamics — Class A office in Stone Oak or the Domain prices very differently from Class B space downtown. The tool asks for a submarket tier so the estimate reflects that.",
  },
  {
    q: 'Is the valuation free, and what happens after?',
    a: "Yes — completely free, with no obligation. Tell us about the property and where to send it; Zachary A. Stovall, CRECO's broker/owner, prepares a Broker Opinion of Value from comparable sales (and, if you want, a walkthrough). Leased properties also get an instant preliminary range on the spot.",
  },
];

export default function PropertyValuationPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': 'https://www.crecotx.com/property-valuation#faq',
    mainEntity: FAQS.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />
      <JsonLd data={breadcrumbList([{ name: 'Property Valuation', path: '/property-valuation' }])} />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 sm:py-20 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-3 text-gold">Free Preliminary Valuation</p>
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight">
                What's your Texas commercial property worth?
              </h1>
              <p className="text-body-lg text-white/70 leading-relaxed mb-4 max-w-2xl">
                Tell us about your property in about 20 seconds and get a free Broker Opinion of Value — real comparable sales, not a tax-roll guess.
              </p>
              <p className="text-body text-white/60 leading-relaxed max-w-2xl">
                Prepared personally by Zachary A. Stovall, CRECO&apos;s broker/owner. Free, no obligation.
              </p>
            </div>
          </Container>
        </section>

        {/* Form + sidebar */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <div className="rounded-2xl bg-white shadow-card p-7 sm:p-10">
                  <p className="overline mb-3">Your property</p>
                  <h2 className="font-heading text-heading-xl font-bold text-primary mb-2">Tell us about it.</h2>
                  <p className="text-body text-foreground-muted mb-5">
                    No financials needed. Two quick steps, then Zack takes it from there.
                  </p>
                  {/* Explicitly Zack: he prepares the BOV and valuation leads route to him. */}
                  <BrokerTrustLine broker={PRIMARY_BROKER} className="mb-8" />
                  <PropertyValuationForm />
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-2xl bg-primary text-white p-7">
                  <ShieldCheck className="h-8 w-8 text-gold mb-4" />
                  <h3 className="font-heading text-heading-sm font-bold mb-3">Why trust this number?</h3>
                  <ul className="space-y-2.5 text-body-sm text-white/80">
                    {TRUST.map(t => (
                      <li key={t} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl bg-white border border-border p-7">
                  <Phone className="h-7 w-7 text-gold mb-3" />
                  <h3 className="font-heading text-heading-sm font-bold text-primary mb-2">Rather just talk?</h3>
                  <p className="text-body-sm text-foreground-muted leading-relaxed mb-3">
                    Skip the form and walk through your property with our team on the phone. We'll tell you a range in 15 minutes.
                  </p>
                  <PhoneCallText variant="inline" tone="light" surface="valuation-sidebar" />
                </div>
              </aside>
            </div>
          </Container>
        </section>

        {/* Proof signals — below the form so the form is the first thing
            an owner reaches (the valuation funnel lost most visitors before
            they touched it). */}
        <TrustStrip />

        {/* How it works */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="overline mb-3">How it works</p>
              <h2 className="font-heading text-display-sm font-bold text-primary">A real number, not a tax-roll guess.</h2>
              <p className="mt-3 text-body text-foreground-muted">
                We don't pretend to give you a final appraisal — that takes a full broker walkthrough. But the preliminary range is calibrated against actual Texas market activity and tells you whether your asset is roughly where you think it is.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {HOW_IT_WORKS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="rounded-xl border border-border bg-white p-7">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-heading-sm font-bold text-primary mb-2">{title}</h3>
                  <p className="text-body-sm text-foreground-muted leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* FAQ — answer-first content mirroring the FAQPage schema (indexable +
            AI-citable), targeting commercial-property-valuation search intent. */}
        <CapRateTable />

        <section className="section-luxury bg-background-cream" id="faq" aria-labelledby="val-faq-heading">
          <Container>
            <div className="max-w-3xl mx-auto">
              <p className="overline mb-3">FAQ</p>
              <h2 id="val-faq-heading" className="font-heading text-display-sm font-bold text-primary mb-8">
                Commercial property valuation in Texas — common questions
              </h2>
              <dl className="space-y-8">
                {FAQS.map((f, i) => (
                  <div key={i}>
                    <dt className="font-heading text-heading-sm font-bold text-primary mb-2">{f.q}</dt>
                    <dd className="text-body text-foreground leading-relaxed">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Container>
        </section>

        {/* Real client testimonials right before the final ask — the strongest
            social proof lands closest to the conversion point. Renders nothing
            if there are no featured testimonials. */}
        <Testimonials
          eyebrow="Client Stories"
          heading="Owners who trusted our read on value"
          bg="bg-white"
        />

        {/* Final CTA */}
        <section className="bg-primary py-16 text-white">
          <Container>
            <div className="max-w-2xl mx-auto text-center">
              <p className="overline mb-3 text-gold">Already thinking about selling?</p>
              <h2 className="font-heading text-display-sm sm:text-display-md font-bold mb-4">
                Get a full broker valuation — no obligation.
              </h2>
              <p className="text-body-lg text-white/70 leading-relaxed mb-8">
                The preliminary number is a starting point. A full broker valuation includes a property walkthrough, comp analysis, lease review, condition adjustments, and market-timing recommendations. Free for property owners considering disposition or 1031 exchange.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/sell"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  Request full broker valuation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/owner-services"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 text-body-sm font-semibold text-white hover:bg-white/10"
                >
                  Owner services
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
