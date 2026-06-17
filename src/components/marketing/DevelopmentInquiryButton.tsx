'use client';

/**
 * DevelopmentInquiryButton — the popup-modal CTA used on
 * /8000-fair-oaks-pkwy in place of the in-page "#inquiry" anchor jumps.
 *
 * The 8979 Dietz Elkhorn page already uses this pattern via
 * ClaimSuiteButton (a single dedicated component). 8000 Fair Oaks Pkwy
 * has TWO action CTAs (one for retail bays, one for executive office
 * suites) that should each open the same inquiry form preselected to
 * the right inquiry track — so this is a small generalization of
 * ClaimSuiteButton that:
 *
 *   - Takes a `label` + `icon` + `variant` so the two buttons can keep
 *     their distinct visual treatment (gold retail bay CTA vs. primary
 *     executive suite CTA).
 *   - Takes a modal `title` so each popup names the right track.
 *   - Takes an `initialInterest` that's forwarded to the form so the
 *     visitor doesn't have to re-pick the radio they already implied
 *     by clicking the button.
 *
 * UX details mirror ClaimSuiteButton: click outside closes, Escape
 * closes, body scroll locks while open, sticky header inside the modal
 * keeps the title + close-X visible while the form scrolls.
 */

import { useEffect, useState } from 'react';
import { ArrowRight, X, type LucideIcon } from 'lucide-react';
import { DevelopmentInterestForm } from '@/components/forms/DevelopmentInterestForm';

type Variant = 'gold' | 'primary';

interface DevelopmentInquiryButtonProps {
  label: string;
  icon?: LucideIcon;
  variant?: Variant;
  modalTitle: string;
  modalEyebrow?: string;
  initialInterest: 'retail' | 'suite' | 'either';
}

export function DevelopmentInquiryButton({
  label,
  icon: Icon,
  variant = 'primary',
  modalTitle,
  modalEyebrow,
  initialInterest,
}: DevelopmentInquiryButtonProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the modal is open. Restore on unmount so the
  // page doesn't get stuck with a frozen scrollbar if this button is
  // ever conditionally rendered out mid-session.
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

  const buttonClasses = variant === 'gold'
    ? 'bg-gold text-primary hover:bg-gold-light'
    : 'bg-primary text-white hover:bg-primary/90';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center gap-2 rounded-lg px-5 py-3 sm:px-6 sm:py-3 text-body-sm font-semibold shadow-sm text-balance ${buttonClasses}`}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}
        {label}
        <ArrowRight className="h-4 w-4 shrink-0" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dev-inquiry-title"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center px-3 sm:px-4 pt-20 sm:pt-24 pb-4"
          onClick={() => setOpen(false)}
        >
          {/* Modal card — same layout pattern as ClaimSuiteButton:
              sticky header (title + close), scrolling form body. The
              dynamic vh formula avoids mobile-browser-chrome edge cases
              where 100vh underflows the actual visible area. */}
          <div
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(calc(100dvh - 7rem), calc(100vh - 7rem))' }}
            onClick={e => e.stopPropagation()}
          >
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
                <h2
                  id="dev-inquiry-title"
                  className="font-heading text-heading-sm sm:text-heading-lg font-bold text-primary mb-1 leading-tight"
                >
                  {modalTitle}
                </h2>
                {modalEyebrow && (
                  <p className="text-caption text-gold font-bold uppercase tracking-widest leading-relaxed">
                    {modalEyebrow}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-5 sm:py-6">
              <DevelopmentInterestForm initialInterest={initialInterest} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
