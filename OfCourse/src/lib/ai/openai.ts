import OpenAI from "openai";

// The OpenAI client, or null when OPENAI_API_KEY isn't set. Server-side only:
// the key is never sent to the browser (it has no NEXT_PUBLIC_ prefix).
let client: OpenAI | null | undefined;

export function getOpenAI(): OpenAI | null {
  if (client === undefined) {
    const apiKey = process.env.OPENAI_API_KEY;
    client = apiKey ? new OpenAI({ apiKey, maxRetries: 1, timeout: 30_000 }) : null;
  }
  return client;
}
