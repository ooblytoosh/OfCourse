"use client";

import { Check } from "lucide-react";
import { useOptimistic, useTransition } from "react";

import { SignInLink } from "@/components/sign-in-link";
import { useFlashError } from "@/hooks/use-flash-error";
import { buttonVariants } from "@/components/ui/button";
import { toggleMembership } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

export function JoinButton({
  courseId,
  joined,
  signedIn,
}: {
  courseId: string;
  joined: boolean;
  signedIn: boolean;
}) {
  const [optimisticJoined, setOptimisticJoined] = useOptimistic(joined);
  const [pending, startTransition] = useTransition();
  const [error, flashError] = useFlashError();

  if (!signedIn) {
    return (
      <SignInLink
        className={cn(buttonVariants({ size: "lg" }), "rounded-full px-5")}
        title="Sign in to join"
      >
        Join
      </SignInLink>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        aria-pressed={optimisticJoined}
        className={cn(
          buttonVariants({ variant: optimisticJoined ? "outline" : "default", size: "lg" }),
          "group/join min-w-24 rounded-full px-5",
        )}
        onClick={() =>
          startTransition(async () => {
            setOptimisticJoined(!optimisticJoined);
            const result = await toggleMembership(courseId);
            if (!result.ok) flashError(result.error);
          })
        }
      >
        {optimisticJoined ? (
          <>
            <Check className="group-hover/join:hidden" />
            <span className="group-hover/join:hidden">Joined</span>
            <span className="hidden group-hover/join:inline">Leave</span>
          </>
        ) : (
          "Join"
        )}
      </button>
      {error && (
        <span role="alert" className="relative z-10 text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
