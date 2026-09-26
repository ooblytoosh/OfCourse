import "server-only";

import { after } from "next/server";

import { syncPostEmbeddings } from "@/lib/ai/embeddings";
import { getOpenAI } from "@/lib/ai/openai";
import { createAdminClient } from "@/lib/supabase/admin";

// Embeds a post after the response has been sent, so publishing never waits
// on OpenAI. Until it finishes (or if AI isn't configured) the post simply
// isn't part of AI search yet; it's still in the feed like any other post.
export function queuePostEmbedding(postId: string) {
  after(async () => {
    const admin = createAdminClient();
    const openai = getOpenAI();
    if (!admin || !openai) {
      console.warn("[ai] Skipping embedding: OPENAI_API_KEY or SUPABASE_SERVICE_ROLE_KEY is not set.");
      return;
    }
    try {
      const result = await syncPostEmbeddings(admin, openai, { postIds: [postId] });
      if (result.embedded) console.info(`[ai] Embedded post ${postId}`);
    } catch (error) {
      console.error(`[ai] Embedding post ${postId} failed:`, error);
    }
  });
}
