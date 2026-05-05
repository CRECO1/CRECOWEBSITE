import type { Metadata } from 'next';
import { BellRing, MapPin, Filter, Mail, ShieldCheck } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Container } from '@/components/ui/Container';
import { PropertyAlertsForm } from '@/components/forms/PropertyAlertsForm';

export const metadata: Metadata = {
  title: 'Texas Commercial Property Alerts | CRECO',
  description:
    'Get alerts the moment a Texas commercial property matching your filters hits the CRECO listings — retail, industrial, office, flex, and land across San Antonio, Austin, Houston, Dallas, and Fort Worth. Free, no obligation.',
  keywords: [
    'texas commercial property alerts',
    'commercial real estate alerts texas',
    'texas commercial real estate email alerts',
    'commercial property alerts san antonio austin houston dallas',
    'creco property alerts',
  ],
  alternates: { canonical: 'https://www.crecotx.com/property-alerts' },
};

const VALUE_PROPS = [
  {
    icon: BellRing,
    title: 'New listings the same day',
    body: 'We email you within 24 hours of a matching Texas commercial property going live on the CRECO inventory — often before it hits LoopNet or Crexi.',
  },
  {
    icon: Filter,
    title: 'Filtered to your search',
    body: 'Only properties matching your property type, transaction type, submarket, and size range. No mass-blast emails of irrelevant deals.',
  },
  {
    icon: MapPin,
    title: 'Statewide Texas coverage',
    body: 'San Antonio, Austin, Houston, Dallas, Fort Worth, and surrounding submarkets. All property types: office, warehouse, flex, retail, mixed-use, and land.',
  },
  {
    icon: Mail,
    title: 'Off-market deal flow when relevant',
    body: 'For active buyers and tenants, we share off-market opportunities our team is working on directly — not just public listings.',
  },
];

export default function PropertyAlertsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 sm:py-20 text-white">
          <Container>
            <div className="max-w-3xl">
              <p className="overline mb-3 text-gold">Texas Commercial Property Alerts</p>
              <h1 className="font-heading text-display-md sm:text-display-lg font-bold mb-4">
                Get the Texas commercial properties you actually want — sent to your inbox.
              </h1>
              <p className="text-body-lg text-white/70 leading-relaxed">
                Tell us what you're looking for — property type, submarket, size, lease or buy — and we'll alert you the moment a matching property hits the CRECO listings. No spam. Unsubscribe anytime.
              </p>
            </div>
          </Container>
        </section>

        {/* Form + Sidebar */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Form */}
              <div className="lg:col-span-2">
                <div className="rounded-2xl bg-white shadow-card p-7 sm:p-10">
                  <h2 className="font-heading text-heading-xl font-bold text-primary mb-2">Set up your alerts</h2>
                  <p className="text-body text-foreground-muted mb-8">Takes about 30 seconds. We'll start sending alerts as soon as something matches.</p>
                  <PropertyAlertsForm />
                </div>
              </div>

              {/* Sidebar */}
              <aside className="space-y-6">
                <div className="rounded-2xl bg-primary text-white p-7">
                  <ShieldCheck className="h-8 w-8 text-gold mb-4" />
                  <h3 className="font-heading text-heading-sm font-bold mb-2">Quiet by design</h3>
                  <p className="text-body-sm text-white/70 leading-relaxed">
                    We don't sell, share, or rent your filters or contact info. You'll only hear from us when there's a property worth your time — typically a few times a month, not a few times a week.
                  </p>
                </div>
                <div className="rounded-2xl bg-white border border-border p-7">
                  <h3 className="font-heading text-heading-sm font-bold text-primary mb-4">What you'll receive</h3>
                  <ul className="space-y-3 text-body-sm text-foreground-muted">
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                      Photos, address, and key specs (size, rate or price, year built)
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                      One-click access to the full CRECO listing page
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                      Direct broker contact if you want a private tour
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gold shrink-0" />
                      Off-market opportunities for active buyers/tenants
                    </li>
                  </ul>
                </div>
              </aside>
            </div>
          </Container>
        </section>

        {/* Why */}
        <section className="section-luxury bg-white">
          <Container>
            <div className="text-center mb-12">
              <p className="overline mb-3">Why CRECO alerts</p>
              <h2 className="font-heading text-display-sm font-bold text-primary">Speed and relevance — without the noise.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {VALUE_PROPS.map(({ icon: Icon, title, body }) => (
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
      </main>
      <Footer />
    </>
  );
}
