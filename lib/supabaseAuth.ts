import { getSupabaseClient } from './supabase';

/**
 * Supabase OAuth helpers.
 * These are ONLY used for Google OAuth and email magic link.
 * The existing JWT/MySQL login/signup is completely untouched.
 */

/**
 * Sign in with Google via Supabase OAuth.
 * Redirects the browser to Google, then back to /auth/callback.
 */
export async function signInWithGoogle(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file.');
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}

/**
 * Send a magic link (OTP) to the given email.
 * User clicks the link in their email and lands on /auth/callback.
 */
export async function sendMagicLink(email: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to your .env file.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}

/**
 * Get the current Supabase session (if any).
 * Returns null if no Supabase session exists.
 */
export async function getSupabaseSession() {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Sign out from Supabase.
 * Called alongside the existing JWT clearAuth() on logout.
 */
export async function supabaseSignOut(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}
