import { createClient } from "@/lib/supabase/server";

export type CourseListItem = {
  id: string;
  slug: string;
  code: string;
  name: string;
  university: string;
  memberCount: number;
  postCount: number;
};

const COURSE_LIST_SELECT =
  "id, slug, code, name, university:universities(name, short_name), course_members(count), posts(count)";

type CourseListRow = {
  id: string;
  slug: string;
  code: string;
  name: string;
  university: { name: string; short_name: string | null } | null;
  course_members: { count: number }[];
  posts: { count: number }[];
};

function toListItem(row: CourseListRow): CourseListItem {
  return {
    id: row.id,
    slug: row.slug,
    code: row.code,
    name: row.name,
    university: row.university?.short_name ?? row.university?.name ?? "",
    memberCount: row.course_members[0]?.count ?? 0,
    postCount: row.posts[0]?.count ?? 0,
  };
}

// Keep only characters that are safe inside a PostgREST filter string.
function sanitizeQuery(query: string): string {
  return query.replace(/[^\p{L}\p{N}\s&'-]/gu, " ").replace(/\s+/g, " ").trim();
}

// Course search by code ("CS 1332", "cs1332") or name ("data structures").
// With no query, lists every course.
// Courses matching a search. With a university, only that university's
// courses (verified students see their own school's catalog).
export async function searchCourses(query = "", universityId?: string): Promise<CourseListItem[]> {
  const supabase = await createClient();
  const q = sanitizeQuery(query).slice(0, 100);

  let request = supabase.from("courses").select(COURSE_LIST_SELECT).order("code");
  if (universityId) request = request.eq("university_id", universityId);
  if (q) {
    const compact = q.toLowerCase().replace(/[^a-z0-9]/g, "");
    const filters = [`code.ilike.%${q}%`, `name.ilike.%${q}%`];
    if (compact) filters.push(`slug.ilike.%${compact}%`);
    request = request.or(filters.join(","));
  }

  const { data, error } = await request.overrideTypes<CourseListRow[], { merge: false }>();
  if (error) throw new Error(`Course search failed: ${error.message}`);
  return data.map(toListItem);
}

export async function getJoinedCourses(userId: string): Promise<CourseListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_members")
    .select(`course:courses(${COURSE_LIST_SELECT})`)
    .eq("user_id", userId)
    .order("joined_at", { ascending: false })
    .overrideTypes<{ course: CourseListRow | null }[], { merge: false }>();
  if (error) throw new Error(`Could not load your courses: ${error.message}`);
  return data.flatMap((row) => (row.course ? [toListItem(row.course)] : []));
}

export type CourseDetail = {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string | null;
  university: string;
  universityId: string;
  memberCount: number;
  // Members with a verified university email.
  verifiedStudentCount: number;
  postCount: number;
  viewerIsMember: boolean;
  // Averages of student ratings, or null when nobody has rated the course.
  stats: {
    workloadHoursPerWeek: number;
    difficulty: number;
    wouldTakeAgainPct: number;
    ratingCount: number;
  } | null;
  viewerRating: CourseRating | null;
};

export type CourseRating = {
  workloadHours: number;
  difficulty: number;
  wouldTakeAgain: boolean;
  semester: string | null;
};

type CourseDetailRow = {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string | null;
  university_id: string;
  university: { name: string; short_name: string | null } | null;
};

export async function getCourse(slug: string, viewerId?: string): Promise<CourseDetail | null> {
  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select(
      "id, slug, code, name, description, university_id, university:universities(name, short_name)",
    )
    .eq("slug", slug.toLowerCase())
    .maybeSingle<CourseDetailRow>();
  if (error) throw new Error(`Could not load course: ${error.message}`);
  if (!course) return null;

  const [members, verified, posts, membership, stats, rating] = await Promise.all([
    supabase.from("course_members").select("*", { count: "exact", head: true }).eq("course_id", course.id),
    supabase
      .from("course_members")
      .select("user_id, profiles!inner(verified)", { count: "exact", head: true })
      .eq("course_id", course.id)
      .eq("profiles.verified", true),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("course_id", course.id),
    viewerId
      ? supabase
          .from("course_members")
          .select("user_id")
          .eq("course_id", course.id)
          .eq("user_id", viewerId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("course_rating_stats").select("*").eq("course_id", course.id).maybeSingle(),
    viewerId
      ? supabase
          .from("course_ratings")
          .select("workload_hours, difficulty, would_take_again, semester")
          .eq("course_id", course.id)
          .eq("user_id", viewerId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    id: course.id,
    slug: course.slug,
    code: course.code,
    name: course.name,
    description: course.description,
    university: course.university?.short_name ?? course.university?.name ?? "",
    universityId: course.university_id,
    memberCount: members.count ?? 0,
    verifiedStudentCount: verified.count ?? 0,
    postCount: posts.count ?? 0,
    viewerIsMember: Boolean(membership.data),
    stats: stats.data
      ? {
          workloadHoursPerWeek: Number(stats.data.avg_workload_hours),
          difficulty: Number(stats.data.avg_difficulty),
          wouldTakeAgainPct: stats.data.would_take_again_pct,
          ratingCount: stats.data.rating_count,
        }
      : null,
    viewerRating: rating.data
      ? {
          workloadHours: rating.data.workload_hours,
          difficulty: rating.data.difficulty,
          wouldTakeAgain: rating.data.would_take_again,
          semester: rating.data.semester,
        }
      : null,
  };
}

export type Topic = { id: string; name: string; postCount: number; unitId: string | null };

// A course's topics, most-used first.
export async function getCourseTopics(courseId: string): Promise<Topic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id, name, unit_id, post_topics(count)")
    .eq("course_id", courseId)
    .overrideTypes<
      { id: string; name: string; unit_id: string | null; post_topics: { count: number }[] }[],
      { merge: false }
    >();
  if (error) throw new Error(`Could not load topics: ${error.message}`);
  return data
    .map((t) => ({ id: t.id, name: t.name, unitId: t.unit_id, postCount: t.post_topics[0]?.count ?? 0 }))
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));
}

export type Unit = { id: string | null; position: number | null; name: string; topics: Topic[] };

// The course syllabus: units in order, each with its topics. Topics not
// assigned to a unit are grouped last under "Other topics".
export async function getCourseUnits(courseId: string, topics: Topic[]): Promise<Unit[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("course_units")
    .select("id, position, name")
    .eq("course_id", courseId)
    .order("position");
  if (error) throw new Error(`Could not load units: ${error.message}`);
  const byName = (a: Topic, b: Topic) => a.name.localeCompare(b.name);
  const units: Unit[] = data.map((u) => ({
    id: u.id,
    position: u.position,
    name: u.name,
    topics: topics.filter((t) => t.unitId === u.id).sort(byName),
  }));
  const unitIds = new Set(data.map((u) => u.id));
  const other = topics.filter((t) => !t.unitId || !unitIds.has(t.unitId)).sort(byName);
  if (other.length) units.push({ id: null, position: null, name: "Other topics", topics: other });
  return units;
}

// Courses with their topics, for the post composer: one university's
// courses (the student's own), or every course when none is given.
export async function getCoursesWithTopics(universityId?: string) {
  const supabase = await createClient();
  let request = supabase
    .from("courses")
    .select(
      "id, slug, code, name, university:universities(short_name, name), " +
        "topics(id, name, unit:course_units(position, name))",
    )
    .order("code");
  if (universityId) request = request.eq("university_id", universityId);
  const { data, error } = await request
    .overrideTypes<
      {
        id: string;
        slug: string;
        code: string;
        name: string;
        university: { name: string; short_name: string | null } | null;
        topics: {
          id: string;
          name: string;
          unit: { position: number; name: string } | null;
        }[];
      }[]
    , { merge: false }>();
  if (error) throw new Error(`Could not load courses: ${error.message}`);
  return data.map((c) => ({
    id: c.id,
    slug: c.slug,
    code: c.code,
    name: c.name,
    university: c.university?.short_name ?? c.university?.name ?? "",
    topics: [...c.topics]
      .sort(
        (a, b) =>
          (a.unit?.position ?? 99) - (b.unit?.position ?? 99) || a.name.localeCompare(b.name),
      )
      .map((t) => ({
        id: t.id,
        name: t.name,
        unit: t.unit ? `Unit ${t.unit.position}: ${t.unit.name}` : "Other topics",
      })),
  }));
}

// The student's own course ratings by course id, to prefill a new review.
export async function getViewerRatings(userId: string): Promise<Record<string, CourseRating>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_ratings")
    .select("course_id, workload_hours, difficulty, would_take_again, semester")
    .eq("user_id", userId);
  return Object.fromEntries(
    (data ?? []).map((r) => [
      r.course_id,
      {
        workloadHours: r.workload_hours,
        difficulty: r.difficulty,
        wouldTakeAgain: r.would_take_again,
        semester: r.semester,
      },
    ]),
  );
}
