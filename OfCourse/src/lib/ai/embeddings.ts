import { createHash } from "node:crypto";

import type OpenAI from "openai";

import { AI_LIMITS, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/ai/config";
import { POST_TYPES, type PostType } from "@/lib/content-policy";
import type { AdminClient } from "@/lib/supabase/admin";

// Shared by the app (new/edited posts) and scripts/embed-posts.ts (backfill).
// Deliberately free of Next.js imports so the script can run it with tsx.

type IndexablePost = {
  id: string;
  course_id: string;
  title: string;
  content: string;
  type: PostType;
  topics: { name: string }[];
  course: { code: string; name: string } | null;
};

// The text that gets embedded: what the post is about, never who wrote it.
export function postDocument(post: IndexablePost): string {
  const lines = [
    `Title: ${post.title}`,
    `Type: ${POST_TYPES[post.type]?.label ?? post.type}`,
    post.course ? `Course: ${post.course.code} ${post.course.name}` : null,
    post.topics.length ? `Topics: ${post.topics.map((t) => t.name).join(", ")}` : null,
    "",
    post.content.slice(0, AI_LIMITS.documentChars),
  ];
  return lines.filter((l) => l !== null).join("\n");
}

function contentHash(document: string): string {
  return createHash("sha256").update(`${EMBEDDING_MODEL}:${EMBEDDING_DIMENSIONS}\n${document}`).digest("hex");
}

export async function embedTexts(openai: OpenAI, texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  });
  const vectors = response.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
  for (const v of vectors) {
    if (v.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `${EMBEDDING_MODEL} returned ${v.length} dimensions; the database expects ${EMBEDDING_DIMENSIONS}.`,
      );
    }
  }
  return vectors;
}

export type SyncResult = { checked: number; embedded: number; unchanged: number };

const BATCH_SIZE = 50;

// Makes sure the given posts (or every post, or every post in a course) have
// an up-to-date embedding. Posts whose text hasn't changed are skipped, so
// running this repeatedly costs nothing extra.
export async function syncPostEmbeddings(
  admin: AdminClient,
  openai: OpenAI,
  scope: { postIds?: string[]; courseId?: string } = {},
): Promise<SyncResult> {
  let query = admin
    .from("posts")
    .select("id, course_id, title, content, type, topics(name), course:courses(code, name)")
    .order("created_at");
  if (scope.postIds) query = query.in("id", scope.postIds);
  if (scope.courseId) query = query.eq("course_id", scope.courseId);
  const { data: posts, error } = await query.overrideTypes<IndexablePost[], { merge: false }>();
  if (error) throw new Error(`Couldn't load posts to embed: ${error.message}`);
  if (posts.length === 0) return { checked: 0, embedded: 0, unchanged: 0 };

  const { data: existing, error: existingError } = await admin
    .from("post_embeddings")
    .select("post_id, content_hash")
    .in("post_id", posts.map((p) => p.id));
  if (existingError) throw new Error(`Couldn't load existing embeddings: ${existingError.message}`);
  const hashes = new Map((existing ?? []).map((e) => [e.post_id, e.content_hash]));

  const stale = posts
    .map((post) => {
      const document = postDocument(post);
      return { post, document, hash: contentHash(document) };
    })
    .filter(({ post, hash }) => hashes.get(post.id) !== hash);

  for (let i = 0; i < stale.length; i += BATCH_SIZE) {
    const batch = stale.slice(i, i + BATCH_SIZE);
    const vectors = await embedTexts(openai, batch.map((b) => b.document));
    const { error: upsertError } = await admin.from("post_embeddings").upsert(
      batch.map(({ post, hash }, j) => ({
        post_id: post.id,
        course_id: post.course_id,
        embedding: JSON.stringify(vectors[j]),
        model: EMBEDDING_MODEL,
        content_hash: hash,
        updated_at: new Date().toISOString(),
      })),
    );
    if (upsertError) throw new Error(`Couldn't save embeddings: ${upsertError.message}`);
  }

  return { checked: posts.length, embedded: stale.length, unchanged: posts.length - stale.length };
}

// Number of posts in a course that have no embedding yet.
export async function countUnindexedPosts(admin: AdminClient, courseId: string): Promise<number> {
  const [posts, embedded] = await Promise.all([
    admin.from("posts").select("*", { count: "exact", head: true }).eq("course_id", courseId),
    admin.from("post_embeddings").select("*", { count: "exact", head: true }).eq("course_id", courseId),
  ]);
  return Math.max(0, (posts.count ?? 0) - (embedded.count ?? 0));
}
