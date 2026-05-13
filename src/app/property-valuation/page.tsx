import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Phone, ShieldCheck, TrendingUp, Calculator, Building2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { PropertyValuationForm } from '@/components/forms/PropertyValuationForm';

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

export default function PropertyValuationPage() {
  return (
    <>
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
