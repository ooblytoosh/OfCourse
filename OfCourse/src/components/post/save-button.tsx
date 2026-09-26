"use client";

import { Bookmark } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { SignInLink } from "@/components/sign-in-link";
import { toggleBookmark } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

export function SaveButton({
  postId,
  saved,
  signedIn,
}: {
  postId: string;
  saved: boolean;
  signedIn: boolean;
}) {
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();

  const classes = cn(
    "relative z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium transition-colors",
    optimisticSaved
      ? "text-foreground hover:bg-muted"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
  const content = (
    <>
      <Bookmark className={cn("size-4", optimisticSaved && "fill-current")} />
      {optimisticSaved ? "Saved" : "Save"}
    </>
  );

  if (!signedIn) {
    return (
      <SignInLink className={classes} title="Sign in to save posts">
        {content}
      </SignInLink>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={optimisticSaved}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setOptimisticSaved(!optimisticSaved);
          const result = await toggleBookmark(postId);
          if (!result.ok) alert(result.error);
        })
      }
    >
      {content}
    </button>
  );
}
