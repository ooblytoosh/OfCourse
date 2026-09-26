// Generates embeddings for posts that don't have an up-to-date one yet.
// Safe to re-run: unchanged posts are skipped (no OpenAI cost).
//
//   npm run embed:posts                 # every post
//   npm run embed:posts -- cs1332       # one course, by slug
//
// Needs OPENAI_API_KEY, NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// in .env.local.

import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/ai/config";
import { syncPostEmbeddings } from "@/lib/ai/embeddings";
import { getOpenAI } from "@/lib/ai/openai";
import { createAdminClient } from "@/lib/supabase/admin";

async function main() {
  const admin = createAdminClient();
  const openai = getOpenAI();
  const missing = [
    !process.env.NEXT_PUBLIC_SUPABASE_URL && "NEXT_PUBLIC_SUPABASE_URL",
    !process.env.SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
    !process.env.OPENAI_API_KEY && "OPENAI_API_KEY",
  ].filter(Boolean);
  if (!admin || !openai || missing.length) {
    console.error(`Missing in .env.local: ${missing.join(", ")}`);
    process.exit(1);
  }

  const slug = process.argv[2];
  let courseId: string | undefined;
  if (slug) {
    const { data } = await admin.from("courses").select("id").eq("slug", slug).maybeSingle();
    if (!data) {
      console.error(`No course with slug "${slug}".`);
      process.exit(1);
    }
    courseId = data.id;
  }

  console.log(`Embedding ${slug ?? "all"} posts with ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS} dimensions)…`);
  const result = await syncPostEmbeddings(admin, openai, { courseId });
  console.log(
    `Done. Checked ${result.checked} posts: embedded ${result.embedded}, already up to date ${result.unchanged}.`,
  );
}

main().catch((error) => {
  console.error("Embedding failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
