'use client';

/**
 * The compact no-dead-end block — the secondary surfaces' version of
 * ListingsEmptyState.
 *
 * Why two components rather than one: /listings is where someone arrives with
 * an active search intent and nothing else on the page to do, so its empty
 * state earns a full explanation plus its own capture form (see
 * ListingsEmptyState). The other places a zero-result can appear — a city ×
 * asset SEO page's "Available Now" table, /sold, the map with nothing geocoded,
 * /compare with an empty shortlist — are sections inside pages that already
 * carry their own lead form further down. Dropping a second form into them
 * would compete with the one below and split the surface's reporting, so these
 * get the same three contact routes and the same off-market reasoning in a
 * block that reads in about six lines.
 *
 * What every caller must supply: a `surface` id, so a tap from the Houston
 * industrial table is distinguishable in GA from one on /sold, and an `action`
 * where the page has a genuinely better next step than "contact us" (the map's
 * "see these in Grid view", /compare's "browse listings"). `body` stays a prop
 * because each page's honest statement of the gap is already written and
 * approved in that page's own file — this component supplies the reasoning and
 * the ask, not the framing.
 *
 * Off-market line and category nouns come from lib/property-type-copy.ts, the
 * same vetted source ListingsEmptyState reads, so the claims discipline
 * documented there covers this component too: nothing quantitative, no track
 * record, no inventory promise.
 */

import Link from 'next/link';
import { ArrowRight, Mail, Sparkles } from 'lucide-react';
import { PhoneCallText } from '@/components/marketing/PhoneCallText';
import { emptyStateCopy, offMarketLine } from '@/lib/property-type-copy';
import { PRIMARY_BROKER } from '@/lib/broker';
import { trackEvent } from '@/lib/analytics';

export interface NoListingsCTAProps {
  heading: string;
  /** The page's own statement of the gap — passed in, not invented here. */
  body: string;
  /**
   * A `property_type` / asset value ('flex', 'office', 'industrial'…). When it
   * resolves to a vetted guide, the off-market line names that category
   * specifically; otherwise it falls back to "commercial space".
   */
  propertyType?: string | null;
  /** Placement id, forwarded to GA on every contact tap. */
  surface: string;
  /** The page's best "keep looking" step, shown above the contact routes. */
  action?: { href: string; label: string };
  /** Where "tell us what you need" points. Defaults to the tenant-needs form. */
  needsHref?: string;
  className?: string;
}

export function NoListingsCTA({
  heading,
  body,
  propertyType,
  surface,
  action,
  needsHref = '/get-started',
  className = '',
}: NoListingsCTAProps) {
  const copy = emptyStateCopy(propertyType);
  const label = copy.kind === 'typed' ? copy.label : null;

  return (
    <div
      className={`rounded-2xl border border-border bg-background-cream p-5 sm:p-7 ${className}`}
      aria-label="No matching listings"
    >
      <h3 className="font-heading text-heading-sm font-bold text-primary sm:text-heading">{heading}</h3>
      <p className="mt-3 text-body-sm leading-relaxed text-foreground-muted">{body}</p>

      {/* The reason to call a broker rather than check back next week. */}
      <div className="mt-4 flex gap-3 rounded-xl border border-gold/30 bg-gold-lighter/50 p-4">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" aria-hidden="true" />
        <p className="text-body-sm leading-relaxed text-primary">{offMarketLine(copy.spaceNoun)}</p>
      </div>

      {/* Mobile-first: everything full width and stacked; side by side from sm. */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        {action && (
          <Link
            href={action.href}
            onClick={() => trackEvent('empty_state_action', { surface, action: action.href })}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            {action.label}
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>
        )}
        <Link
          href={needsHref}
          onClick={() => trackEvent('empty_state_needs_click', { surface, property_type: label ?? undefined })}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-primary/25 px-6 py-3 text-body-sm font-semibold text-primary transition-colors hover:border-gold hover:text-gold-dark"
        >
          {label ? `Tell us what ${copy.spaceNoun} you need` : 'Tell us what you need'}
        </Link>
      </div>

      {/* Call · Text · Email — one tap each on a phone. */}
      <div className="mt-5 border-t border-border pt-5">
        <p className="text-caption font-semibold uppercase tracking-wider text-foreground-muted">
          Or reach our team directly
        </p>
        <PhoneCallText variant="stacked" surface={surface} className="mt-3" />
        <a
          href={`mailto:${PRIMARY_BROKER.email}?subject=${encodeURIComponent(
            label ? `${label} space enquiry` : 'Commercial space enquiry',
          )}`}
          onClick={() => trackEvent('mailto_click', { surface })}
          className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 text-body-sm font-semibold text-primary transition-colors hover:border-gold hover:text-gold-dark"
        >
          <Mail className="h-4 w-4 shrink-0" />
          Email {PRIMARY_BROKER.email}
        </a>
      </div>
    </div>
  );
}
