'use client';

/**
 * Step 2 of the password reset flow. Supabase's recovery email links here
 * with the recovery token in the URL fragment. The Supabase JS client
 * auto-detects it (detectSessionInUrl: true is the default) and establishes
 * a temporary session — at which point we can call updateUser({ password }).
 *
 * We use onAuthStateChange to listen for the PASSWORD_RECOVERY event before
 * showing the form. If the user navigates here without a valid recovery
 * token, we surface a friendly message instead of silently failing the
 * update later.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { updatePassword } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

const MIN_PASSWORD_LEN = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Wait for Supabase to read the recovery token from the URL fragment and
  // fire PASSWORD_RECOVERY. If we already have a session by mount time
  // (refresh after the event fired), accept that too.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });

    // Check for an existing session (covers the refresh-after-recovery case)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        setReady(true);
      } else {
        // Give Supabase a moment to process the URL fragment, then surface
        // an error if no recovery event arrived
        setTimeout(() => {
          if (!cancelled && !ready) {
            setTokenError(
              "This reset link is invalid or has expired. Request a new one from the sign-in page.",
            );
          }
        }, 1500);
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LEN) {
      setError(`Password must be at least ${MIN_PASSWORD_LEN} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setDone(true);
      // Redirect into the admin editor after a beat
      setTimeout(() => router.push('/admin'), 2000);
    } catch (err) {
      setError((err as Error).message || 'Could not update password. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background-cream p-6">
        <div className="w-full max-w-md text-center">
          <div className="mb-10">
            <span className="font-heading text-2xl font-bold tracking-tight text-primary">
              CRE<span className="text-gold">CO</span>
            </span>
            <p className="mt-2 text-body-sm text-foreground-muted">Team Portal</p>
          </div>
          <div className="rounded-2xl bg-white p-8 shadow-card">
            <CheckCircle className="mx-auto h-12 w-12 text-gold mb-4" />
            <h1 className="font-heading text-heading-xl font-bold text-primary mb-2">Password updated</h1>
            <p className="text-body-sm text-foreground-muted">
              Redirecting you to the admin panel…
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-cream p-6">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <span className="font-heading text-2xl font-bold tracking-tight text-primary">
            CRE<span className="text-gold">CO</span>
          </span>
          <p className="mt-2 text-body-sm text-foreground-muted">Team Portal</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-card">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20">
              <KeyRound className="h-5 w-5 text-gold-dark" />
            </div>
            <h1 className="font-heading text-heading-xl font-bold text-primary">Set new password</h1>
          </div>

          {tokenError ? (
            <>
              <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">
                {tokenError}
              </p>
              <Link
                href="/manage/forgot-password"
                className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-dark hover:text-gold"
              >
                Request a new reset link
              </Link>
            </>
          ) : !ready ? (
            <p className="text-body-sm text-foreground-muted">Verifying your reset link…</p>
          ) : (
            <>
              <p className="text-body-sm text-foreground-muted mb-6">
                Pick a new password. Minimum {MIN_PASSWORD_LEN} characters.
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label-readable">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={MIN_PASSWORD_LEN}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-border px-4 py-3 pr-12 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
                      autoComplete="new-password"
                      autoFocus
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
                <div>
                  <label className="label-readable">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={MIN_PASSWORD_LEN}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
                  Update password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
