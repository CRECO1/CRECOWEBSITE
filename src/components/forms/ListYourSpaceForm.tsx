'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Honeypot } from './Honeypot';
import { useCaptureSubmit } from '@/lib/use-capture-submit';
import { readUtmsFromCookie } from '@/lib/analytics';
import { LISTING_PROPERTY_TYPES, LISTING_INTENT } from '@/lib/listing-copy';

/**
 * The listing-acquisition capture: an owner handing CRECO their space.
 *
 * Deliberately not the valuation form. That one answers "what is this worth";
 * this one starts "will you lease it for me", so it asks for the property
 * itself — address, type, size, lease or sale — and files the lead as a
 * landlord with its own source and tags. Nothing here promises a rate: how
 * CRECO is paid is agreed with the owner, not quoted on a page.
 *
 * Submits through the shared capture engine, so honeypot, reCAPTCHA and error
 * handling behave as they do everywhere else. No nurture enrollment — the
 * broker pitches these himself.
 */
export function ListYourSpaceForm({ surface = 'list-your-space' }: { surface?: string }) {
  const [f, setF] = useState({
    name: '', email: '', phone: '', company: '',
    address: '', property_type: '', size: '', intent: '', notes: '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  const { submitting, submitted, error, submit } = useCaptureSubmit({
    endpoint: '/api/leads',
    recaptchaAction: 'listing_inquiry',
    errorFallback: 'Something went wrong. Please try again, or call (210) 817-3443.',
    track: { success: 'listing_inquiry_submitted', failure: 'listing_inquiry_failed', props: { surface } },
    buildPayload: ({ recaptchaToken, website }) => ({
      name: f.name,
      email: f.email,
      phone: f.phone,
      company: f.company || null,
      source: 'listing-inquiry',
      property_interest: f.address,
      message: [
        `Property address: ${f.address}`,
        `Property type: ${f.property_type}`,
        `Approx. size: ${f.size || '—'}`,
        `Looking to: ${f.intent}`,
        f.notes ? `Notes: ${f.notes}` : '',
      ].filter(Boolean).join('\n'),
      recaptchaToken,
      website,
      ...readUtmsFromCookie(),
    }),
  });

  const field = 'w-full rounded-lg border border-border bg-white px-4 py-3 text-body-sm text-primary placeholder:text-foreground-muted/60 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25';

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-white p-8 text-center">
        <CheckCircle className="mx-auto mb-4 h-10 w-10 text-gold" />
        <h3 className="mb-2 font-heading text-heading-xl font-bold text-primary">Got it.</h3>
        <p className="mx-auto max-w-md text-body text-foreground-muted">
          Zack has your property and will come back to you personally with how he&apos;d take it to market.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Honeypot />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input required name="name" value={f.name} onChange={set('name')} placeholder="Your name" className={field} />
        <input required type="email" name="email" value={f.email} onChange={set('email')} placeholder="you@company.com" className={field} />
        <input required type="tel" name="phone" value={f.phone} onChange={set('phone')} placeholder="Phone" className={field} />
        <input name="company" value={f.company} onChange={set('company')} placeholder="Company (optional)" className={field} />
      </div>

      <input required name="address" value={f.address} onChange={set('address')} placeholder="Property address" className={field} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <select required name="property_type" value={f.property_type} onChange={set('property_type')} className={field}>
          <option value="">Property type…</option>
          {LISTING_PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <input name="size" value={f.size} onChange={set('size')} placeholder="Approx. size (SF or acres)" className={field} />
        <select required name="intent" value={f.intent} onChange={set('intent')} className={field}>
          <option value="">Lease or sale…</option>
          {LISTING_INTENT.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      <textarea
        name="notes" rows={3} value={f.notes} onChange={set('notes')}
        placeholder="Anything useful — current vacancy, existing tenants, timing (optional)"
        className={field}
      />

      {error && <p className="text-body-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-bold text-primary transition-colors hover:bg-gold-light disabled:opacity-60 sm:w-auto"
      >
        {submitting ? 'Sending…' : <>List my space <ArrowRight className="h-4 w-4" /></>}
      </button>
      <p className="text-caption text-foreground-muted">
        No cost to discuss. Representation is success-based, and the terms are agreed with you before anything is signed.
      </p>
    </form>
  );
}
