import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Phone, ShieldCheck, TrendingUp, Calculator, Building2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { PropertyValuationForm } from '@/components/forms/PropertyValuationForm';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { Testimonials } from '@/components/marketing/Testimonials';
import { jsonLd } from '@/lib/jsonLd';

import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList } from '@/lib/schema';
export const metadata: Metadata = {
  title: "What's My Commercial Property Worth? | Free Texas CRE Valuation | CRECO",
  description:
    "Get an instant preliminary valuation range for your Texas commercial property — industrial, retail, office, flex, or mixed-use. Free, no obligation. Backed by current Texas cap rates. CRECO brokers follow up with a full broker valuation if you want to dig deeper.",
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
    title: "What's My Commercial Property Worth? | Free Texas CRE Valuation | CRECO",
    description:
      'Get an instant preliminary valuation for your Texas commercial property — industrial, retail, office, flex. Free, no obligation.',
    url: 'https://www.crecotx.com/property-valuation',
    type: 'website',
  },
};

const HOW_IT_WORKS = [
  {
    icon: Calculator,
    title: 'Fill in what you know',
    body: "Property type, submarket, and either your NOI, gross income, or square footage with rough rent — whichever you have. Takes about 60 seconds.",
  },
  {
    icon: TrendingUp,
    title: 'Get an instant range',
    body: "We apply current Texas cap rates by property type and submarket tier to produce a preliminary value range. Not a point estimate — Texas CRE doesn't work that way.",
  },
  {
    icon: Building2,
    title: 'CRECO follows up',
    body: "A senior broker reviews your inputs and (if you want) tours the property to deliver a full broker valuation — comps, lease analysis, condition adjustments, market timing. No charge, no obligation.",
  },
];

const TRUST = [
  'Texas-licensed broker since day one — TREC #9014367-BB',
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
    a: "As a rough 2026 guide for stabilized Texas assets: industrial and multi-tenant retail generally trade around 6.5–8.5%, single-tenant net-lease depends heavily on tenant credit and remaining term, and Class B office is wider at roughly 8–10%+. Value-add, distressed, or special-use properties trade outside these bands. Our tool applies current ranges by property type and submarket tier — the right cap rate for your specific asset still depends on lease structure and condition.",
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
    a: "Yes — the instant range is free and requires no contact information to see the number. If you'd like a full broker valuation (a property walkthrough, comps, lease and condition analysis, and market-timing guidance), a senior CRECO broker follows up at no charge and no obligation — useful if you're weighing a sale or a 1031 exchange.",
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
                Get an instant preliminary valuation range based on current Texas cap rates by property type and submarket. Free, no obligation, no contact-info-required-to-see-the-number.
              </p>
              <p className="text-body text-white/60 leading-relaxed max-w-2xl">
                Plus the option to have a senior CRECO broker deliver a full valuation if you want to dig deeper.
              </p>
            </div>
          </Container>
        </section>

        {/* Real, operator-set proof signals right under the hero (mirrors the
            homepage placement). Server component — live counts at paint, and
            reads the same site_settings stats the homepage does. */}
        <TrustStrip />

        {/* Form + sidebar */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <div className="rounded-2xl bg-white shadow-card p-7 sm:p-10">
                  <p className="overline mb-3">Your property</p>
                  <h2 className="font-heading text-heading-xl font-bold text-primary mb-2">Tell us about it.</h2>
                  <p className="text-body text-foreground-muted mb-8">
                    We need property type and submarket. The other fields make the range tighter — fill in what you know, skip what you don't.
                  </p>
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
                    Skip the form and walk through your property with a CRECO broker on the phone. We'll tell you a range in 15 minutes.
                  </p>
                  <a href="tel:+12108173443" className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-dark hover:text-gold">
                    (210) 817-3443 <ArrowRight className="h-3 w-3" />
                  </a>
                </div>
              </aside>
            </div>
          </Container>
        </section>

        {/* How it works */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="overline mb-3">How it works</p>
              <h2 className="font-heading text-display-sm font-bold text-primary">A real preliminary number in 60 seconds.</h2>
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
