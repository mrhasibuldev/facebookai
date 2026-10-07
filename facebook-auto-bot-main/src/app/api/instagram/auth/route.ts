import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { createServerClient } from "@supabase/ssr";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";

const INSTAGRAM_OAUTH_URL = "https://www.instagram.com/oauth/authorize";

const INSTAGRAM_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
];

const OAUTH_STATE_COOKIE = "instagram_oauth_state";

export async function GET(_req: Request) {
  try {
    const cookieStore = await cookies();
    const user = await getAuthenticatedUser();

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

    // Get Instagram configuration from settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("instagram_app_id, instagram_redirect_uri")
      .eq("user_id", user.id)
      .single();

    if (!settings?.instagram_app_id || !settings?.instagram_redirect_uri) {
      return NextResponse.json(
        { error: "Instagram not configured. Please configure Instagram App ID and redirect URI in Settings." },
        { status: 400 }
      );
    }

    // Generate secure state for CSRF protection
    const state = randomUUID();

    // Store state in cookie
    cookieStore.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
    });

    // Build Instagram OAuth URL
    const params = new URLSearchParams({
      client_id: settings.instagram_app_id,
      redirect_uri: settings.instagram_redirect_uri,
      response_type: "code",
      scope: INSTAGRAM_SCOPES.join(","),
      state,
    });

    const authUrl = `${INSTAGRAM_OAUTH_URL}?${params.toString()}`;

    console.log("[Instagram Auth] Starting OAuth flow");

    return NextResponse.json({ authUrl });
  } catch (err) {
    console.error("[Instagram Auth] Error:", err);
    return NextResponse.json(
      { error: "Failed to start Instagram OAuth" },
      { status: 500 }
    );
  }
}
