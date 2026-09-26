import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/database.types";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

// Refreshes the Supabase auth session on every request so Server Components
// always see a valid session. Route protection happens in the pages
// themselves (see requireUser in lib/auth.ts), not here.
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
  await supabase.auth.getClaims();

  return response;
}
