import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";

export async function getSettings(): Promise<AppSettings> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await db.from("app_settings").select("*").eq("user_id", user.id).maybeSingle();
  if (error) {
    throw new Error(`Failed to load settings: ${error.message}`);
  }
  if (!data) {
    // Create default settings for the user
    return await createDefaultSettings(user.id);
  }
  return data as AppSettings;
}

async function createDefaultSettings(userId: string): Promise<AppSettings> {
  const db = await supabaseServer();
  const { data, error } = await db
    .from("app_settings")
    .insert({ user_id: userId })
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to create default settings: ${error?.message ?? "no row"}`);
  }
  return data as AppSettings;
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const db = await supabaseServer();
  const { data: { user } } = await db.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await db
    .from("app_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select()
    .single();
  if (error || !data) {
    throw new Error(`Failed to update settings: ${error?.message ?? "no row"}`);
  }
  return data as AppSettings;
}
