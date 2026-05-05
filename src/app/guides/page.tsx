import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, FileText, Lock } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { SORTED_GUIDES } from '@/lib/guides';

export const metadata: Metadata = {
  title: 'Texas Commercial Real Estate Guides | Free Downloads | CRECO',
  description:
    "Free in-depth guides for Texas commercial real estate tenants, owners, and investors. Lease negotiation playbooks, disposition strategy, and market analysis from CRECO's broker team.",
  keywords: [
    'texas commercial real estate guide',
    'commercial lease negotiation guide texas',
    'commercial property owner guide texas',
    'texas commercial real estate playbook',
    'creco guides',
  ],
  alternates: { canonical: 'https://www.crecotx.com/guides' },
};

export default function GuidesIndex() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 sm:py-20 text-white">
          <Container>
            <p className="overline mb-3 text-gold">Texas Commercial Real Estate · Free Guides</p>
            <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-4">
              In-depth guides for the decisions that matter.
            </h1>
            <p className="text-body-lg text-white/70 max-w-3xl leading-relaxed">
              Practical, no-fluff guides written by CRECO's broker team. Each guide is the document we'd hand a client before our first conversation — covering lease negotiation, disposition strategy, owner-user economics, and the deal points that actually move money. Free in exchange for an email.
            </p>
          </Container>
        </section>

        {/* Guides */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {SORTED_GUIDES.map(guide => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="group rounded-2xl bg-white shadow-card hover:shadow-card-hover transition-all p-8 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <FileText className="h-5 w-5" />
                    </div>
                    <span className="text-caption uppercase tracking-widest text-gold">For {guide.audience}s</span>
                  </div>
                  <h2 className="font-heading text-heading-lg font-bold text-primary mb-3 group-hover:text-gold transition-colors">
                    {guide.title}
                  </h2>
                  <p className="text-body-sm text-foreground-muted leading-relaxed mb-6 flex-1">
                    {guide.excerpt}
                  </p>
                  <div className="flex items-center gap-5 text-caption text-foreground-muted border-t border-border pt-4 mb-4">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> {guide.pageCount} pages
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" /> {guide.readingMinutes} min read
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" /> Free w/ email
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-2 text-body-sm font-semibold text-gold-dark group-hover:text-gold transition-colors">
                    Read the guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-heading text-display-sm font-bold text-primary mb-4">Have a specific Texas commercial real estate situation?</h2>
              <p className="text-body text-foreground-muted leading-relaxed mb-8">
                Our guides cover the playbook. Your situation is specific. CRECO's brokers are happy to walk through the right approach for your tenancy, property, or portfolio — no obligation.
              </p>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-body-sm font-semibold text-white hover:bg-primary/90"
              >
                Get started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
