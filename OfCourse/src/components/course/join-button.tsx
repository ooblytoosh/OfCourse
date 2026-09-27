"use client";

import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";

import { SignInLink } from "@/components/sign-in-link";
import { useFlashError } from "@/hooks/use-flash-error";
import { buttonVariants } from "@/components/ui/button";
import { toggleMembership } from "@/lib/actions/community";
import { VERIFY_HREF, type Participation } from "@/lib/participation";
import { cn } from "@/lib/utils";

export function JoinButton({
  courseId,
  joined,
  signedIn,
  participation,
}: {
  courseId: string;
  joined: boolean;
  signedIn: boolean;
  participation: Participation;
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

  // Joining needs a verified student at this university (leaving never does).
  if (!joined && !participation.allowed) {
    return participation.reason === "verify" ? (
      <Link
        href={VERIFY_HREF}
        className={cn(buttonVariants({ size: "lg" }), "rounded-full px-5")}
        title={participation.message}
      >
        <ShieldCheck />
        Verify to join
      </Link>
    ) : (
      <button
        type="button"
        disabled
        title={participation.message}
        className={cn(buttonVariants({ variant: "outline", size: "lg" }), "rounded-full px-5")}
      >
        Students only
      </button>
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
