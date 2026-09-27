import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

// Pages a signed-in student can open before agreeing to the terms.
const BEFORE_TERMS = ["/welcome", "/terms", "/login", "/signup", "/verify", "/forgot-password", "/reset-password", "/auth/", "/api/"];

function allowedBeforeTerms(pathname: string): boolean {
  return BEFORE_TERMS.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`)));
}

// Refreshes the Supabase auth session on every request so Server Components
// always see a valid session, and sends students who haven't agreed to the
// terms to /welcome. The terms check lives here (not in a layout) because
// layouts don't re-run on in-app navigation. Other route protection happens
// in the pages themselves (see requireUser in lib/auth.ts).
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) return response;

  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([header, value]) =>
          response.headers.set(header, value),
        );
      },
    },
  });

  // Must run before anything else touches the response.
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  const { pathname, search } = request.nextUrl;
  if (userId && !allowedBeforeTerms(pathname)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("terms_accepted_at")
      .eq("id", userId)
      .maybeSingle();
    if (profile && !profile.terms_accepted_at) {
      const welcome = request.nextUrl.clone();
      welcome.pathname = "/welcome";
      welcome.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
      const redirect = NextResponse.redirect(welcome);
      response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
      return redirect;
    }
  }

  return response;
}
