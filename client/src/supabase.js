/**
 * Supabase Client & Configuration Helper
 * Reads configuration from Vite environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 */

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project')
);

/**
 * If you install @supabase/supabase-js:
 *   npm install @supabase/supabase-js
 * 
 * You can initialize the client like this:
 * 
 * import { createClient } from '@supabase/supabase-js';
 * export const supabase = isSupabaseConfigured
 *   ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
 *   : null;
 */
