import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";
import { logError } from "@/lib/errors";

/**
 * Delete user account and all associated data.
 * This is a destructive operation that cannot be undone.
 *
 * Security:
 * - Requires authenticated user
 * - Uses service-role key to bypass RLS for cleanup
 * - Deletes user data before deleting auth user
 * - Validates user can only delete their own account
 */
export async function POST(_req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const db = supabaseAdmin();

    // Delete user's posts
    const { error: postsError } = await db
      .from("posts")
      .delete()
      .eq("user_id", user.id);

    if (postsError) {
      logError("Delete Account - Posts", postsError);
      // Continue despite error - try to delete other data
    }

    // Delete user's topics
    const { error: topicsError } = await db
      .from("topics")
      .delete()
      .eq("user_id", user.id);

    if (topicsError) {
      logError("Delete Account - Topics", topicsError);
      // Continue despite error
    }

    // Delete user's settings
    const { error: settingsError } = await db
      .from("app_settings")
      .delete()
      .eq("user_id", user.id);

    if (settingsError) {
      logError("Delete Account - Settings", settingsError);
      // Continue despite error
    }

    // Delete user's avatar from storage if exists
    const { data: settings } = await db
      .from("app_settings")
      .select("avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settings?.avatar_url) {
      try {
        const url = new URL(settings.avatar_url);
        const pathParts = url.pathname.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const filePath = `${user.id}/${fileName}`;

        await db.storage.from("avatars").remove([filePath]);
      } catch (storageError) {
        logError("Delete Account - Avatar Storage", storageError);
        // Continue despite error
      }
    }

    // Delete the Supabase Auth user
    const { error: authError } = await db.auth.admin.deleteUser(user.id);

    if (authError) {
      logError("Delete Account - Auth User", authError);
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("Delete Account", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete account" },
      { status: 500 }
    );
  }
}
