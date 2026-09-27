"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser, safeRedirectPath } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type TermsState = { error?: string } | undefined;

export async function acceptTerms(_prev: TermsState, formData: FormData): Promise<TermsState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/welcome");
  if (formData.get("agree") !== "on") return { error: "Check the box to agree before continuing." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_terms");
  if (error) return { error: "Couldn't save that. Try again." };

  // Pages cached in the browser from before agreeing would send the student
  // straight back here; drop them so the next page loads fresh.
  revalidatePath("/", "layout");
  const next = formData.get("next");
  redirect(safeRedirectPath(typeof next === "string" ? next : "/"));
}
