"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { safeRedirectPath } from "@/lib/auth";
import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export type AuthFormState = { error?: string; message?: string } | undefined;

const NOT_CONFIGURED: AuthFormState = {
  error: "Supabase isn't configured yet. Add your keys to .env.local.",
};

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const email = field(formData, "email");
  const password = formData.get("password");
  if (!email || typeof password !== "string" || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  redirect(safeRedirectPath(field(formData, "next")));
}

export async function signUp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const name = field(formData, "name");
  const email = field(formData, "email");
  const password = formData.get("password");
  if (!name || !email || typeof password !== "string") {
    return { error: "Fill in every field." };
  }
  if (password.length < 8) {
    return { error: "Use a password with at least 8 characters." };
  }

  const siteUrl = getSiteUrl((await headers()).get("origin"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Read by the handle_new_user trigger to fill profiles.name.
      data: { name },
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/`,
    },
  });
  if (error) return { error: error.message };

  // Email confirmation disabled in Supabase: the user is signed in already.
  if (data.session) redirect("/");

  return { message: `Check ${email} for a link to confirm your account.` };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
