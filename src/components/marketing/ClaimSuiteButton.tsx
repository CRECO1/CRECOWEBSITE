'use client';

/**
 * ClaimSuiteButton — the gold hero CTA on /8979-dietz-elkhorn that opens
 * the inquiry form in a modal instead of scroll-jumping to the inline
 * form below the fold.
 *
 * Rationale: a popup catches the high-intent click immediately and keeps
 * the prospect on the hero — they don't lose context between deciding
 * "I want this" and starting the form. The inline form section further
 * down stays as-is for visitors who prefer to read first + scroll.
 *
 * UX details:
 *   - Click outside the modal card closes it.
 *   - Escape key closes it.
 *   - Body scroll is locked while the modal is open so the page behind
 *     doesn't drift while the form is being filled out.
 *   - The form is the same RetailLeasingInquiryForm component used in
 *     the inline section — same fields, same /api/leads endpoint, same
 *     attribution. Inside the modal the form's own success state takes
 *     over after submission ("Thanks — we'll be in touch within one
 *     business day."). The visitor can dismiss with Escape or by
 *     clicking outside.
 */

import { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { RetailLeasingInquiryForm } from '@/components/forms/RetailLeasingInquiryForm';

export function ClaimSuiteButton() {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the modal is open. Restore on unmount so the
  // page doesn't get stuck with a frozen scrollbar if the component is
  // ever conditionally rendered out.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Escape key closes the modal — standard accessibility expectation.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gold px-8 py-4 text-body-sm font-bold text-primary hover:bg-gold-light shadow-lg"
      >
        Claim Your Suite — Inquire Now <ArrowRight className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-suite-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl my-4 sm:my-0 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button — absolute, top-right, large hit area for thumbs */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 z-10 inline-flex items-center justify-center h-10 w-10 rounded-full text-foreground-muted hover:bg-background-cream hover:text-primary transition-colors"
              aria-label="Close inquiry form"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="px-5 sm:px-8 pt-8 pb-6 sm:pb-8 max-h-[90vh] overflow-y-auto">
              <div className="mb-6 text-center max-w-md mx-auto">
                <p className="overline mb-2 text-gold">Pre-lease your suite</p>
                <h2 id="claim-suite-title" className="font-heading text-heading-lg sm:text-heading-xl font-bold text-primary mb-2 leading-tight">
                  Tell us about your concept.
                </h2>
                <p className="text-body-sm text-foreground-muted leading-relaxed">
                  A CRECO broker will follow up within one business day. Established
                  operators get first pick of end caps and food-ready bays.
                </p>
              </div>

              <RetailLeasingInquiryForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
