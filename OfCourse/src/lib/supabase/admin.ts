import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";

// Supabase client with the service role key. It bypasses Row Level Security,
// so it is only used by trusted server code for one job: writing post
// embeddings. Never import it into client components. Returns null when
// SUPABASE_SERVICE_ROLE_KEY isn't set.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;
