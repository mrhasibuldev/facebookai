import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(req: Request) {
  try {
    const { appId, appSecret, redirectUri } = await req.json();

    if (!appId || !redirectUri) {
      return NextResponse.json(
        { error: "App ID and redirect URI are required" },
        { status: 400 }
      );
    }

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

    // Update app_settings with Instagram credentials
    const updateData: {
      instagram_app_id: string;
      instagram_redirect_uri: string;
      instagram_app_secret?: string;
    } = {
      instagram_app_id: appId,
      instagram_redirect_uri: redirectUri,
    };

    // Only update secret if provided
    if (appSecret) {
      updateData.instagram_app_secret = appSecret;
    }

    const { error } = await supabase
      .from("app_settings")
      .update(updateData)
      .eq("user_id", user.id);

    if (error) {
      console.error("[Instagram Credentials] Failed to save:", error);
      return NextResponse.json(
        { error: "Failed to save Instagram credentials" },
        { status: 500 }
      );
    }

    console.log("[Instagram Credentials] Saved successfully");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Instagram Credentials] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
