// The only majors a student can pick. Keep in sync with public.majors (see the
// auth_profile_fixes migration); the database rejects anything else.
export const MAJORS = [
  "Aerospace Engineering",
  "Applied Physics",
  "Architecture",
  "Arts, Entertainment, and Creative Technologies",
  "Astrophysics",
  "Atmospheric and Oceanic Sciences",
  "Biochemistry",
  "Biology",
  "Biomedical Engineering",
  "Chemistry",
  "Chemical and Biomolecular Engineering",
  "Civil Engineering",
  "Computational Media",
  "Computer Engineering",
  "Computer Science",
  "Construction Science and Management",
  "Economics",
  "Economics and International Affairs",
  "Electrical Engineering",
  "Environmental Engineering",
  "Environmental Science",
  "Global Economics and Modern Languages",
  "History, Technology, and Society",
  "Industrial Design",
  "Industrial Engineering",
  "International Affairs",
  "International Affairs and Modern Languages",
  "Literature, Media, and Communication",
  "Mathematics",
  "Mathematics and Computing",
  "Mechanical Engineering",
  "Music Technology",
  "Neuroscience",
  "Physics",
  "Psychology",
  "Public Policy",
  "Solid Earth and Planetary Sciences",
  "Urban Planning and Spatial Analytics",
] as const;

export type Major = (typeof MAJORS)[number];

export function isMajor(value: string): value is Major {
  return (MAJORS as readonly string[]).includes(value);
}
