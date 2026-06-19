'use client';

/**
 * StickyPropertyCTABar — a presentation shell that pins its children
 * to the bottom of the viewport once a visitor scrolls past the hero,
 * then fades out near the inline inquiry section so it doesn't compete
 * with the real form when they're already there.
 *
 * Wrapping children keeps the actual CTA logic in the existing
 * ClaimSuiteButton / DevelopmentInquiryButton components — same
 * modal, same form, same /api/leads endpoint. The sticky bar adds
 * surface attribution to GA via a `data-sticky-cta` attribute so the
 * downstream `inquiry_modal_opened` event can be cross-referenced
 * with `sticky_cta_clicked` (fired from this wrapper) to attribute
 * conversions to the sticky surface vs. the hero.
 *
 * Mobile UX: the pill stretches to full width inside the safe area
 * for a tap-friendly target. Desktop: right-aligned so it doesn't
 * obstruct content. Hidden until scrolled past `appearAfter` (default
 * 600px, roughly past a desktop hero) and re-hidden when the inline
 * inquiry section enters the viewport.
 */

import { ReactNode, useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface StickyPropertyCTABarProps {
  /** Attribution for GA, e.g. "8000-fair-oaks-pkwy". */
  property: string;
  children: ReactNode;
  /** Selector to detect "we're already at the form" — defaults to "#inquiry". */
  hideWhenVisible?: string;
  /** Scroll distance (px) before the bar appears. */
  appearAfter?: number;
}

export function StickyPropertyCTABar({
  property,
  children,
  hideWhenVisible = '#inquiry',
  appearAfter = 600,
}: StickyPropertyCTABarProps) {
  const [scrolledPast, setScrolledPast] = useState(false);
  const [inquiryVisible, setInquiryVisible] = useState(false);

  // Scroll gate — bar only appears after the user has read past the
  // hero. requestAnimationFrame throttled so we don't thrash layout.
  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        setScrolledPast(window.scrollY > appearAfter);
        rafId = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [appearAfter]);

  // Inline-inquiry visibility — hide bar when the real form is on screen.
  useEffect(() => {
    const target = document.querySelector(hideWhenVisible);
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInquiryVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hideWhenVisible]);

  const shouldShow = scrolledPast && !inquiryVisible;

  return (
    <div
      role="region"
      aria-label="Quick inquiry"
      onClickCapture={() => {
        // Captures any click inside the sticky wrapper so we measure
        // surface-attribution before the underlying button's own
        // inquiry_modal_opened event fires. Two events per tap is fine
        // — they answer different questions.
        if (shouldShow) trackEvent('sticky_cta_clicked', { property });
      }}
      className={`fixed inset-x-0 bottom-0 z-40 pb-3 px-3 sm:px-4 sm:pb-4 transition-all duration-300 pointer-events-none ${
        shouldShow ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <div className="max-w-7xl mx-auto flex sm:justify-end pointer-events-auto">
        <div className="w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto [&_button]:shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
