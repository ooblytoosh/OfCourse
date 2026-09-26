"use client";

import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { SignInLink } from "@/components/sign-in-link";
import { castVote } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

type Vote = -1 | 0 | 1;
type VoteState = { vote: Vote; score: number };

// Pressing the active arrow again removes the vote; the other arrow switches it.
function applyVote(state: VoteState, pressed: 1 | -1): VoteState {
  const next: Vote = state.vote === pressed ? 0 : pressed;
  return { vote: next, score: state.score - state.vote + next };
}

const arrowClass =
  "inline-flex size-7 items-center justify-center rounded-full transition-colors disabled:opacity-60";

export function VoteButton({
  postId,
  vote,
  score,
  signedIn,
  className,
}: {
  postId: string;
  vote: Vote;
  score: number;
  signedIn: boolean;
  className?: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic<VoteState, 1 | -1>({ vote, score }, applyVote);
  const [pending, startTransition] = useTransition();

  const wrapper = cn(
    "relative z-10 inline-flex items-center gap-0.5 rounded-full text-sm font-medium tabular-nums",
    optimistic.vote === 1 && "bg-brand/10 text-brand",
    optimistic.vote === -1 && "bg-indigo-50 text-indigo-600",
    optimistic.vote === 0 && "text-muted-foreground",
    className,
  );

  if (!signedIn) {
    return (
      <SignInLink className={cn(wrapper, "px-1 hover:bg-muted")} title="Sign in to vote">
        <ArrowBigUp className="size-5" />
        <span className="min-w-4 text-center">{optimistic.score}</span>
        <ArrowBigDown className="size-5" />
      </SignInLink>
    );
  }

  const vote_ = (value: 1 | -1) =>
    startTransition(async () => {
      setOptimistic(value);
      const result = await castVote(postId, value);
      if (!result.ok) alert(result.error);
    });

  return (
    <div className={wrapper} role="group" aria-label="Vote">
      <button
        type="button"
        className={cn(arrowClass, optimistic.vote !== 1 && "hover:bg-muted hover:text-brand")}
        aria-pressed={optimistic.vote === 1}
        aria-label={optimistic.vote === 1 ? "Remove upvote" : "Upvote"}
        disabled={pending}
        onClick={() => vote_(1)}
      >
        <ArrowBigUp className={cn("size-5", optimistic.vote === 1 && "fill-current")} />
      </button>
      <span className="min-w-4 text-center" aria-label={`Score ${optimistic.score}`}>
        {optimistic.score}
      </span>
      <button
        type="button"
        className={cn(arrowClass, optimistic.vote !== -1 && "hover:bg-muted hover:text-indigo-600")}
        aria-pressed={optimistic.vote === -1}
        aria-label={optimistic.vote === -1 ? "Remove downvote" : "Downvote"}
        disabled={pending}
        onClick={() => vote_(-1)}
      >
        <ArrowBigDown className={cn("size-5", optimistic.vote === -1 && "fill-current")} />
      </button>
    </div>
  );
}
