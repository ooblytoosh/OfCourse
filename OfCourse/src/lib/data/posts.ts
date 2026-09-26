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
};

type AuthorRow = Omit<Author, "university"> & {
  university: { name: string; short_name: string | null } | null;
};

const AUTHOR_FIELDS =
  "id, name, username, avatar_url, verified, university:universities(name, short_name)";

export function toAuthor(row: AuthorRow | null): Author | null {
  if (!row) return null;
  return {
    ...row,
    university: row.verified ? (row.university?.short_name ?? row.university?.name ?? null) : null,
  };
}

export type PostSummary = {
  id: string;
  title: string;
  content: string;
  type: PostType;
  semester: string | null;
  createdAt: string;
  // Set when the author edited the post after publishing it.
  editedAt: string | null;
  voteScore: number;
  commentCount: number;
  author: Author | null;
  course: { slug: string; code: string; name: string };
  topics: { id: string; name: string }[];
  viewerHasVoted: boolean;
  viewerHasSaved: boolean;
};

export type FeedSort = "hot" | "new" | "top";
export const FEED_SORTS: FeedSort[] = ["hot", "new", "top"];

const POST_SELECT =
  "id, title, content, type, semester, created_at, updated_at, vote_score, comment_count, " +
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
  author: AuthorRow | null;
  course: { slug: string; code: string; name: string };
  topics: { id: string; name: string }[];
};

// Adds whether the viewer has upvoted/saved each post.
async function withViewerState(rows: PostRow[], viewerId?: string): Promise<PostSummary[]> {
  const ids = rows.map((r) => r.id);
  let voted = new Set<string>();
  let saved = new Set<string>();

  if (viewerId && ids.length > 0) {
    const supabase = await createClient();
    const [votes, bookmarks] = await Promise.all([
      supabase.from("votes").select("post_id").eq("user_id", viewerId).in("post_id", ids),
      supabase.from("bookmarks").select("post_id").eq("user_id", viewerId).in("post_id", ids),
    ]);
    voted = new Set((votes.data ?? []).map((v) => v.post_id));
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
    commentCount: r.comment_count,
    author: toAuthor(r.author),
    course: r.course,
    topics: [...r.topics].sort((a, b) => a.name.localeCompare(b.name)),
    viewerHasVoted: voted.has(r.id),
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

  if (options.topicId) request = request.eq("topic_filter.topic_id", options.topicId);

  const q = options.query ? sanitizeQuery(options.query) : "";
  if (q) request = request.or(`title.ilike.%${q}%,content.ilike.%${q}%`);

  const orderColumn =
    options.sort === "new" ? "created_at" : options.sort === "top" ? "vote_score" : "hot_score";
  request = request
    .order(orderColumn, { ascending: false })
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 50);

  const { data, error } = await request.overrideTypes<PostRow[], { merge: false }>();
  if (error) throw new Error(`Could not load posts: ${error.message}`);
  return withViewerState(data, options.viewerId);
}

export type PostDetail = PostSummary & {
  course: { id: string; slug: string; code: string; name: string; university: string };
};

export async function getPost(postId: string, viewerId?: string): Promise<PostDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      POST_SELECT.replace(
        "course:courses(slug, code, name)",
        "course:courses(id, slug, code, name, university:universities(name, short_name))",
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
  replies: CommentNode[];
};

// Comments for a post as a two-level tree: top-level comments with replies.
export async function getComments(postId: string): Promise<CommentNode[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      `id, content, created_at, updated_at, deleted_at, parent_comment_id, author:profiles(${AUTHOR_FIELDS})`,
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
        author: AuthorRow | null;
      }[]
    , { merge: false }>();
  if (error) throw new Error(`Could not load comments: ${error.message}`);

  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of data) {
    const deleted = c.deleted_at !== null;
    byId.set(c.id, {
      id: c.id,
      content: deleted ? "" : c.content,
      createdAt: c.created_at,
      edited: !deleted && wasEdited(c.created_at, c.updated_at),
      deleted,
      author: deleted ? null : toAuthor(c.author),
      replies: [],
    });
  }
  for (const c of data) {
    const node = byId.get(c.id)!;
    const parent = c.parent_comment_id ? byId.get(c.parent_comment_id) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  return roots;
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
