"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { safeRedirectPath } from "@/lib/auth";
import { emailMatchesDomain } from "@/lib/data/profiles";
import { friendlyEmailError } from "@/lib/email-errors";
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
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/welcome`,
    },
  });
  if (error) return fail({ form: friendlyEmailError(error.message) });

  const verifyUrl = (mode: CodeMode) =>
    `/verify?${new URLSearchParams({ email: values.email, mode })}`;

  if (!data.session) {
    // Email confirmation is on: Supabase emailed a sign-up code.
    redirect(verifyUrl("signup"));
  }

  // Email confirmation is off: the account is signed in but not verified yet.
  // Email a sign-in code to prove the university address.
  if (values.universityId === UNLISTED_UNIVERSITY) redirect("/welcome");
  // If this email fails to send, the verify page's "send a new email" retries it.
  await supabase.auth.signInWithOtp({
    email: values.email,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl}/auth/confirm?next=/welcome` },
  });
  redirect(verifyUrl("email"));
}

// Which kind of emailed code is being entered:
//   signup        confirms a new account (Supabase "Confirm signup" email)
//   email         proves an existing account owns its address ("Magic Link" email)
//   email_change  confirms a new address from Settings ("Change Email Address" email)
export type CodeMode = "signup" | "email" | "email_change";
const CODE_MODES: CodeMode[] = ["signup", "email", "email_change"];

export type CodeFormState = { error?: string; resent?: boolean; attempt: number } | undefined;

// Checks a code from a Supabase email. A correct code signs the student in
// (or confirms their new address), and the database then verifies their
// university from the proven email domain.
export async function verifyEmailCode(_prev: CodeFormState, formData: FormData): Promise<CodeFormState> {
  const fail = (error: string): CodeFormState => ({ error, attempt: Date.now() });
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED!.error!);

  const email = field(formData, "email").toLowerCase();
  const code = field(formData, "code").replace(/\s+/g, "");
  const mode = CODE_MODES.includes(field(formData, "mode") as CodeMode)
    ? (field(formData, "mode") as CodeMode)
    : "signup";
  const next = safeRedirectPath(field(formData, "next") || "/welcome");
  if (!email) return fail("Missing email address. Start again from sign up.");
  if (!/^\d{6,10}$/.test(code)) return fail("Enter the code from the email (just the numbers).");

  const supabase = await createClient();
  // Sign-up and sign-in codes are interchangeable from the student's point of
  // view, so try the expected kind first and the other one second.
  const types: CodeMode[] =
    mode === "email_change" ? ["email_change"] : mode === "signup" ? ["signup", "email"] : ["email", "signup"];
  let verified = false;
  for (const type of types) {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type });
    if (!error) {
      verified = true;
      break;
    }
  }
  if (!verified) return fail("That code didn't work. Check it, or send a new one.");

  await supabase.rpc("claim_university_verification");
  redirect(next);
}

export async function resendEmailCode(
  email: string,
  mode: CodeMode,
  next = "/welcome",
): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured() || !email) return { ok: false, message: "Couldn't send a new email." };
  const supabase = await createClient();
  const siteUrl = getSiteUrl((await headers()).get("origin"));
  const emailRedirectTo = `${siteUrl}/auth/confirm?next=${encodeURIComponent(safeRedirectPath(next))}`;
  const { error } =
    mode === "signup"
      ? await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo } })
      : mode === "email_change"
        ? await supabase.auth.resend({ type: "email_change", email, options: { emailRedirectTo } })
        : await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo } });
  if (error) return { ok: false, message: friendlyEmailError(error.message) };
  return { ok: true, message: `New email sent to ${email}.` };
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
