'use client';

/**
 * Exit-intent modal — catches the ~70% of visitors who would otherwise
 * bounce silently. Single email field, one offer (free Q2 Texas market
 * report). Posts to /api/subscribe so the lead lands in the same place
 * as the property-alerts subscribers.
 *
 * Trigger heuristics:
 *   Desktop — cursor leaves the viewport via the top edge (the classic
 *             "going for the back button" signal). Only fires after the
 *             visitor has spent at least 8s on the page so it doesn't
 *             ambush bounce-immediate visitors who never engaged.
 *   Mobile  — fast upward scroll velocity AND past 30% scroll depth. The
 *             top-edge trick doesn't work on touch; this is the closest
 *             proxy for "leaving."
 *
 * Suppression rules (any single rule disables the modal forever for the
 * session):
 *   - sessionStorage flag set when the modal is shown / dismissed / submitted
 *   - localStorage flag set after a successful subscribe (don't ask twice)
 *   - User is on a billing/admin/client/* route (operator surface)
 *   - User has already given us a lead this visit (set by any form handler)
 *   - prefers-reduced-motion media query is true (interruption-averse users)
 *
 * Skip in dev mode if NEXT_PUBLIC_EXIT_INTENT_DISABLED='true' (handy when
 * working on a non-related page and the modal keeps popping).
 */

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { getRecaptchaToken } from '@/components/forms/Recaptcha';
import { Honeypot } from '@/components/forms/Honeypot';
import { trackEvent, readUtmsFromCookie } from '@/lib/analytics';
import { isClientEmailValid } from '@/lib/validation';
import { useFocusTrap } from '@/hooks/useFocusTrap';

const SESSION_KEY = 'creco_exit_shown';
const PERSISTENT_KEY = 'creco_exit_subscribed';
const MIN_DWELL_MS = 8000;
const SUPPRESS_PATHS = ['/billing', '/admin', '/manage', '/client/', '/get-started', '/contact'];

export function ExitIntentModal() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Refs keep listener state stable across re-renders without re-binding.
  const dwellStartRef = useRef<number>(Date.now());
  const lastScrollYRef = useRef<number>(0);
  const lastScrollTRef = useRef<number>(Date.now());
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus inside the modal so Tab can't escape onto the page
  // underneath. Only engages when the modal is open.
  useFocusTrap(dialogRef, open);

  // Suppression — paths the operator never wants this on top of
  const shouldSuppress = SUPPRESS_PATHS.some(p => pathname?.startsWith(p));

  useEffect(() => {
    if (shouldSuppress) return;
    if (process.env.NEXT_PUBLIC_EXIT_INTENT_DISABLED === 'true') return;
    if (typeof window === 'undefined') return;
    // Already shown this session, or already subscribed previously
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (localStorage.getItem(PERSISTENT_KEY)) return;
    // Respect reduced-motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    dwellStartRef.current = Date.now();

    function trigger(via: 'desktop_top_edge' | 'mobile_fast_scroll_up') {
      if (Date.now() - dwellStartRef.current < MIN_DWELL_MS) return;
      if (sessionStorage.getItem(SESSION_KEY)) return;
      sessionStorage.setItem(SESSION_KEY, '1');
      setOpen(true);
      trackEvent('exit_intent_shown', { via, path: pathname ?? '/' });
    }

    function onMouseLeave(e: MouseEvent) {
      // Only fire when cursor exits via the TOP of the viewport (going for
      // browser chrome / back button / new tab). clientY < 0 is the
      // standard cross-browser way to detect that — relatedTarget is too
      // flaky in modern browsers.
      if (e.clientY <= 0) trigger('desktop_top_edge');
    }

    function onScroll() {
      const y = window.scrollY;
      const t = Date.now();
      const dy = y - lastScrollYRef.current;
      const dt = t - lastScrollTRef.current;
      lastScrollYRef.current = y;
      lastScrollTRef.current = t;
      // Mobile heuristic: rapid upward scroll (negative dy / unit time) past
      // some depth. 30% depth gate ensures we don't ambush "they accidentally
      // pulled down then scrolled back up at the top."
      const depthFraction = y / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      if (depthFraction < 0.30) return;
      const velocity = dy / Math.max(1, dt); // pixels / ms, negative = up
      if (velocity < -1.5) trigger('mobile_fast_scroll_up');
    }

    window.addEventListener('mouseout', onMouseLeave);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('mouseout', onMouseLeave);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname, shouldSuppress]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        trackEvent('exit_intent_dismissed', { method: 'escape' });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Synchronous guard against double-submit before the button-disabled
    // state lands. Re-clicking before setState commits could otherwise
    // fire two POSTs from the same form open.
    if (submitting) return;
    setError(null);
    if (!isClientEmailValid(email)) {
      setError('Enter a valid email.');
      return;
    }
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken('exit_intent');
      const honeypot = (new FormData(e.currentTarget).get('website') as string) ?? '';
      const attribution = readUtmsFromCookie();
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: '—',
          subscription_type: 'market-report',
          source: 'exit-intent',
          filters: { offer: 'q2-2026-texas-market-report' },
          recaptchaToken,
          website: honeypot,
          ...attribution,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not subscribe');
      }
      setSubmitted(true);
      localStorage.setItem(PERSISTENT_KEY, '1');
      trackEvent('exit_intent_submitted', {
        path: pathname ?? '/',
        attribution_source: attribution.utm_source ?? 'direct',
      });
    } catch (err) {
      setError((err as Error).message);
      trackEvent('exit_intent_failed', { reason: (err as Error).message?.slice(0, 80) });
    } finally {
      setSubmitting(false);
    }
  }

  function dismiss() {
    setOpen(false);
    trackEvent('exit_intent_dismissed', { method: 'close_button' });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-intent-title"
      onClick={dismiss}
    >
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-muted hover:text-primary hover:bg-background-cream/60 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="p-7 sm:p-8 text-center">
            <div className="mx-auto h-12 w-12 inline-flex items-center justify-center rounded-full bg-green-100 text-green-700 mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="font-heading text-heading-md font-bold text-primary mb-2">Check your inbox.</h2>
            <p className="text-body-sm text-foreground-muted">
              Q2 2026 Texas commercial real estate report is on its way. You&apos;ll also be the first to hear about new listings matching your filters as we add them.
            </p>
          </div>
        ) : (
          <div className="p-7 sm:p-8">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-gold">
              <FileText className="h-5 w-5" />
            </div>
            <h2 id="exit-intent-title" className="font-heading text-heading-md font-bold text-primary mb-2">
              Before you go — get our Q2 Texas market report.
            </h2>
            <p className="text-body-sm text-foreground-muted mb-5">
              Cap rates, vacancy by submarket, and what we&apos;re seeing in active deal flow across San Antonio, Austin, Houston, and DFW. Free. No call.
            </p>

            <form onSubmit={handleSubmit}>
              <Honeypot />
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  aria-required="true"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  aria-label="Email address"
                  autoFocus
                  className="flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary placeholder:text-foreground-muted focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 whitespace-nowrap"
                >
                  {submitting ? 'Sending…' : <>Send me the report <ArrowRight className="h-4 w-4" /></>}
                </button>
              </div>
              {error && (
                <p
                  role="alert"
                  aria-live="polite"
                  className="mt-2 text-caption text-destructive"
                >
                  {error}
                </p>
              )}
              <p className="mt-3 text-caption text-foreground-muted">
                We never sell your info. One report now, then quarterly market updates. Unsubscribe anytime.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
