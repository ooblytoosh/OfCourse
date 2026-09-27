import "server-only";

import { AI_LIMITS } from "@/lib/ai/config";
import { countUnindexedPosts, embedTexts, syncPostEmbeddings } from "@/lib/ai/embeddings";
import { getOpenAI } from "@/lib/ai/openai";
import { sanitizeAnswer, synthesize, type ChatTurn, type SourceReply } from "@/lib/ai/synthesis";
import { tabForPostType } from "@/lib/content-policy";
import type { Json } from "@/lib/database.types";
import { getPostsByIds, type PostSummary } from "@/lib/data/posts";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Course-scoped retrieval-augmented answers over student posts, in saved chats.
//
//   question (+ previous question) -> embedding -> match_course_posts (this course)
//     -> posts loaded through the normal API -> OpenAI synthesis (+ chat history)
//     -> answer + the real posts it drew on -> saved to the student's chat
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

export type StoredSource = { post_id: string; similarity: number; cited: boolean };

const NO_RESULTS_TEXT = "I couldn't find enough student-created content for this question yet.";

// Errors thrown with this are safe to show to the student.
class FriendlyError extends Error {}

export async function askStudentKnowledge(input: {
  courseId: string;
  question: string;
  userId: string;
  conversationId?: string;
}): Promise<{ result: AskResult; conversationId?: string }> {
  const question = input.question.trim().replace(/\s+/g, " ");
  const fail = (message: string) => ({
    result: { status: "error", question, message } as AskResult,
    conversationId: input.conversationId,
  });

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
    const { data: allowed } = await supabase.rpc("can_participate", { p_course_id: course.id });
    if (allowed !== true) {
      throw new FriendlyError("Verify your university email to ask the AI about this course.");
    }

    // A continued chat must be the student's own, in this course.
    let history: ChatTurn[] = [];
    if (input.conversationId) {
      const { data: chat } = await supabase
        .from("ai_conversations")
        .select("id, course_id")
        .eq("id", input.conversationId)
        .maybeSingle();
      if (!chat || chat.course_id !== course.id) throw new FriendlyError("That chat isn't available.");
      history = await loadHistory(supabase, chat.id);
    }

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

    // Follow-ups like "what about double rotations?" are searched together
    // with the previous question so they find the right posts.
    const previousQuestion = history.at(-1)?.question;
    const searchText = previousQuestion ? `${previousQuestion}\n${question}` : question;
    const [queryEmbedding] = await embedTexts(openai, [searchText]);
    const { data: matches, error: matchError } = await supabase.rpc("match_course_posts", {
      query_embedding: JSON.stringify(queryEmbedding),
      p_course_id: course.id,
      match_count: AI_LIMITS.matchCount,
    });
    if (matchError) throw new Error(`Vector search failed: ${matchError.message}`);

    const similarity = new Map(matches.map((m) => [m.post_id, m.similarity]));
    const candidates = matches.filter((m) => m.similarity >= AI_LIMITS.minSimilarity);
    // Loaded through the normal API: only posts this student is allowed to see.
    const candidatePosts = candidates.length
      ? await getPostsByIds(candidates.map((m) => m.post_id), input.userId)
      : [];
    const posts = pickAcrossTabs(candidatePosts, AI_LIMITS.maxSources);
    const relevantIds = posts.map((p) => p.id);

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

    let result: AskResult;
    if (posts.length === 0) {
      const closest = await getPostsByIds(matches.slice(0, 3).map((m) => m.post_id), input.userId);
      result = { status: "no_results", question, closest: closest.map((p) => toSource(p)) };
    } else {
      const [replies, ratings] = await Promise.all([
        loadReplies(supabase, relevantIds),
        loadRatings(supabase, course.id),
      ]);
      const raw = await synthesize(openai, question, posts, history, { replies, ratings });
      if (!raw) throw new Error("The model returned an empty answer.");
      const { answer, cited } = sanitizeAnswer(raw, posts.length);
      result = {
        status: "answer",
        question,
        answer,
        sources: posts.map((post, i) => toSource(post, cited.has(i + 1))),
      };
    }

    const conversationId = await saveTurn(supabase, {
      conversationId: input.conversationId,
      userId: input.userId,
      courseId: course.id,
      result,
    });
    return { result, conversationId };
  } catch (error) {
    if (error instanceof FriendlyError) return fail(error.message);
    console.error("[ai] askStudentKnowledge failed:", error);
    return fail("Something went wrong while searching student knowledge. Please try again.");
  }
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Posts come in most-similar first. Keep the best one from each course tab
// (reviews, threads, resources) so a question can draw on all of them, then
// fill the rest by similarity, and return them most-similar first.
function pickAcrossTabs<T extends PostSummary>(posts: T[], max: number): T[] {
  const picked = new Set<T>();
  const seenTabs = new Set<string>();
  for (const post of posts) {
    const tab = tabForPostType(post.type);
    if (!seenTabs.has(tab) && picked.size < max) {
      seenTabs.add(tab);
      picked.add(post);
    }
  }
  for (const post of posts) {
    if (picked.size >= max) break;
    picked.add(post);
  }
  return posts.filter((p) => picked.has(p));
}

// The first few student replies under each source post. Threads are often a
// question whose answers live in the replies.
async function loadReplies(supabase: Supabase, postIds: string[]): Promise<Map<string, SourceReply[]>> {
  const replies = new Map<string, SourceReply[]>();
  if (postIds.length === 0) return replies;
  const { data } = await supabase
    .from("comments")
    .select("post_id, content, deleted_at, author:profiles(name, username)")
    .in("post_id", postIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .overrideTypes<
      { post_id: string; content: string; author: { name: string | null; username: string | null } | null }[],
      { merge: false }
    >();
  for (const row of data ?? []) {
    const list = replies.get(row.post_id) ?? [];
    if (list.length >= AI_LIMITS.repliesPerSource) continue;
    const text = row.content.replace(/\s+/g, " ").trim();
    list.push({
      author: row.author?.name || row.author?.username || "a student",
      text: text.length > AI_LIMITS.replyChars ? `${text.slice(0, AI_LIMITS.replyChars)}…` : text,
    });
    replies.set(row.post_id, list);
  }
  return replies;
}

async function loadRatings(supabase: Supabase, courseId: string) {
  const { data } = await supabase
    .from("course_rating_stats")
    .select("avg_workload_hours, avg_difficulty, would_take_again_pct, rating_count")
    .eq("course_id", courseId)
    .maybeSingle();
  if (!data || !data.rating_count) return null;
  return {
    workloadHours: Number(data.avg_workload_hours),
    difficulty: Number(data.avg_difficulty),
    wouldTakeAgainPct: Number(data.would_take_again_pct),
    count: Number(data.rating_count),
  };
}

// The last few question/answer pairs of a chat, oldest first.
async function loadHistory(supabase: Supabase, conversationId: string): Promise<ChatTurn[]> {
  const { data } = await supabase
    .from("ai_messages")
    .select("role, content, status")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    // A question and its answer share a timestamp: newest-first puts the
    // answer ahead of its question, so the reversed list pairs up.
    .order("role", { ascending: true })
    .limit(AI_LIMITS.historyTurns * 2);
  const messages = (data ?? []).reverse();
  const turns: ChatTurn[] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].role === "user" && messages[i + 1].role === "assistant") {
      if (messages[i + 1].status === "answer") {
        turns.push({ question: messages[i].content, answer: messages[i + 1].content });
      }
      i++;
    }
  }
  return turns;
}

// Saves a question and its answer, starting a chat if needed. Errors are
// never saved, so the student can simply try again.
async function saveTurn(
  supabase: Supabase,
  turn: { conversationId?: string; userId: string; courseId: string; result: AskResult },
): Promise<string | undefined> {
  const { result } = turn;
  if (result.status === "error") return turn.conversationId;

  let conversationId = turn.conversationId;
  if (!conversationId) {
    const title = result.question.length > 80 ? `${result.question.slice(0, 79)}…` : result.question;
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: turn.userId, course_id: turn.courseId, title })
      .select("id")
      .single();
    if (error || !data) {
      console.error("[ai] Couldn't start a chat:", error);
      return undefined;
    }
    conversationId = data.id;
  }

  const sources: StoredSource[] = (result.status === "answer" ? result.sources : result.closest).map((s) => ({
    post_id: s.id,
    similarity: Number(s.similarity.toFixed(4)),
    cited: s.cited,
  }));
  const { error } = await supabase.from("ai_messages").insert([
    { conversation_id: conversationId, role: "user", content: result.question },
    {
      conversation_id: conversationId,
      role: "assistant",
      content: result.status === "answer" ? result.answer : NO_RESULTS_TEXT,
      status: result.status,
      sources: sources as unknown as Json,
    },
    // Columns a row leaves out take their defaults instead of NULL.
  ], { defaultToNull: false });
  if (error) console.error("[ai] Couldn't save chat messages:", error);
  await supabase
    .from("ai_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  return conversationId;
}
