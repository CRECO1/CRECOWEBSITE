'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getMfaState, removeTotpFactor, startTotpEnrollment, verifyMfaCode } from '@/lib/mfa';

type Enrollment = { factorId: string; qrCode: string; secret: string };

function SecurityPanel() {
  const required = useSearchParams().get('required') === '1';
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(true);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const s = await getMfaState();
      setFactorId(s.factorId);
    } catch {
      setSignedIn(false);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  async function begin() {
    setError(''); setBusy(true);
    try {
      setEnrollment(await startTotpEnrollment());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start setup. Try again.');
    } finally { setBusy(false); }
  }

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!enrollment) return;
    setError(''); setBusy(true);
    try {
      await verifyMfaCode(enrollment.factorId, code);
      setEnrollment(null); setCode(''); setDone(true);
      await refresh();
    } catch {
      setError('That code did not match. Wait for the next code in your app and try again.');
      setCode('');
    } finally { setBusy(false); }
  }

  async function turnOff() {
    if (!factorId) return;
    setError(''); setBusy(true);
    try {
      await removeTotpFactor(factorId);
      setDone(false);
      await refresh();
    } catch {
      setError('Turning this off needs a fresh two-step sign-in. Sign out, sign back in with your code, then try again.');
    } finally { setBusy(false); }
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
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20">
              {factorId ? <ShieldCheck className="h-5 w-5 text-gold-dark" /> : <ShieldAlert className="h-5 w-5 text-gold-dark" />}
            </div>
            <h1 className="font-heading text-heading-xl font-bold text-primary">Two-Step Sign-In</h1>
          </div>

          {required && !factorId && (
            <p className="mb-4 rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-body-sm text-primary">
              Two-step sign-in is required to reach the admin and billing areas. Set it up below, then continue.
            </p>
          )}
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-body-sm text-destructive">{error}</div>
          )}

          {loading ? (
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          ) : !signedIn ? (
            <p className="text-body-sm text-foreground-muted">
              Sign in first, then come back to this page.{' '}
              <Link className="font-semibold text-gold-dark hover:underline" href="/manage/login?redirect=/manage/security">Sign in</Link>
            </p>
          ) : factorId ? (
            <div className="space-y-4">
              <p className="text-body-sm text-foreground-muted">
                {done ? 'Done. ' : ''}Two-step sign-in is <strong className="text-primary">on</strong>. You will enter a 6-digit code from your authenticator app each time you sign in.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild><Link href="/admin">Continue to admin</Link></Button>
                <Button variant="outline" onClick={turnOff} loading={busy}>Turn off</Button>
              </div>
            </div>
          ) : enrollment ? (
            <form onSubmit={confirm} className="space-y-4">
              <ol className="list-decimal space-y-1 pl-5 text-body-sm text-foreground-muted">
                <li>Open an authenticator app (Google Authenticator, 1Password, Authy).</li>
                <li>Scan this code, or type the key below.</li>
                <li>Enter the 6-digit code the app shows.</li>
              </ol>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={enrollment.qrCode} alt="QR code to add CRECO to your authenticator app" className="mx-auto h-44 w-44" />
              <p className="break-all rounded-lg bg-background-cream px-3 py-2 text-center font-mono text-caption text-primary">{enrollment.secret}</p>
              <input
                type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code"
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456" aria-label="6-digit verification code"
                className="w-full rounded-lg border border-border px-4 py-3 text-center text-heading-sm tracking-[0.4em] text-primary focus:outline-none focus:ring-2 focus:ring-gold-dark"
              />
              <Button type="submit" size="lg" fullWidth loading={busy}>Turn on two-step sign-in</Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-body-sm text-foreground-muted">
                Add a second step to your sign-in. After your password you will enter a 6-digit code from an authenticator app on your phone, so a stolen password alone cannot open the admin or billing areas.
              </p>
              <Button size="lg" fullWidth onClick={begin} loading={busy}>Set up two-step sign-in</Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ManageSecurityPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-background-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
      </main>
    }>
      <SecurityPanel />
    </Suspense>
  );
}
