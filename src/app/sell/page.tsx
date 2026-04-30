'use client';

import { useState } from 'react';
import { TrendingUp, Building2, FileText, Users, CheckCircle, ArrowRight, Phone } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';

const STEPS = [
  { number: '01', title: 'Property Evaluation', description: 'We tour the asset, review rent rolls and operating history, and benchmark against comparable transactions to establish a defensible value range.' },
  { number: '02', title: 'Positioning Strategy', description: 'We craft the marketing narrative — broker book, property website, drone & professional photography, and a tenant/buyer profile.' },
  { number: '03', title: 'Targeted Marketing', description: 'CoStar, LoopNet, our principal-broker network, and direct outreach to qualified principals — your asset gets in front of the right eyes.' },
  { number: '04', title: 'Offer Negotiation', description: 'We tee up multiple LOIs when possible, walk you through tradeoffs (price vs. terms vs. certainty), and negotiate aggressively.' },
  { number: '05', title: 'Diligence to Close', description: 'We coordinate with your attorney, accountant, lender, and the buyer\'s diligence team — and we don\'t disappear after the contract is signed.' },
];

const STATS = [
  { icon: TrendingUp, value: '2.4M+', label: 'SF Transacted' },
  { icon: Building2, value: '15+', label: 'Years in San Antonio' },
  { icon: FileText, value: '30+', label: 'Active Listings' },
  { icon: Users, value: '98%', label: 'Client Satisfaction' },
];

export default function SellPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.get('name'),
        company: data.get('company'),
        email: data.get('email'),
        phone: data.get('phone'),
        message: `Property Address: ${data.get('address')}\nProperty Type: ${data.get('property_type')}\nGoal: ${data.get('goal')}\nTimeline: ${data.get('timeline')}\nNotes: ${data.get('notes')}`,
        source: 'owner-inquiry',
      }),
    }).catch(() => {});
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <>
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

              {/* Owner Inquiry Form */}
              <RevealOnScroll direction="right">
                <div id="valuation" className="rounded-2xl bg-background-cream p-8 lg:p-10">
                  {submitted ? (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto mb-4 h-14 w-14 text-gold" />
                      <h3 className="font-heading text-heading-xl font-bold text-primary mb-2">Request Received</h3>
                      <p className="text-body text-foreground-muted">
                        A CRECO broker will reach out within one business day to discuss your property and next steps.
                      </p>
                    </div>
                  ) : (
                    <>
                      <h3 className="mb-2 font-heading text-heading-xl font-bold text-primary">Request a Property Opinion</h3>
                      <p className="mb-6 text-body-sm text-foreground-muted">
                        Tell us about your property and we&apos;ll provide a no-obligation Broker Opinion of Value or leasing strategy.
                      </p>
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <input name="name" required placeholder="Your Name" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                          <input name="company" placeholder="Company / Entity" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input name="phone" type="tel" required placeholder="Phone Number" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                          <input name="email" type="email" required placeholder="Email Address" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                        </div>
                        <input name="address" required placeholder="Property Address" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold" />
                        <div className="grid grid-cols-2 gap-4">
                          <select name="property_type" required className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold">
                            <option value="">Property type…</option>
                            <option>Office</option>
                            <option>Warehouse / Industrial</option>
                            <option>Flex</option>
                            <option>Retail</option>
                            <option>Land</option>
                            <option>Multifamily</option>
                            <option>Mixed-Use</option>
                            <option>Other</option>
                          </select>
                          <select name="goal" required className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold">
                            <option value="">My goal…</option>
                            <option>Sell</option>
                            <option>Lease</option>
                            <option>Either</option>
                            <option>Just want a valuation</option>
                          </select>
                        </div>
                        <select name="timeline" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold">
                          <option value="">Timeline…</option>
                          <option>ASAP (within 30 days)</option>
                          <option>1–3 months</option>
                          <option>3–6 months</option>
                          <option>6–12 months</option>
                          <option>Just exploring</option>
                        </select>
                        <textarea name="notes" rows={3} placeholder="Anything else we should know? (occupancy, rent roll, deferred maintenance, etc.)" className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold resize-none" />
                        <Button type="submit" size="lg" fullWidth loading={loading}>
                          Request a Property Opinion
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </RevealOnScroll>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
