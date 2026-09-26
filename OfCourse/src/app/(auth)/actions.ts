"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { safeRedirectPath } from "@/lib/auth";
import { emailMatchesDomain } from "@/lib/data/profiles";
import {
  gradYearOptions,
  normalizeUsername,
  PROFILE_LIMITS,
  UNLISTED_UNIVERSITY,
  USERNAME_PATTERN,
} from "@/lib/profile-rules";
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

export type SignupValues = {
  name: string;
  username: string;
  universityId: string;
  email: string;
  major: string;
  gradYear: string;
};

export type SignupState =
  | {
      errors?: Partial<Record<keyof SignupValues | "password" | "form", string>>;
      values?: SignupValues;
      message?: string;
      attempt: number;
    }
  | undefined;

export async function signUp(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const values: SignupValues = {
    name: field(formData, "name"),
    username: normalizeUsername(field(formData, "username")),
    universityId: field(formData, "universityId"),
    email: field(formData, "email").toLowerCase(),
    major: field(formData, "major"),
    gradYear: field(formData, "gradYear"),
  };
  const password = formData.get("password");
  const fail = (errors: NonNullable<SignupState>["errors"]): SignupState => ({
    errors,
    values,
    attempt: Date.now(),
  });
  if (!isSupabaseConfigured()) return fail({ form: NOT_CONFIGURED?.error });

  const supabase = await createClient();
  const errors: NonNullable<SignupState>["errors"] = {};

  if (!values.name) errors.name = "Enter your name.";
  else if (values.name.length > PROFILE_LIMITS.name) errors.name = "That name is too long.";

  if (!USERNAME_PATTERN.test(values.username)) {
    errors.username = "Use 3–24 lowercase letters, numbers or underscores.";
  } else {
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", values.username)
      .maybeSingle();
    if (taken) errors.username = "That username is taken.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  // The selected university's domain is checked here, on the server. The
  // database independently derives the university from the email once it
  // is verified, so this check is for a clear error, not for trust.
  if (!values.universityId) {
    errors.universityId = "Choose your university.";
  } else if (values.universityId !== UNLISTED_UNIVERSITY) {
    const { data: university } = await supabase
      .from("universities")
      .select("short_name, name, domain")
      .eq("id", values.universityId)
      .maybeSingle();
    if (!university) {
      errors.universityId = "Choose your university.";
    } else if (!errors.email && !emailMatchesDomain(values.email, university.domain)) {
      errors.email = `Use your ${university.short_name ?? university.name} email (ending in @${university.domain}).`;
    }
  }

  if (values.major.length > PROFILE_LIMITS.major) errors.major = "That major is too long.";
  if (values.gradYear && !gradYearOptions().includes(Number(values.gradYear))) {
    errors.gradYear = "Choose your graduation year.";
  }
  if (typeof password !== "string" || password.length < 8) {
    errors.password = "Use a password with at least 8 characters.";
  }

  if (Object.keys(errors).length > 0 || typeof password !== "string") return fail(errors);

  const siteUrl = getSiteUrl((await headers()).get("origin"));
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password,
    options: {
      // Read by the handle_new_user trigger to fill the profile. Nothing here
      // can make an account verified.
      data: {
        name: values.name,
        username: values.username,
        major: values.major || null,
        grad_year: values.gradYear || null,
      },
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/profile`,
    },
  });
  if (error) return fail({ form: error.message });

  // Email confirmation is turned off in Supabase: the user is signed in, but
  // not verified. Send them to finish verification.
  if (data.session) redirect("/settings?welcome=1#verification");

  return {
    message:
      values.universityId === UNLISTED_UNIVERSITY
        ? `Check ${values.email} for a link to confirm your account.`
        : `Check ${values.email} for a confirmation link. Opening it verifies your university email.`,
    attempt: Date.now(),
  };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
