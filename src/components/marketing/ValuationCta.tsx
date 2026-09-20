import Link from 'next/link';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { VALUATION_CTA } from '@/lib/valuation-copy';

/**
 * The one valuation call-to-action.
 *
 * Owners used to meet three different pitches for the same tool — a card in
 * the homepage's "Free Tools" grid, the owner half of the lead-magnet band,
 * and ad-hoc links on the owner pages — each promising something slightly
 * different. This is the single component, and its wording comes from
 * lib/valuation-copy so it cannot drift from the landing page it points at.
 *
 * `variant`:
 *   band   — full-width dark band, for the bottom of a marketing page
 *   inline — compact bordered card, for sitting inside existing content
 */
export function ValuationCta({
  variant = 'band',
  surface,
}: {
  variant?: 'band' | 'inline';
  /** Where this instance lives, appended to the link for attribution. */
  surface?: string;
}) {
  const href = surface ? `/property-valuation?from=${encodeURIComponent(surface)}` : '/property-valuation';

  if (variant === 'inline') {
    return (
      <div className="rounded-2xl border border-border/60 bg-background-cream p-6 sm:p-8">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 shrink-0 text-gold-dark" />
          <h3 className="font-heading text-heading-lg font-bold text-primary">{VALUATION_CTA.heading}</h3>
        </div>
        <p className="mb-5 text-body-sm leading-relaxed text-foreground-muted">{VALUATION_CTA.body}</p>
        <Link
          href={href}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-body-sm font-bold text-primary transition-colors hover:bg-gold-light"
        >
          {VALUATION_CTA.action} <ArrowRight className="h-4 w-4 shrink-0" />
        </Link>
        <p className="mt-3 text-caption text-foreground-muted">{VALUATION_CTA.reassurance}</p>
      </div>
    );
  }

  return (
    <section className="bg-primary py-14 sm:py-16">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gold/15">
            <TrendingUp className="h-6 w-6 text-gold" />
          </div>
          <h2 className="font-heading text-display-sm font-bold text-white">{VALUATION_CTA.heading}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-body text-white/75">{VALUATION_CTA.body}</p>
          <Link
            href={href}
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-bold text-primary transition-colors hover:bg-gold-light"
          >
            {VALUATION_CTA.action} <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
          <p className="mt-4 text-caption text-white/55">{VALUATION_CTA.reassurance}</p>
        </div>
      </Container>
    </section>
  );
}
