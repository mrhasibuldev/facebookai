/**
 * Instagram Client Library
 *
 * Handles Instagram Graph API interactions for publishing content.
 *
 * Uses Instagram API with Instagram Login (NEW ARCHITECTURE):
 * - Direct Instagram authorization (no Facebook Page required)
 * - Uses Instagram User access token
 * - Host URL: graph.instagram.com
 * - Permissions: instagram_business_basic, instagram_business_content_publish
 *
 * Reference: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";

const INSTAGRAM_GRAPH_BASE = "https://graph.instagram.com";

export class InstagramNotConnectedError extends Error {
  constructor() {
    super("Instagram is not connected. Connect it from Settings first.");
  }
}

async function graph(path: string, params: Record<string, string>, init?: RequestInit) {
  const url = `${INSTAGRAM_GRAPH_BASE}${path}`;
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
    throw new Error(body?.error?.message ?? `Instagram API ${path} failed (${res.status})`);
  }
  return body;
}

/**
 * Instagram account from Instagram Business Login
 */
export interface InstagramAccount {
  id: string;
  username: string;
  profile_picture_url?: string;
}

/**
 * Get Instagram connection from social_connections
 */
async function getInstagramConnection() {
  const user = await getAuthenticatedUser();
  const db = supabaseAdmin();

  const { data: connection } = await db
    .from("social_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", "instagram")
    .eq("status", "connected")
    .single();

  if (!connection) {
    throw new InstagramNotConnectedError();
  }

  return connection;
}

/**
 * Get Instagram User access token from connection
 */
async function getInstagramAccessToken(): Promise<string> {
  const connection = await getInstagramConnection();
  const token = connection.metadata?.instagram_token;

  if (!token) {
    throw new Error("Instagram access token not found in connection");
  }

  return token;
}

/**
 * Get Instagram user info (username, etc.)
 */
export async function getInstagramUserInfo(): Promise<InstagramAccount> {
  const token = await getInstagramAccessToken();

  const params = new URLSearchParams({
    fields: "user_id,username,profile_picture_url",
    access_token: token,
  });

  const data = await graph(`/me?${params.toString()}`, {});

  return {
    id: data.data.user_id,
    username: data.data.username,
    profile_picture_url: data.data.profile_picture_url,
  };
}

/**
 * Create a media container for an image
 */
export async function createMediaContainer(
  imageUrl: string,
  caption: string
): Promise<{ id: string }> {
  const token = await getInstagramAccessToken();
  const userInfo = await getInstagramUserInfo();

  const data = await graph(
    `/${userInfo.id}/media`,
    {
      image_url: imageUrl,
      caption: caption,
      access_token: token,
    },
    { method: "POST" }
  );

  return { id: data.id };
}

/**
 * Publish a media container
 */
export async function publishMedia(creationId: string): Promise<{ id: string }> {
  const token = await getInstagramAccessToken();
  const userInfo = await getInstagramUserInfo();

  const data = await graph(
    `/${userInfo.id}/media_publish`,
    {
      creation_id: creationId,
      access_token: token,
    },
    { method: "POST" }
  );

  return { id: data.id };
}

/**
 * Verify publish status
 */
export async function verifyPublishStatus(mediaId: string): Promise<{ status_code: string }> {
  const token = await getInstagramAccessToken();

  const data = await graph(`/${mediaId}`, {
    fields: "status_code",
    access_token: token,
  });

  return { status_code: data.status_code };
}

/**
 * Check content publishing limit
 */
export async function checkPublishingLimit(): Promise<{
  quota_usage: number;
  quota_total: number;
}> {
  const token = await getInstagramAccessToken();
  const userInfo = await getInstagramUserInfo();

  const data = await graph(`/${userInfo.id}/content_publishing_limit`, {
    config_usage_type: "content_publishing",
    access_token: token,
  });

  return {
    quota_usage: data.config_usage,
    quota_total: data.quota_total,
  };
}
