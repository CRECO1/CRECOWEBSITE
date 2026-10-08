'use client';

/**
 * Fixed bottom CTA bar shown only on small screens (<768px) on marketing pages.
 *
 * Real-estate sites consistently see major mobile-conversion lifts from a
 * persistent "Call" + "Inquire" pair at the bottom of the screen — visitors
 * don't have to scroll to reach a CTA, and the click-to-call drives the
 * highest-value leads.
 *
 * Hidden on /admin, /manage, /crm and CTA forms themselves to avoid duplicating
 * intent or covering the form submit button.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Building2, MessageSquare } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

// Note the trailing slash on '/listings/' — it hides this global bar on listing
// DETAIL pages (which have their own MobileInquiryBar "Schedule a Tour" bar, so
// the two would otherwise stack and occlude each other) while keeping it on the
// '/listings' index, which has no bar of its own.
//
// The two property landing pages carry their own StickyPropertyCTABar, pinned
// to the same bottom edge — with this bar too, the two overlapped on phones.
// The header's phone icon keeps a one-tap call on those pages.
const HIDDEN_PREFIXES = ['/admin', '/manage', '/crm', '/tenant-needs', '/get-started', '/sell', '/contact', '/listings/', '/8000-fair-oaks-pkwy', '/8923-dietz-elkhorn', '/r/'];

// The page's own main form, if it has one. Alerts/newsletter don't count —
// they're the soft ask, not the page's conversion form.
const PAGE_FORM_SELECTOR = 'form[data-lead-form]:not([data-lead-form="property_alerts"])';

/** First visible, fillable field — never the honeypot (tabIndex -1). */
const FIRST_FIELD = 'input:not([type="hidden"]):not([tabindex="-1"]), textarea:not([tabindex="-1"]), select:not([tabindex="-1"])';

export function MobileStickyCTA({ phone = '(210) 817-3443' }: { phone?: string }) {
  const pathname = usePathname() ?? '/';
  // Page-aware third button: on a page with its own form it jumps there
  // ("Inquire") instead of sending the visitor away to the generic
  // /get-started quiz. Detected after mount, per route.
  const [hasPageForm, setHasPageForm] = useState(false);
  useEffect(() => {
    setHasPageForm(!!document.querySelector(PAGE_FORM_SELECTOR));
  }, [pathname]);

  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null;

  const goToPageForm = (e: React.MouseEvent) => {
    const form = document.querySelector<HTMLFormElement>(PAGE_FORM_SELECTOR);
    if (!form) return; // fall through to the href
    e.preventDefault();
    trackEvent('cta_clicked', { cta: 'on_page_form', destination: 'mobile_sticky_cta', page_path: pathname });
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => form.querySelector<HTMLElement>(FIRST_FIELD)?.focus({ preventScroll: true }), 350);
  };

  const telHref = `tel:+1${phone.replace(/\D/g, '')}`;

  return (
    <>
      {/* Spacer so the fixed bar doesn't cover the bottom of page content */}
      <div className="h-16 md:hidden" aria-hidden="true" />
      {/* Three-button strip on mobile — Call | Text | Inquire/Start. The
          Text option was missing before, meaning texters had no thumb-
          distance CTA. Grid-cols-3 splits the space evenly; each cell
          maintains the ~44px tap target via py-3. */}
      <div
        role="region"
        aria-label="Quick contact actions"
        data-track-section="sticky_bar"
        // The tel/sms anchors below fire their own phone_call/sms_click with a
        // real surface; without this the global capture handler would fire a
        // second phone_call (surface:'auto') for the same tap.
        data-no-auto-track
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t border-border bg-white p-3 shadow-2xl md:hidden"
      >
        <a
          href={telHref}
          onClick={() => trackEvent('phone_call', { surface: 'mobile_sticky_cta' })}
          className="flex items-center justify-center gap-2 rounded-lg border border-primary/25 bg-white px-2 py-3 text-sm font-semibold text-primary active:bg-primary/5"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call
        </a>
        <a
          href={`sms:+1${phone.replace(/\D/g, '')}`}
          onClick={() => trackEvent('sms_click', { surface: 'mobile_sticky_cta' })}
          className="flex items-center justify-center gap-2 rounded-lg border border-primary/25 bg-white px-2 py-3 text-sm font-semibold text-primary active:bg-primary/5"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Text
        </a>
        {/* Call and Text are the quiet pair; this is the bar's one filled
            button. */}
        <Link
          href="/get-started"
          onClick={hasPageForm ? goToPageForm : undefined}
          className="flex items-center justify-center gap-2 rounded-lg bg-gold px-2 py-3 text-sm font-semibold text-primary active:bg-gold-dark"
        >
          <Building2 className="h-4 w-4" aria-hidden="true" />
          {hasPageForm ? 'Inquire' : 'Start'}
        </Link>
      </div>
    </>
  );
}
