'use client';

/**
 * The /listings no-results state.
 *
 * What it replaced: a centred building icon, "No properties found", and "Try
 * adjusting your filters". A visitor who tapped "Flex" on the homepage had told
 * us precisely what they wanted and got a dead end — on a phone, a whole screen
 * of nothing.
 *
 * What it does instead, in the order a phone reads it:
 *   1. Opens on an invitation built from the type ("Let’s find your flex
 *      space"), never on the absence — Zack's call: lead with the offer.
 *   2. Explains what that property type IS and who it's for — useful to the
 *      tenant who half-knows the term, and it makes the page worth landing on.
 *   3. Says we often know of space that never reaches a listing site, which is
 *      the actual reason to contact a broker rather than refresh the page.
 *   4. Offers the three contact routes at once — Call, Text, Email — above the
 *      fold of the ask, then the four-field capture below it.
 *   5. Only then offers the filter escape hatches, because "clear your filters"
 *      is the least valuable thing we can say to someone who knows what they
 *      want.
 *
 * Copy lives in lib/property-type-copy.ts, keyed by `listings.property_type`
 * value, so adding a type is a data edit. Anything without a vetted entry —
 * an odd filter combination, a search term that matched nothing, a custom CMS
 * type — renders the generic version, which still explains and still asks. The
 * one outcome this component must never produce is a bare dead end.
 *
 * Lead plumbing is deliberately not new: the capture is the site's shared
 * InlineLeadForm posting source 'tenant-needs' to /api/leads, so it inherits
 * the honeypot, fill-time check, reCAPTCHA, page context, UTM forwarding,
 * lead_site='crecotx.com' and CRM typing that every other form on the site
 * already has. This surface only supplies words, a `surface` id and the
 * property type.
 */

import { useEffect } from 'react';
import Link from 'next/link';
import { Building2, Compass, Mail, Sparkles } from 'lucide-react';
import { InlineLeadForm } from '@/components/forms/InlineLeadForm';
import { PhoneCallText } from '@/components/marketing/PhoneCallText';
import { emptyStateCopy, offMarketLine } from '@/lib/property-type-copy';
import { PRIMARY_BROKER } from '@/lib/broker';
import { trackEvent, trackOnce } from '@/lib/analytics';

interface ListingsEmptyStateProps {
  /**
   * The active property-type filter ('all' or unset when none). Drives which
   * definition is shown; anything without a vetted entry falls back to generic.
   */
  propertyType?: string | null;
  /**
   * True when a filter other than property type is narrowing the results (a
   * search term, submarket, size, sale/lease). Used only to decide whether to
   * offer "clear the other filters" — the type copy is still the right copy for
   * someone who picked Flex AND a size band.
   */
  otherFiltersActive?: boolean;
  /** Total listings before filtering — powers the "browse all N" escape hatch. */
  totalCount?: number;
  onClearFilters?: () => void;
  /** Clears everything except the property type, for the combo case. */
  onClearOtherFilters?: () => void;
}

export function ListingsEmptyState({
  propertyType,
  otherFiltersActive = false,
  totalCount = 0,
  onClearFilters,
  onClearOtherFilters,
}: ListingsEmptyStateProps) {
  const copy = emptyStateCopy(propertyType);
  const typed = copy.kind === 'typed';
  const typeValue = copy.kind === 'typed' ? copy.value : null;

  // Stable per-type id so the CRM and GA can separate "went looking for flex and
  // found nothing" from the same dead end on retail.
  const surface = typed ? `listings-empty-${copy.value}` : 'listings-empty-generic';
  const propertyInterest = typed ? `${copy.label} — no public match` : undefined;

  const heading = typed
    ? `Let’s find your ${copy.spaceNoun}`
    : copy.heading;

  // A zero-result view is a conversion signal, not a non-event: it's the only
  // way to see which property types visitors want and we can't show. trackOnce
  // keyed on the surface so re-renders and the 700ms filter debounce upstream
  // can't inflate it, while switching Flex → Retail still reports both.
  useEffect(() => {
    trackOnce(`listings_empty:${surface}`, 'listings_empty_state_view', {
      surface,
      property_type: typeValue ?? undefined,
      copy_variant: typeValue ? 'typed' : 'generic',
    });
  }, [surface, typeValue]);

  return (
    <section aria-label="No matching listings" className="py-10 sm:py-14">
      {/* Mobile-first: one column, everything full-bleed within the container.
          From lg: up the explanation and the capture sit side by side so the
          form is visible without scrolling on a laptop. */}
      <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-5 lg:gap-10">
        <div className="lg:col-span-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-dark">
              <Building2 className="h-5 w-5" />
            </span>
            <h2 className="font-heading text-heading-sm font-bold text-primary sm:text-heading">
              {heading}
            </h2>
          </div>

          {/* What the type IS. The lead paragraph, sized up a little — this is
              the part that makes the page useful rather than empty. */}
          <p className="mt-5 text-body leading-relaxed text-primary">
            {copy.definition}
          </p>
          <p className="mt-3 text-body-sm leading-relaxed text-foreground-muted">
            {copy.whoItsFor}
          </p>

          {/* The reason to talk to a broker instead of refreshing the page. */}
          <div className="mt-6 flex gap-3 rounded-xl border border-gold/30 bg-gold-lighter/60 p-4 sm:p-5">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" aria-hidden="true" />
            <p className="text-body-sm leading-relaxed text-primary">
              {typed ? offMarketLine(copy.spaceNoun) : offMarketLine('commercial space')}
            </p>
          </div>

          {/* Call · Text · Email — the low-friction routes, before the form.
              On a phone these are one tap and the most likely conversion. */}
          <div className="mt-6 rounded-2xl bg-primary p-5 text-white sm:p-6">
            <p className="font-heading text-heading-sm font-bold leading-snug">
              {copy.ctaLine}
            </p>
            <p className="mt-2 text-body-sm text-white/70">
              No obligation, and no cost to tell us what you&rsquo;re after. A CRECO broker
              replies within one business day — sooner by phone.
            </p>
            <PhoneCallText variant="stacked" surface={surface} className="mt-4" />
            <a
              href={`mailto:${PRIMARY_BROKER.email}?subject=${encodeURIComponent(
                typed ? `${copy.label} space enquiry` : 'Commercial space enquiry',
              )}`}
              onClick={() => trackEvent('mailto_click', { surface })}
              className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-white/25 px-4 py-3 text-body-sm font-semibold text-white transition-colors hover:border-gold hover:text-gold-light"
            >
              <Mail className="h-4 w-4 shrink-0" />
              Email {PRIMARY_BROKER.email}
            </a>
          </div>
        </div>

        {/* Submit your needs — the shared tenant-needs capture, so this lead is
            typed and attributed exactly like one from /get-started. */}
        <div className="mt-8 lg:col-span-2 lg:mt-0">
          <InlineLeadForm
            eyebrow={typed ? `${copy.label} search` : 'Tell us what you need'}
            heading="Submit your needs"
            // Curly apostrophes as literal characters, not HTML entities —
            // these are string props, not JSX text, so an entity would render
            // as "we&rsquo;ll".
            body={
              typed
                ? `Size, submarket and timing is enough to start. We’ll come back with ${copy.spaceNoun} that fits — including options that aren’t posted here.`
                : 'Give us the shape of what you need and we’ll come back with options — including space that isn’t posted here.'
            }
            contextLabel={typed ? `What ${copy.spaceNoun} do you need?` : 'What are you looking for?'}
            contextPlaceholder={copy.contextPlaceholder}
            source="tenant-needs"
            surface={surface}
            propertyInterest={propertyInterest}
            submitLabel="Send me options"
          />
        </div>
      </div>

      {/* Filter escape hatches last, and quiet — useful, but not the pitch. */}
      <div className="mx-auto mt-8 flex max-w-5xl flex-col gap-2 border-t border-border pt-6 text-body-sm sm:flex-row sm:items-center sm:gap-5">
        <span className="inline-flex items-center gap-2 text-foreground-muted">
          <Compass className="h-4 w-4 shrink-0" aria-hidden="true" />
          Keep looking:
        </span>
        {otherFiltersActive && onClearOtherFilters && (
          <button
            type="button"
            onClick={onClearOtherFilters}
            className="text-left font-semibold text-gold-dark underline-offset-4 hover:underline"
          >
            {typed ? `Show all ${copy.label} listings` : 'Widen the other filters'}
          </button>
        )}
        {onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-left font-semibold text-gold-dark underline-offset-4 hover:underline"
          >
            {totalCount > 0 ? `Browse all ${totalCount} properties` : 'Clear all filters'}
          </button>
        )}
        <Link
          href="/property-alerts"
          className="text-left font-semibold text-gold-dark underline-offset-4 hover:underline"
        >
          Get alerts when something matches
        </Link>
      </div>
    </section>
  );
}
