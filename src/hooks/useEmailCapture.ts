'use client';

/**
 * useEmailCapture — consolidates the submit logic shared by every
 * single-email capture surface (brochure request, exit-intent, save
 * search, etc.). Each surface still owns its own UI: the input field,
 * the button styling, the success-state layout. The hook only owns the
 * submit flow:
 *
 *   1. Double-submit guard (race between event dispatch and setState)
 *   2. Client-side email validation
 *   3. reCAPTCHA token fetch
 *   4. UTM attribution read from cookie
 *   5. Honeypot value extraction from the form
 *   6. POST to the configured endpoint with the shared shape +
 *      caller-provided extra fields
 *   7. trackEvent on success + failure
 *
 * Before this hook existed each form re-implemented the exact same
 * try/catch dance with subtle drift (different event names, missing
 * UTMs in one, missing honeypot in another). Now there's one path.
 *
 * Usage:
 *   const { submit, submitting, submitted, error } = useEmailCapture({
 *     endpoint: '/api/leads',
 *     source: 'brochure-request',
 *     recaptchaAction: 'brochure_request',
 *     successEvent: 'brochure_requested',
 *     failureEvent: 'brochure_request_failed',
 *     buildPayload: (email) => ({
 *       name: '—',
 *       email,
 *       property_interest: listingTitle,
 *     }),
 *   });
 *
 *   <form onSubmit={(e) => submit(e, emailInput)}>...</form>
 *
 * Errors are surfaced via the returned `error` string; consumers render
 * it next to the input with aria-live.
 */

import { useState } from 'react';
import { getRecaptchaToken } from '@/components/forms/Recaptcha';
import { trackEvent, readUtmsFromCookie } from '@/lib/analytics';
import { isClientEmailValid } from '@/lib/validation';

interface UseEmailCaptureOpts {
  /** API endpoint to POST to. Examples: '/api/leads', '/api/subscribe'. */
  endpoint: string;
  /** recaptcha action name. Lower-snake_case per Google convention. */
  recaptchaAction: string;
  /** GA4 event name fired on successful submission. */
  successEvent: string;
  /** GA4 event name fired on failure. */
  failureEvent: string;
  /** Build the rest of the request payload from the validated email.
   *  The hook handles {recaptchaToken, website, ...utm_*}. The caller
   *  fills the per-surface fields: name, source, property_interest,
   *  filters, etc. */
  buildPayload: (email: string) => Record<string, unknown>;
  /** Optional extra GA4 event params on success (e.g. listing_slug). */
  successEventParams?: Record<string, unknown>;
}

export interface EmailCaptureState {
  /** Trigger the submit. Pass the form event + the current email value. */
  submit: (e: React.FormEvent<HTMLFormElement>, email: string) => Promise<void>;
  submitting: boolean;
  submitted: boolean;
  /** Human-readable validation/error message; null when no error. */
  error: string | null;
  /** Manually reset to the initial state — used when the parent toggles
   *  the surface back on after a previous successful submit. */
  reset: () => void;
}

export function useEmailCapture(opts: UseEmailCaptureOpts): EmailCaptureState {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>, email: string) {
    e.preventDefault();
    // Synchronous guard against double-submit before button-disabled state
    // commits. A fast double-click can fire two POSTs without this.
    if (submitting) return;
    setError(null);

    if (!isClientEmailValid(email)) {
      setError('Enter a valid email.');
      return;
    }

    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken(opts.recaptchaAction);
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';
      const attribution = readUtmsFromCookie();
      const cleanEmail = email.trim().toLowerCase();

      const res = await fetch(opts.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...opts.buildPayload(cleanEmail),
          recaptchaToken,
          website: honeypot,
          ...attribution,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not submit');
      }
      setSubmitted(true);
      trackEvent(opts.successEvent, {
        ...opts.successEventParams,
        attribution_source: attribution.utm_source ?? 'direct',
      });
    } catch (err) {
      const msg = (err as Error).message ?? 'Unknown error';
      setError(msg);
      trackEvent(opts.failureEvent, { reason: msg.slice(0, 80) });
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSubmitting(false);
    setSubmitted(false);
    setError(null);
  }

  return { submit, submitting, submitted, error, reset };
}
