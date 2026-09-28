'use client';

/**
 * Site-wide interaction tracking.
 *
 * Three signals that were invisible before, captured by delegation from the
 * document rather than by editing every button on the site:
 *
 *   lead_form_started  — first focus inside a form marked data-lead-form.
 *                        Fires once per form per page load, so the ratio
 *                        against *_submitted is a real abandonment rate.
 *   cta_clicked        — a click on a link to one of the money destinations.
 *                        Matched by href, so a new "Get started" button
 *                        anywhere is counted the day it ships.
 *   phone_call /      — tel: and mailto: anywhere on the site. A handful of
 *   mailto_click         components already fire these with their own
 *                        `surface`; those carry data-no-auto-track so they
 *                        are not counted twice.
 *
 * No PII: only the destination path, a surface name and the page path are
 * sent. Never a field value, a name or an address.
 */

import { useEffect } from 'react';
import { trackEvent, trackFormStart } from '@/lib/analytics';

/** Destination → CTA name. Keyed on pathname, so query strings don't matter. */
const CTA_DESTINATIONS: Record<string, string> = {
  '/get-started': 'get_started',
  '/list-your-space': 'list_your_space',
  '/property-valuation': 'request_valuation',
  '/what-is-my-commercial-property-worth': 'request_valuation',
  '/sell': 'sell_inquiry',
  '/contact': 'contact',
  '/property-alerts': 'property_alerts',
  '/listings': 'browse_listings',
  '/development-opportunities': 'development',
};

function pagePath(): string {
  try {
    return window.location.pathname || '/';
  } catch {
    return '/';
  }
}

export function InteractionTracking() {
  useEffect(() => {
    const onFocusIn = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t || typeof t.closest !== 'function') return;
      const form = t.closest<HTMLElement>('form[data-lead-form]');
      if (!form) return;
      // Ignore the honeypot — a bot filling it is not a person starting a form.
      if ((t as HTMLInputElement).name === 'website') return;
      trackFormStart(
        form.dataset.leadForm || 'unknown',
        form.dataset.surface || pagePath(),
        { page_path: pagePath() },
      );
    };

    const onClick = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t || typeof t.closest !== 'function') return;
      const a = t.closest<HTMLAnchorElement>('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';

      // Components that already track this click with their own surface.
      const selfTracked = !!a.closest('[data-no-auto-track]');

      if (href.startsWith('tel:')) {
        if (!selfTracked) trackEvent('phone_call', { surface: 'auto', page_path: pagePath() });
        return;
      }
      if (href.startsWith('mailto:')) {
        if (!selfTracked) trackEvent('mailto_click', { surface: 'auto', page_path: pagePath() });
        return;
      }
      if (href.startsWith('/')) {
        const path = href.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
        const cta = CTA_DESTINATIONS[path];
        if (cta) {
          trackEvent('cta_clicked', { cta, destination: path, page_path: pagePath() });
        }
      }
    };

    // Capture phase: these must register even when the element stops
    // propagation for its own reasons.
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('focusin', onFocusIn, true);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  return null;
}
