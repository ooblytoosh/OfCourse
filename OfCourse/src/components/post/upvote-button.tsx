"use client";

import { ArrowBigUp } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { SignInLink } from "@/components/sign-in-link";
import { useFlashError } from "@/hooks/use-flash-error";
import { toggleHelpful } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

type VoteState = { voted: boolean; count: number };

// One upvote per student; pressing again removes it. "stacked" puts the count
// under the arrow (feed cards); "inline" puts it beside (post page).
export function UpvoteButton({
  postId,
  voted,
  count,
  signedIn,
  layout = "inline",
  className,
}: VoteState & { postId: string; signedIn: boolean; layout?: "stacked" | "inline"; className?: string }) {
  const [optimistic, toggle] = useOptimistic<VoteState, void>({ voted, count }, (state) => ({
    voted: !state.voted,
    count: state.count + (state.voted ? -1 : 1),
  }));
  const [pending, startTransition] = useTransition();
  const [error, flashError] = useFlashError();

  const classes = cn(
    "group/vote relative z-10 inline-flex items-center justify-center rounded-lg border font-semibold tabular-nums transition-all duration-150 active:scale-95",
    layout === "stacked" ? "w-11 flex-col gap-0 py-1.5 text-xs" : "h-8 gap-1 px-2.5 text-sm",
    optimistic.voted
      ? "border-transparent bg-brand-gradient text-white shadow-[0_6px_16px_-8px_var(--brand)]"
      : "bg-card text-muted-foreground hover:border-brand/50 hover:text-brand",
    className,
  );
  const content = (
    <>
      <ArrowBigUp
        className={cn(
          "size-5 transition-transform duration-150 group-hover/vote:-translate-y-px",
          optimistic.voted && "fill-current",
        )}
        aria-hidden
      />
      <span>{optimistic.count}</span>
    </>
  );

  if (!signedIn) {
    return (
      <SignInLink className={classes} title="Sign in to upvote">
        {content}
        <span className="sr-only">upvotes</span>
      </SignInLink>
    );
  }

  return (
    <span className={cn("relative inline-flex", layout === "stacked" ? "flex-col items-center" : "items-center gap-2")}>
      <button
        type="button"
        className={classes}
        aria-pressed={optimistic.voted}
        aria-label={`${optimistic.voted ? "Remove upvote" : "Upvote"} (${optimistic.count})`}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            toggle();
            const result = await toggleHelpful(postId);
            if (!result.ok) flashError(result.error);
          })
        }
      >
        {content}
      </button>
      {error && (
        <span role="alert" className="relative z-10 text-xs text-destructive">
          {error}
        </span>
      )}
    </span>
  );
}
