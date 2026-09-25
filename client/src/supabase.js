/**
 * Supabase Client — CloudPrune AI
 *
 * Initializes @supabase/supabase-js with VITE_ env vars.
 * Exposes `supabase` (the live client) and `isSupabaseConfigured`
 * (a boolean guard used by the rest of the app).
 */

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_URL.includes('your-project')
);

/**
 * Live Supabase client instance.
 * Will be `null` if credentials are not set — callers must guard with
 * `isSupabaseConfigured` before using this value.
 */
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
