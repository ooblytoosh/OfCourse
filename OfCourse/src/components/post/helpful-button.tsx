"use client";

import { Lightbulb } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { SignInLink } from "@/components/sign-in-link";
import { useFlashError } from "@/hooks/use-flash-error";
import { toggleHelpful } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

type HelpfulState = { marked: boolean; count: number };

// "Helpful (12)": one mark per student; pressing again removes it.
export function HelpfulButton({
  postId,
  marked,
  count,
  signedIn,
  className,
}: HelpfulState & { postId: string; signedIn: boolean; className?: string }) {
  const [optimistic, toggle] = useOptimistic<HelpfulState, void>({ marked, count }, (state) => ({
    marked: !state.marked,
    count: state.count + (state.marked ? -1 : 1),
  }));
  const [pending, startTransition] = useTransition();
  const [error, flashError] = useFlashError();

  const classes = cn(
    "relative z-10 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-sm font-medium tabular-nums transition-colors",
    optimistic.marked
      ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
    className,
  );
  const content = (
    <>
      <Lightbulb className={cn("size-4", optimistic.marked && "fill-amber-300")} aria-hidden />
      Helpful
      <span className="text-xs opacity-80">({optimistic.count})</span>
    </>
  );

  if (!signedIn) {
    return (
      <SignInLink className={classes} title="Sign in to mark posts helpful">
        {content}
      </SignInLink>
    );
  }

  return (
    <>
      <button
        type="button"
        className={classes}
        aria-pressed={optimistic.marked}
        aria-label={`${optimistic.marked ? "Remove helpful mark" : "Mark as helpful"} (${optimistic.count})`}
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
    </>
  );
}
