import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { LISTING_CTA } from '@/lib/listing-copy';

/**
 * The one "list your space" call-to-action.
 *
 * Same pattern as ValuationCta, and deliberately a separate component: the two
 * offers are not interchangeable. Valuation answers "what is this worth";
 * this one asks for the listing. A page may carry both, but they must read as
 * different asks, so their copy lives in separate modules.
 *
 * Owner-facing only. It has no business on a tenant page.
 */
export function ListingCta({
  variant = 'band',
  surface,
}: {
  variant?: 'band' | 'inline';
  surface?: string;
}) {
  const href = surface ? `/list-your-space?from=${encodeURIComponent(surface)}` : '/list-your-space';

  if (variant === 'inline') {
    return (
      <div className="rounded-2xl border border-border/60 bg-background-cream p-6 sm:p-8">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-5 w-5 shrink-0 text-gold-dark" />
          <h3 className="font-heading text-heading-lg font-bold text-primary">{LISTING_CTA.heading}</h3>
        </div>
        <p className="mb-5 text-body-sm leading-relaxed text-foreground-muted">{LISTING_CTA.body}</p>
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-body-sm font-bold text-primary transition-colors hover:bg-gold-light"
        >
          {LISTING_CTA.action} <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
        <p className="mt-3 text-caption text-foreground-muted">{LISTING_CTA.reassurance}</p>
      </div>
    );
  }

  return (
    <section className="bg-primary py-14 sm:py-16">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/15">
            <Building2 className="h-6 w-6 text-gold" />
          </div>
          <h2 className="font-heading text-display-sm font-bold text-white">{LISTING_CTA.heading}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-body text-white/75">{LISTING_CTA.body}</p>
          <Link
            href={href}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-bold text-primary transition-colors hover:bg-gold-light"
          >
            {LISTING_CTA.action} <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
          <p className="mt-4 text-caption text-white/55">{LISTING_CTA.reassurance}</p>
        </div>
      </Container>
    </section>
  );
}
