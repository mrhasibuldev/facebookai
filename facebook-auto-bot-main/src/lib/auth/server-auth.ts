import { supabaseServer } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { AuthenticationError } from "@/lib/errors";

/**
 * Get the authenticated user from the server-side session.
 * Throws AuthenticationError if user is not authenticated.
 *
 * This is a centralized helper to avoid repeated auth checks in database functions.
 */
export async function getAuthenticatedUser(): Promise<User> {
  const db = await supabaseServer();
  const { data: { user }, error } = await db.auth.getUser();

  if (error) {
    throw new AuthenticationError(`Failed to get user: ${error.message}`);
  }

  if (!user) {
    throw new AuthenticationError("User not authenticated");
  }

  return user;
}

/**
 * Get the authenticated user ID.
 * Convenience function for common use case.
 */
export async function getUserId(): Promise<string> {
  const user = await getAuthenticatedUser();
  return user.id;
}

/**
 * Check if user is authenticated without throwing.
 * Returns null if not authenticated.
 */
export async function maybeGetUser(): Promise<User | null> {
  try {
    return await getAuthenticatedUser();
  } catch {
    return null;
  }
}
