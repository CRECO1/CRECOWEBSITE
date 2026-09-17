import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Award, Users, Building2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { RevealOnScroll } from '@/hooks/useScrollReveal';
import { TeamSection, type Agent } from '@/components/team/TeamSection';
import { JsonLd } from '@/components/seo/JsonLd';
import { FaqSection } from '@/components/marketing/FaqSection';
import { supabase } from '@/lib/supabase';
import { BUSINESS, FOUNDER_ID, SITE_URL, breadcrumbList, businessRef, webPage } from '@/lib/schema';

// 30-min ISR — the team grid is fetched on the server so it's in the HTML.
export const revalidate = 1800;

const AT_A_GLANCE: { label: string; value: string }[] = [
  { label: 'Legal / trade name', value: `${BUSINESS.legalName}, doing business as ${BUSINESS.name}` },
  { label: 'What CRECO is', value: 'A licensed Texas commercial real estate brokerage and advisory firm' },
  { label: 'License', value: `Texas Real Estate Commission (TREC) brokerage license #${BUSINESS.trecLicense}` },
  { label: 'Headquarters', value: BUSINESS.fullAddress },
  { label: 'Phone / email', value: `${BUSINESS.phoneDisplay} · ${BUSINESS.email}` },
  { label: 'Office hours', value: BUSINESS.hours },
  { label: 'Markets', value: 'San Antonio (HQ metro, incl. Fair Oaks Ranch, Boerne, and the Hill Country), Austin, Houston, Dallas–Fort Worth, and statewide Texas' },
  { label: 'Property types', value: 'Retail, office (incl. medical), industrial / warehouse, flex, land, and investment property — for lease and for sale' },
  { label: 'Clients represented', value: 'Tenants, buyers, landlords / owners, sellers, and investors (never both sides of the same deal)' },
  { label: 'Services', value: 'Tenant representation, leasing & sales, investment advisory, 1031 exchange sourcing, property management, development, sustainability consulting' },
  { label: 'Founder', value: 'Zachary A. Stovall, Broker (TREC #691174)' },
];

const ABOUT_FAQS = [
  {
    q: 'What is CRECO?',
    a: `CRECO – Commercial Real Estate Company (${BUSINESS.legalName}) is a licensed Texas commercial real estate brokerage, TREC #${BUSINESS.trecLicense}, headquartered at ${BUSINESS.fullAddress}. It brokers and advises on retail, office, industrial, flex, and land for lease and sale across San Antonio, Austin, Houston, Dallas–Fort Worth, and statewide Texas.`,
  },
  {
    q: 'Does CRECO represent tenants or landlords?',
    a: 'Both. CRECO represents tenants and buyers searching for space (tenant representation is typically paid by the landlord, so it is usually free to the tenant) and represents owners and landlords leasing or selling property. CRECO does not represent both sides of the same deal. CRECO also owns and leases its own centers in Fair Oaks Ranch and Lytle.',
  },
  {
    q: 'Who runs CRECO?',
    a: 'CRECO was founded by Zachary A. Stovall, a San Antonio native and Texas broker (TREC #691174). The team includes Brian Blanco, Director of Leasing, who spent four-plus years at Amazon as part of its delivery-station site-selection process. Every engagement is handled by a senior broker.',
  },
  {
    q: 'How do I contact CRECO?',
    a: `Call ${BUSINESS.phoneDisplay}, email ${BUSINESS.email}, or visit ${BUSINESS.fullAddress} (${BUSINESS.hours}). A broker responds within one business day.`,
  },
];

function agentId(a: Agent): string {
  return /stovall/i.test(a.name) ? FOUNDER_ID : `${SITE_URL}/about#${a.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export const metadata: Metadata = {
  title: 'About CRECO | Texas Commercial Real Estate Company',
  description:
    'CRECO is a trailblazing Texas commercial real estate brokerage and advisory firm. Headquartered in Fair Oaks Ranch, serving San Antonio, Austin, Houston, Dallas–Fort Worth, and the Hill Country. Principal-led tenant rep, owner services, and investment advisory.',
  keywords: [
    'CRECO commercial real estate',
    'texas commercial real estate company',
    'texas commercial real estate brokerage',
    'san antonio commercial real estate firm',
    'fair oaks ranch commercial real estate',
    'hill country commercial real estate broker',
    'principal-led commercial real estate texas',
    'commercial real estate advisory texas',
    'tenant representation firm texas',
    'investment advisory commercial real estate texas',
  ],
  alternates: { canonical: 'https://www.crecotx.com/about' },
  openGraph: {
    title: 'About CRECO | Texas Commercial Real Estate',
    description:
      'Principal-led Texas commercial real estate brokerage and advisory firm. Tenant rep, owner services, and investment advisory across San Antonio, Austin, Houston, and DFW.',
    url: 'https://www.crecotx.com/about',
    type: 'website',
  },
};

const VALUES = [
  { icon: Award, title: 'Expertise', description: 'Deep San Antonio market knowledge with the analytical rigor of a national firm.' },
  { icon: Users, title: 'Principal Service', description: 'Every client works directly with a principal — not a junior broker on commission.' },
  { icon: Building2, title: 'Trailblazing', description: 'We set new standards for what clients should expect from their commercial brokers.' },
  { icon: CheckCircle, title: 'Transparency', description: 'Clear underwriting, honest counsel, and no surprises in the close.' },
];

export default async function AboutPage() {
  const { data } = await supabase.from('agents').select('*').order('order', { ascending: true });
  const agents = (data ?? []) as Agent[];

  return (
    <>
      <JsonLd
        data={[
          webPage('AboutPage', '/about', 'About CRECO – Commercial Real Estate Company',
            'Company facts, license, markets, services, and team for CRECO, a Texas commercial real estate brokerage.',
            { mainEntity: businessRef }),
          breadcrumbList([{ name: 'About', path: '/about' }]),
          ...agents.map(a => ({
            '@context': 'https://schema.org',
            '@type': 'Person',
            '@id': agentId(a),
            name: a.name,
            jobTitle: a.title,
            email: a.email,
            telephone: a.phone ?? undefined,
            image: a.image_url ?? undefined,
            worksFor: businessRef,
            knowsAbout: a.specialties ?? undefined,
            description: a.bio ? a.bio.split('\n')[0].slice(0, 500) : undefined,
          })),
        ]}
      />
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

        {/* At a glance — a plain definition list of verifiable company facts.
            The single most extractable block on the site for AI assistants. */}
        <section className="section-luxury bg-white border-t border-border" aria-labelledby="glance-heading">
          <Container>
            <div className="mx-auto max-w-4xl">
              <p className="overline mb-3">Company Facts</p>
              <h2 id="glance-heading" className="mb-8 font-heading text-display-sm font-bold text-primary">CRECO at a glance</h2>
              <dl className="divide-y divide-border rounded-xl border border-border">
                {AT_A_GLANCE.map(({ label, value }) => (
                  <div key={label} className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-3 sm:gap-4">
                    <dt className="text-body-sm font-semibold text-primary">{label}</dt>
                    <dd className="text-body-sm text-foreground-muted sm:col-span-2">{value}</dd>
                  </div>
                ))}
              </dl>
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

        {/* Team — embedded section, replaces the standalone /team route.
            id="team" lives on the inner <section> so /about#team scrolls
            users straight to the grid (used by header nav + the /team
            redirect for any external bookmarks that still point there). */}
        <TeamSection className="section-luxury bg-white" initialAgents={agents} />

        <FaqSection faqs={ABOUT_FAQS} path="/about" heading="About CRECO — FAQ" className="section-luxury bg-background-cream" />

        {/* CTA — "Meet the Team" button removed because the team grid
            is already on this same page directly above. "Contact Us"
            stands alone as the single closing action. */}
        <section className="section-compact bg-primary text-white">
          <Container>
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="font-heading text-display-sm font-bold mb-4">Let&apos;s talk.</h2>
              <p className="text-body text-white/70 mb-8">
                Brief us on your needs or just learn more — we&apos;re happy to start with a conversation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
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
