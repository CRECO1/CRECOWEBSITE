import { createClient } from './supabase/client';

/**
 * Two-step sign-in (TOTP authenticator app) for the team portal, built on
 * Supabase Auth MFA. A session is "aal1" after the password and "aal2" once a
 * 6-digit code has also been verified. The middleware requires aal2 for
 * /admin and /billing whenever the account has a verified factor.
 */

export interface MfaState {
  currentLevel: 'aal1' | 'aal2' | null;
  nextLevel: 'aal1' | 'aal2' | null;
  /** Id of the verified TOTP factor, when the account has one. */
  factorId: string | null;
}

export async function getMfaState(): Promise<MfaState> {
  const supabase = createClient();
  const { data: aal, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error) throw error;
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const verified = factors?.totp?.find(f => f.status === 'verified') ?? null;
  return {
    currentLevel: aal?.currentLevel ?? null,
    nextLevel: aal?.nextLevel ?? null,
    factorId: verified?.id ?? null,
  };
}

/** Check a 6-digit code against a factor. Throws on a wrong or expired code. */
export async function verifyMfaCode(factorId: string, code: string) {
  const supabase = createClient();
  const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId });
  if (cErr) throw cErr;
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() });
  if (error) throw error;
}

/** Start enrolling an authenticator app. Returns the QR code and manual key. */
export async function startTotpEnrollment() {
  const supabase = createClient();
  // Clear any half-finished enrollment so the user always gets a fresh QR.
  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const f of existing?.all ?? []) {
    if (f.factor_type === 'totp' && f.status !== 'verified') {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator app' });
  if (error) throw error;
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
}

export async function removeTotpFactor(factorId: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}
