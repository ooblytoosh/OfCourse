"use client";

import { useActionState, useEffect, useRef } from "react";

import { SignInLink } from "@/components/sign-in-link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createComment, type CommentFormState } from "@/lib/actions/community";
import { POST_LIMITS } from "@/lib/content-policy";

export function CommentForm({
  postId,
  parentId,
  signedIn,
  placeholder = "Add a comment",
  autoFocus,
  onDone,
}: {
  postId: string;
  parentId?: string;
  signedIn: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState<CommentFormState, FormData>(
    createComment,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box (and close reply forms) after a successful submit.
  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      onDone?.();
    }
  }, [state?.success, onDone]);

  if (!signedIn) {
    return (
      <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
        <SignInLink className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </SignInLink>{" "}
        to join the discussion.
      </div>
    );
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="postId" value={postId} />
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <Textarea
        name="content"
        required
        maxLength={POST_LIMITS.commentMax}
        placeholder={placeholder}
        aria-label={placeholder}
        autoFocus={autoFocus}
        className="min-h-20 bg-card"
      />
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Posting…" : parentId ? "Reply" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
