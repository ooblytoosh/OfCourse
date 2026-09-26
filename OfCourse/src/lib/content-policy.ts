import type { Enums } from "@/lib/database.types";

// What students can share on OfCourse, and what they can't.
// Post creation (Phase 2) must show ACADEMIC_INTEGRITY_ATTESTATION as a
// required checkbox and store the confirmation time in
// posts.integrity_attested_at (the column is NOT NULL, so the database
// rejects any post created without it).

export const ACADEMIC_INTEGRITY_ATTESTATION =
  "I confirm this material is my own work and does not contain unreleased " +
  "exams, answer keys, or restricted course materials.";

export const POST_TYPES: Record<
  Enums<"post_type">,
  { label: string; description: string }
> = {
  note: { label: "Notes", description: "Your own notes from the course" },
  study_guide: { label: "Study guide", description: "A guide you wrote yourself" },
  explanation: { label: "Explanation", description: "A concept, explained your way" },
  advice: { label: "Advice", description: "How to study and succeed" },
  experience: { label: "Experience", description: "What taking the course was like" },
  discussion: { label: "Discussion", description: "Questions and conversations" },
  resource: { label: "Resource", description: "Public tools, videos, and links" },
};

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
