"use server";

import { askStudentKnowledge, type AskResult } from "@/lib/ai/search";
import { getCurrentUser } from "@/lib/auth";
import { getChatTurns, listChats, type ChatSummary } from "@/lib/data/ai-chats";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isId = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

// Ask the course's student knowledge a question, optionally continuing a
// saved chat. Signed-in students only (it spends OpenAI credits).
export async function askCourseQuestion(
  courseId: unknown,
  question: unknown,
  conversationId?: unknown,
): Promise<{ result: AskResult; conversationId?: string }> {
  const text = typeof question === "string" ? question : "";
  if (!isId(courseId)) {
    return { result: { status: "error", question: text, message: "That course doesn't exist." } };
  }
  const user = await getCurrentUser();
  if (!user) {
    return { result: { status: "error", question: text, message: "Sign in to ask the student knowledge." } };
  }
  return askStudentKnowledge({
    courseId,
    question: text,
    userId: user.id,
    conversationId: isId(conversationId) ? conversationId : undefined,
  });
}

// Opens one of your saved chats.
export async function openChat(conversationId: unknown): Promise<AskResult[] | null> {
  const user = await getCurrentUser();
  if (!user || !isId(conversationId)) return null;
  try {
    return await getChatTurns(conversationId, user.id);
  } catch (error) {
    console.error("[ai] openChat failed:", error);
    return null;
  }
}

export async function deleteChat(conversationId: unknown, courseId: unknown): Promise<ChatSummary[] | null> {
  const user = await getCurrentUser();
  if (!user || !isId(conversationId) || !isId(courseId)) return null;
  const supabase = await createClient();
  await supabase.from("ai_conversations").delete().eq("id", conversationId);
  return listChats(courseId);
}

export async function refreshChats(courseId: unknown): Promise<ChatSummary[]> {
  const user = await getCurrentUser();
  if (!user || !isId(courseId)) return [];
  return listChats(courseId);
}
