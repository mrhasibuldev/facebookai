import { createBrowserClient } from "@supabase/ssr";
import { logError } from "@/lib/errors";

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
    const missing = [];
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    logError("SupabaseClient", new Error(`Missing environment variables: ${missing.join(", ")}`));
    console.error("[SupabaseClient] Missing environment variables:", missing);
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Please check your .env.local file.`
    );
  }

  try {
    console.log("[SupabaseClient] Initializing client with URL:", supabaseUrl);
    supabaseClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return '';
          const value = document.cookie
            .split('; ')
            .find((row) => row.startsWith(name + '='))
            ?.split('=')[1];
          return value || '';
        },
        set(name: string, value: string, options: { maxAge?: number; path?: string; domain?: string; secure?: boolean; httpOnly?: boolean; sameSite?: string | boolean }) {
          if (typeof document === 'undefined') return;
          let cookieString = `${name}=${value}`;
          if (options.maxAge) cookieString += `; Max-Age=${options.maxAge}`;
          if (options.path) cookieString += `; Path=${options.path}`;
          if (options.domain) cookieString += `; Domain=${options.domain}`;
          if (options.secure) cookieString += `; Secure`;
          if (options.httpOnly) cookieString += `; HttpOnly`;
          if (options.sameSite) cookieString += `; SameSite=${options.sameSite}`;
          document.cookie = cookieString;
        },
        remove(name: string, options: { path?: string; domain?: string }) {
          if (typeof document === 'undefined') return;
          let cookieString = `${name}=; Max-Age=0`;
          if (options.path) cookieString += `; Path=${options.path}`;
          if (options.domain) cookieString += `; Domain=${options.domain}`;
          document.cookie = cookieString;
        },
      },
    });
    console.log("[SupabaseClient] Client initialized successfully");
  } catch (err) {
    logError("SupabaseClient", err);
    console.error("[SupabaseClient] Initialization error:", err);
    // Check if error is related to database not being set up
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('relation') || errorMsg.includes('table') || errorMsg.includes('does not exist')) {
      throw new Error("Database not configured. Please run the SQL schema from supabase/schema.sql in your Supabase SQL Editor.");
    }
    throw new Error("Failed to initialize Supabase client. Please check your configuration.");
  }

  return supabaseClientInstance;
}
