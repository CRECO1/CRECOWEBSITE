import Link from 'next/link';
import { ArrowRight, Building2, Handshake, MapPin, TrendingUp } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { LISTING_CTA } from '@/lib/listing-copy';
import { SALE_CTA, DEVELOPMENT_CTA } from '@/lib/owner-paths-copy';
import { VALUATION_CTA } from '@/lib/valuation-copy';

/**
 * The owner's four doors, side by side.
 *
 * CRECO asks an owner four different things — lease it, sell it, bring us the
 * site, what's it worth — and each has its own page and capture. Stacking four
 * full-width CTA bands on the owner pages would be a wall of pitches; this
 * puts them in one band as compact cards, so an owner picks the one that
 * matches what they came for.
 *
 * Wording comes from each offer's own copy module, so a card can never drift
 * from the page it opens.
 *
 * Owner-facing only — never render this on a tenant page.
 */
const PATHS = [
  { icon: Building2,  label: 'Lease it',        cta: LISTING_CTA,     href: '/list-your-space' },
  { icon: Handshake,  label: 'Sell it',         cta: SALE_CTA,        href: SALE_CTA.href },
  { icon: MapPin,     label: 'Develop it',      cta: DEVELOPMENT_CTA, href: DEVELOPMENT_CTA.href },
  { icon: TrendingUp, label: 'Value it',        cta: VALUATION_CTA,   href: '/property-valuation' },
] as const;

export function OwnerPathsBand({ surface, exclude = [] }: {
  surface?: string;
  /** Hide a path on the page that already is that path. */
  exclude?: Array<'/list-your-space' | '/sell' | '/development-opportunities' | '/property-valuation'>;
}) {
  const shown = PATHS.filter(p => !exclude.includes(p.href as typeof exclude[number]));
  return (
    <section className="bg-primary py-14 sm:py-16" aria-labelledby="owner-paths">
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 max-w-2xl">
            <p className="overline mb-2 text-gold">For property owners</p>
            <h2 id="owner-paths" className="font-heading text-display-sm font-bold text-white">
              What do you want to do with it?
            </h2>
          </div>
          <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${shown.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
            {shown.map(({ icon: Icon, label, cta, href }) => (
              <Link
                key={href}
                href={surface ? `${href}?from=${encodeURIComponent(surface)}` : href}
                className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-gold/40 hover:bg-white/10"
              >
                <Icon className="mb-4 h-6 w-6 text-gold" />
                <h3 className="mb-2 font-heading text-heading font-bold text-white">{label}</h3>
                <p className="mb-5 flex-1 text-body-sm leading-relaxed text-white/70">{cta.heading}</p>
                <span className="inline-flex items-center gap-2 text-body-sm font-bold text-gold">
                  {cta.action}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
