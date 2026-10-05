import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Post, PostStatus } from "@/lib/types";
import { logError, getDatabaseErrorMessage } from "@/lib/errors";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";

function toErrorObject(err: unknown): { message?: string; code?: string } | null {
  if (err && typeof err === 'object' && 'message' in err) {
    return err as { message?: string; code?: string };
  }
  return null;
}

export async function listPosts(
  opts: { status?: PostStatus | PostStatus[]; limit?: number } = {}
): Promise<Post[]> {
  try {
    const user = await getAuthenticatedUser();
    const db = await supabaseServer();

    let query = db.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

    if (opts.status) {
      query = Array.isArray(opts.status)
        ? query.in("status", opts.status)
        : query.eq("status", opts.status);
    }
    if (opts.limit) query = query.limit(opts.limit);

    const { data, error } = await query;
    if (error) throw new Error(`Failed to list posts: ${error.message}`);
    return (data ?? []) as Post[];
  } catch (err) {
    logError("listPosts", err);
    throw new Error(getDatabaseErrorMessage(toErrorObject(err)));
  }
}

export async function getPost(id: string): Promise<Post | null> {
  try {
    const user = await getAuthenticatedUser();
    const db = await supabaseServer();

    const { data, error } = await db.from("posts").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
    if (error) throw new Error(`Failed to load post: ${error.message}`);
    return data as Post | null;
  } catch (err) {
    logError("getPost", err);
    throw new Error(getDatabaseErrorMessage(toErrorObject(err)));
  }
}

export async function createPostRecord(
  input: Omit<
    Post,
    "id" | "created_at" | "status" | "posted_at" | "facebook_post_id" | "error_message" | "user_id"
  > & {
    status: PostStatus;
  }
): Promise<Post> {
  try {
    const user = await getAuthenticatedUser();
    const db = await supabaseServer();

    const { data, error } = await db
      .from("posts")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (error) throw new Error(`Failed to create post: ${error.message}`);
    return data as Post;
  } catch (err) {
    logError("createPostRecord", err);
    throw new Error(getDatabaseErrorMessage(toErrorObject(err)));
  }
}

export async function updatePostRecord(id: string, patch: Partial<Post>): Promise<Post> {
  try {
    const user = await getAuthenticatedUser();
    const db = await supabaseServer();

    const { data, error } = await db.from("posts").update(patch).eq("id", id).eq("user_id", user.id).select().single();
    if (error) throw new Error(`Failed to update post: ${error.message}`);
    return data as Post;
  } catch (err) {
    logError("updatePostRecord", err);
    throw new Error(getDatabaseErrorMessage(toErrorObject(err)));
  }
}

export async function deletePostRecord(id: string): Promise<void> {
  try {
    const user = await getAuthenticatedUser();
    const db = await supabaseServer();

    const { error } = await db.from("posts").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw new Error(`Failed to delete post: ${error.message}`);
  } catch (err) {
    logError("deletePostRecord", err);
    throw new Error(getDatabaseErrorMessage(toErrorObject(err)));
  }
}

/** Scheduled posts whose time has come, oldest first — used by the cron worker. */
export async function listDuePosts(nowIso: string): Promise<Post[]> {
  try {
    const db = supabaseAdmin();
    const { data, error } = await db
      .from("posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(20);
    if (error) throw new Error(`Failed to list due posts: ${error.message}`);
    return (data ?? []) as Post[];
  } catch (err) {
    logError("listDuePosts", err);
    throw new Error(getDatabaseErrorMessage(toErrorObject(err)));
  }
}
