
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Keep the existing Supabase session-refresh behavior.
  const response = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Only the dashboard homepage is protected for now.
  // Login, confirmation callbacks, and other public routes
  // continue to use the existing session-refresh behavior.
  if (pathname !== "/") {
    return response;
  }

  // Create a request-scoped client to verify the user's JWT.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  try {
    // Verify the signed authentication claims.
    const { data, error } = await supabase.auth.getClaims();

    if (!error && data?.claims?.sub) {
      return response;
    }
  } catch (error) {
    console.error("Dashboard authentication failed:", error);
  }

  // No valid session: send the visitor to the login page.
  return NextResponse.redirect(new URL("/login", request.url));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
