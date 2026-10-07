import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const INSTAGRAM_TOKEN_URL = "https://graph.instagram.com/oauth/access_token";

const OAUTH_STATE_COOKIE = "instagram_oauth_state";
const OAUTH_CODE_COOKIE = "instagram_oauth_code";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();

  // Handle error from Instagram
  if (error) {
    console.error("[Instagram OAuth] Error from Instagram:", error);
    cookieStore.delete(OAUTH_STATE_COOKIE);
    cookieStore.delete(OAUTH_CODE_COOKIE);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?instagram_error=${error}`
    );
  }

  // Handle callback with authorization code
  if (code) {
    try {
      const storedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
      if (!storedState || storedState !== state) {
        console.error("[Instagram OAuth] Invalid state parameter");
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?instagram_error=invalid_state`
        );
      }

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
        return NextResponse.redirect("/login");
      }

      // Get Instagram configuration from settings
      const { data: settings } = await supabase
        .from("app_settings")
        .select("instagram_app_id, instagram_app_secret, instagram_redirect_uri")
        .eq("user_id", user.id)
        .single();

      if (!settings?.instagram_app_id || !settings?.instagram_app_secret || !settings?.instagram_redirect_uri) {
        console.error("[Instagram OAuth] Instagram configuration missing");
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?instagram_error=config_missing`
        );
      }

      // Exchange authorization code for access token
      const params = new URLSearchParams({
        client_id: settings.instagram_app_id,
        client_secret: settings.instagram_app_secret,
        grant_type: "authorization_code",
        redirect_uri: settings.instagram_redirect_uri,
        code,
      });

      const tokenResponse = await fetch(INSTAGRAM_TOKEN_URL, {
        method: "POST",
        body: params,
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("[Instagram OAuth] Token exchange failed:", errorText);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?instagram_error=token_exchange_failed`
        );
      }

      const tokenData = await tokenResponse.json();

      // Get Instagram user info
      const userParams = new URLSearchParams({
        fields: "user_id,username",
        access_token: tokenData.access_token,
      });

      const userResponse = await fetch(
        `https://graph.instagram.com/me?${userParams.toString()}`
      );

      if (!userResponse.ok) {
        console.error("[Instagram OAuth] Failed to get user info");
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?instagram_error=user_info_failed`
        );
      }

      const userData = await userResponse.json();

      // Store in social_connections
      const { error: insertError } = await supabase
        .from("social_connections")
        .upsert({
          user_id: user.id,
          platform: "instagram",
          platform_account_id: userData.data.user_id,
          platform_account_name: userData.data.username,
          platform_username: userData.data.username,
          status: "connected",
          access_token_reference: "encrypted",
          token_expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
          metadata: {
            instagram_user_id: userData.data.user_id,
            instagram_token: tokenData.access_token, // TODO: Encrypt in production
          },
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("[Instagram OAuth] Failed to store connection:", insertError);
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?instagram_error=db_error`
        );
      }

      // Clear cookies
      cookieStore.delete(OAUTH_STATE_COOKIE);
      cookieStore.delete(OAUTH_CODE_COOKIE);

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?instagram_success=true`
      );
    } catch (err) {
      console.error("[Instagram OAuth] Callback error:", err);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?instagram_error=callback_error`
      );
    }
  }

  // If no code, this is the start of OAuth flow - return error
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/settings?instagram_error=no_code`
  );
}
