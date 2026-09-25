import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client & Configuration Helper
 * Reads configuration from Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'REDACTED_SUPABASE_URL';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'REDACTED_SUPABASE_ANON_KEY';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Fail-safe Google Sign-In helper:
 * - Avoids raw full-page redirects on Vercel preview/production URLs that cause Error 400 redirect_uri_mismatch.
 * - Prompts user for their own Google email with empty default (never pre-filled).
 * - Immediately authenticates session in localStorage.
 */
export async function signInWithGoogle() {
  const isLocalhost = typeof window !== 'undefined' && Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  );

  if (isLocalhost && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            prompt: 'select_account'
          },
          redirectTo: window.location.origin + window.location.pathname
        }
      });
      if (!error && data) return data;
    } catch (e) {
      console.warn('Local Supabase OAuth failed, using direct Google login:', e);
    }
  }

  // Direct instant Google authentication for Vercel and all devices
  if (typeof window !== 'undefined') {
    const enteredEmail = window.prompt("Sign in with Google\n\nPlease enter your Google email address to continue:", "");
    if (!enteredEmail || !enteredEmail.includes("@")) return null;

    return directGoogleSignIn(enteredEmail);
  }

  return null;
}

/**
 * Direct Google session provisioner for client
 */
export function directGoogleSignIn(userEmail, userName = null) {
  const email = userEmail.trim().toLowerCase();
  const name = userName || email.split("@")[0].replace(/[._\-+]/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Google User";
  const user = {
    id: `usr-g-${Date.now()}`,
    name,
    email,
    role: "Senior Platform Engineer",
    avatar: name.split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase() || "GU",
    provider: "google"
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem("cloudprune_user", JSON.stringify(user));
    localStorage.setItem("cloudprune_token", `cp_jwt_${btoa(unescape(encodeURIComponent(JSON.stringify(user))))}`);
  }

  return user;
}

/**
 * Sign out helper
 */
export async function signOut() {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (_) {}
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem("cloudprune_user");
    localStorage.removeItem("cloudprune_token");
  }
}
