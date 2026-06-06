'use client';

/**
 * SignupForm — the client-side form for /signup.
 *
 * Lives in its own file because the parent /signup/page.tsx is a server
 * component (lets us set static metadata + reuse server-side rendering
 * for first paint), while the form needs useState + useRouter.
 *
 * UX rules:
 *   - Inline validation messages, not modal alerts. Operators hate
 *     pop-ups.
 *   - Honeypot field (CSS-hidden) — bots fill it, humans don't.
 *   - Loading state on the submit button with a spinner.
 *   - Network failures: surface the actual error message from the API
 *     in the red banner. The API returns user-actionable messages
 *     (e.g. "An account with this email already exists. Sign in
 *     instead.") and links accordingly.
 *   - Duplicate-email path: link straight to /manage/login with the
 *     email pre-filled.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertTriangle, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function SignupForm() {
  const router = useRouter();
  const [brokerage, setBrokerage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateEmail, setDuplicateEmail] = useState<string | null>(null);

  const inputCls =
    'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-body-sm text-primary focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDuplicateEmail(null);

    // Client-side validation — duplicates the server checks so we
    // surface obvious errors without a round trip.
    if (brokerage.trim().length < 2) {
      setError('Brokerage name is required.');
      return;
    }
    if (!/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brokerage_name: brokerage.trim(),
          admin_email: email.trim().toLowerCase(),
          admin_password: password,
          website, // honeypot
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409 && data.duplicate) {
          setDuplicateEmail(email.trim().toLowerCase());
        }
        setError(data.error ?? `Signup failed (${res.status})`);
        setSubmitting(false);
        return;
      }
      // Success — redirect to /onboard/welcome with the workspace slug
      // so the welcome page can show "your workspace at /workspaces/X"
      // (and to make the URL bookmarkable in case the operator closes
      // the tab before verifying).
      router.push(`/onboard/welcome?ws=${encodeURIComponent(data.workspace_slug ?? '')}`);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-sm space-y-5">
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-body-sm text-red-800">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{error}</p>
            {duplicateEmail && (
              <Link
                href={`/manage/login?email=${encodeURIComponent(duplicateEmail)}`}
                className="inline-flex items-center gap-1 mt-2 text-red-900 font-semibold hover:underline"
              >
                Sign in instead <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      )}

      <label className="block">
        <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">
          Brokerage name
        </span>
        <input
          type="text"
          className={inputCls}
          value={brokerage}
          onChange={e => setBrokerage(e.target.value)}
          placeholder="e.g. Smith Commercial Realty"
          required
          autoComplete="organization"
        />
      </label>

      <label className="block">
        <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">
          Your email
        </span>
        <input
          type="email"
          className={inputCls}
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@brokerage.com"
          required
          autoComplete="email"
        />
        <p className="text-caption text-foreground-muted mt-1">
          We&apos;ll send a verification link here. Used to sign in afterward.
        </p>
      </label>

      <label className="block">
        <span className="block text-caption uppercase tracking-widest text-foreground-muted mb-1.5">
          Password
        </span>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className={`${inputCls} pr-10`}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 10 characters"
            required
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-foreground-muted hover:text-primary"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>

      {/* Honeypot — visually hidden but reachable by naive bots.
          Real users will skip it; submissions with it filled get
          silently accepted server-side. */}
      <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Website (leave blank)
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={e => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-body-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Creating your workspace…</>
        ) : (
          <>Start free trial <ArrowRight className="h-4 w-4" /></>
        )}
      </button>

      <p className="text-caption text-foreground-muted text-center leading-relaxed">
        By starting your trial you agree to the{' '}
        <Link href="/privacy" className="text-gold-dark hover:underline">privacy policy</Link>.
        Your card isn&apos;t charged during the trial.
      </p>
    </form>
  );
}
