import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Award, Users, Building2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';

export const metadata: Metadata = {
  title: 'About CRECO | San Antonio Commercial Real Estate Company',
  description:
    'CRECO is a trailblazing commercial real estate company in San Antonio. Learn about our mission, principals, and the values that drive every engagement.',
  alternates: { canonical: 'https://www.crecotx.com/about' },
};

const VALUES = [
  { icon: Award, title: 'Expertise', description: 'Deep San Antonio market knowledge with the analytical rigor of a national firm.' },
  { icon: Users, title: 'Principal Service', description: 'Every client works directly with a principal — not a junior broker on commission.' },
  { icon: Building2, title: 'Trailblazing', description: 'We set new standards for what clients should expect from their commercial brokers.' },
  { icon: CheckCircle, title: 'Transparency', description: 'Clear underwriting, honest counsel, and no surprises in the close.' },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-20 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-4 text-gold">About CRECO</p>
              <h1 className="font-heading text-display font-bold">
                Where your real estate ventures find the support they deserve.
              </h1>
              <p className="mt-6 text-body-lg text-white/80">
                CRECO — Commercial Real Estate Company — is a San Antonio-based commercial brokerage and advisory firm built on innovation, expertise, and a relentless commitment to client outcomes.
              </p>
            </div>
          </Container>
        </section>

        {/* Story */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
              <RevealOnScroll direction="left">
                <p className="overline mb-3">Our Story</p>
                <h2 className="mb-6 font-heading text-display-sm font-bold text-primary">A trailblazing approach to CRE.</h2>
                <p className="mb-4 text-body text-foreground-muted leading-relaxed">
                  We started CRECO because we saw a gap in the San Antonio market. Tenants and owners deserved more than what the volume-driven national chains were offering — more attention, more analytical depth, more skin in the game.
                </p>
                <p className="mb-4 text-body text-foreground-muted leading-relaxed">
                  So we built a firm with a small, senior team. Every engagement runs through a principal. Every assignment gets the analytical rigor of a national shop, but with the responsiveness and judgment of a boutique.
                </p>
                <p className="text-body text-foreground-muted leading-relaxed">
                  That&apos;s the CRECO difference. Whether you&apos;re a tenant looking for your first office, an owner repositioning a portfolio, or an investor underwriting your tenth deal — you get a principal&apos;s attention and a fiduciary&apos;s honesty.
                </p>
              </RevealOnScroll>

              <RevealOnScroll direction="right">
                <div className="rounded-2xl bg-background-cream p-8 lg:p-10">
                  <h3 className="mb-6 font-heading text-heading-xl font-bold text-primary">What we believe</h3>
                  <ul className="space-y-4">
                    {[
                      'Tenants and owners are best served by brokers who specialize, not by generalists.',
                      'Underwriting comes before opinions. We show our work.',
                      'Off-market opportunities matter — relationships unlock deals that listings can\'t.',
                      'A good fit between client and broker matters more than the firm\'s logo.',
                      'Sustainable, well-located real estate is good business — and good for San Antonio.',
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

        {/* Values */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <RevealOnScroll>
              <div className="mb-14 text-center">
                <p className="overline mb-3">What Drives Us</p>
                <h2 className="font-heading text-display font-bold text-primary gold-line gold-line-center inline-block pb-4">Our Values</h2>
              </div>
            </RevealOnScroll>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map(({ icon: Icon, title, description }, i) => (
                <RevealOnScroll key={title} delay={i * 80}>
                  <div className="rounded-xl border border-border bg-white p-6 text-center h-full">
                    <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gold/10 text-gold">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 font-heading text-heading-sm font-semibold text-primary">{title}</h3>
                    <p className="text-body-sm text-foreground-muted">{description}</p>
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
              <h2 className="font-heading text-display-sm font-bold mb-4">Let&apos;s talk.</h2>
              <p className="text-body text-white/70 mb-8">
                Tour the team, brief us on your needs, or just learn more — we&apos;re happy to start with a conversation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/team">Meet the Team</Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link href="/contact">Contact Us</Link>
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
