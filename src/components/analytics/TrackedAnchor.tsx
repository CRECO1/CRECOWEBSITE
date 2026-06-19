'use client';

/**
 * TrackedAnchor — drop-in replacement for <a> that fires a GA4
 * trackEvent on click. Used wherever a click is an interesting
 * conversion signal but the surrounding page is a server component
 * and can't directly attach onClick.
 *
 * Example:
 *   <TrackedAnchor
 *     href="/flyer.pdf"
 *     event="flyer_downloaded"
 *     params={{ property: '8000-fair-oaks-pkwy' }}
 *     target="_blank"
 *   >Download flyer</TrackedAnchor>
 *
 * The fire-then-navigate order is fine for GA4 — the network beacon is
 * sent before the navigation completes because GA4 uses
 * `navigator.sendBeacon` under the hood for events. No need to
 * preventDefault + delay.
 */

import { AnchorHTMLAttributes, ReactNode } from 'react';
import { trackEvent } from '@/lib/analytics';

interface TrackedAnchorProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick'> {
  event: string;
  params?: Record<string, unknown>;
  children: ReactNode;
}

export function TrackedAnchor({ event, params, children, ...rest }: TrackedAnchorProps) {
  return (
    <a
      {...rest}
      onClick={() => trackEvent(event, params)}
    >
      {children}
    </a>
  );
}
