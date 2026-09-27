import "server-only";

import { searchCourses, type CourseListItem } from "@/lib/data/courses";
import { createClient } from "@/lib/supabase/server";

export type Recommendation = CourseListItem & { reason: string };

// Recommended classes at one university. Ranked by what students like you
// did: classmates from your courses who took it, students in your major who
// took it, how many would take it again, and how active it is. Courses you
// already joined are left out. Every recommendation says why.
export async function getRecommendedCourses(options: {
  universityId?: string;
  viewerId?: string;
  major?: string | null;
  limit?: number;
}): Promise<Recommendation[]> {
  const courses = await searchCourses("", options.universityId);
  if (courses.length === 0) return [];
  const supabase = await createClient();
  const ids = courses.map((c) => c.id);

  const [{ data: memberships }, { data: ratings }] = await Promise.all([
    supabase
      .from("course_members")
      .select("course_id, user_id, profile:profiles(major)")
      .in("course_id", ids)
      .limit(5000)
      .overrideTypes<{ course_id: string; user_id: string; profile: { major: string | null } | null }[], { merge: false }>(),
    supabase
      .from("course_rating_stats")
      .select("course_id, would_take_again_pct, rating_count")
      .in("course_id", ids),
  ]);
  const rows = memberships ?? [];

  const joined = new Set(rows.filter((m) => m.user_id === options.viewerId).map((m) => m.course_id));
  const coursesOf = new Map<string, Set<string>>();
  for (const m of rows) {
    if (!coursesOf.has(m.user_id)) coursesOf.set(m.user_id, new Set());
    coursesOf.get(m.user_id)!.add(m.course_id);
  }
  const code = new Map(courses.map((c) => [c.id, c.code]));
  const rating = new Map((ratings ?? []).map((r) => [r.course_id, r]));

  const scored = courses
    .filter((c) => !joined.has(c.id))
    .map((c) => {
      const members = rows.filter((m) => m.course_id === c.id);
      // Classmates: members of this course who share a course with you.
      const shared = new Map<string, number>();
      for (const m of members) {
        if (m.user_id === options.viewerId) continue;
        for (const other of coursesOf.get(m.user_id) ?? []) {
          if (joined.has(other)) shared.set(other, (shared.get(other) ?? 0) + 1);
        }
      }
      const [topShared, sharedCount] = [...shared.entries()].sort((a, b) => b[1] - a[1])[0] ?? [null, 0];
      const sameMajor = options.major ? members.filter((m) => m.profile?.major === options.major).length : 0;
      const stats = rating.get(c.id);
      const again = stats?.rating_count ? Number(stats.would_take_again_pct) : null;

      const score =
        3 * sharedCount + 2 * sameMajor + (again ?? 50) / 25 + Math.log1p(c.postCount) + Math.log1p(c.memberCount);
      const reason =
        sharedCount > 0 && topShared
          ? `Taken by ${sharedCount} ${sharedCount === 1 ? "student" : "students"} who also took ${code.get(topShared)}`
          : sameMajor > 0
            ? `Popular with ${sameMajor} ${options.major} ${sameMajor === 1 ? "major" : "majors"}`
            : again !== null
              ? `${Math.round(again)}% of students would take it again`
              : `${c.postCount} ${c.postCount === 1 ? "post" : "posts"} from students`;
      return { course: { ...c, reason }, score };
    })
    .sort((a, b) => b.score - a.score || a.course.code.localeCompare(b.course.code))
    .slice(0, options.limit ?? 6);

  return scored.map((s) => s.course);
}
