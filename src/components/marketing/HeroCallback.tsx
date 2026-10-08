'use client';

import { useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Honeypot } from '@/components/forms/Honeypot';
import { getRecaptchaToken } from '@/components/forms/Recaptcha';
import { trackEvent, leadPayloadFields } from '@/lib/analytics';
import { PRIMARY_BROKER } from '@/lib/broker';

/**
 * "Have us call you" in the hero — the same name + number request as the /get-started panel (same endpoint,
 * same bot screen), reachable without answering any questions. Lands in the CRM as an "exploring" call-back.
 */
export function HeroCallback() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const website = (form.get('website') as string) ?? '';
    const formRenderedAt = Number(form.get('form_rendered_at')) || undefined;
    setSending(true);
    setError(null);
    try {
      const recaptchaToken = await getRecaptchaToken('homepage_callback');
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: 'exploring',
          callback: true,
          name,
          phone,
          answers: { requested_from_step: 'Homepage hero' },
          surface: 'homepage-callback',
          recaptchaToken,
          website,
          form_rendered_at: formRenderedAt,
          ...leadPayloadFields(),
        }),
      });
      if (!res.ok) {
        let msg = `Something went wrong. Please call or text ${PRIMARY_BROKER.phone_display}.`;
        try { const data = await res.json(); if (data?.error) msg = data.error; } catch { /* non-JSON */ }
        trackEvent('homepage_callback_failed', { surface: 'homepage-hero', reason: `http_${res.status}` });
        setError(msg);
        return;
      }
      trackEvent('homepage_callback_submitted', { surface: 'homepage-hero' });
      setSent(true);
    } catch {
      trackEvent('homepage_callback_failed', { surface: 'homepage-hero', reason: 'network' });
      setError(`We couldn't reach the server. Please call or text ${PRIMARY_BROKER.phone_display}.`);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto mt-4 max-w-md rounded-xl border border-gold/40 bg-white p-4 text-center" role="status" data-track-section="hero_callback">
        <p className="text-body-sm font-semibold text-primary">Got it — we’ll call you at {phone}.</p>
      </div>
    );
  }

  return (
    <div className="mt-2 text-center" data-track-section="hero_callback">
      <button
        type="button"
        data-track-id="callback_toggle"
        onClick={() => {
          if (!open) trackEvent('homepage_callback_opened', { surface: 'homepage-hero' });
          setOpen(o => !o);
        }}
        aria-expanded={open}
        className="inline-flex min-h-[44px] items-center gap-1.5 text-body-sm font-semibold text-gold underline-offset-4 hover:text-gold-light hover:underline"
      >
        <PhoneCall className="h-4 w-4" aria-hidden="true" /> Have us call you
      </button>
      {open && (
        <form onSubmit={submit} className="mx-auto mt-3 max-w-md space-y-3 rounded-xl border border-border bg-white p-5 text-left shadow-card">
          <Honeypot />
          <p className="flex items-center gap-2 text-body-sm font-semibold text-primary">
            <PhoneCall className="h-4 w-4 text-gold-dark" aria-hidden="true" /> We’ll call you — just a name and number.
          </p>
          <input
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold-dark"
          />
          <input
            required
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Best number to reach you"
            autoComplete="tel"
            className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold-dark"
          />
          <Button type="submit" size="lg" fullWidth loading={sending}>
            Call me
          </Button>
          {error && (
            <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-caption text-destructive">{error}</p>
          )}
        </form>
      )}
    </div>
  );
}
