import type { Metadata } from 'next';
import { jsonLd } from '@/lib/jsonLd';
import Link from 'next/link';
import { ArrowRight, MapPin, Building2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import {
  submarketsByMetro, PARENT_METRO_LABELS,
  type ParentMetro,
} from '@/lib/submarkets-content';

/**
 * /markets — Texas commercial real estate submarket hub.
 *
 * Index of every submarket page on the site, grouped by parent metro.
 * Designed as the canonical "explore Texas CRE by geography" landing —
 * complements the four existing city-level pages (Austin, Houston,
 * Dallas, Fair Oaks Ranch, Boerne) by giving the deeper submarkets
 * their own first-class home.
 *
 * SEO-wise this is the index that links out to every submarket page,
 * with rich CollectionPage + ItemList structured data so Google sees
 * it as a hub.
 */

export const metadata: Metadata = {
  title: 'Texas Commercial Real Estate Markets | Submarket Guide | CRECO',
  description:
    "Submarket-level guide to Texas commercial real estate — Austin, Houston, Dallas–Fort Worth, San Antonio, and Hill Country. Local market data, current rents, who's leasing where, and CRECO broker contacts in each market.",
  keywords: [
    'texas commercial real estate markets',
    'texas commercial submarkets',
    'austin metro commercial real estate',
    'dfw commercial real estate',
    'houston commercial submarkets',
    'san antonio commercial real estate',
    'texas hill country commercial',
    'texas cre by market',
  ],
  alternates: { canonical: 'https://www.crecotx.com/markets' },
  openGraph: {
    title: 'Texas Commercial Real Estate Markets | CRECO',
    description:
      'Submarket-level guide to Texas commercial real estate — Austin, Houston, DFW, San Antonio, Hill Country. Local market data + CRECO broker contacts.',
    url: 'https://www.crecotx.com/markets',
    type: 'website',
  },
};

// Major-metro hub pages already in the site — surfaced alongside the
// new submarket pages so the index doubles as a one-stop "by-geography"
// browser.
const METRO_HUB_PAGES: Record<ParentMetro, { href: string; label: string } | null> = {
  'austin':            { href: '/austin-commercial-real-estate',  label: 'Austin metro overview' },
  'dallas-fort-worth': { href: '/dallas-commercial-real-estate',  label: 'Dallas–Fort Worth overview' },
  'houston':           { href: '/houston-commercial-real-estate', label: 'Houston metro overview' },
  'san-antonio':       null,   // dedicated SA page lives at /submarkets — covered below
  'hill-country':      null,
};

const METRO_ORDER: ParentMetro[] = ['austin', 'dallas-fort-worth', 'houston', 'san-antonio', 'hill-country'];

export default function MarketsHubPage() {
  const byMetro = submarketsByMetro();
  const totalSubmarkets = Object.values(byMetro).reduce((s, arr) => s + arr.length, 0);

  // JSON-LD: CollectionPage + BreadcrumbList + ItemList of every submarket
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Texas Commercial Real Estate Markets',
    description: 'Submarket-level guide to Texas commercial real estate across Austin, Houston, DFW, San Antonio, and Hill Country.',
    url: 'https://www.crecotx.com/markets',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home',    item: 'https://www.crecotx.com' },
        { '@type': 'ListItem', position: 2, name: 'Markets', item: 'https://www.crecotx.com/markets' },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalSubmarkets,
      itemListElement: METRO_ORDER.flatMap(metro =>
        byMetro[metro].map((s, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: s.shortLabel,
          url: `https://www.crecotx.com/markets/${s.slug}`,
        })),
      ),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
      />
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 sm:py-20 text-white">
          <Container>
            <p className="overline mb-3 text-gold flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" /> Texas Commercial Real Estate · Submarket Guide
            </p>
            <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-5 leading-tight max-w-3xl">
              Texas commercial real estate, mapped by where the deals actually live.
            </h1>
            <p className="text-body-lg text-white/70 leading-relaxed max-w-2xl">
              Texas CRE isn't one market — it's thirty. Every submarket has its own rent dynamics, tenant base, supply pipeline, and broker network. This is the guide to the submarkets that matter. Pick a metro, then a submarket; each page has current data and a way to talk to a broker who actually works there.
            </p>
          </Container>
        </section>

        {/* Existing major-city pages strip */}
        <section className="bg-gold py-6 sm:py-8 text-primary">
          <Container>
            <p className="text-caption uppercase tracking-widest mb-3 font-semibold">Major Metros</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/austin-commercial-real-estate" className="rounded-full bg-primary text-white px-5 py-2 text-body-sm font-semibold hover:bg-primary/90">Austin</Link>
              <Link href="/dallas-commercial-real-estate" className="rounded-full bg-primary text-white px-5 py-2 text-body-sm font-semibold hover:bg-primary/90">Dallas–Fort Worth</Link>
              <Link href="/houston-commercial-real-estate" className="rounded-full bg-primary text-white px-5 py-2 text-body-sm font-semibold hover:bg-primary/90">Houston</Link>
              <Link href="/fair-oaks-ranch-commercial-real-estate" className="rounded-full bg-primary text-white px-5 py-2 text-body-sm font-semibold hover:bg-primary/90">Fair Oaks Ranch</Link>
              <Link href="/boerne-commercial-real-estate" className="rounded-full bg-primary text-white px-5 py-2 text-body-sm font-semibold hover:bg-primary/90">Boerne</Link>
            </div>
          </Container>
        </section>

        {/* Submarket grid by metro */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="max-w-3xl mx-auto text-center mb-12">
              <p className="overline mb-3">Submarkets</p>
              <h2 className="font-heading text-display-sm font-bold text-primary mb-3">
                Each submarket gets its own page.
              </h2>
              <p className="text-body text-foreground-muted">
                Current rents, vacancy, what's leasing, and the broker contacts who actually work that submarket. Updated as the market moves.
              </p>
            </div>

            <div className="space-y-12">
              {METRO_ORDER.map(metro => {
                const submarkets = byMetro[metro];
                if (submarkets.length === 0) return null;
                const hub = METRO_HUB_PAGES[metro];

                return (
                  <div key={metro}>
                    <div className="flex items-end justify-between flex-wrap gap-3 mb-6 pb-3 border-b border-border">
                      <h3 className="font-heading text-heading-lg font-bold text-primary">
                        {PARENT_METRO_LABELS[metro]}
                      </h3>
                      {hub && (
                        <Link
                          href={hub.href}
                          className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-dark hover:text-gold"
                        >
                          {hub.label} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {submarkets.map(s => (
                        <Link
                          key={s.slug}
                          href={`/markets/${s.slug}`}
                          className="group rounded-xl border border-border bg-white p-6 hover:border-gold hover:shadow-card-hover transition-all flex flex-col"
                        >
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold mb-4">
                            <Building2 className="h-5 w-5" />
                          </div>
                          <h4 className="font-heading text-heading-sm font-bold text-primary mb-1 group-hover:text-gold transition-colors">
                            {s.shortLabel}
                          </h4>
                          <p className="text-body-sm text-foreground-muted mb-4 flex-1">
                            {s.tagline}
                          </p>
                          <span className="inline-flex items-center gap-1.5 text-caption font-semibold text-gold-dark group-hover:text-gold">
                            Explore market <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        {/* CTA */}
        <section className="bg-primary py-14 text-white">
          <Container>
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="font-heading text-display-sm font-bold mb-4">
                Don't see your submarket?
              </h2>
              <p className="text-body-lg text-white/70 leading-relaxed mb-8">
                CRECO covers commercial real estate across all of Texas, not just the markets we've published deep pages on. Tell us what you're looking for and we'll point you at the right broker on our team.
              </p>
              <Link
                href="/get-started"
                className="inline-flex items-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-semibold text-primary hover:bg-gold-light"
              >
                Talk to a broker
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
