import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Home, Search, MapPin, Building2 } from 'lucide-react';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Page Not Found | CRECO',
  description: "The page you're looking for doesn't exist. Search Texas commercial real estate listings, services, and submarkets at CRECO.",
  robots: { index: false, follow: true },
};

const QUICK_LINKS = [
  { href: '/listings', label: 'Browse all properties', icon: Search, description: 'Office, warehouse, flex, retail, and land across Texas' },
  { href: '/services', label: 'Our services', icon: Building2, description: 'Tenant rep, investment advisory, leasing & sales, property management' },
  { href: '/submarkets', label: 'San Antonio submarkets', icon: MapPin, description: 'Northwest, North Central, Northeast, Downtown, South Side, Far West' },
  { href: '/insights', label: 'Market insights', icon: Building2, description: 'Texas commercial real estate analysis and strategy' },
];

const POPULAR_PAGES = [
  { href: '/texas-retail-space-for-lease', label: 'Texas retail space for lease' },
  { href: '/texas-industrial-property-for-lease', label: 'Texas industrial / warehouse' },
  { href: '/texas-office-space-for-lease', label: 'Texas office space for lease' },
  { href: '/texas-commercial-property-for-sale', label: 'Texas commercial property for sale' },
  { href: '/owner-services', label: 'Multi-property owner services' },
  { href: '/get-started', label: 'Get started — tell us what you need' },
];

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        {/* Hero */}
        <section className="bg-primary py-16 sm:py-24 text-white">
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="font-heading text-display-xl font-bold text-gradient-gold mb-4">
                404
              </p>
              <h1 className="font-heading text-display-sm font-bold mb-4">
                We couldn&apos;t find that page.
              </h1>
              <p className="text-body-lg text-white/70 mb-8">
                The link may be outdated, or the page may have moved. Try one of the quick links below — or call us at <a href="tel:+12108173443" className="text-gold hover:underline">(210) 817-3443</a> and we&apos;ll point you in the right direction.
              </p>
              <Button size="lg" asChild>
                <Link href="/">
                  <Home className="mr-2 h-5 w-5" />
                  Back to homepage
                </Link>
              </Button>
            </div>
          </Container>
        </section>

        {/* Quick links */}
        <section className="section-luxury bg-background-cream">
          <Container>
            <div className="mb-10 text-center">
              <p className="overline mb-3">Try one of these</p>
              <h2 className="font-heading text-heading-xl font-bold text-primary">Where do you want to go?</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
              {QUICK_LINKS.map(({ href, label, icon: Icon, description }) => (
                <Link
                  key={href}
                  href={href}
                  className="group rounded-xl border border-border bg-white p-6 transition-all hover:border-gold hover:shadow-card-hover"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold group-hover:bg-gold group-hover:text-primary transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-heading-sm font-semibold text-primary mb-1 group-hover:text-gold transition-colors">
                    {label}
                  </h3>
                  <p className="text-body-sm text-foreground-muted">{description}</p>
                </Link>
              ))}
            </div>

            {/* Popular pages list */}
            <div className="mt-12 max-w-2xl mx-auto">
              <p className="overline mb-4 text-center">Popular pages</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {POPULAR_PAGES.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-body-sm text-foreground-muted hover:bg-white hover:text-gold-dark transition-colors"
                    >
                      <ArrowRight className="h-4 w-4 shrink-0 text-gold" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
