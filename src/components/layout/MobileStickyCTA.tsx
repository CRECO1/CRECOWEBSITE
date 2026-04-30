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
import { Phone, Building2 } from 'lucide-react';

const HIDDEN_PREFIXES = ['/admin', '/manage', '/crm', '/tenant-needs', '/sell', '/contact'];

export function MobileStickyCTA({ phone = '(210) 817-3443' }: { phone?: string }) {
  const pathname = usePathname() ?? '/';
  if (HIDDEN_PREFIXES.some(p => pathname.startsWith(p))) return null;

  const telHref = `tel:+1${phone.replace(/\D/g, '')}`;

  return (
    <>
      {/* Spacer so the fixed bar doesn't cover the bottom of page content */}
      <div className="h-16 md:hidden" aria-hidden="true" />
      <div
        role="region"
        aria-label="Quick contact actions"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-border bg-white p-3 shadow-2xl md:hidden"
      >
        <a
          href={telHref}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-sm font-semibold text-white active:bg-primary/90"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call
        </a>
        <Link
          href="/tenant-needs"
          className="flex items-center justify-center gap-2 rounded-lg bg-gold px-3 py-3 text-sm font-semibold text-primary active:bg-gold-dark"
        >
          <Building2 className="h-4 w-4" aria-hidden="true" />
          Find Space
        </Link>
      </div>
    </>
  );
}
