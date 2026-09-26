import { isSupabaseConfigured } from "@/lib/supabase/env";

// Shown in place of auth features until Supabase keys are provided.
export function SetupNotice() {
  if (isSupabaseConfigured()) return null;

  return (
    <div className="rounded-xl border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground">
      <p className="font-medium text-foreground">Supabase isn&apos;t connected yet</p>
      <p className="mt-1">
        Copy <code className="font-mono">.env.example</code> to{" "}
        <code className="font-mono">.env.local</code>, add your project URL and
        publishable key, then restart the dev server.
      </p>
    </div>
  );
}
