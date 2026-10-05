import { supabaseServer } from "@/lib/supabase/server";
import type { AppSettings } from "@/lib/types";
import { logError, getDatabaseErrorMessage } from "@/lib/errors";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";

function toErrorObject(err: unknown): { message?: string; code?: string } | null {
  if (err && typeof err === 'object' && 'message' in err) {
    return err as { message?: string; code?: string };
  }
  return null;
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const user = await getAuthenticatedUser();
    const db = await supabaseServer();

    const { data, error } = await db.from("app_settings").select("*").eq("user_id", user.id).maybeSingle();
    if (error) {
      throw new Error(`Failed to load settings: ${error.message}`);
    }
    if (!data) {
      // Create default settings for the user
      return await createDefaultSettings(user.id);
    }
    return data as AppSettings;
  } catch (err) {
    logError("getSettings", err);
    throw new Error(getDatabaseErrorMessage(toErrorObject(err)));
  }
}

async function createDefaultSettings(userId: string): Promise<AppSettings> {
  try {
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
  } catch (err) {
    logError("createDefaultSettings", err);
    throw new Error(getDatabaseErrorMessage(toErrorObject(err)));
  }
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  try {
    const user = await getAuthenticatedUser();
    const db = await supabaseServer();

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
  } catch (err) {
    logError("updateSettings", err);
    throw new Error(getDatabaseErrorMessage(toErrorObject(err)));
  }
}
