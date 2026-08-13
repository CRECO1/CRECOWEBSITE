'use client';

/**
 * Email gate for lead magnet downloads. On submit, POSTs to /api/subscribe with
 * subscription_type='lead-magnet' and asset_slug=<guide.slug>, then unlocks the
 * full guide inline by calling onUnlock(). Persists unlock state in
 * localStorage so the user doesn't have to re-enter email if they refresh.
 */

import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle, Lock } from 'lucide-react';
import { getRecaptchaToken } from './Recaptcha';
import { Honeypot } from './Honeypot';

const STORAGE_KEY_PREFIX = 'creco-guide-unlocked-';

export function LeadMagnetForm({
  assetSlug,
  outcomes,
  onUnlock,
}: {
  assetSlug: string;
  outcomes: string[];
  onUnlock: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-unlock on mount if user has previously unlocked this guide
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(STORAGE_KEY_PREFIX + assetSlug)) {
      onUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetSlug]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';
      const recaptchaToken = await getRecaptchaToken('subscribe_lead_magnet');
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name,
          subscription_type: 'lead-magnet',
          source: `guide:${assetSlug}`,
          asset_slug: assetSlug,
          filters: company ? { company } : null,
          recaptchaToken,
          website: honeypot,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not unlock guide');
      }
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + assetSlug, '1');
      } catch { /* ignore quota errors */ }
      onUnlock();
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="form-success-box bg-gradient-to-br from-gold/5 to-transparent p-7 sm:p-10 my-8">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="h-4 w-4 text-gold" />
        <p className="overline text-gold">Read the rest free</p>
      </div>
      <h2 className="font-heading text-heading-lg font-bold text-primary mb-3">
        Tell us where to send the full guide.
      </h2>
      <p className="text-body text-foreground-muted mb-6 max-w-xl">
        Enter your email and we'll unlock the full guide right here on this page — and email you a copy you can share with your team.
      </p>

      {/* Outcomes */}
      <div className="mb-7">
        <p className="text-body-sm font-semibold text-primary mb-3">What you'll walk away with:</p>
        <ul className="space-y-2">
          {outcomes.map(o => (
            <li key={o} className="flex items-start gap-2.5 text-body-sm text-foreground-muted">
              <CheckCircle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Honeypot />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary placeholder:text-foreground-muted/60 focus:outline-none focus:border-gold"
          />
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary placeholder:text-foreground-muted/60 focus:outline-none focus:border-gold"
          />
        </div>
        <input
          type="text"
          value={company}
          onChange={e => setCompany(e.target.value)}
          placeholder="Company (optional)"
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary placeholder:text-foreground-muted/60 focus:outline-none focus:border-gold"
        />
        {error && <p className="text-body-sm text-destructive">{error}</p>}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <p className="text-caption text-foreground-muted max-w-md">
            We'll never share your email. By unlocking, you agree to receive occasional CRECO insights — unsubscribe anytime.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-body-sm font-semibold text-primary hover:bg-gold-light disabled:opacity-60 whitespace-nowrap"
          >
            {submitting ? 'Unlocking…' : <>Unlock the guide <ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>
      </form>
    </div>
  );
}
