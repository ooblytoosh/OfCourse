import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// The signed-in user for this request, or null. Cached per request so the
// layout and page can both call it without a second round trip.
export const getCurrentUser = cache(async () => {
  // Always render per request, even before Supabase is configured, so pages
  // that depend on the session are never prerendered as signed-out.
  await connection();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

// For pages that require an account. Redirects to /login and comes back after.
export async function requireUser(returnTo: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

// Only allow same-site relative redirects after login.
export function safeRedirectPath(path: string | null | undefined): string {
  // "//host" and "/\host" are protocol-relative URLs to another site.
  if (!path || !path.startsWith("/") || /^\/[/\\]/.test(path)) return "/";
  return path;
}
