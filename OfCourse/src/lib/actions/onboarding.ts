"use server";

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

  const next = formData.get("next");
  redirect(safeRedirectPath(typeof next === "string" ? next : "/"));
}
