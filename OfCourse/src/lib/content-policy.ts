import type { Enums } from "@/lib/database.types";

// What students can share on OfCourse, and what they can't.
// The composer requires ACADEMIC_INTEGRITY_ATTESTATION as a checkbox and the
// confirmation time is stored in posts.integrity_attested_at (NOT NULL, so
// the database rejects any post created without it).

export const ACADEMIC_INTEGRITY_ATTESTATION =
  "I confirm this material is my own work and does not contain unreleased " +
  "exams, answer keys, or restricted course materials.";

export type PostType = Enums<"post_type">;

export const POST_TYPES: Record<PostType, { label: string; description: string }> = {
  discussion: { label: "Discussion", description: "Questions and conversations" },
  advice: { label: "Study Advice", description: "How to study and succeed in the course" },
  note: { label: "Notes", description: "Your own notes from the course" },
  study_guide: { label: "Study Guide", description: "A guide you wrote yourself" },
  explanation: { label: "Concept Explanation", description: "A concept, explained your way" },
  // Reserved in the database for later; not offered in the composer yet.
  experience: { label: "Course Experience", description: "What taking the course was like" },
  resource: { label: "Resource", description: "Public tools, videos, and links" },
};

// Types students can choose when creating a post.
export const POSTABLE_TYPES = [
  "discussion",
  "advice",
  "note",
  "study_guide",
  "explanation",
] as const satisfies readonly PostType[];

export function isPostableType(value: string): value is (typeof POSTABLE_TYPES)[number] {
  return (POSTABLE_TYPES as readonly string[]).includes(value);
}

export const PROHIBITED_CONTENT = [
  "Exams or quizzes, past or present",
  "Unreleased exam questions",
  "Answer keys",
  "Solutions to current assignments",
  "Professor lecture slides",
  "Professor-created study guides",
  "Textbook PDFs",
  "Lecture recordings",
  "Any other restricted course materials",
] as const;

export const POST_LIMITS = {
  titleMin: 5,
  titleMax: 300,
  contentMin: 10,
  contentMax: 20000,
  maxTopics: 5,
  commentMax: 5000,
};
