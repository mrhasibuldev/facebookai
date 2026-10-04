import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const db = supabaseAdmin();
    
    // Check if settings already exist for this user
    const { data: existing } = await db
      .from("app_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      console.log("Settings already exist for user:", userId);
      return NextResponse.json({ ok: true, exists: true });
    }

    // Create default settings (database will auto-generate id)
    const { data, error } = await db
      .from("app_settings")
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) {
      console.error("Failed to create settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, settings: data });
  } catch (err) {
    console.error("Settings creation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
