'use client';

/**
 * The owner report's ask: "what's on your radar?" chips + a one-tap request
 * for a free Broker Opinion of Value. We already know who the owner is (the
 * token), so the request needs no form — a phone number is optional.
 *
 * Also reports the view. Corporate email scanners open every link in an email
 * the moment it lands, so a view only counts once a real person has had the
 * page visible for a few seconds, and never for bots, datacenter visits or
 * our own team (same rules as analytics — lib/analytics-gate.ts).
 */
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { isDatacenterVisitor, isInternalVisitor, isLikelyBot } from '@/lib/analytics-gate';

const INTERESTS = ['Selling', 'Leasing up space', '1031 / refinancing', 'Just keeping tabs'] as const;
const VIEW_DELAY_MS = 4000;

function post(token: string, body: Record<string, unknown>) {
  return fetch('/api/owner-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, ...body }),
    keepalive: true,
  });
}

export function OwnerReportActions({ token, one, alreadyRequested }: { token: string; one: boolean; alreadyRequested: boolean }) {
  const [interest, setInterest] = useState<string>(INTERESTS[0]);
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>(alreadyRequested ? 'sent' : 'idle');

  useEffect(() => {
    const internal = isInternalVisitor();
    if (internal || isLikelyBot() || isDatacenterVisitor()) return;
    const key = `owner_report_viewed_${token}`;
    try { if (sessionStorage.getItem(key)) return; } catch { /* private mode */ }
    const timer = setTimeout(() => {
      if (document.visibilityState !== 'visible') return;
      try { sessionStorage.setItem(key, '1'); } catch { /* ignore */ }
      post(token, { type: 'view' }).catch(() => {});
    }, VIEW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [token]);

  async function request() {
    setState('sending');
    try {
      const res = await post(token, { type: 'bov', interest, phone: phone.trim() || undefined });
      if (!res.ok) throw new Error(String(res.status));
      setState('sent');
    } catch {
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-1 h-6 w-6 shrink-0 text-green-700" />
        <div>
          <h2 className="font-heading text-heading font-bold text-primary">Your Broker Opinion of Value is on the way.</h2>
          <p className="mt-1 text-body text-foreground-muted">
            Zachary Stovall will reach out within one business day to walk through {one ? 'the property' : 'your properties'} and what {one ? 'it' : 'each'} would trade for today. No cost, no obligation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <h2 className="font-heading text-heading font-bold text-primary">What&rsquo;s on your radar?</h2>
      <p className="mt-1 text-body-sm text-foreground-muted">Tap one — it tells us what to put in your free opinion of value.</p>
      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="What's on your radar">
        {INTERESTS.map(i => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={interest === i}
            onClick={() => setInterest(i)}
            className={`min-h-[44px] rounded-full border-2 px-4 py-2 text-body-sm font-semibold transition-colors ${interest === i ? 'border-gold bg-[#fffaf0] text-primary' : 'border-border bg-white text-primary hover:border-gold/60'}`}
          >
            {i}
          </button>
        ))}
      </div>
      <label className="mt-5 block max-w-sm">
        <span className="mb-1 block text-caption font-bold uppercase tracking-widest text-foreground-muted">Best number (optional)</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="(210) 555-0100"
          className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:border-gold-dark focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
      </label>
      <button
        type="button"
        onClick={request}
        disabled={state === 'sending'}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3.5 text-body font-bold text-primary shadow-sm transition-colors hover:bg-gold-light disabled:opacity-60"
      >
        {state === 'sending' ? 'Sending…' : <>Get my free Broker Opinion of Value <ArrowRight className="h-4 w-4" /></>}
      </button>
      {state === 'error' && (
        <p role="alert" className="mt-3 text-body-sm text-destructive">
          That didn&rsquo;t go through. Please call or text (210) 817-3443 and we&rsquo;ll take it from there.
        </p>
      )}
      <p className="mt-3 text-body-sm text-foreground-muted">
        Prepared personally by Zachary Stovall, Broker: recent comps, a lease analysis, and what {one ? 'it' : 'each property'} would trade for today. No cost, no obligation.
      </p>
    </>
  );
}
