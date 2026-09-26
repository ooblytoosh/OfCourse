import "server-only";

import type { AskResult, AskSource, StoredSource } from "@/lib/ai/search";
import { getPostsByIds } from "@/lib/data/posts";
import { createClient } from "@/lib/supabase/server";

export type ChatSummary = { id: string; title: string; updatedAt: string };

// A student's saved chats in one course, newest first.
export async function listChats(courseId: string): Promise<ChatSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("id, title, updated_at")
    .eq("course_id", courseId)
    .order("updated_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(`Could not load chats: ${error.message}`);
  return data.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updated_at }));
}

// A saved chat as question/answer turns. Source posts are re-loaded through
// the normal API, so deleted posts drop out and counts are current.
export async function getChatTurns(conversationId: string, viewerId: string): Promise<AskResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ai_messages")
    .select("role, content, sources, status")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    // A question and its answer are saved together with the same timestamp;
    // "user" sorts after "assistant", so descending puts the question first.
    .order("role", { ascending: false });
  if (error) throw new Error(`Could not load chat: ${error.message}`);

  const stored = data.flatMap((m) => (m.role === "assistant" ? (m.sources as StoredSource[]) : []));
  const posts = new Map(
    (await getPostsByIds([...new Set(stored.map((s) => s.post_id))], viewerId)).map((p) => [p.id, p]),
  );
  const hydrate = (sources: StoredSource[]): AskSource[] =>
    sources.flatMap((s) => {
      const post = posts.get(s.post_id);
      return post ? [{ ...post, similarity: s.similarity, cited: s.cited }] : [];
    });

  const turns: AskResult[] = [];
  for (let i = 0; i < data.length; i++) {
    const m = data[i];
    if (m.role !== "user") continue;
    const reply = data[i + 1];
    if (!reply || reply.role !== "assistant") continue;
    const sources = hydrate(reply.sources as StoredSource[]);
    turns.push(
      reply.status === "answer"
        ? { status: "answer", question: m.content, answer: reply.content, sources }
        : { status: "no_results", question: m.content, closest: sources },
    );
    i++;
  }
  return turns;
}
