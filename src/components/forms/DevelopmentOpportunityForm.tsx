'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { Honeypot } from './Honeypot';
import { useCaptureSubmit } from '@/lib/use-capture-submit';
import { readUtmsFromCookie } from '@/lib/analytics';
import { DEVELOPMENT_PROPERTY_TYPES, DEVELOPMENT_ROLES } from '@/lib/owner-paths-copy';

/**
 * Development-opportunity capture — a site owner or a developer bringing CRECO
 * something to look at.
 *
 * Third distinct owner intent, kept fully separate from leasing and
 * dispositions: its own route, source, CRM tags and copy. The `role` field is
 * what makes it useful — "I own the site" and "I am a developer looking for
 * sites" are opposite sides of the same market, and the broker needs to know
 * which one he is talking to before he replies.
 *
 * No nurture enrollment; the broker works these himself.
 */
export function DevelopmentOpportunityForm({ surface = 'development-opportunities' }: { surface?: string }) {
  const [f, setF] = useState({
    name: '', email: '', phone: '', company: '',
    role: '', location: '', site_type: '', size: '', notes: '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF(p => ({ ...p, [k]: e.target.value }));

  const { submitting, submitted, error, submit } = useCaptureSubmit({
    endpoint: '/api/leads',
    recaptchaAction: 'development_inquiry',
    errorFallback: 'Something went wrong. Please try again, or call (210) 817-3443.',
    track: { success: 'development_inquiry_submitted', failure: 'development_inquiry_failed', props: { surface } },
    buildPayload: ({ recaptchaToken, website }) => ({
      name: f.name,
      email: f.email,
      phone: f.phone,
      company: f.company || null,
      source: 'development-inquiry',
      property_interest: f.location,
      message: [
        `Role: ${f.role}`,
        `Site / location: ${f.location}`,
        `Site type: ${f.site_type}`,
        `Approx. size: ${f.size || '—'}`,
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
        <h3 className="mb-2 font-heading text-heading-xl font-bold text-primary">Received.</h3>
        <p className="mx-auto max-w-md text-body text-foreground-muted">
          Zack will review it himself and come back to you directly. Anything you share is treated as confidential.
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

      <select required name="role" value={f.role} onChange={set('role')} className={field}>
        <option value="">Which describes you?…</option>
        {DEVELOPMENT_ROLES.map(r => <option key={r}>{r}</option>)}
      </select>

      <input required name="location" value={f.location} onChange={set('location')} placeholder="Site address, or the area you're targeting" className={field} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <select required name="site_type" value={f.site_type} onChange={set('site_type')} className={field}>
          <option value="">Site type…</option>
          {DEVELOPMENT_PROPERTY_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <input name="size" value={f.size} onChange={set('size')} placeholder="Approx. size (acres or SF)" className={field} />
      </div>

      <textarea
        name="notes" rows={3} value={f.notes} onChange={set('notes')}
        placeholder="What you're trying to do — sell it, build on it, find a partner (optional)"
        className={field}
      />

      {error && <p className="text-body-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-7 py-3.5 text-body-sm font-bold text-primary transition-colors hover:bg-gold-light disabled:opacity-60 sm:w-auto"
      >
        {submitting ? 'Sending…' : <>Bring us the opportunity <ArrowRight className="h-4 w-4" /></>}
      </button>
      <p className="text-caption text-foreground-muted">
        Reviewed confidentially. CRECO acts as broker and advisor on these — it is not the developer.
      </p>
    </form>
  );
}
