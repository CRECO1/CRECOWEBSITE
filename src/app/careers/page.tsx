import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList, faqPage } from '@/lib/schema';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import Link from 'next/link';
import {
  Briefcase, ArrowRight, Phone, Users, TrendingUp, Sparkles,
  Building2, MapPin, ShieldCheck, HandshakeIcon, Search as SearchIcon,
} from 'lucide-react';
import { CRECO_VALUE_PROPS } from '@/lib/recruiting';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { CareerApplicationForm } from '@/components/forms/CareerApplicationForm';

export const metadata: Metadata = {
  title: 'Careers at CRECO | Texas Commercial Real Estate',
  description:
    "CRECO is hiring commercial real estate agents across Texas. Join a small principal-led team headquartered at 8000 Fair Oaks Pkwy in Fair Oaks Ranch.",
  keywords: [
    'commercial real estate agent jobs texas',
    'commercial real estate broker careers',
    'creco careers',
    'commercial real estate jobs san antonio',
    'commercial real estate jobs austin',
    'commercial real estate jobs houston',
    'commercial real estate jobs dallas',
    'tenant representation broker jobs',
    'owner services agent texas',
    'fair oaks ranch real estate jobs',
  ],
  alternates: { canonical: 'https://www.crecotx.com/careers' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Careers at CRECO | Texas Commercial Real Estate',
    description:
      'CRECO is hiring commercial real estate agents across Texas. Small principal-led team, every agent works directly with clients, headquartered in Fair Oaks Ranch.',
    url: 'https://www.crecotx.com/careers',
    type: 'website',
  },
};

// Copy comes from lib/recruiting.ts so the page, the CRECO one-pager and the
// Fair Oaks side of the pitch cannot drift. Icons are resolved here.
const ICONS = { UserCheck: Users, Laptop: Sparkles, Megaphone: TrendingUp, Search: SearchIcon, Network: HandshakeIcon, DollarSign: ShieldCheck } as const;
const WHY_CRECO = [
  ...CRECO_VALUE_PROPS.map(p => ({ icon: ICONS[p.icon], title: p.title, body: p.body })),
  {
    icon: Building2,
    title: 'Skin in the game',
    body: "We don't just broker — we own and operate the mixed-use commercial center at 8000 Fair Oaks Pkwy. That conviction shows up in how we underwrite, how we negotiate, and how we coach.",
  },
];

const WHO_WE_LOOK_FOR = [
  'Active TX real estate license — or willing to get one',
  'Commercial focus or real interest in moving to commercial from residential',
  'Self-directed and accountable — we coach, we don\'t micromanage',
  'Comfortable with phone, email, in-person — most CRE deals still close that way',
  'Plays well with others — small team means every relationship matters',
  'Lives in or willing to work Texas markets we cover',
];

const FAQS = [
  {
    q: "I'm a residential agent. Can I make the switch to commercial?",
    a: "Yes. Commercial is a different rhythm than residential: longer sales cycles, more underwriting, sophisticated counterparties, but more interesting work and bigger checks. If you have the discipline and the network, you can build a real practice — and because our sister brokerage handles residential, the book you already have does not go to waste. Tell us about your background in the application and Zack will talk through the path.",
  },
  {
    q: "I'm not licensed yet. Should I still apply?",
    a: 'If you have relevant experience (commercial real estate, finance, development, leasing, capital markets, or related) and you\'re committed to getting licensed, yes. Texas requires 180 hours of pre-licensing education plus the state exam. We can talk about timing in the conversation.',
  },
  {
    q: 'Where do CRECO agents work from?',
    a: "Our headquarters is at 8000 Fair Oaks Pkwy in Fair Oaks Ranch — a mixed-use commercial center we own and operate. [Desk / office space for agents — confirm]. Most of our team works hybrid: in-office for client meetings and team time, in the field for tours, and from anywhere for desk work.",
  },
  {
    q: 'What does the comp look like?',
    a: "Commission split [commission split — confirm], [cap / post-cap structure — confirm], [desk / monthly fees — confirm]. Zack goes through the exact numbers with you on the first call rather than publishing a headline figure here. What is settled: the platform — the CRM with e-signature, the listing system and the marketing behind it — comes with the seat.",
  },
  {
    q: "Is the application confidential?",
    a: "Yes. We never contact your current brokerage or employer without your explicit say-so. Many of our hires are still actively producing somewhere else when they apply.",
  },
];

export default function CareersPage() {
  return (
    <>
      <JsonLd data={[breadcrumbList([{ name: 'Careers', path: '/careers' }]), faqPage(FAQS, '/careers')]} />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 sm:py-24 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-3 text-gold flex items-center gap-2">
                <Briefcase className="h-3.5 w-3.5" /> Careers · Texas Commercial Real Estate
              </p>
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight">
                Build your commercial real estate career at CRECO.
              </h1>
              <p className="text-body-lg text-white/70 leading-relaxed mb-4 max-w-2xl">
                We're a small, principal-led Texas commercial real estate firm — and we're always looking for sharp agents who want to do real work for real clients on real deals.
              </p>
              <p className="text-body text-white/60 leading-relaxed mb-8 max-w-2xl">
                Tenant rep, owner services, investment advisory, and leasing & sales across San Antonio, the Hill Country, Austin, Houston, and DFW. Headquartered at 8000 Fair Oaks Pkwy in Fair Oaks Ranch.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#apply"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
                >
                  Apply now
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="tel:+12108173443"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 text-body-sm font-semibold text-white hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />
                  (210) 817-3443
                </a>
              </div>
            </div>
          </Container>
        </section>

        {/* Status strip */}
        <section className="bg-gold py-6 text-primary">
          <Container>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center">
              <span className="font-heading text-heading-sm font-bold uppercase tracking-wider">
                Now Hiring
              </span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">Tenant Rep · Owner Services · Investment Advisory</span>
              <span className="text-body-sm">·</span>
              <span className="text-body-sm font-medium">Texas-wide</span>
            </div>
          </Container>
        </section>

        {/* Why */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="overline mb-3">Why CRECO</p>
              <h2 className="font-heading text-display-sm font-bold text-primary mb-4">
                A different kind of brokerage.
              </h2>
              <p className="text-body text-foreground-muted leading-relaxed">
                Most commercial brokerages treat agents as a recruiting funnel — sign as many bodies as possible, lean on splits and overrides, see who survives. We don't. We hire deliberately, coach actively, and invest in the agents who invest in the firm. If that's the kind of seat you're looking for, keep reading.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {WHY_CRECO.map(({ icon: Icon, title, body }) => (
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

        {/* Who */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">
              <div>
                <p className="overline mb-3">What we look for</p>
                <h2 className="font-heading text-display-sm font-bold text-primary mb-5">
                  The right fit, not just the right resume.
                </h2>
                <p className="text-body text-foreground leading-relaxed mb-6">
                  Commercial real estate is a relationship business with technical depth. We hire for both. The most important quality isn't years of experience — it's whether you'll do the work and play well with the rest of the team.
                </p>
                <p className="text-body text-foreground leading-relaxed">
                  If you're early in your career, we'll coach you. If you're a producer somewhere else, we'll meet you where you are. Either way, the bar is the same: be the kind of broker we'd want to refer a friend to.
                </p>
              </div>
              <div className="rounded-2xl bg-background-cream p-8 lg:p-10">
                <Briefcase className="h-9 w-9 text-gold mb-4" />
                <h3 className="font-heading text-heading-lg font-bold text-primary mb-5">What we look for</h3>
                <ul className="space-y-3 text-body-sm text-foreground-muted">
                  {WHO_WE_LOOK_FOR.map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="max-w-3xl mx-auto">
              <p className="overline mb-3 text-center">Common questions</p>
              <h2 className="font-heading text-display-sm font-bold text-primary text-center mb-12">
                Before you apply.
              </h2>
              <div className="space-y-4">
                {FAQS.map(faq => (
                  <details key={faq.q} className="group rounded-xl border border-border bg-white p-6">
                    <summary className="flex cursor-pointer items-start justify-between gap-4 list-none">
                      <span className="font-heading text-body font-semibold text-primary">
                        {faq.q}
                      </span>
                      <span className="text-gold text-2xl leading-none transition-transform group-open:rotate-45 shrink-0">+</span>
                    </summary>
                    <p className="mt-4 text-body-sm text-foreground-muted leading-relaxed">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* Application Form */}
        <section id="apply" className="section-luxury bg-white scroll-mt-24">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <div className="rounded-2xl bg-white border border-border shadow-card p-7 sm:p-10">
                  <p className="overline mb-3">Apply to Join CRECO</p>
                  <h2 className="font-heading text-heading-xl font-bold text-primary mb-2">
                    Tell us about yourself.
                  </h2>
                  <p className="text-body text-foreground-muted mb-8">
                    The form takes about 90 seconds. A CRECO principal will review your background and reach out to schedule a confidential conversation if there's a fit.
                  </p>
                  <CareerApplicationForm />
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-2xl bg-primary text-white p-7">
                  <Phone className="h-8 w-8 text-gold mb-4" />
                  <h3 className="font-heading text-heading-sm font-bold mb-2">Prefer a direct conversation?</h3>
                  <p className="text-body-sm text-white/70 leading-relaxed mb-4">
                    Some of our best hires came from a phone call before any application. If you'd rather skip the form, call or text directly.
                  </p>
                  <a href="tel:+12108173443" className="inline-flex items-center gap-2 text-gold font-semibold hover:text-gold-light">
                    (210) 817-3443
                  </a>
                </div>
                <div className="rounded-2xl bg-background-cream border border-border p-7">
                  <MapPin className="h-7 w-7 text-gold mb-3" />
                  <h3 className="font-heading text-heading-sm font-bold text-primary mb-2">Where we're based</h3>
                  <p className="text-body-sm text-foreground-muted leading-relaxed mb-3">
                    Headquarters at 8000 Fair Oaks Pkwy in Fair Oaks Ranch — the mixed-use commercial center CRECO owns and operates.
                  </p>
                  <Link href="/8000-fair-oaks-pkwy" className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-dark hover:text-gold">
                    See the building <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </aside>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
