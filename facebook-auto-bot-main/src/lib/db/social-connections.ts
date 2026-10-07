/**
 * Social Connections Database Layer
 *
 * Manages social platform connections (Facebook, Instagram, future platforms)
 * in a unified table.
 */

import { supabaseAdmin } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";
import type { Platform } from "@/lib/types";

export interface SocialConnection {
  id: number;
  user_id: string;
  platform: Platform;
  platform_account_id: string | null;
  platform_account_name: string | null;
  platform_username: string | null;
  status: "connected" | "disconnected" | "error";
  access_token_reference: string | null;
  token_expires_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get a social connection for a user and platform
 */
export async function getSocialConnection(
  platform: Platform
): Promise<SocialConnection | null> {
  const user = await getAuthenticatedUser();
  const db = supabaseAdmin();

  const { data } = await db
    .from("social_connections")
    .select("*")
    .eq("user_id", user.id)
    .eq("platform", platform)
    .single();

  return data as SocialConnection | null;
}

/**
 * List all social connections for a user
 */
export async function listSocialConnections(): Promise<SocialConnection[]> {
  const user = await getAuthenticatedUser();
  const db = supabaseAdmin();

  const { data } = await db
    .from("social_connections")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data || []) as SocialConnection[];
}

/**
 * Create or update a social connection
 */
export async function upsertSocialConnection(
  platform: Platform,
  data: Partial<SocialConnection>
): Promise<void> {
  const user = await getAuthenticatedUser();
  const db = supabaseAdmin();

  const existing = await getSocialConnection(platform);

  if (existing) {
    // Update existing connection
    await db
      .from("social_connections")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("platform", platform);
  } else {
    // Create new connection
    await db.from("social_connections").insert({
      user_id: user.id,
      platform,
      status: "connected",
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

/**
 * Disconnect a social connection
 */
export async function disconnectSocialConnection(platform: Platform): Promise<void> {
  const user = await getAuthenticatedUser();
  const db = supabaseAdmin();

  await db
    .from("social_connections")
    .update({
      status: "disconnected",
      platform_account_id: null,
      platform_account_name: null,
      platform_username: null,
      access_token_reference: null,
      token_expires_at: null,
      metadata: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("platform", platform);
}

/**
 * Delete a social connection completely
 */
export async function deleteSocialConnection(platform: Platform): Promise<void> {
  const user = await getAuthenticatedUser();
  const db = supabaseAdmin();

  await db
    .from("social_connections")
    .delete()
    .eq("user_id", user.id)
    .eq("platform", platform);
}
