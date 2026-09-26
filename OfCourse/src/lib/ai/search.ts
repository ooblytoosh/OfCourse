import "server-only";

import { AI_LIMITS } from "@/lib/ai/config";
import { countUnindexedPosts, embedTexts, syncPostEmbeddings } from "@/lib/ai/embeddings";
import { getOpenAI } from "@/lib/ai/openai";
import { sanitizeAnswer, synthesize } from "@/lib/ai/synthesis";
import { getPostsByIds, type PostSummary } from "@/lib/data/posts";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Course-scoped retrieval-augmented answers over student posts.
//
//   question -> embedding -> match_course_posts (this course only)
//            -> posts loaded through the normal API -> OpenAI synthesis
//            -> answer + the real posts it drew on
//
// Sources shown to the user always come from the database records we
// retrieved. The model only refers to them by number ([S1], [S2]…); the app
// turns those into links, drops any number that doesn't exist, and strips
// any URL the model writes.

export type AskSource = PostSummary & { similarity: number; cited: boolean };

export type AskResult =
  | { status: "answer"; question: string; answer: string; sources: AskSource[] }
  | { status: "no_results"; question: string; closest: AskSource[] }
  | { status: "error"; question: string; message: string };

// Errors thrown with this are safe to show to the student.
class FriendlyError extends Error {}

export async function askStudentKnowledge(input: {
  courseId: string;
  question: string;
  userId: string;
}): Promise<AskResult> {
  const question = input.question.trim().replace(/\s+/g, " ");
  const fail = (message: string): AskResult => ({ status: "error", question, message });

  if (question.length < AI_LIMITS.questionMin) return fail("Ask a slightly longer question.");
  if (question.length > AI_LIMITS.questionMax) {
    return fail(`Keep your question under ${AI_LIMITS.questionMax} characters.`);
  }

  const openai = getOpenAI();
  if (!openai) return fail("AI search isn't set up yet. You can still browse and search the posts below.");

  const supabase = await createClient();

  try {
    // The course must exist; everything below is scoped to its id.
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("id", input.courseId)
      .maybeSingle();
    if (!course) throw new FriendlyError("That course doesn't exist.");

    // Cost control: a per-student hourly limit.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recent } = await supabase
      .from("ai_search_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", input.userId)
      .gte("created_at", since);
    if ((recent ?? 0) >= AI_LIMITS.hourlyQuestions) {
      throw new FriendlyError("You've asked a lot of questions this hour. Try again a little later.");
    }

    // Posts added before AI was set up (or while it was down) get indexed on
    // first search; posts that are already indexed are skipped.
    const admin = createAdminClient();
    if (admin && (await countUnindexedPosts(admin, course.id)) > 0) {
      await syncPostEmbeddings(admin, openai, { courseId: course.id });
    }

    const [queryEmbedding] = await embedTexts(openai, [question]);
    const { data: matches, error: matchError } = await supabase.rpc("match_course_posts", {
      query_embedding: JSON.stringify(queryEmbedding),
      p_course_id: course.id,
      match_count: AI_LIMITS.matchCount,
    });
    if (matchError) throw new Error(`Vector search failed: ${matchError.message}`);

    const similarity = new Map(matches.map((m) => [m.post_id, m.similarity]));
    const relevantIds = matches
      .filter((m) => m.similarity >= AI_LIMITS.minSimilarity)
      .slice(0, AI_LIMITS.maxSources)
      .map((m) => m.post_id);

    await supabase.from("ai_search_log").insert({
      user_id: input.userId,
      course_id: course.id,
      question,
      source_count: relevantIds.length,
    });

    const toSource = (post: PostSummary, cited = false): AskSource => ({
      ...post,
      similarity: similarity.get(post.id) ?? 0,
      cited,
    });

    if (relevantIds.length === 0) {
      const closest = await getPostsByIds(matches.slice(0, 3).map((m) => m.post_id), input.userId);
      return { status: "no_results", question, closest: closest.map((p) => toSource(p)) };
    }

    // Loaded through the normal API: only posts this student is allowed to see.
    const posts = await getPostsByIds(relevantIds, input.userId);
    if (posts.length === 0) return { status: "no_results", question, closest: [] };

    const raw = await synthesize(openai, question, posts);
    if (!raw) throw new Error("The model returned an empty answer.");
    const { answer, cited } = sanitizeAnswer(raw, posts.length);

    return {
      status: "answer",
      question,
      answer,
      sources: posts.map((post, i) => toSource(post, cited.has(i + 1))),
    };
  } catch (error) {
    if (error instanceof FriendlyError) return fail(error.message);
    console.error("[ai] askStudentKnowledge failed:", error);
    return fail("Something went wrong while searching student knowledge. Please try again.");
  }
}
