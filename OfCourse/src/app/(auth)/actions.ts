"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { safeRedirectPath } from "@/lib/auth";
import { emailMatchesDomain } from "@/lib/data/profiles";
import { EMAIL_CODE_PATTERN } from "@/lib/email-codes";
import { friendlyEmailError } from "@/lib/email-errors";
import { isMajor } from "@/lib/majors";
import {
  capitalizeName,
  gradYearOptions,
  normalizeUsername,
  PROFILE_LIMITS,
  UNLISTED_UNIVERSITY,
  USERNAME_PATTERN,
} from "@/lib/profile-rules";
import { getSiteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
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

// "alexchen", "@alexchen" or "alex@gatech.edu" → the account's email. Usernames
// are looked up with the service key on the server, so emails are never
// exposed through the public API.
async function emailForLogin(identifier: string): Promise<string | null> {
  if (identifier.includes("@") && !identifier.startsWith("@")) return identifier.toLowerCase();
  const username = normalizeUsername(identifier);
  if (!USERNAME_PATTERN.test(username)) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data: profile } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (!profile) return null;
  const { data } = await admin.auth.admin.getUserById(profile.id);
  return data.user?.email ?? null;
}

// Signing in or out changes what every page shows; drop pages the browser
// cached for the previous session.
function forgetCachedPages() {
  revalidatePath("/", "layout");
}

export async function signIn(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const identifier = field(formData, "identifier") || field(formData, "email");
  const password = formData.get("password");
  if (!identifier || typeof password !== "string" || !password) {
    return { error: "Enter your username or email, and your password." };
  }

  const wrong = { error: "That username or email and password don't match." };
  const email = await emailForLogin(identifier);
  if (!email) return wrong;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (/confirm/i.test(error.message)) {
      return { error: "Confirm your email first: use the code or link we emailed you." };
    }
    return /invalid login credentials/i.test(error.message) ? wrong : { error: friendlyEmailError(error.message) };
  }

  forgetCachedPages();
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
    name: capitalizeName(field(formData, "name")),
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

  if (values.major && !isMajor(values.major)) errors.major = "Choose your major from the list.";
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
  forgetCachedPages();
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
  if (!EMAIL_CODE_PATTERN.test(code)) return fail("Enter the code from the email (just the numbers).");

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
  if (!verified) {
    return fail(
      "That code didn't work. Codes work once and expire after an hour, and only the newest email's code counts. Send a new email and try its code.",
    );
  }

  await supabase.rpc("claim_university_verification");
  forgetCachedPages();
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
  forgetCachedPages();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Forgot password: email a code (and link), then set a new password.
// ---------------------------------------------------------------------------

export type ResetState = { error?: string; attempt: number } | undefined;

export async function requestPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  if (!isSupabaseConfigured()) return { error: NOT_CONFIGURED!.error, attempt: Date.now() };
  const identifier = field(formData, "identifier");
  if (!identifier) return { error: "Enter your username or email.", attempt: Date.now() };

  const email = await emailForLogin(identifier);
  if (email) {
    const supabase = await createClient();
    const siteUrl = getSiteUrl((await headers()).get("origin"));
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
    });
    if (error && /rate|seconds|security purposes|too many/i.test(error.message)) {
      return { error: friendlyEmailError(error.message), attempt: Date.now() };
    }
  }
  // Same answer whether or not the account exists, so this can't be used to
  // find out who has an account.
  const to = email ?? (identifier.includes("@") ? identifier.toLowerCase() : "");
  redirect(`/reset-password?${new URLSearchParams(to ? { email: to } : {})}`);
}

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const fail = (error: string): ResetState => ({ error, attempt: Date.now() });
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED!.error!);

  const email = field(formData, "email").toLowerCase();
  const code = field(formData, "code").replace(/\s+/g, "");
  const password = formData.get("password");
  const confirm = formData.get("confirm");
  if (typeof password !== "string" || password.length < 8) return fail("Use a password with at least 8 characters.");
  if (password !== confirm) return fail("The two passwords don't match.");

  const supabase = await createClient();
  const user = await supabase.auth.getUser().then((r) => r.data.user);
  if (email || !user) {
    // Came here by code: the code proves the student owns the email.
    if (!email) return fail("Enter the email you asked for a reset code with.");
    if (!EMAIL_CODE_PATTERN.test(code)) return fail("Enter the code from the email (just the numbers).");
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "recovery" });
    if (error) return fail("That code didn't work. Codes work once and expire after an hour. Ask for a new one.");
  }
  // Otherwise the emailed link already signed the student in for the reset.

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return fail(
      /different from the old/i.test(error.message)
        ? "Choose a password you haven't used before."
        : friendlyEmailError(error.message),
    );
  }
  forgetCachedPages();
  redirect("/");
}
