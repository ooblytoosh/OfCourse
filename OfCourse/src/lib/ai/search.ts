import "server-only";

import type OpenAI from "openai";

import { AI_LIMITS, CHAT_MODEL } from "@/lib/ai/config";
import { countUnindexedPosts, embedTexts, syncPostEmbeddings } from "@/lib/ai/embeddings";
import { getOpenAI } from "@/lib/ai/openai";
import { POST_TYPES } from "@/lib/content-policy";
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

const SYSTEM_PROMPT = `You are the AI knowledge layer for OfCourse, where university students share what they learned in a course.

Help a student understand their question by synthesizing the student-created posts provided as sources. They all come from the student's own course.

Rules:
- Use the sources as the primary basis for your answer. Add general knowledge only to connect ideas, and never let it contradict the sources.
- Cite sources inline with their labels, like [S1] or [S2][S3], right after the claim they support. Only use the labels you were given.
- Never invent student experiences, quotes, names, post titles, links or sources. Don't claim a student said something unless the source says it.
- Make clear what is your synthesis and what students actually said (for example: "Jordan explains that…" only when that post says so).
- If the sources don't really answer the question, say plainly that the available student knowledge is insufficient, and mention what they do cover.
- Don't include URLs or a list of sources at the end; the app shows the sources.
- Be concise: at most about 180 words. Use short paragraphs or "- " bullet points. No headings.`;

function formatSource(post: PostSummary, label: string): string {
  const author = post.author?.name || post.author?.username || "a student";
  const meta = [
    POST_TYPES[post.type]?.label ?? post.type,
    `by ${author}`,
    post.semester ? `took the course ${post.semester}` : null,
    post.topics.length ? `topics: ${post.topics.map((t) => t.name).join(", ")}` : null,
    `${post.voteScore} votes`,
  ]
    .filter(Boolean)
    .join(" · ");
  const body = post.content.length > AI_LIMITS.sourceChars
    ? `${post.content.slice(0, AI_LIMITS.sourceChars)}…`
    : post.content;
  return `[${label}] "${post.title}" (${meta})\n${body}`;
}

// Keep only citations that point at a real source, and remove any link.
function sanitizeAnswer(text: string, sourceCount: number): { answer: string; cited: Set<number> } {
  const cited = new Set<number>();
  const answer = text
    .replace(/\[(S\d+(?:\s*,\s*S\d+)*)\]/g, (_, group: string) =>
      group
        .split(/\s*,\s*/)
        .map((label) => Number(label.slice(1)))
        .filter((n) => n >= 1 && n <= sourceCount)
        .map((n) => {
          cited.add(n);
          return `[S${n}]`;
        })
        .join(""),
    )
    .replace(/\[S\d+\]/g, (m) => (Number(m.slice(2, -1)) <= sourceCount ? m : ""))
    .replace(/\bhttps?:\/\/\S+/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
  return { answer, cited };
}

async function synthesize(openai: OpenAI, question: string, sources: PostSummary[]) {
  const context = sources.map((post, i) => formatSource(post, `S${i + 1}`)).join("\n\n---\n\n");
  const isReasoningModel = /^(gpt-5|o\d)/.test(CHAT_MODEL);
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Student posts from this course:\n\n${context}\n\nQuestion: ${question}` },
    ],
    max_completion_tokens: isReasoningModel ? 2000 : 500,
    ...(isReasoningModel ? { reasoning_effort: "low" as const } : {}),
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

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
