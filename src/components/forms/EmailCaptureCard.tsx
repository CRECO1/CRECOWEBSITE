'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Honeypot } from './Honeypot';
import { useCaptureSubmit, type CaptureSubmitOptions } from '@/lib/use-capture-submit';

/**
 * The card-shaped, one-field email capture.
 *
 * Two components were the same card built twice — icon, heading, body, a single
 * email input beside a gold button, and an inline success panel — differing only
 * in their words, their endpoint and the shade of their background. They are one
 * component now, and the things that actually differed stay props.
 *
 * Deliberately narrow: this is for captures that ask for an email and nothing
 * else. The guide gate (name + company + outcomes list) and the alerts page
 * (property filters) have real layouts of their own and keep them; they share
 * the submit engine through useCaptureSubmit instead.
 */
export interface EmailCaptureCardProps {
  icon: LucideIcon;
  heading: string;
  body: string;
  submitLabel: string;
  submittingLabel?: string;
  success: { heading: string; body: string };
  placeholder?: string;
  /** Aria label for the input when the card has no visible label. */
  inputLabel?: string;
  /** Dark rides on a near-black ground; light on cream or white. */
  tone?: 'dark' | 'light';
  /**
   * The card's own background. The two original cards did not match — one sat
   * on translucent white inside a dark band, the other on solid primary — so
   * the surface keeps control of its own ground rather than being flattened.
   */
  cardClassName?: string;
  /** Error text colour differed per card; keep each one's. */
  errorClassName?: string;
  submit: CaptureSubmitOptions;
  /** Receives the typed email so the caller can build its payload. */
  onEmailChange: (email: string) => void;
  email: string;
  /**
   * Optional control rendered between the body copy and the email row — the
   * alerts card uses it for asset-type pills. Kept as a slot so this component
   * stays a card with an email in it, rather than growing a form's worth of
   * props for one caller.
   */
  extra?: React.ReactNode;
}

export function EmailCaptureCard({
  icon: Icon,
  heading,
  body,
  submitLabel,
  submittingLabel = 'Sending…',
  success,
  placeholder = 'you@company.com',
  inputLabel = 'Email address',
  tone = 'light',
  cardClassName,
  errorClassName = 'text-red-500',
  submit,
  email,
  onEmailChange,
  extra,
}: EmailCaptureCardProps) {
  const state = useCaptureSubmit(submit);

  const card = cardClassName ?? (tone === 'dark'
    ? 'bg-white/5 text-white border border-white/10'
    : 'bg-white border border-border');
  const headingClasses = tone === 'dark' ? 'text-white' : 'text-primary';
  const bodyClasses = tone === 'dark' ? 'text-white/70' : 'text-foreground-muted';
  const inputClasses = tone === 'dark'
    ? 'border-white/15 bg-white/10 text-white placeholder:text-white/40'
    : 'border-border bg-white text-primary placeholder:text-foreground-muted/60';

  if (state.submitted) {
    return (
      <div className={`rounded-2xl p-6 ${card}`}>
        <div className="flex items-start gap-3">
          <CheckCircle className="h-5 w-5 shrink-0 text-gold mt-0.5" />
          <div>
            <h3 className={`font-heading text-body-lg font-bold mb-1 ${headingClasses}`}>{success.heading}</h3>
            <p className={`text-body-sm leading-relaxed ${bodyClasses}`}>{success.body}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 ${card}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-5 w-5 shrink-0 text-gold" />
        <h3 className={`font-heading text-body-lg font-bold ${headingClasses}`}>{heading}</h3>
      </div>
      <p className={`mb-4 text-body-sm leading-relaxed ${bodyClasses}`}>{body}</p>
      <form onSubmit={state.submit}>
        <Honeypot />
        {/* The pills sit inside the form, above the email row, so they share
            the honeypot's timing stamp and submit with the same event. */}
        {extra}
        <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={e => onEmailChange(e.target.value)}
          placeholder={placeholder}
          aria-label={inputLabel}
          autoComplete="email"
          disabled={state.submitting}
          className={`flex-1 rounded-lg border px-3 py-2.5 text-body-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gold/30 disabled:opacity-60 ${inputClasses}`}
        />
        <button
          type="submit"
          disabled={state.submitting}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gold px-5 py-2.5 text-body-sm font-bold text-primary shadow-sm transition-colors hover:bg-gold-light disabled:opacity-60"
        >
          {state.submitting ? submittingLabel : submitLabel}
          {!state.submitting && <ArrowRight className="h-4 w-4 shrink-0" />}
        </button>
        </div>
      </form>
      {state.error && <p className={`mt-2 text-caption ${errorClassName}`}>{state.error}</p>}
    </div>
  );
}
