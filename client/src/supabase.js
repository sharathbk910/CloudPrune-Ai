import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client & Configuration Helper
 * Reads configuration from Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 */
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || null;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || null;

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * Initiates native Google OAuth 2.0 via Supabase with prompt: 'select_account'
 * Ensures Google's official account picker opens for the visitor's device.
 */
export async function signInWithGoogle() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      queryParams: {
        prompt: 'select_account'
      },
      redirectTo: window.location.origin + window.location.pathname
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Initiates Email OTP verification via Supabase Auth
 * @param {string} email
 */
export async function signInWithOtp(email) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    }
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Verifies Email OTP token via Supabase Auth
 * @param {string} email
 * @param {string} token - 6-digit numeric OTP
 */
export async function verifyOtp(email, token) {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email'
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out helper
 */
export async function signOut() {
  if (supabase) {
    await supabase.auth.signOut();
  }
}

