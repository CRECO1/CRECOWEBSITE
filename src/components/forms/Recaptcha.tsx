'use client';

/**
 * reCAPTCHA v3 client-side helper.
 *
 * The script is 346KB of third-party JavaScript — on its own, half the JS the
 * homepage loads. It used to be mounted in the root layout with
 * strategy="afterInteractive", so every visitor on every page paid for it
 * whether or not they ever touched a form. Most never do.
 *
 * So it now loads on the first sign that a form is about to be used: a focus
 * or a pointer press anywhere inside a form. That is well before anyone can
 * finish typing a name, let alone submit. And `getRecaptchaToken` awaits the
 * loader itself, so a submit that somehow beats the listeners still gets a
 * real token rather than skipping verification.
 *
 * Callers are unchanged: mount <RecaptchaScript /> once, then await
 * getRecaptchaToken(action) before posting.
 */

import { useEffect } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/**
 * How long a submit will wait for Google before giving up and posting without
 * a token. The server treats a missing token the same as it always has; the
 * timing, honeypot and email-quality checks still apply. A visitor behind a
 * firewall that blocks Google must not lose their enquiry to a hanging script.
 */
const LOAD_TIMEOUT_MS = 6000;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

let loader: Promise<boolean> | null = null;

/** Injects the script at most once per page; resolves false if it can't load. */
function ensureRecaptcha(): Promise<boolean> {
  if (!SITE_KEY || typeof window === 'undefined') return Promise.resolve(false);
  if (window.grecaptcha) return Promise.resolve(true);
  if (loader) return loader;

  loader = new Promise<boolean>(resolve => {
    const done = (ok: boolean) => resolve(ok);
    const timer = setTimeout(() => done(false), LOAD_TIMEOUT_MS);

    const el = document.createElement('script');
    el.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    el.async = true;
    el.onload = () => { clearTimeout(timer); done(true); };
    el.onerror = () => { clearTimeout(timer); done(false); };
    document.head.appendChild(el);
  });
  return loader;
}

/**
 * Mount once at the root layout. Renders nothing — it only listens for the
 * first interaction with a form and warms the script from there.
 */
export function RecaptchaScript() {
  useEffect(() => {
    if (!SITE_KEY) return;

    const onInteract = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t || typeof t.closest !== 'function') return;
      // Any form control, or anything inside a <form>. The honeypot is inside
      // a form too, but a bot filling it never gets past the server anyway.
      if (t.closest('form') || t.closest('input, textarea, select')) {
        cleanup();
        void ensureRecaptcha();
      }
    };

    const cleanup = () => {
      document.removeEventListener('focusin', onInteract, true);
      document.removeEventListener('pointerdown', onInteract, true);
    };

    document.addEventListener('focusin', onInteract, true);
    document.addEventListener('pointerdown', onInteract, true);
    return cleanup;
  }, []);

  return null;
}

/**
 * Get a fresh token for a given action name (lowercase letters/underscores).
 * Returns null if reCAPTCHA isn't configured, couldn't load, or errored —
 * callers treat null as "no token", which the server already handles.
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!SITE_KEY) return null;

  // The submit path is the backstop: if the listeners never fired, load now
  // and wait, so a token is still attached.
  const ready = await ensureRecaptcha();
  if (!ready || !window.grecaptcha) return null;

  try {
    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha!.ready(async () => {
        try {
          resolve(await window.grecaptcha!.execute(SITE_KEY, { action }));
        } catch (e) {
          reject(e);
        }
      });
    });
  } catch (err) {
    console.warn('reCAPTCHA token request failed:', (err as Error).message);
    return null;
  }
}
