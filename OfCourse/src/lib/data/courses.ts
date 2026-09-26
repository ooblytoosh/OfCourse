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
export async function searchCourses(query = ""): Promise<CourseListItem[]> {
  const supabase = await createClient();
  const q = sanitizeQuery(query).slice(0, 100);

  let request = supabase.from("courses").select(COURSE_LIST_SELECT).order("code");
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
  memberCount: number;
  postCount: number;
  viewerIsMember: boolean;
  stats: {
    workloadHoursPerWeek: number;
    difficulty: number;
    wouldTakeAgainPct: number;
    responseCount: number;
    isDemo: boolean;
  } | null;
};

type CourseDetailRow = {
  id: string;
  slug: string;
  code: string;
  name: string;
  description: string | null;
  university: { name: string; short_name: string | null } | null;
  stats: {
    workload_hours_per_week: number;
    difficulty: number;
    would_take_again_pct: number;
    response_count: number;
    is_demo: boolean;
  } | null;
};

export async function getCourse(slug: string, viewerId?: string): Promise<CourseDetail | null> {
  const supabase = await createClient();
  const { data: course, error } = await supabase
    .from("courses")
    .select(
      "id, slug, code, name, description, university:universities(name, short_name), " +
        "stats:course_stats(workload_hours_per_week, difficulty, would_take_again_pct, response_count, is_demo)",
    )
    .eq("slug", slug.toLowerCase())
    .maybeSingle<CourseDetailRow>();
  if (error) throw new Error(`Could not load course: ${error.message}`);
  if (!course) return null;

  const [members, posts, membership] = await Promise.all([
    supabase.from("course_members").select("*", { count: "exact", head: true }).eq("course_id", course.id),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("course_id", course.id),
    viewerId
      ? supabase
          .from("course_members")
          .select("user_id")
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
    memberCount: members.count ?? 0,
    postCount: posts.count ?? 0,
    viewerIsMember: Boolean(membership.data),
    stats: course.stats && {
      workloadHoursPerWeek: Number(course.stats.workload_hours_per_week),
      difficulty: Number(course.stats.difficulty),
      wouldTakeAgainPct: course.stats.would_take_again_pct,
      responseCount: course.stats.response_count,
      isDemo: course.stats.is_demo,
    },
  };
}

export type Topic = { id: string; name: string; postCount: number };

// A course's topics, most-used first.
export async function getCourseTopics(courseId: string): Promise<Topic[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("topics")
    .select("id, name, post_topics(count)")
    .eq("course_id", courseId)
    .overrideTypes<{ id: string; name: string; post_topics: { count: number }[] }[], { merge: false }>();
  if (error) throw new Error(`Could not load topics: ${error.message}`);
  return data
    .map((t) => ({ id: t.id, name: t.name, postCount: t.post_topics[0]?.count ?? 0 }))
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name));
}

// Every course with its topics, for the post composer.
export async function getCoursesWithTopics() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select("id, slug, code, name, university:universities(short_name, name), topics(id, name)")
    .order("code")
    .overrideTypes<
      {
        id: string;
        slug: string;
        code: string;
        name: string;
        university: { name: string; short_name: string | null } | null;
        topics: { id: string; name: string }[];
      }[]
    , { merge: false }>();
  if (error) throw new Error(`Could not load courses: ${error.message}`);
  return data.map((c) => ({
    id: c.id,
    slug: c.slug,
    code: c.code,
    name: c.name,
    university: c.university?.short_name ?? c.university?.name ?? "",
    topics: [...c.topics].sort((a, b) => a.name.localeCompare(b.name)),
  }));
}
