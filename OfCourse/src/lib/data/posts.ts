import type { PostType } from "@/lib/content-policy";
import { createClient } from "@/lib/supabase/server";

export type Author = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  verified: boolean;
  // Short name of the verified university, e.g. "Georgia Tech".
  university: string | null;
  // ON votes received (minus half the OFF votes), never below 0.
  lumens: number;
};

type AuthorRow = Omit<Author, "university"> & {
  university: { name: string; short_name: string | null } | null;
};

const AUTHOR_FIELDS =
  "id, name, username, avatar_url, verified, lumens, university:universities(name, short_name)";

export function toAuthor(row: AuthorRow | null): Author | null {
  if (!row) return null;
  return {
    ...row,
    university: row.verified ? (row.university?.short_name ?? row.university?.name ?? null) : null,
  };
}

// A post's or comment's lightbulb: ON/OFF votes, brightness level (0 = unlit,
// 1 = cracked ... 5 = radiant) and the viewer's own vote.
export type Bulb = { lit: number; off: number; level: number; score: number; viewerVote: -1 | 0 | 1 };

export type PostSummary = {
  id: string;
  title: string;
  content: string;
  type: PostType;
  semester: string | null;
  createdAt: string;
  // Set when the author edited the post after publishing it.
  editedAt: string | null;
  // ON votes minus OFF votes.
  voteScore: number;
  bulb: Bulb;
  commentCount: number;
  author: Author | null;
  course: { slug: string; code: string; name: string };
  topics: { id: string; name: string }[];
  viewerHasSaved: boolean;
};

export type FeedSort = "brightest" | "new";
export const FEED_SORTS: FeedSort[] = ["brightest", "new"];

const POST_SELECT =
  "id, title, content, type, semester, created_at, updated_at, vote_score, comment_count, " +
  "lit_count, off_count, brightness_level, brightness_score, " +
  `author:profiles!posts_author_id_fkey(${AUTHOR_FIELDS}), course:courses(slug, code, name), topics(id, name)`;

type PostRow = {
  id: string;
  title: string;
  content: string;
  type: PostType;
  semester: string | null;
  created_at: string;
  updated_at: string;
  vote_score: number;
  comment_count: number;
  lit_count: number;
  off_count: number;
  brightness_level: number;
  brightness_score: number;
  author: AuthorRow | null;
  course: { slug: string; code: string; name: string };
  topics: { id: string; name: string }[];
};

// Adds the viewer's own vote and whether they saved each post.
async function withViewerState(rows: PostRow[], viewerId?: string): Promise<PostSummary[]> {
  const ids = rows.map((r) => r.id);
  let votes = new Map<string, -1 | 1>();
  let saved = new Set<string>();

  if (viewerId && ids.length > 0) {
    const supabase = await createClient();
    const [voteRows, bookmarks] = await Promise.all([
      supabase.from("votes").select("post_id, value").eq("user_id", viewerId).in("post_id", ids),
      supabase.from("bookmarks").select("post_id").eq("user_id", viewerId).in("post_id", ids),
    ]);
    votes = new Map((voteRows.data ?? []).map((v) => [v.post_id, v.value === -1 ? -1 : 1]));
    saved = new Set((bookmarks.data ?? []).map((b) => b.post_id));
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    type: r.type,
    semester: r.semester,
    createdAt: r.created_at,
    editedAt: wasEdited(r.created_at, r.updated_at) ? r.updated_at : null,
    voteScore: r.vote_score,
    bulb: {
      lit: r.lit_count,
      off: r.off_count,
      level: r.brightness_level,
      score: r.brightness_score,
      viewerVote: votes.get(r.id) ?? 0,
    },
    commentCount: r.comment_count,
    author: toAuthor(r.author),
    course: r.course,
    topics: [...r.topics].sort((a, b) => a.name.localeCompare(b.name)),
    viewerHasSaved: saved.has(r.id),
  }));
}

// Ignore the tiny gap between insert and the first write in the same request.
function wasEdited(createdAt: string, updatedAt: string): boolean {
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 60_000;
}

function sanitizeQuery(query: string): string {
  return query.replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 100);
}

export async function getCourseFeed(options: {
  courseId: string;
  sort: FeedSort;
  types?: readonly PostType[];
  topicId?: string;
  query?: string;
  viewerId?: string;
  limit?: number;
}): Promise<PostSummary[]> {
  const supabase = await createClient();
  const select = options.topicId
    ? `${POST_SELECT}, topic_filter:post_topics!inner(topic_id)`
    : POST_SELECT;

  let request = supabase.from("posts").select(select).eq("course_id", options.courseId);
  if (options.types) request = request.in("type", [...options.types]);

  if (options.topicId) request = request.eq("topic_filter.topic_id", options.topicId);

  const q = options.query ? sanitizeQuery(options.query) : "";
  if (q) request = request.or(`title.ilike.%${q}%,content.ilike.%${q}%`);

  const orderColumn =
    options.sort === "new" ? "created_at" : "brightness_score";
  request = request
    .order(orderColumn, { ascending: false })
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);

  const { data, error } = await request.overrideTypes<PostRow[], { merge: false }>();
  if (error) throw new Error(`Could not load posts: ${error.message}`);
  return withViewerState(data, options.viewerId);
}

export type PostDetail = PostSummary & {
  course: { id: string; slug: string; code: string; name: string; university: string; universityId: string };
};

export async function getPost(postId: string, viewerId?: string): Promise<PostDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      POST_SELECT.replace(
        "course:courses(slug, code, name)",
        "course:courses(id, slug, code, name, university_id, university:universities(name, short_name))",
      ),
    )
    .eq("id", postId)
    .maybeSingle<
      Omit<PostRow, "course"> & {
        course: {
          id: string;
          slug: string;
          code: string;
          name: string;
          university_id: string;
          university: { name: string; short_name: string | null } | null;
        };
      }
    >();
  if (error) throw new Error(`Could not load post: ${error.message}`);
  if (!data) return null;

  const [summary] = await withViewerState([{ ...data, course: data.course }], viewerId);
  return {
    ...summary,
    course: {
      id: data.course.id,
      slug: data.course.slug,
      code: data.course.code,
      name: data.course.name,
      university: data.course.university?.short_name ?? data.course.university?.name ?? "",
      universityId: data.course.university_id,
    },
  };
}

export async function getSavedPosts(viewerId: string): Promise<PostSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select(`created_at, post:posts(${POST_SELECT})`)
    .eq("user_id", viewerId)
    .order("created_at", { ascending: false })
    .overrideTypes<{ created_at: string; post: PostRow | null }[], { merge: false }>();
  if (error) throw new Error(`Could not load saved posts: ${error.message}`);
  const rows = data.flatMap((b) => (b.post ? [b.post] : []));
  return withViewerState(rows, viewerId);
}

export type CommentNode = {
  id: string;
  content: string;
  createdAt: string;
  edited: boolean;
  // Deleted comments that still have replies stay as placeholders.
  deleted: boolean;
  author: Author | null;
  bulb: Bulb;
  replies: CommentNode[];
};

export type CommentSort = "brightest" | "new";

// Comments for a post as a two-level tree: top-level comments with replies.
// Top-level comments are brightest first (or newest); replies stay in order.
export async function getComments(
  postId: string,
  options: { viewerId?: string; sort?: CommentSort } = {},
): Promise<CommentNode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      `id, content, created_at, updated_at, deleted_at, parent_comment_id, lit_count, off_count, brightness_level, brightness_score, author:profiles!comments_author_id_fkey(${AUTHOR_FIELDS})`,
    )
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .overrideTypes<
      {
        id: string;
        content: string;
        created_at: string;
        updated_at: string;
        deleted_at: string | null;
        parent_comment_id: string | null;
        lit_count: number;
        off_count: number;
        brightness_level: number;
        brightness_score: number;
        author: AuthorRow | null;
      }[]
    , { merge: false }>();
  if (error) throw new Error(`Could not load comments: ${error.message}`);

  let myVotes = new Map<string, -1 | 1>();
  if (options.viewerId && data.length) {
    const { data: votes } = await supabase
      .from("comment_votes")
      .select("comment_id, value")
      .eq("user_id", options.viewerId)
      .in("comment_id", data.map((c) => c.id));
    myVotes = new Map((votes ?? []).map((v) => [v.comment_id, v.value === -1 ? -1 : 1]));
  }

  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  const score = new Map(data.map((c) => [c.id, c.brightness_score]));
  for (const c of data) {
    const deleted = c.deleted_at !== null;
    byId.set(c.id, {
      id: c.id,
      content: deleted ? "" : c.content,
      createdAt: c.created_at,
      edited: !deleted && wasEdited(c.created_at, c.updated_at),
      deleted,
      author: deleted ? null : toAuthor(c.author),
      bulb: {
        lit: c.lit_count,
        off: c.off_count,
        level: c.brightness_level,
        score: c.brightness_score,
        viewerVote: myVotes.get(c.id) ?? 0,
      },
      replies: [],
    });
  }
  for (const c of data) {
    const node = byId.get(c.id)!;
    const parent = c.parent_comment_id ? byId.get(c.parent_comment_id) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  if (options.sort === "new") return roots.reverse();
  return roots.sort((a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0));
}

// A student's posts, newest first.
export async function getPostsByAuthor(authorId: string, viewerId?: string): Promise<PostSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("author_id", authorId)
    .order("created_at", { ascending: false })
    .limit(100)
    .overrideTypes<PostRow[], { merge: false }>();
  if (error) throw new Error(`Could not load posts: ${error.message}`);
  return withViewerState(data, viewerId);
}

// Posts by id, in the order given (e.g. by search relevance). Goes through the
// normal RLS-protected API, so it only returns posts the viewer may see.
export async function getPostsByIds(ids: string[], viewerId?: string): Promise<PostSummary[]> {
  if (ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .in("id", ids)
    .overrideTypes<PostRow[], { merge: false }>();
  if (error) throw new Error(`Could not load posts: ${error.message}`);
  const order = new Map(ids.map((id, i) => [id, i]));
  const sorted = [...data].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return withViewerState(sorted, viewerId);
}

// How many posts of each type a course has (for the course page tabs).
export async function getPostTypeCounts(courseId: string): Promise<Partial<Record<PostType, number>>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select("type").eq("course_id", courseId);
  if (error) throw new Error(`Could not count posts: ${error.message}`);
  const counts: Partial<Record<PostType, number>> = {};
  for (const { type } of data) counts[type] = (counts[type] ?? 0) + 1;
  return counts;
}

// The course's brightest review (at least "Glowing"), for the spotlight card.
export async function getBrightestReview(courseId: string, viewerId?: string): Promise<PostSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("course_id", courseId)
    .eq("type", "experience")
    .gte("brightness_level", 3)
    .order("brightness_score", { ascending: false })
    .limit(1)
    .overrideTypes<PostRow[], { merge: false }>();
  if (!data?.length) return null;
  const [post] = await withViewerState(data, viewerId);
  return post;
}
