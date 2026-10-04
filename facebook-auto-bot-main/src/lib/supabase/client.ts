import { createBrowserClient } from "@supabase/ssr";

/**
 * Client-side Supabase client for browser auth.
 * Uses the anon key which is safe to expose in the browser.
 * This client is used for authentication and user-specific data access.
 *
 * IMPORTANT: This is a singleton to avoid multiple client instances
 * which cause undefined behavior and session conflicts.
 */
let supabaseClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseClient() {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  // Next.js automatically makes NEXT_PUBLIC_* available on client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Check .env.local"
    );
  }

  supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseClientInstance;
}
