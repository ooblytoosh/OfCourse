// All AI settings in one place.
//
// Embeddings: OpenAI text-embedding-3-small by default. The v3 embedding
// models accept a `dimensions` parameter, so any of them can produce vectors
// that fit the database column; EMBEDDING_DIMENSIONS must equal the size of
// post_embeddings.embedding (see supabase/migrations/20260929000000_ai_search.sql).
//
// Answers: a small, fast chat model by default.

export const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;

export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-5.4-mini";

export const AI_LIMITS = {
  questionMin: 5,
  questionMax: 500,
  // Posts retrieved per question, and how many of them go to the model.
  // Retrieval keeps the best relevant post from each course tab (reviews,
  // threads, resources) so one kind of post can't crowd out the others.
  matchCount: 20,
  maxSources: 8,
  // Student replies included under each source (threads keep their answers
  // in the replies), and how much of each reply.
  repliesPerSource: 4,
  // How much each brightness level (0-5) adds to a post's similarity when
  // choosing sources, so brighter posts win close calls.
  brightnessWeight: 0.015,
  replyChars: 400,
  // Characters of each post sent to the model (keeps prompts small).
  sourceChars: 1500,
  // Earlier chat turns sent with a follow-up question, and how much of each
  // earlier answer is included.
  historyTurns: 3,
  historyAnswerChars: 1200,
  // Characters of a post that get embedded.
  documentChars: 6000,
  // Minimum cosine similarity for a post to count as relevant. Calibrated for
  // text-embedding-3-small on the demo data: on-topic posts score ~0.5-0.8,
  // loosely related ones ~0.3-0.45, unrelated ones < 0.2.
  minSimilarity: Number(process.env.AI_MIN_SIMILARITY ?? 0.5),
  // Questions each student can ask per hour.
  hourlyQuestions: Number(process.env.AI_HOURLY_LIMIT ?? 30),
};
