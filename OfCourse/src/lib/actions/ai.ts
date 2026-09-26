"use server";

import { askStudentKnowledge, type AskResult } from "@/lib/ai/search";
import { getCurrentUser } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Ask the course's student knowledge a question. Signed-in students only
// (it spends OpenAI credits). Runs entirely on the server.
export async function askCourseQuestion(courseId: unknown, question: unknown): Promise<AskResult> {
  const text = typeof question === "string" ? question : "";
  if (typeof courseId !== "string" || !UUID.test(courseId)) {
    return { status: "error", question: text, message: "That course doesn't exist." };
  }
  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", question: text, message: "Sign in to ask the student knowledge." };
  }
  return askStudentKnowledge({ courseId, question: text, userId: user.id });
}
