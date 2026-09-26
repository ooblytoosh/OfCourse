import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeRedirectPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

// Landing point for links in Supabase auth emails (sign-up confirmation,
// magic links, email changes, password recovery). Handles both link styles:
//   ?code=...                  (default PKCE flow)
//   ?token_hash=...&type=...   (custom email templates)
//
// Arriving here from an email link proves the user controls their address, so
// we then ask the database to verify their university. The database checks
// the signed session itself; nothing from this request can fake it.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeRedirectPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        : { error: new Error("Missing confirmation token") };

    if (!error) {
      await supabase.rpc("claim_university_verification");
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set(
    "error",
    "That link is invalid or has expired. Try signing in again.",
  );
  return NextResponse.redirect(loginUrl);
}
