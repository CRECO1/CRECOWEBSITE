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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
          onClick={() => setOpen(false)}
        >
          {/* Modal card — pinned to fit within viewport. flex-col so the
              sticky header sits above the scrollable form body. Using
              100dvh (when supported) to handle mobile browser chrome
              correctly; calc(100vh - 1.5rem) is the desktop safe fallback. */}
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(calc(100dvh - 1.5rem), calc(100vh - 1.5rem))' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Sticky-ish header — outside the scrolling form so the close
                button + title stay visible while the prospect fills out
                the form */}
            <div className="flex-shrink-0 px-5 sm:px-8 pt-6 pb-4 border-b border-border/60 relative">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-full text-foreground-muted hover:bg-background-cream hover:text-primary transition-colors"
                aria-label="Close inquiry form"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="text-center max-w-md mx-auto pr-8">
                <h2 id="claim-suite-title" className="font-heading text-heading-md sm:text-heading-lg font-bold text-primary mb-1 leading-tight">
                  Tell us about your concept.
                </h2>
                <p className="text-caption text-foreground-muted leading-relaxed">
                  CRECO broker follows up within one business day.
                </p>
              </div>
            </div>

            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6">
              <RetailLeasingInquiryForm />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
