import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profiles";
import { profileHref } from "@/lib/links";

// "Profile" in the navigation: send the signed-in student to their own page.
export default async function MyProfilePage() {
  const user = await requireUser("/profile");
  const profile = await getProfile(user.id);
  redirect(profile ? profileHref(profile) : "/settings");
}
