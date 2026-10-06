import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  console.log("[MIDDLEWARE] RUNNING for:", req.nextUrl.pathname);
  const res = NextResponse.next();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return res;
  }

  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isRootPage = pathname === "/";
  const isPublicPage = pathname === "/privacy" || pathname === "/terms";

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    console.log("[MIDDLEWARE] Session check:", { pathname, hasSession: !!user, userEmail: user?.email });

    // Allow public pages without authentication
    if (isPublicPage) {
      return res;
    }

    if (isDashboardRoute && !user) {
      console.log("[MIDDLEWARE] Redirecting to login: no session");
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (isAuthPage && user) {
      console.log("[MIDDLEWARE] Redirecting to dashboard: authenticated");
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }

    if (isRootPage) {
      const url = req.nextUrl.clone();
      if (user) {
        console.log("[MIDDLEWARE] Redirecting to dashboard: authenticated");
        url.pathname = "/dashboard";
      } else {
        console.log("[MIDDLEWARE] Redirecting to login: no session");
        url.pathname = "/login";
      }
      return NextResponse.redirect(url);
    }
  } catch (error) {
    console.error("[MIDDLEWARE] Error:", error);
    if (isRootPage || isDashboardRoute || isAuthPage) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      if (isDashboardRoute) {
        url.searchParams.set("next", pathname);
      }
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
