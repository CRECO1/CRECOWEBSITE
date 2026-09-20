'use client';

import { useState } from 'react';
import { getRecaptchaToken } from '@/components/forms/Recaptcha';
import { trackEvent } from '@/lib/analytics';

/**
 * The submit engine every email capture on this site shares.
 *
 * Five components had each grown their own copy of the same twenty lines:
 * read the honeypot, fetch a reCAPTCHA token, POST, decide whether the
 * response counts as a failure, surface an error, flip to a success state,
 * fire analytics. They drifted — some read the API's error message, some
 * showed a generic string, one forgot the honeypot — so a fix in one never
 * reached the others.
 *
 * What stays with the caller, deliberately: the endpoint, the payload, the
 * copy and the markup. Those are what make a newsletter signup different from
 * a market-report gate, and collapsing them would change what the captures do.
 * This hook only owns the mechanics.
 */
export interface CaptureSubmitOptions {
  /** Where the capture posts. Not all captures use /api/subscribe. */
  endpoint: string;
  /** reCAPTCHA v3 action name, kept per-surface for score tuning. */
  recaptchaAction: string;
  /** Builds the exact body this surface sends. Receives the anti-spam extras. */
  buildPayload: (extras: { recaptchaToken: string | null; website: string }) => Record<string, unknown>;
  /** Analytics event names, when the surface tracks them. */
  track?: { success?: string; failure?: string; props?: Record<string, unknown> };
  /**
   * Shown when the request fails. Surfaces that prefer the API's own message
   * (the guide gate says "Could not unlock guide") leave this unset.
   */
  errorFallback?: string;
  /** Runs after a successful submit — clearing a field, closing a modal. */
  onSuccess?: () => void;
}

export interface CaptureSubmitState {
  submitting: boolean;
  submitted: boolean;
  error: string | null;
  /** Pass the form's submit event; the honeypot is read from it. */
  submit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  reset: () => void;
}

export function useCaptureSubmit(opts: CaptureSubmitOptions): CaptureSubmitState {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // The honeypot input lives inside the form; an empty value is a human.
      const website = (new FormData(e.currentTarget).get('website') as string) ?? '';
      const recaptchaToken = await getRecaptchaToken(opts.recaptchaAction);

      const res = await fetch(opts.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts.buildPayload({ recaptchaToken, website })),
      });

      if (!res.ok) {
        // Prefer the API's own message when the surface has not supplied a
        // fallback — those messages are written for the specific capture.
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || opts.errorFallback || `HTTP ${res.status}`);
      }

      if (opts.track?.success) trackEvent(opts.track.success, opts.track.props ?? {});
      setSubmitted(true);
      opts.onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (opts.track?.failure) {
        trackEvent(opts.track.failure, { ...(opts.track.props ?? {}), reason: message.slice(0, 80) });
      }
      setError(opts.errorFallback ?? message);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    submitting,
    submitted,
    error,
    submit,
    reset: () => { setSubmitted(false); setError(null); },
  };
}
