import { cache } from "react";

import { getPostsByAuthor, type PostSummary } from "@/lib/data/posts";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
  major: string | null;
  gradYear: number | null;
  bio: string | null;
  verified: boolean;
  university: { name: string; shortName: string; domain: string } | null;
  createdAt: string;
};

type ProfileRow = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  major: string | null;
  grad_year: number | null;
  bio: string | null;
  verified: boolean;
  created_at: string;
  university: { name: string; short_name: string | null; domain: string } | null;
};

const PROFILE_SELECT =
  "id, name, username, avatar_url, major, grad_year, bio, verified, created_at, " +
  "university:universities(name, short_name, domain)";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    avatarUrl: row.avatar_url,
    major: row.major,
    gradYear: row.grad_year,
    bio: row.bio,
    // A university is only ever set together with verification.
    verified: row.verified && Boolean(row.university),
    university:
      row.verified && row.university
        ? {
            name: row.university.name,
            shortName: row.university.short_name ?? row.university.name,
            domain: row.university.domain,
          }
        : null,
    createdAt: row.created_at,
  };
}

// Look up a profile by username, or by id for students without a username.
export const getProfile = cache(async (handle: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const request = supabase.from("profiles").select(PROFILE_SELECT);
  const { data, error } = await (UUID.test(handle)
    ? request.eq("id", handle)
    : request.eq("username", handle.toLowerCase())
  ).maybeSingle<ProfileRow>();
  if (error) throw new Error(`Could not load profile: ${error.message}`);
  return data ? toProfile(data) : null;
});

export type ProfileComment = {
  id: string;
  content: string;
  createdAt: string;
  post: { id: string; title: string; course: { slug: string; code: string; name: string } };
};

export type ProfileCourse = {
  slug: string;
  code: string;
  name: string;
  semester: string | null;
  contributions: number;
};

export type ProfileActivity = {
  posts: PostSummary[];
  comments: ProfileComment[];
  commentCount: number;
  helpfulVotes: number;
  courses: ProfileCourse[];
  savedCount: number | null;
};

// Everything a profile page shows about what the student has contributed.
// savedCount is only returned for the student viewing their own profile.
export async function getProfileActivity(
  profileId: string,
  viewerId?: string,
): Promise<ProfileActivity> {
  const supabase = await createClient();
  const isSelf = viewerId === profileId;

  const [posts, comments, commentCount, memberships, saved] = await Promise.all([
    getPostsByAuthor(profileId, viewerId),
    supabase
      .from("comments")
      .select("id, content, created_at, post:posts(id, title, course:courses(slug, code, name))")
      .eq("author_id", profileId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200)
      .overrideTypes<
        {
          id: string;
          content: string;
          created_at: string;
          post: ProfileComment["post"] | null;
        }[],
        { merge: false }
      >(),
    supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("author_id", profileId)
      .is("deleted_at", null),
    supabase
      .from("course_members")
      .select("semester, joined_at, course:courses(slug, code, name)")
      .eq("user_id", profileId)
      .overrideTypes<
        {
          semester: string | null;
          joined_at: string;
          course: { slug: string; code: string; name: string } | null;
        }[],
        { merge: false }
      >(),
    isSelf
      ? supabase.from("bookmarks").select("*", { count: "exact", head: true }).eq("user_id", profileId)
      : Promise.resolve({ count: null }),
  ]);
  if (comments.error) throw new Error(`Could not load comments: ${comments.error.message}`);
  if (memberships.error) throw new Error(`Could not load courses: ${memberships.error.message}`);

  const profileComments: ProfileComment[] = comments.data.flatMap((c) =>
    c.post ? [{ id: c.id, content: c.content, createdAt: c.created_at, post: c.post }] : [],
  );

  // Courses: every course joined or contributed to, with a contribution count
  // (posts + comments) and the semester the student took it.
  const courses = new Map<string, ProfileCourse>();
  const touch = (course: { slug: string; code: string; name: string }) => {
    let entry = courses.get(course.slug);
    if (!entry) {
      entry = { ...course, semester: null, contributions: 0 };
      courses.set(course.slug, entry);
    }
    return entry;
  };
  for (const m of memberships.data) {
    if (m.course) touch(m.course).semester = m.semester;
  }
  for (const post of posts) {
    const entry = touch(post.course);
    entry.contributions += 1;
    entry.semester ??= post.semester;
  }
  for (const c of profileComments) touch(c.post.course).contributions += 1;

  return {
    posts,
    comments: profileComments.slice(0, 10),
    commentCount: commentCount.count ?? 0,
    helpfulVotes: posts.reduce((sum, p) => sum + p.voteScore, 0),
    courses: [...courses.values()].sort(
      (a, b) => b.contributions - a.contributions || a.code.localeCompare(b.code),
    ),
    savedCount: isSelf ? (saved.count ?? 0) : null,
  };
}

export type University = { id: string; name: string; shortName: string; domain: string };

export async function getUniversities(): Promise<University[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("universities")
    .select("id, name, short_name, domain")
    .order("name");
  if (error) throw new Error(`Could not load universities: ${error.message}`);
  return data.map((u) => ({
    id: u.id,
    name: u.name,
    shortName: u.short_name ?? u.name,
    domain: u.domain,
  }));
}

// Mirrors public.university_for_email(): exact domain or a subdomain of it.
export function emailMatchesDomain(email: string, domain: string): boolean {
  const emailDomain = email.split("@")[1]?.toLowerCase() ?? "";
  return emailDomain === domain || emailDomain.endsWith(`.${domain}`);
}
