'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { signIn } from '@/lib/auth';
import { getMfaState, verifyMfaCode } from '@/lib/mfa';

/**
 * Constrain post-login redirects to same-origin paths only. Without this
 * validation, an attacker can craft a phishing URL like
 *   /manage/login?redirect=https://evil.com
 * and the browser would jump straight to evil.com after a successful
 * sign-in. The check rejects:
 *   - any string that doesn't start with "/"  (absolute URLs)
 *   - "//"-prefixed protocol-relative URLs
 *   - "/\..." (some browsers treat that as protocol-relative)
 *   - non-string values
 */
function safeRedirect(value: string | null): string {
  if (typeof value !== 'string' || value.length === 0) return '/admin';
  if (value[0] !== '/') return '/admin';
  if (value.length > 1 && (value[1] === '/' || value[1] === '\\')) return '/admin';
  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // After sign-in, send the user to the admin editor at /admin. The
  // ?redirect=… query param overrides this when middleware bounced them
  // here from a deep link — but only same-origin paths are honored.
  const redirect = safeRedirect(searchParams.get('redirect'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Second step: the account has an authenticator app, so the password alone
  // is not enough. mfaFactor holds the factor id while we wait for the code.
  const [mfaFactor, setMfaFactor] = useState<string | null>(null);
  const [code, setCode] = useState('');

  // The middleware sends a password-only session here with ?mfa=1 when it
  // reaches /admin or /billing without the code. Jump straight to the code step.
  useEffect(() => {
    if (searchParams.get('mfa') !== '1') return;
    getMfaState()
      .then(s => { if (s.factorId && s.currentLevel !== 'aal2') setMfaFactor(s.factorId); })
      .catch(() => { /* no session: show the normal password form */ });
  }, [searchParams]);

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaFactor) return;
    setError('');
    setLoading(true);
    try {
      await verifyMfaCode(mfaFactor, code);
      router.push(redirect);
    } catch {
      setError('That code did not work. Check your authenticator app and try again.');
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      const state = await getMfaState();
      if (state.factorId && state.currentLevel !== 'aal2') {
        setMfaFactor(state.factorId);
        return;
      }
      router.push(redirect);
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-cream p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-10 text-center">
          <span className="font-heading text-2xl font-bold tracking-tight text-primary">
            CRE<span className="text-gold">CO</span>
          </span>
          <p className="mt-2 text-body-sm text-foreground-muted">Team Portal</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl bg-white p-8 shadow-card">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20">
              <Lock className="h-5 w-5 text-gold-dark" />
            </div>
            <h1 className="font-heading text-heading-xl font-bold text-primary">{mfaFactor ? 'Verify It\'s You' : 'Sign In'}</h1>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">
              {error}
            </div>
          )}

          {mfaFactor ? (
            <form onSubmit={handleCode} className="space-y-4">
              <p className="flex items-center gap-2 text-body-sm text-foreground-muted">
                <ShieldCheck className="h-4 w-4 text-gold-dark" />
                Enter the 6-digit code from your authenticator app.
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                autoComplete="one-time-code"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                aria-label="6-digit verification code"
                className="w-full rounded-lg border border-border px-4 py-3 text-center text-heading-sm tracking-[0.4em] text-primary focus:outline-none focus:ring-2 focus:ring-gold-dark"
              />
              <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
                Verify
              </Button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-readable">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@crecotx.com"
                className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold-dark"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label-readable">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border px-4 py-3 pr-12 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold-dark"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
              Sign In
            </Button>
          </form>
          )}

          <div className="mt-5 text-center">
            <Link
              href="/manage/forgot-password"
              className="text-body-sm text-foreground-muted hover:text-gold transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-caption text-foreground-muted">
          Need access?{' '}
          <a href="mailto:info@crecotx.com" className="text-gold hover:underline">
            Contact your administrator
          </a>
        </p>
      </div>
    </main>
  );
}

export default function ManageLoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-background-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
