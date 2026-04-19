import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client — used ONLY for OAuth 2.0 (Google) and email magic link.
 * The existing JWT/MySQL auth system is completely separate and unaffected.
 *
 * Required env vars (add to .env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

// Only create the client if the env vars are present.
// This prevents crashes if someone runs the app without Supabase configured.
let _supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }
  if (!_supabaseClient) {
    _supabaseClient = createClient(supabaseUrl, supabasePublishableKey);
  }
  return _supabaseClient;
}

export default getSupabaseClient;
