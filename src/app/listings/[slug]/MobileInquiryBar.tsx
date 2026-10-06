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
 *
 * Text sits beside Call: on a phone, a text is the lowest-effort way to ask
 * "is this still available?", and the global sticky bar (which had Text) is
 * hidden on listing pages so the two bars don't stack.
 */

import { CalendarClock, MessageSquare, Phone } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export function MobileInquiryBar({ phone = '(210) 817-3443' }: { phone?: string }) {
  const digits = phone.replace(/\D/g, '');
  const telHref = `tel:+1${digits}`;
  const smsHref = `sms:+1${digits}`;
  const iconBtn = 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-white text-primary transition-colors hover:border-gold hover:text-gold';

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden" data-no-auto-track>
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
        <a
          href={telHref}
          aria-label={`Call CRECO at ${phone}`}
          onClick={() => trackEvent('phone_call', { surface: 'listing_mobile_bar' })}
          className={iconBtn}
        >
          <Phone className="h-5 w-5" />
        </a>
        <a
          href={smsHref}
          aria-label={`Text CRECO at ${phone}`}
          onClick={() => trackEvent('sms_click', { surface: 'listing_mobile_bar' })}
          className={iconBtn}
        >
          <MessageSquare className="h-5 w-5" />
        </a>
        <a
          href="#inquiry"
          onClick={(e) => {
            e.preventDefault();
            // The tour form, not the whole sidebar: #inquiry opens with the
            // brochure email box, which isn't what "Schedule a Tour" promises.
            const el = document.getElementById('inquiry-tour') ?? document.getElementById('inquiry');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              // Drop focus into the first field a person can actually see.
              // A bare 'input' selector used to land on the honeypot
              // (<Honeypot>'s hidden "website" field, tabIndex -1): anyone who
              // then started typing filled the spam trap, and the server
              // silently discarded their tour request as a bot.
              setTimeout(() => {
                const first = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                  'input:not([type="hidden"]):not([tabindex="-1"]), textarea:not([tabindex="-1"])',
                );
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
