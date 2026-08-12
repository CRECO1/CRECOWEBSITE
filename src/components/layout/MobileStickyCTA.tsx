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

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Phone, Building2, MessageSquare } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

// Note the trailing slash on '/listings/' — it hides this global bar on listing
// DETAIL pages (which have their own MobileInquiryBar "Schedule a Tour" bar, so
// the two would otherwise stack and occlude each other) while keeping it on the
// '/listings' index, which has no bar of its own.
const HIDDEN_PREFIXES = ['/admin', '/manage', '/crm', '/tenant-needs', '/get-started', '/sell', '/contact', '/listings/'];

export function MobileStickyCTA({ phone = '(210) 817-3443' }: { phone?: string }) {
  const pathname = usePathname() ?? '/';
  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null;

  const telHref = `tel:+1${phone.replace(/\D/g, '')}`;

  return (
    <>
      {/* Spacer so the fixed bar doesn't cover the bottom of page content */}
      <div className="h-16 md:hidden" aria-hidden="true" />
      {/* Three-button strip on mobile — Call | Text | Get Started. The
          Text option was missing before, meaning texters had no thumb-
          distance CTA. Grid-cols-3 splits the space evenly; each cell
          maintains the ~44px tap target via py-3. */}
      <div
        role="region"
        aria-label="Quick contact actions"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-2 border-t border-border bg-white p-3 shadow-2xl md:hidden"
      >
        <a
          href={telHref}
          onClick={() => trackEvent('phone_click', { surface: 'mobile_sticky_cta' })}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-2 py-3 text-sm font-semibold text-white active:bg-primary/90"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call
        </a>
        <a
          href={`sms:+1${phone.replace(/\D/g, '')}`}
          onClick={() => trackEvent('sms_click', { surface: 'mobile_sticky_cta' })}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-2 py-3 text-sm font-semibold text-primary active:bg-primary/20"
        >
          <MessageSquare className="h-4 w-4" aria-hidden="true" />
          Text
        </a>
        <Link
          href="/get-started"
          className="flex items-center justify-center gap-2 rounded-lg bg-gold px-2 py-3 text-sm font-semibold text-primary active:bg-gold-dark"
        >
          <Building2 className="h-4 w-4" aria-hidden="true" />
          Start
        </Link>
      </div>
    </>
  );
}
