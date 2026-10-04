import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { Post, PostStatus } from "@/lib/types";

export async function listPosts(
  opts: { status?: PostStatus | PostStatus[]; limit?: number } = {}
): Promise<Post[]> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

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
}

export async function getPost(id: string): Promise<Post | null> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await db.from("posts").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (error) throw new Error(`Failed to load post: ${error.message}`);
  return data as Post | null;
}

export async function createPostRecord(
  input: Omit<
    Post,
    "id" | "created_at" | "status" | "posted_at" | "facebook_post_id" | "error_message" | "user_id"
  > & {
    status: PostStatus;
  }
): Promise<Post> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await db
    .from("posts")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();
  if (error) throw new Error(`Failed to create post: ${error.message}`);
  return data as Post;
}

export async function updatePostRecord(id: string, patch: Partial<Post>): Promise<Post> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await db.from("posts").update(patch).eq("id", id).eq("user_id", user.id).select().single();
  if (error) throw new Error(`Failed to update post: ${error.message}`);
  return data as Post;
}

export async function deletePostRecord(id: string): Promise<void> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { error } = await db.from("posts").delete().eq("id", id).eq("user_id", user.id);
  if (error) throw new Error(`Failed to delete post: ${error.message}`);
}

/** Scheduled posts whose time has come, oldest first — used by the cron worker. */
export async function listDuePosts(nowIso: string): Promise<Post[]> {
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
}
