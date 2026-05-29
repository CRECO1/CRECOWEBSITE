'use client';

/**
 * Save-search → property alerts in one click.
 *
 * Sits on /listings as a floating "Save this search" button (shown when
 * any filter is active). Clicking opens this modal: one email field, a
 * preview of the active filters, and a Save button. POSTs to /api/subscribe
 * with subscription_type='property-alerts' so the entry lands in the same
 * subscribers table as the full /property-alerts form — same downstream
 * notification path, no schema fork.
 *
 * Why this exists:
 *   The full /property-alerts form is a 7-field commitment. A visitor who
 *   has already filtered to "warehouse, under 15k SF, in Northeast San
 *   Antonio" has expressed their preferences through the URL. This modal
 *   converts those preferences directly without re-asking for them. Single
 *   email field = 3-5x conversion vs. the full form.
 */

import { useState, useEffect } from 'react';
import { X, BellRing, CheckCircle2, ArrowRight } from 'lucide-react';
import { getRecaptchaToken } from '@/components/forms/Recaptcha';
import { trackEvent, readUtmsFromCookie } from '@/lib/analytics';
import { propertyTypeLabel, transactionLabel } from '@/lib/utils';

interface SaveSearchFilters {
  search: string;
  propertyType: string;
  transactionType: string;
  sizeLabel: string;
  /** Min/max in SF; null = unbounded. Sent to the API so the subscriber
   *  record carries the same filter shape as /property-alerts. */
  sizeMin: number | null;
  sizeMax: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  filters: SaveSearchFilters;
}

export function SaveSearchModal({ open, onClose, filters }: Props) {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape closes. Gated on !submitting so a mid-write keypress doesn't
  // tear down state while the subscribe POST is in flight.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !submitting) onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, submitting, onClose]);

  // Reset state when the modal re-opens (otherwise a previous success
  // banner persists on a second click).
  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError('Enter a valid email.');
      return;
    }
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken('save_search');
      const attribution = readUtmsFromCookie();
      // Filter payload matches what /property-alerts sends so downstream
      // matching logic stays unified. propertyType='all' means "any" and
      // becomes an empty array (no constraint).
      const filterPayload = {
        property_types: filters.propertyType !== 'all' ? [filters.propertyType] : [],
        transaction_type: filters.transactionType !== 'all' ? filters.transactionType : 'both',
        submarkets: [] as string[],
        size_min: filters.sizeMin,
        size_max: filters.sizeMax,
        search_terms: filters.search || null,
      };
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: '—',
          subscription_type: 'property-alerts',
          source: 'save-search',
          filters: filterPayload,
          recaptchaToken,
          ...attribution,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not save search');
      }
      setSubmitted(true);
      trackEvent('save_search_submitted', {
        property_type: filters.propertyType,
        transaction_type: filters.transactionType,
        size_label: filters.sizeLabel,
        has_search_text: !!filters.search,
        attribution_source: attribution.utm_source ?? 'direct',
      });
    } catch (err) {
      setError((err as Error).message);
      trackEvent('save_search_failed', { reason: (err as Error).message?.slice(0, 80) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/55 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-search-title"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="relative w-full max-w-md my-8 rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold">
              <BellRing className="h-4 w-4" />
            </span>
            <div>
              <h2 id="save-search-title" className="font-heading text-body font-bold text-primary">
                Save this search
              </h2>
              <p className="text-caption text-foreground-muted">
                Get alerts when matching properties hit our inventory
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:text-primary hover:bg-background-cream/60 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {submitted ? (
          <div className="p-7 sm:p-8 text-center">
            <div className="mx-auto h-12 w-12 inline-flex items-center justify-center rounded-full bg-green-100 text-green-700 mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="font-heading text-heading-sm font-bold text-primary mb-2">
              Search saved.
            </h3>
            <p className="text-body-sm text-foreground-muted">
              We&apos;ll email you the moment a Texas commercial property matching these filters hits the CRECO listings — usually within a week of being signed by an owner.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 text-caption font-semibold text-gold-dark hover:text-gold"
            >
              Keep browsing →
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Filter chip preview — so the visitor can confirm exactly what
                they're saving and trust the system isn't subscribing them
                to everything. */}
            <div>
              <p className="text-caption uppercase tracking-widest text-foreground-muted mb-2">Saving these filters</p>
              <div className="flex flex-wrap gap-1.5">
                {filters.propertyType !== 'all' && (
                  <span className="rounded-full bg-gold/15 text-gold-dark px-2.5 py-1 text-caption font-semibold">
                    {propertyTypeLabel(filters.propertyType)}
                  </span>
                )}
                {filters.transactionType !== 'all' && (
                  <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1 text-caption font-semibold">
                    {transactionLabel(filters.transactionType)}
                  </span>
                )}
                {filters.sizeLabel && filters.sizeLabel !== 'Any Size' && (
                  <span className="rounded-full bg-blue-50 text-blue-800 px-2.5 py-1 text-caption font-semibold">
                    {filters.sizeLabel}
                  </span>
                )}
                {filters.search && (
                  <span className="rounded-full bg-background-cream text-foreground px-2.5 py-1 text-caption font-semibold">
                    Search: &ldquo;{filters.search.slice(0, 24)}{filters.search.length > 24 ? '…' : ''}&rdquo;
                  </span>
                )}
                {filters.propertyType === 'all' && filters.transactionType === 'all' && !filters.search && (filters.sizeLabel === 'Any Size' || !filters.sizeLabel) && (
                  <span className="text-caption text-foreground-muted italic">
                    All Texas commercial listings
                  </span>
                )}
              </div>
            </div>

            <label className="block">
              <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1">Your email</span>
              <input
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoFocus
                className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary placeholder:text-foreground-muted focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              />
              {error && <p className="mt-2 text-caption text-destructive">{error}</p>}
            </label>

            <p className="text-caption text-foreground-muted">
              One email per matching property, max. Unsubscribe anytime. <a href="/property-alerts" className="font-semibold text-gold-dark hover:underline">Want more filter granularity →</a>
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-4 py-2 text-body-sm text-foreground-muted hover:text-primary disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? 'Saving…' : <>Save & alert me <ArrowRight className="h-3.5 w-3.5" /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
