'use client';

/**
 * Fixed bottom action bar shown only on mobile (< lg). The sidebar inquiry
 * panel becomes inline-below-content on small viewports, so visitors deep
 * into the spec/feature scroll have nothing to convert against. This bar
 * keeps "Schedule a tour" + "Call" one tap away no matter where they are
 * on the page.
 *
 * The button scrolls to #inquiry — the listing detail page anchors the
 * inquiry panel with that ID.
 */

import { CalendarClock, Phone } from 'lucide-react';

export function MobileInquiryBar({ phone = '(210) 817-3443' }: { phone?: string }) {
  const telHref = `tel:+1${phone.replace(/\D/g, '')}`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
        <a
          href={telHref}
          aria-label={`Call CRECO at ${phone}`}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-primary transition-colors hover:border-gold hover:text-gold"
        >
          <Phone className="h-5 w-5" />
        </a>
        <a
          href="#inquiry"
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById('inquiry');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              // Drop focus into the first input for keyboard / a11y once the
              // scroll lands.
              setTimeout(() => {
                const first = el.querySelector<HTMLInputElement | HTMLTextAreaElement>('input, textarea');
                first?.focus({ preventScroll: true });
              }, 350);
            }
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-body-sm font-semibold text-white hover:bg-primary/90"
        >
          <CalendarClock className="h-5 w-5" />
          Schedule a Tour
        </a>
      </div>
    </div>
  );
}
