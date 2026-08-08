import { createClient } from './supabase/client';

// Sign in with email and password
export async function signIn(email: string, password: string) {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

// Sign out
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Send a password recovery email. The redirect lands on /manage/reset-password
// where the user finishes setting a new password. The destination URL must
// be on the project's allowed-redirect list in Supabase Auth settings.
export async function requestPasswordReset(email: string) {
  const supabase = createClient();
  const redirectTo =
    typeof window !== 'undefined'
      ? `${window.location.origin}/manage/reset-password`
      : 'https://www.crecotx.com/manage/reset-password';
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
}

// Update the signed-in user's password. Called from /manage/reset-password
// after Supabase has auto-detected the recovery token in the URL fragment
// and established a temporary session.
export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// Get current session
export async function getSession() {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}
