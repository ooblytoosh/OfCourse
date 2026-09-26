import type OpenAI from "openai";

import { AI_LIMITS, CHAT_MODEL } from "@/lib/ai/config";
import { POST_TYPES } from "@/lib/content-policy";
import type { PostSummary } from "@/lib/data/posts";

// Prompting and answer clean-up for AI search. Free of Next.js imports so it
// can also be exercised from scripts.

type SourcePost = Pick<
  PostSummary,
  "title" | "content" | "type" | "semester" | "topics" | "voteScore" | "author"
>;

const SYSTEM_PROMPT = `You are the AI knowledge layer for OfCourse, where university students share what they learned in a course.

Help a student understand their question by synthesizing the student-created posts provided as sources. They all come from the student's own course.

Rules:
- Answer only from the sources. Don't add facts, formulas or advice that aren't in them.
- If the sources don't directly answer the question, start with "The student posts in this course don't directly cover this." Then briefly say what related topics they do cover, and stop. Don't fill the gap from general knowledge.
- Cite sources inline with their labels, like [S1] or [S2][S3], right after the claim they support. Only use the labels you were given.
- Never invent student experiences, quotes, names, post titles, links or sources. Only say a student said something if their post says it.
- Some sources are other students' questions or opinions. The student asking now is someone else: never tell them "your intuition is right" or reply as if they wrote a source.
- Make clear what is your synthesis and what students actually said (for example: "Jordan explains that…" only when that post says so).
- Earlier messages in the conversation are context only (so follow-up questions make sense). Cite only the sources listed in the latest message.
- Don't include URLs or a list of sources at the end; the app shows the sources.
- Be concise: at most about 180 words. Use short paragraphs or "- " bullet points. No headings.`;

function formatSource(post: SourcePost, label: string): string {
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
export function sanitizeAnswer(text: string, sourceCount: number): { answer: string; cited: Set<number> } {
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

export type ChatTurn = { question: string; answer: string };

// Earlier turns are sent (trimmed, without their old citation numbers) so
// follow-up questions have context.
function historyMessages(history: ChatTurn[]) {
  return history.flatMap((turn) => [
    { role: "user" as const, content: turn.question },
    {
      role: "assistant" as const,
      content: turn.answer.replace(/\[S\d+\]/g, "").slice(0, AI_LIMITS.historyAnswerChars),
    },
  ]);
}

export async function synthesize(
  openai: OpenAI,
  question: string,
  sources: SourcePost[],
  history: ChatTurn[] = [],
) {
  const context = sources.map((post, i) => formatSource(post, `S${i + 1}`)).join("\n\n---\n\n");
  const isReasoningModel = /^(gpt-5|o\d)/.test(CHAT_MODEL);
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...historyMessages(history),
      { role: "user", content: `Student posts from this course:\n\n${context}\n\nQuestion: ${question}` },
    ],
    max_completion_tokens: isReasoningModel ? 2000 : 500,
    ...(isReasoningModel ? { reasoning_effort: "low" as const } : {}),
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}

