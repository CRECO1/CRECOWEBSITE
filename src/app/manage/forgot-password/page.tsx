'use client';

/**
 * Step 1 of the password reset flow. The user types their email; Supabase
 * sends a recovery email; they click the link in that email and land on
 * /manage/reset-password to actually set the new password.
 *
 * We always show the same success message regardless of whether the email
 * exists in our auth table — exposing "no such user" would let an attacker
 * enumerate which emails belong to admins.
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { requestPasswordReset } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await requestPasswordReset(email.trim());
      // Always succeed visibly — see comment above on enumeration
      setSubmitted(true);
    } catch (err) {
      // Network errors / Supabase-down etc. — still show generic success
      // to avoid leaking which emails are valid. Log the real error.
      console.error('Password reset request error:', err);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
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
            <h1 className="font-heading text-heading-xl font-bold text-primary mb-2">Check your inbox</h1>
            <p className="text-body-sm text-foreground-muted mb-6">
              If an account exists for <strong>{email}</strong>, we just sent a password reset link to that address. The link will expire in about an hour. Check spam if you don&apos;t see it.
            </p>
            <Link
              href="/manage/login"
              className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-gold-dark hover:text-gold"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
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
              <Mail className="h-5 w-5 text-gold-dark" />
            </div>
            <h1 className="font-heading text-heading-xl font-bold text-primary">Reset password</h1>
          </div>

          <p className="text-body-sm text-foreground-muted mb-6">
            Enter the email associated with your CRECO admin account. We&apos;ll send you a link to set a new password.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-readable">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@crecotx.com"
                className="w-full rounded-lg border border-border px-4 py-3 text-body-sm text-primary focus:outline-none focus:ring-2 focus:ring-gold"
                autoComplete="email"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" fullWidth loading={loading} className="mt-2">
              Send reset link
            </Button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/manage/login"
              className="inline-flex items-center gap-1.5 text-body-sm text-foreground-muted hover:text-gold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
