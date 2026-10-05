import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logError } from "@/lib/errors";

/**
 * Server-only Supabase client using the service-role key.
 * This bypasses RLS and is used for admin operations.
 * NEVER import this file from a Client Component.
 */
export function supabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    const missing = [];
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseServiceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

    logError("SupabaseAdmin", new Error(`Missing environment variables: ${missing.join(", ")}`));
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Please check your .env.local file.`
    );
  }

  try {
    return createServerClient(supabaseUrl, supabaseServiceRoleKey, {
      cookies: {
        getAll() {
          return [];
        },
      },
    });
  } catch (err) {
    logError("SupabaseAdmin", err);
    throw new Error("Failed to initialize Supabase admin client. Please check your configuration.");
  }
}

/**
 * Server-side Supabase client that respects the user's auth session.
 * Uses the anon key and reads the session from cookies.
 * This client respects RLS policies and should be used for user-specific data.
 * NEVER import this file from a Client Component.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [];
    if (!supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
    if (!supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");

    logError("SupabaseServer", new Error(`Missing environment variables: ${missing.join(", ")}`));
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Please check your .env.local file.`
    );
  }

  try {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    });
  } catch (err) {
    logError("SupabaseServer", err);
    throw new Error("Failed to initialize Supabase server client. Please check your configuration.");
  }
}
