'use client';

/**
 * Honeypot field + form-render timestamp — invisible to humans, telling on bots.
 *
 * Many spam-bot frameworks blindly fill every text input on a form. By adding
 * a hidden field that no real user can see or tab to, we get a 95%+ accurate
 * spam signal at zero UX cost. Pairs with reCAPTCHA: reCAPTCHA catches
 * sophisticated bots via behavioral scoring; honeypot catches the dumber 80%
 * cheaply, and works even when reCAPTCHA isn't configured.
 *
 * It also stamps when the form rendered. A human reads, types and clicks —
 * seconds pass. A bot posts the instant it parses the DOM. The server rejects
 * anything that arrives implausibly fast (see lib/form-timing), which costs a
 * real visitor nothing and catches scripted submissions the honeypot misses
 * because they only fill fields they recognise.
 *
 * Usage:
 *   <Honeypot name="website" />        // in your form JSX
 *   const honeypot = formData.get('website');
 *   if (honeypot) reject as spam;      // server-side check
 *   formData.get('form_rendered_at')   // ms epoch, checked server-side
 */

import { useRef } from 'react';

interface Props {
  /** Field name. Use something innocuous-sounding that bots will fill. */
  name?: string;
}

export function Honeypot({ name = 'website' }: Props) {
  // Stamped once when the field mounts, not on every render, so a re-render
  // (typing in a controlled input) cannot reset the clock and make a slow,
  // genuine fill look instant.
  const renderedAt = useRef(Date.now());
  return (
    <div
      aria-hidden="true"
      // sr-only clip pattern — zero layout footprint, no off-screen positioning.
      // left:-9999px isn't reliably clipped by body{overflow-x:hidden} on iOS
      // Safari, which makes pages pannable / "not scaling" on iPhones. This stays
      // in the DOM so bots still fill it.
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      <label htmlFor={`hp-${name}`}>
        {/* Real screen-reader users would never tab here because of aria-hidden */}
        Don&apos;t fill this in if you&apos;re human:
      </label>
      <input
        type="text"
        id={`hp-${name}`}
        name={name}
        tabIndex={-1}
        autoComplete="off"
      />
      <input type="hidden" name="form_rendered_at" value={String(renderedAt.current)} readOnly />
    </div>
  );
}
