'use client';

/**
 * PhoneCallText — inline display of a phone number with adjacent
 * "Call" and "Text" affordances.
 *
 * Why this exists:
 *   Every phone surface on the site was a `tel:` link only — visitors
 *   with a preference for texting (younger tenants, busy owners in
 *   meetings, non-first-language callers) had no idea texting was
 *   an option. Even though most modern SMS-capable phones handle
 *   `sms:` links natively, the visible "Text" affordance is the trust
 *   signal — "you can text us" reads much more approachable than
 *   forcing a phone call.
 *
 * Design:
 *   - `inline` variant: renders in-line inside body copy — icon +
 *     number + small "Call · Text" separator, all in one row. Used
 *     in the header, footer, and body copy where an anchor with a
 *     phone icon lives today.
 *   - `stacked` variant: renders two side-by-side pill buttons (Call
 *     + Text) below the number. Used inside BrokerCard, MobileStickyCTA,
 *     and anywhere the phone is offered as a primary action rather
 *     than a passive reference.
 *
 * SMS href format: plain `sms:+1XXXXXXXXXX`. Both iOS and Android
 * accept this — iOS opens Messages with the To field pre-filled,
 * Android opens the default SMS app. No pre-filled body because
 * pre-filling can feel presumptuous and pre-fill support is uneven
 * across Android SMS apps.
 */

import { Phone, MessageSquare } from 'lucide-react';
import { PRIMARY_BROKER } from '@/lib/broker';

interface PhoneCallTextProps {
  /**
   * Layout variant.
   *   `inline` — icon + number + Call · Text label in one row (nav/footer)
   *   `stacked` — number on top, Call + Text buttons below (CTAs)
   */
  variant?: 'inline' | 'stacked';
  /** Optional tone override for the inline variant (dark bg vs light) */
  tone?: 'light' | 'dark';
  /** GA attribution surface, forwarded to trackEvent on click */
  surface?: string;
  className?: string;
}

/**
 * Fires an analytics event when a phone or SMS action is tapped.
 * Non-blocking — never awaited, never throws.
 */
function fireClickEvent(action: 'phone_call' | 'sms_click', surface: string) {
  if (typeof window === 'undefined') return;
  try {
    const gtag = (window as any).gtag;
    if (typeof gtag === 'function') {
      gtag('event', action, { surface });
    }
    const dl = (window as any).dataLayer;
    if (Array.isArray(dl)) {
      dl.push({ event: action, surface });
    }
  } catch {
    // analytics must never break UI
  }
}

export function PhoneCallText({
  variant = 'inline',
  tone = 'light',
  surface = 'unknown',
  className = '',
}: PhoneCallTextProps = {}) {
  if (variant === 'stacked') {
    // Two side-by-side outlined buttons, equal weight. Deliberately quiet:
    // these sit beside forms and the gold-filled Text button used to compete
    // with the page's real primary CTA. Both min 44px tall for tap targets.
    const quiet = 'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-primary/25 bg-white px-4 py-3 text-body-sm font-semibold text-primary hover:border-gold hover:text-gold-dark transition-colors';
    return (
      <div className={`grid grid-cols-2 gap-2 ${className}`} data-no-auto-track>
        <a
          href={PRIMARY_BROKER.phone_href}
          onClick={() => fireClickEvent('phone_call', surface)}
          className={quiet}
        >
          <Phone className="h-4 w-4 shrink-0" />
          Call
        </a>
        <a
          href={PRIMARY_BROKER.sms_href}
          onClick={() => fireClickEvent('sms_click', surface)}
          className={quiet}
        >
          <MessageSquare className="h-4 w-4 shrink-0" />
          Text
        </a>
      </div>
    );
  }

  // Inline variant — icon + number as the primary tel: link, then
  // small · Text link after so tap targets stay distinct.
  const numberClass = tone === 'dark' ? 'text-white hover:text-gold-light' : 'text-primary hover:text-gold';
  const smsClass = tone === 'dark' ? 'text-gold hover:text-gold-light' : 'text-gold-dark hover:text-gold';
  const sepClass = tone === 'dark' ? 'text-white/40' : 'text-foreground-muted';

  return (
    <span className={`inline-flex items-center gap-2 flex-wrap ${className}`} data-no-auto-track>
      <a
        href={PRIMARY_BROKER.phone_href}
        onClick={() => fireClickEvent('phone_call', surface)}
        // Call and Text are the two most-tapped links on a phone; keep them
        // at the 44px guideline there and exactly as they were from md: up.
        className={`inline-flex min-h-[44px] items-center gap-2 font-semibold transition-colors md:min-h-0 ${numberClass}`}
        aria-label={`Call CRECO at ${PRIMARY_BROKER.phone_display}`}
      >
        <Phone className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{PRIMARY_BROKER.phone_display}</span>
      </a>
      <span className={`text-caption ${sepClass}`}>·</span>
      <a
        href={PRIMARY_BROKER.sms_href}
        onClick={() => fireClickEvent('sms_click', surface)}
        className={`inline-flex min-h-[44px] items-center gap-1 text-body-sm font-semibold transition-colors md:min-h-0 ${smsClass}`}
        aria-label={`Text CRECO at ${PRIMARY_BROKER.phone_display}`}
      >
        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
        Text
      </a>
    </span>
  );
}
