import { supabaseAdmin } from "@/lib/supabase/server";
import { GRAPH_BASE } from "@/lib/facebook/oauth";
import type { AppSettings } from "@/lib/types";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";

export class FacebookNotConnectedError extends Error {
  constructor() {
    super("Facebook is not connected. Connect it from Settings first.");
  }
}

export class NoPageSelectedError extends Error {
  constructor() {
    super("No Facebook Page selected. Choose one on the Pages screen first.");
  }
}

async function loadSettings(): Promise<AppSettings> {
  const user = await getAuthenticatedUser();
  const db = supabaseAdmin();
  const { data } = await db.from("app_settings").select("*").eq("user_id", user.id).single<AppSettings>();
  if (!data) throw new Error("Settings row is missing.");
  return data;
}

async function graph(path: string, params: Record<string, string>, init?: RequestInit) {
  const url = `${GRAPH_BASE}${path}`;
  const res = await fetch(init?.method === "POST" ? url : `${url}?${new URLSearchParams(params)}`, {
    ...init,
    ...(init?.method === "POST"
      ? {
          headers: { "Content-Type": "application/x-www-form-urlencoded", ...init?.headers },
          body: new URLSearchParams(params),
        }
      : {}),
    signal: AbortSignal.timeout(30_000),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || body?.error) {
    throw new Error(body?.error?.message ?? `Facebook API ${path} failed (${res.status})`);
  }
  return body;
}

export interface FacebookPage {
  id: string;
  name: string;
  category: string | null;
  /** Non-expiring when minted from a long-lived user token. */
  access_token: string;
}

/**
 * Every Page this person can create content on. `tasks` is filtered rather
 * than trusted wholesale: being able to see a Page does not mean being allowed
 * to publish to it, and finding that out at post time would be far worse.
 *
 * Note: This filter excludes Pages that don't have the CREATE_CONTENT task.
 * If Meta returns all Pages but only some have CREATE_CONTENT, those without
 * the task will not appear in the Pages list.
 */
export async function fetchPages(): Promise<FacebookPage[]> {
  const settings = await loadSettings();
  if (!settings.facebook_user_token) throw new FacebookNotConnectedError();

  const pages: FacebookPage[] = [];
  const skippedPages: Array<{ id: string; name: string; tasks: string[] }> = [];
  let after: string | undefined;
  let totalMetaPages = 0;

  do {
    const params: Record<string, string> = {
      access_token: settings.facebook_user_token,
      fields: "id,name,category,access_token,tasks",
      limit: "100",
    };
    if (after) params.after = after;

    const data = await graph("/me/accounts", params);
    totalMetaPages += (data.data ?? []).length;

    for (const p of data.data ?? []) {
      if (Array.isArray(p.tasks) && !p.tasks.includes("CREATE_CONTENT")) {
        skippedPages.push({
          id: p.id,
          name: p.name,
          tasks: p.tasks,
        });
        continue;
      }
      pages.push({
        id: p.id,
        name: p.name,
        category: p.category ?? null,
        access_token: p.access_token,
      });
    }
    after = data.paging?.cursors?.after && data.paging?.next ? data.paging.cursors.after : undefined;
  } while (after);

  // Log diagnostic information (safe - no tokens exposed)
  console.log(`[Facebook Pages] Meta returned: ${totalMetaPages} Pages`);
  console.log(`[Facebook Pages] After CREATE_CONTENT filter: ${pages.length} Pages`);
  console.log(`[Facebook Pages] Skipped: ${skippedPages.length} Pages (missing CREATE_CONTENT task)`);
  if (skippedPages.length > 0) {
    console.log(`[Facebook Pages] Skipped Page IDs: ${skippedPages.map(p => p.id).join(", ")}`);
  }

  return pages;
}

/** Permissions this app cannot work without. */
export const REQUIRED_PERMISSIONS = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
];

/**
 * Which of the required permissions the connected account actually granted.
 *
 * Worth checking explicitly: when the Meta app uses Login for Business the
 * permissions come from a saved configuration, so a configuration missing
 * `pages_manage_posts` connects perfectly and then fails at publish time with a
 * bare "(#200) Permissions error" that names nothing.
 */
export async function missingPermissions(userToken: string): Promise<string[]> {
  try {
    const data = await graph("/me/permissions", { access_token: userToken });
    const granted = new Set(
      (data.data ?? [])
        .filter((p: { status: string }) => p.status === "granted")
        .map((p: { permission: string }) => p.permission)
    );
    return REQUIRED_PERMISSIONS.filter((p) => !granted.has(p));
  } catch {
    return [];
  }
}

export async function fetchAccount(): Promise<{ name: string }> {
  const settings = await loadSettings();
  if (!settings.facebook_user_token) throw new FacebookNotConnectedError();
  const data = await graph("/me", { access_token: settings.facebook_user_token, fields: "name" });
  return { name: data.name };
}

export interface PublishPhotoInput {
  pageId: string;
  pageToken: string;
  message: string;
  imageUrl: string;
}

/**
 * Publishes a photo post. Meta fetches the image from `url` itself, which is
 * why every generated image is re-hosted on Supabase Storage first — a
 * best-effort free provider's URL would not be a safe thing for Facebook's
 * crawler to depend on.
 */
export async function publishPhoto(input: PublishPhotoInput): Promise<{ id: string }> {
  const data = await graph(
    `/${input.pageId}/photos`,
    {
      url: input.imageUrl,
      message: input.message,
      access_token: input.pageToken,
      published: "true",
    },
    { method: "POST" }
  );
  return { id: data.post_id ?? data.id };
}
