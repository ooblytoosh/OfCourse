import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { SignInLink } from "@/components/sign-in-link";
import { buttonVariants } from "@/components/ui/button";
import { VERIFY_HREF, type Participation } from "@/lib/participation";
import { cn } from "@/lib/utils";

// Shown instead of joining/posting/commenting/etc. when the viewer can't take
// part yet, with the one step that fixes it.
export function VerifyPrompt({
  participation,
  compact = false,
  className,
}: {
  participation: Extract<Participation, { allowed: false }>;
  compact?: boolean;
  className?: string;
}) {
  const action =
    participation.reason === "verify" ? (
      <Link href={VERIFY_HREF} className={cn(buttonVariants({ size: compact ? "sm" : "default" }), "shrink-0")}>
        <ShieldCheck />
        Verify now
      </Link>
    ) : participation.reason === "signin" ? (
      <SignInLink className={cn(buttonVariants({ size: compact ? "sm" : "default" }), "shrink-0")}>
        Sign in
      </SignInLink>
    ) : null;

  return (
    <div
      role="note"
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand/[0.07] sm:flex-row sm:items-center sm:justify-between",
        compact ? "p-3 text-sm" : "p-4",
        className,
      )}
    >
      <p className="flex items-start gap-2.5">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
        <span>
          {participation.reason === "verify" && (
            <span className="font-semibold">Verify your university email to join in. </span>
          )}
          <span className={participation.reason === "verify" ? "text-muted-foreground" : ""}>
            {participation.reason === "verify"
              ? "Until then you can read everything, but joining courses, posting, commenting, upvoting, rating and the AI need a verified student."
              : participation.message}
          </span>
        </span>
      </p>
      {action}
    </div>
  );
}
