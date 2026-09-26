"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";

import { getCurrentUser } from "@/lib/auth";
import { emailMatchesDomain } from "@/lib/data/profiles";
import { friendlyEmailError } from "@/lib/email-errors";
import {
  gradYearOptions,
  normalizeUsername,
  PROFILE_LIMITS,
  USERNAME_PATTERN,
} from "@/lib/profile-rules";
import { getSiteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export type ProfileFormValues = {
  name: string;
  username: string;
  major: string;
  gradYear: string;
  bio: string;
};

export type ProfileFormState =
  | {
      errors?: Partial<Record<keyof ProfileFormValues | "form", string>>;
      values: ProfileFormValues;
      saved?: boolean;
      attempt: number;
    }
  | undefined;

export async function updateProfile(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const values: ProfileFormValues = {
    name: field(formData, "name"),
    username: normalizeUsername(field(formData, "username")),
    major: field(formData, "major"),
    gradYear: field(formData, "gradYear"),
    bio: field(formData, "bio"),
  };
  const result = (rest: Omit<NonNullable<ProfileFormState>, "values" | "attempt">) => ({
    ...rest,
    values,
    attempt: Date.now(),
  });

  const user = await getCurrentUser();
  if (!user) return result({ errors: { form: "Sign in to edit your profile." } });

  const errors: NonNullable<ProfileFormState>["errors"] = {};
  if (!values.name) errors.name = "Enter your name.";
  else if (values.name.length > PROFILE_LIMITS.name) errors.name = "That name is too long.";
  if (!USERNAME_PATTERN.test(values.username)) {
    errors.username = "Use 3–24 lowercase letters, numbers or underscores.";
  }
  if (values.major.length > PROFILE_LIMITS.major) errors.major = "That major is too long.";
  if (values.gradYear && !gradYearOptions().includes(Number(values.gradYear))) {
    errors.gradYear = "Choose your graduation year.";
  }
  if (values.bio.length > PROFILE_LIMITS.bio) {
    errors.bio = `Keep your bio under ${PROFILE_LIMITS.bio} characters.`;
  }
  if (Object.keys(errors).length > 0) return result({ errors });

  const supabase = await createClient();
  // Only these columns are writable by users; verification fields are not.
  const { error } = await supabase
    .from("profiles")
    .update({
      name: values.name,
      username: values.username,
      major: values.major || null,
      grad_year: values.gradYear ? Number(values.gradYear) : null,
      bio: values.bio || null,
    })
    .eq("id", user.id);

  if (error?.code === "23505") return result({ errors: { username: "That username is taken." } });
  if (error) return result({ errors: { form: "Couldn't save your profile. Try again." } });

  refresh();
  return result({ saved: true });
}

export type VerificationState =
  | {
      error?: string;
      // Set once a code has been emailed: which address, and which kind of code.
      sentTo?: string;
      mode?: "email" | "email_change";
      email?: string;
      universityId?: string;
      attempt: number;
    }
  | undefined;

// Starts university verification by emailing the student a code (the email
// also has a link, which works too). Entering the code proves they own the
// address; the database then verifies them (claim_university_verification).
export async function startVerification(
  _prev: VerificationState,
  formData: FormData,
): Promise<VerificationState> {
  const universityId = field(formData, "universityId");
  const email = field(formData, "email").toLowerCase();
  const reply = (rest: {
    error?: string;
    sentTo?: string;
    mode?: "email" | "email_change";
  }): VerificationState => ({
    ...rest,
    email,
    universityId,
    attempt: Date.now(),
  });

  const user = await getCurrentUser();
  if (!user?.email) return reply({ error: "Sign in to verify your university." });

  const supabase = await createClient();
  const { data: university } = await supabase
    .from("universities")
    .select("name, short_name, domain")
    .eq("id", universityId)
    .maybeSingle();
  if (!university) return reply({ error: "Choose your university." });

  const label = university.short_name ?? university.name;
  if (!emailMatchesDomain(email, university.domain)) {
    return reply({ error: `That isn't a ${label} email. Use an address ending in @${university.domain}.` });
  }

  const siteUrl = getSiteUrl((await headers()).get("origin"));
  const redirectTo = `${siteUrl}/auth/confirm?next=/settings`;

  if (email === user.email.toLowerCase()) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
    });
    if (error) return reply({ error: friendlyEmailError(error.message) });
    return reply({ sentTo: email, mode: "email" });
  }

  // A different address: switch the account to the university email.
  // Supabase emails a confirmation link to the new address (and, if secure
  // email change is on, one to the current address too).
  const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: redirectTo });
  if (error) return reply({ error: friendlyEmailError(error.message) });
  return reply({ sentTo: email, mode: "email_change" });
}


const AVATAR_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_BUCKET = "avatars";

export type AvatarState = { error?: string; attempt: number } | undefined;

// Uploads a profile photo to Storage at avatars/<user id>/<timestamp>.<ext>.
// Storage policies only allow writing inside your own folder.
export async function uploadAvatar(_prev: AvatarState, formData: FormData): Promise<AvatarState> {
  const fail = (error: string): AvatarState => ({ error, attempt: Date.now() });
  const user = await getCurrentUser();
  if (!user) return fail("Sign in to change your photo.");

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return fail("Choose an image.");
  const ext = AVATAR_TYPES[file.type];
  if (!ext) return fail("Use a PNG, JPG, WebP or GIF image.");
  if (file.size > AVATAR_MAX_BYTES) return fail("Images can be at most 2 MB.");

  const supabase = await createClient();
  const path = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return fail("Couldn't upload that image. Try again.");

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
  const { error } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", user.id);
  if (error) {
    await supabase.storage.from(AVATAR_BUCKET).remove([path]);
    return fail("Couldn't save your photo. Try again.");
  }

  await removeOldAvatars(supabase, user.id, path);
  refresh();
  return { attempt: Date.now() };
}

export async function removeAvatar(): Promise<{ ok: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { ok: false };
  await removeOldAvatars(supabase, user.id);
  refresh();
  return { ok: true };
}

// Best-effort cleanup of previous uploads in the user's folder.
async function removeOldAvatars(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  keepPath?: string,
) {
  const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
  const stale = (files ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== keepPath);
  if (stale.length > 0) await supabase.storage.from(AVATAR_BUCKET).remove(stale);
}
