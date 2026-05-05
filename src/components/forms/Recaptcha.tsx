'use client';

/**
 * reCAPTCHA v3 client-side helper.
 *
 * - Loads the Google reCAPTCHA script once per page when the public site key
 *   is present in env. Does nothing if the env var is unset.
 * - Exposes a `getRecaptchaToken(action)` helper that resolves to a fresh
 *   token, or `null` if reCAPTCHA isn't configured / failed to load.
 *
 * Form components call `getRecaptchaToken('submit_contact')` (or similar)
 * before posting and include the resulting token in the request body. The
 * server route then verifies via verifyRecaptcha() in lib/recaptcha.ts.
 */

import Script from 'next/script';

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/** Mount once at the root layout (or any high-level component) — loads the script. */
export function RecaptchaScript() {
  if (!SITE_KEY) return null;
  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`}
      strategy="afterInteractive"
    />
  );
}

/**
 * Get a fresh token for a given action name (lowercase letters/underscores).
 * Returns null if reCAPTCHA isn't configured — callers should treat null as
 * "no token, server will allow through if reCAPTCHA is also not configured
 * server-side."
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (!SITE_KEY) return null;
  if (typeof window === 'undefined' || !window.grecaptcha) return null;

  try {
    return await new Promise<string>((resolve, reject) => {
      window.grecaptcha!.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(SITE_KEY, { action });
          resolve(token);
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
