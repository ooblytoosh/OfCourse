"use client";

import { ArrowBigUp } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { SignInLink } from "@/components/sign-in-link";
import { toggleVote } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

type VoteState = { voted: boolean; score: number };

export function VoteButton({
  postId,
  voted,
  score,
  signedIn,
  className,
}: VoteState & { postId: string; signedIn: boolean; className?: string }) {
  const [optimistic, setOptimistic] = useOptimistic<VoteState, void>(
    { voted, score },
    (state) => ({ voted: !state.voted, score: state.score + (state.voted ? -1 : 1) }),
  );
  const [pending, startTransition] = useTransition();

  const classes = cn(
    "relative z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium tabular-nums transition-colors",
    optimistic.voted
      ? "bg-brand/10 text-brand hover:bg-brand/15"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
    className,
  );
  const content = (
    <>
      <ArrowBigUp className={cn("size-5", optimistic.voted && "fill-current")} />
      {optimistic.score}
    </>
  );

  if (!signedIn) {
    return (
      <SignInLink className={classes} title="Sign in to upvote">
        {content}
      </SignInLink>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={optimistic.voted}
      aria-label={optimistic.voted ? "Remove upvote" : "Upvote"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimistic();
          const result = await toggleVote(postId);
          if (!result.ok) alert(result.error);
        })
      }
    >
      {content}
    </button>
  );
}
