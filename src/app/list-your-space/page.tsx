import type { Metadata } from 'next';
import {
  Megaphone, Scale, ShieldCheck, Clock, FileText, UserCheck, Handshake, Building2, Phone,
} from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { JsonLd } from '@/components/seo/JsonLd';
import { breadcrumbList, webPage, businessRef, BUSINESS, SITE_URL } from '@/lib/schema';
import { DEFAULT_OG_IMAGE } from '@/lib/og';
import { ListYourSpaceForm } from '@/components/forms/ListYourSpaceForm';
import { LISTING_BENEFITS } from '@/lib/listing-copy';

export const revalidate = 3600;

const PATH = '/list-your-space';

/**
 * Listing acquisition — the page that asks an owner for the mandate.
 *
 * Targets landlord intent ("list commercial property for lease", "commercial
 * leasing broker for landlords"), which nothing on the site was answering: the
 * owner pages explained what CRECO does, and /sell leads with a sale. This one
 * leads with the listing.
 *
 * Every benefit is qualitative. No lease-up speeds, no occupancy figures, no
 * commission rate — see lib/listing-copy.
 */
export const metadata: Metadata = {
  title: 'List Your Commercial Property for Lease | CRECO',
  description:
    'List retail, office, industrial, flex or land with CRECO. Professional marketing, syndication to LoopNet, Crexi and CoStar, screened tenants, and a broker who works your listing himself.',
  keywords: [
    'list commercial property for lease',
    'list my commercial space',
    'commercial leasing broker for landlords',
    'commercial leasing broker san antonio',
    'landlord representation texas',
    'lease my retail space',
    'lease my office space',
    'lease my warehouse',
    'commercial listing agent texas',
    'find a tenant for my commercial property',
  ],
  alternates: { canonical: `${SITE_URL}${PATH}` },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'List Your Commercial Property for Lease | CRECO',
    description:
      'Put a broker on your space who works the deal himself — and gets it in front of the tenants and tenant-rep brokers actually looking.',
    url: `${SITE_URL}${PATH}`,
    type: 'website',
  },
};

const ICONS = { Megaphone, Scale, ShieldCheck, Clock, FileText, UserCheck, Handshake, Building2 } as const;

const FAQS = [
  {
    q: 'Why list commercial space with a broker instead of marketing it myself?',
    a: 'Most qualified tenants do not find space by driving past it. They search LoopNet, Crexi and CoStar, or they hire a tenant-rep broker who works a network. A listing broker puts your space in both places, screens who responds, and negotiates the terms that actually decide what a lease is worth — rent, term, escalations, concessions and tenant improvements. The cost owners usually underestimate is vacancy: an empty month is gone whatever you save on marketing.',
  },
  {
    q: 'What types of commercial property does CRECO list?',
    a: 'Retail, office, industrial and warehouse, flex, and land — for lease and for sale. CRECO also owns and operates its own commercial centers, so the listing side of the business is work it does for itself as well as for clients.',
  },
  {
    q: 'What does CRECO do once my space is listed?',
    a: 'Prepares the marketing, syndicates the listing to the commercial platforms tenants and tenant-rep brokers search, handles inquiries and tours, screens prospects, negotiates the letter of intent and lease terms alongside your attorney, and coordinates through to signature. Renewals and vacancy planning are part of the same relationship.',
  },
  {
    q: 'How is CRECO paid on a listing?',
    a: 'Representation is success-based — CRECO is paid when the space is leased or sold. The specific terms are agreed with you in the listing agreement before anything is signed, and they depend on the property, the scope and the deal.',
  },
  {
    q: 'Who will actually be working my listing?',
    a: 'Zachary A. Stovall, CRECO’s broker and owner. You deal with him directly rather than being handed to a junior associate once the agreement is signed.',
  },
  {
    q: 'What do you need from me to get started?',
    a: 'The address, the property type, roughly how much space is available, and whether you are looking to lease, sell, or weigh both. Anything else useful — current vacancy, existing tenants, timing — helps, but is not required to start the conversation.',
  },
];

export default function ListYourSpacePage() {
  return (
    <>
      <JsonLd
        data={[
          breadcrumbList([{ name: 'List Your Space', path: PATH }]),
          webPage('WebPage', PATH, 'List Your Commercial Property for Lease', metadata.description as string, {
            primaryImageOfPage: undefined,
          }),
          businessRef,
          {
            '@context': 'https://schema.org',
            '@type': 'Service',
            '@id': `${SITE_URL}${PATH}#service`,
            name: 'Commercial property listing and leasing representation',
            serviceType: [
              'Commercial listing representation',
              'Landlord representation',
              'Commercial leasing',
              'Tenant procurement',
            ],
            provider: { '@id': `${SITE_URL}/#organization` },
            description: metadata.description as string,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            '@id': `${SITE_URL}${PATH}#faq`,
            mainEntity: FAQS.map(f => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
        ]}
      />
      <Header />
      <main className="min-h-screen pt-20">

        {/* Hero + form side by side — the ask is visible without scrolling */}
        <section className="bg-primary py-16 sm:py-20 text-white">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="overline mb-3 text-gold">For Texas Property Owners</p>
                <h1 className="font-heading text-display-md sm:text-display-lg font-bold leading-tight">
                  List your space with CRECO.
                </h1>
                <p className="mt-5 max-w-xl text-body-lg leading-relaxed text-white/80">
                  Retail, office, industrial, flex or land — put a broker on it who works the deal
                  himself and gets it in front of the tenants and tenant-rep brokers actually looking.
                </p>
                <div className="mt-7">
                  <a
                    href={`tel:${BUSINESS.phoneE164.replace(/-/g, '')}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    <Phone className="h-4 w-4" /> {BUSINESS.phoneDisplay}
                  </a>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
                <h2 className="mb-1 font-heading text-heading-xl font-bold text-primary">Tell us about the space</h2>
                <p className="mb-6 text-body-sm text-foreground-muted">
                  Zack reviews it himself and comes back with how he&apos;d take it to market.
                </p>
                <ListYourSpaceForm />
              </div>
            </div>
          </Container>
        </section>

        {/* The case — punches, not paragraphs */}
        <section className="section-luxury bg-white" aria-labelledby="why-list">
          <Container>
            <div className="mx-auto max-w-5xl">
              <div className="mb-12 max-w-2xl">
                <p className="overline mb-2 text-gold">Why use a broker</p>
                <h2 id="why-list" className="font-heading text-display-sm font-bold text-primary">
                  What representation actually buys you
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
                {LISTING_BENEFITS.map(b => {
                  const Icon = ICONS[b.icon];
                  return (
                    <div key={b.title} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15">
                        <Icon className="h-5 w-5 text-gold-dark" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-heading text-heading font-bold text-primary">{b.title}</h3>
                        <p className="text-body-sm leading-relaxed text-foreground-muted">{b.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="section-luxury bg-background-cream" aria-labelledby="listing-faq">
          <Container>
            <div className="mx-auto max-w-3xl">
              <h2 id="listing-faq" className="mb-8 font-heading text-display-xs font-bold text-primary">
                Listing questions
              </h2>
              <div className="space-y-3">
                {FAQS.map(f => (
                  <details key={f.q} className="group rounded-xl border border-border bg-white p-5">
                    <summary className="flex cursor-pointer items-center justify-between gap-4 font-heading text-heading font-semibold text-primary">
                      {f.q}
                      <span className="shrink-0 text-gold-dark transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 text-body-sm leading-relaxed text-foreground-muted">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-primary py-14 text-white">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-heading text-display-xs font-bold">Have space sitting empty?</h2>
              <p className="mt-4 text-body text-white/75">
                Send the address. Zack will tell you how he&apos;d lease it.
              </p>
              <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="#top"
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-bold text-primary transition-colors hover:bg-gold-light"
                >
                  List your space
                </a>
                <a
                  href={`tel:${BUSINESS.phoneE164.replace(/-/g, '')}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-7 py-3.5 text-body-sm font-semibold text-white transition-colors hover:border-gold hover:text-gold"
                >
                  <Phone className="h-4 w-4" /> {BUSINESS.phoneDisplay}
                </a>
              </div>
              <p className="mt-6 text-caption text-white/50">
                {BUSINESS.fullAddress} · {BUSINESS.trecLicenseDisplay}
              </p>
            </div>
          </Container>
        </section>

      </main>
      <Footer />
    </>
  );
}
