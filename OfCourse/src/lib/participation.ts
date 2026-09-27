import type { Profile } from "@/lib/data/profiles";

// Whether the viewer can take part in a course (join, post, comment, vote,
// rate, ask the AI). Reading is always open. The database enforces the same
// rule (public.can_participate); this only decides what the page shows.
export type Participation =
  | { allowed: true }
  | { allowed: false; reason: "signin" | "verify" | "other_university"; message: string };

export function participationFor(
  profile: Profile | null,
  course: { universityId: string; university: string },
): Participation {
  if (!profile) {
    return { allowed: false, reason: "signin", message: "Sign in to join courses and take part." };
  }
  if (!profile.verified || !profile.university) {
    return {
      allowed: false,
      reason: "verify",
      message:
        "Verify your university email to join courses, post, comment, vote with lightbulbs, rate courses and ask the AI.",
    };
  }
  if (profile.university.id !== course.universityId) {
    return {
      allowed: false,
      reason: "other_university",
      message: `This is a ${course.university} course. Only verified ${course.university} students can take part.`,
    };
  }
  return { allowed: true };
}

export const VERIFY_HREF = "/settings#verification";

// Returned by server actions when the database says no.
export const NOT_ALLOWED_ERROR = "Verify your university email to take part in this course.";
