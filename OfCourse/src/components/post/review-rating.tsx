import { Clock, Gauge, ThumbsDown, ThumbsUp } from "lucide-react";

import type { ReviewRating as Rating } from "@/lib/data/posts";
import { cn } from "@/lib/utils";

// "12 hrs/week · 7/10 difficulty · Would take again" on a course review.
export function ReviewRating({ rating, className }: { rating: Rating; className?: string }) {
  const Again = rating.wouldTakeAgain ? ThumbsUp : ThumbsDown;
  return (
    <p
      aria-label={`Their rating: ${rating.workloadHours} hours per week, difficulty ${rating.difficulty} out of 10, ${
        rating.wouldTakeAgain ? "would take again" : "wouldn't take again"
      }`}
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground", className)}
    >
      <span className="inline-flex items-center gap-1">
        <Clock className="size-3.5" aria-hidden />
        <span className="text-foreground tabular-nums">{rating.workloadHours}</span> hrs/week
      </span>
      <span className="inline-flex items-center gap-1">
        <Gauge className="size-3.5" aria-hidden />
        <span className="text-foreground tabular-nums">{rating.difficulty}/10</span> difficulty
      </span>
      <span className="inline-flex items-center gap-1">
        <Again className={cn("size-3.5", rating.wouldTakeAgain ? "text-good" : "text-bad")} aria-hidden />
        {rating.wouldTakeAgain ? "Would take again" : "Wouldn't take again"}
      </span>
    </p>
  );
}
