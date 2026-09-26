'use client';

/**
 * The short inline capture that sits inside a landing page.
 *
 * The site's dedicated forms (ListYourSpaceForm, SellInquiryForm, the
 * valuation tool) ask 6–9 questions because someone who navigated to them has
 * already decided. This is for the visitor mid-page who is convinced but was
 * never going to click through to a form: name, email, phone, and one question
 * that fits the page. Four fields, no dropdowns, no required free text.
 *
 * It deliberately does NOT invent a new lead source. Each surface reuses a
 * `source` the /api/leads route already types correctly for the CRM
 * ('listing-inquiry' → Landlord/Investor, 'disposition-inquiry' → Seller) and
 * distinguishes itself with `surface`, which the CRM now receives as its own
 * field. That way a landlord captured here is typed exactly like one captured
 * on /list-your-space, while reporting can still tell the two apart.
 *
 * Submits through useCaptureSubmit, so it inherits the honeypot, the fill-time
 * check, reCAPTCHA, page context and UTM forwarding without restating any of
 * it.
 */

import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Honeypot } from './Honeypot';
import { useCaptureSubmit } from '@/lib/use-capture-submit';
import { readUtmsFromCookie } from '@/lib/analytics';
import { BUSINESS } from '@/lib/schema';

export interface InlineLeadFormProps {
  /** Small caps line above the heading. */
  eyebrow?: string;
  heading: string;
  body?: string;
  /** Label + placeholder for the single contextual question. */
  contextLabel: string;
  contextPlaceholder: string;
  /** A source the /api/leads route already maps to the right CRM type. */
  source: 'listing-inquiry' | 'disposition-inquiry' | 'tenant-needs';
  /** Placement id — forwarded to the CRM so reporting can separate surfaces. */
  surface: string;
  submitLabel?: string;
  /** Dark rides on the primary ground; light on cream or white. */
  tone?: 'light' | 'dark';
  className?: string;
}

export function InlineLeadForm({
  eyebrow,
  heading,
  body,
  contextLabel,
  contextPlaceholder,
  source,
  surface,
  submitLabel = 'Request a call',
  tone = 'light',
  className = '',
}: InlineLeadFormProps) {
  const [f, setF] = useState({ name: '', email: '', phone: '', context: '' });
  const set = (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF(prev => ({ ...prev, [k]: e.target.value }));

  const { submitting, submitted, error, submit } = useCaptureSubmit({
    endpoint: '/api/leads',
    recaptchaAction: 'inline_lead',
    errorFallback: `Something went wrong. Please try again, or call ${BUSINESS.phoneDisplay}.`,
    track: { success: 'inline_lead_submitted', failure: 'inline_lead_failed', props: { surface, source } },
    buildPayload: ({ recaptchaToken, website }) => ({
      name: f.name,
      email: f.email,
      phone: f.phone,
      source,
      surface,
      message: f.context ? `${contextLabel}\n${f.context}` : null,
      recaptchaToken,
      website,
      ...readUtmsFromCookie(),
    }),
  });

  const dark = tone === 'dark';
  const card = dark
    ? 'bg-white/5 border border-white/10'
    : 'bg-white border border-border shadow-card';
  const field = dark
    ? 'w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-body-sm text-white placeholder:text-white/50 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25'
    : 'w-full rounded-lg border border-border bg-white px-4 py-3 text-body-sm text-primary placeholder:text-foreground-muted/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25';

  if (submitted) {
    return (
      <div className={`rounded-2xl p-8 text-center ${card} ${className}`}>
        <CheckCircle className="mx-auto mb-4 h-11 w-11 text-gold" />
        <p className={`font-heading text-heading-sm font-bold ${dark ? 'text-white' : 'text-primary'}`}>
          Got it — we&rsquo;ll be in touch.
        </p>
        <p className={`mt-2 text-body-sm ${dark ? 'text-white/70' : 'text-foreground-muted'}`}>
          A CRECO broker responds within one business day. Need us sooner?{' '}
          <a href={`tel:${BUSINESS.phoneE164}`} className="font-semibold text-gold-dark hover:underline">
            {BUSINESS.phoneDisplay}
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 sm:p-8 ${card} ${className}`}>
      {eyebrow && <p className={`overline mb-2 ${dark ? 'text-gold' : ''}`}>{eyebrow}</p>}
      <h3 className={`font-heading text-heading-sm font-bold ${dark ? 'text-white' : 'text-primary'}`}>
        {heading}
      </h3>
      {body && (
        <p className={`mt-2 text-body-sm leading-relaxed ${dark ? 'text-white/70' : 'text-foreground-muted'}`}>
          {body}
        </p>
      )}

      <form onSubmit={submit} className="mt-5 space-y-3">
        <Honeypot />
        {/* One column on a phone, two once there is room for them to read as a
            pair rather than a stack of identical boxes. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input required name="name" value={f.name} onChange={set('name')} placeholder="Your name" aria-label="Your name" autoComplete="name" className={field} />
          <input required type="email" name="email" value={f.email} onChange={set('email')} placeholder="you@company.com" aria-label="Email address" autoComplete="email" className={field} />
        </div>
        <input required type="tel" name="phone" value={f.phone} onChange={set('phone')} placeholder="Phone" aria-label="Phone number" autoComplete="tel" className={field} />
        <textarea
          name="context"
          rows={2}
          value={f.context}
          onChange={set('context')}
          placeholder={contextPlaceholder}
          aria-label={contextLabel}
          className={field}
        />

        {error && <p className={`text-body-sm ${dark ? 'text-red-300' : 'text-red-600'}`}>{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-body-sm font-bold text-primary shadow-sm transition-colors hover:bg-gold-light disabled:opacity-60 sm:w-auto"
        >
          {submitting ? 'Sending…' : submitLabel}
          {!submitting && <ArrowRight className="h-4 w-4 shrink-0" />}
        </button>
        <p className={`text-caption ${dark ? 'text-white/50' : 'text-foreground-muted'}`}>
          No obligation. We reply within one business day.
        </p>
      </form>
    </div>
  );
}
