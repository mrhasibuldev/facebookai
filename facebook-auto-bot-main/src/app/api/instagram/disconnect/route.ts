import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(_req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete Instagram connection
    const { error } = await supabase
      .from("social_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", "instagram");

    if (error) {
      console.error("[Instagram Disconnect] Failed to delete connection:", error);
      return NextResponse.json({ error: "Failed to disconnect Instagram" }, { status: 500 });
    }

    console.log("[Instagram Disconnect] Successfully disconnected");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Instagram Disconnect] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
