"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

import { ButtonLink } from "@/components/button-link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useFlashError } from "@/hooks/use-flash-error";
import { deletePost } from "@/lib/actions/community";

// Edit / Delete, shown to a post's author.
export function PostOwnerActions({ postId, editHref }: { postId: string; editHref: string }) {
  const [pending, startTransition] = useTransition();
  const [error, flashError] = useFlashError();
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <ButtonLink href={editHref} variant="ghost" size="sm">
        <Pencil />
        Edit
      </ButtonLink>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={pending}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setConfirming(true)}
      >
        <Trash2 />
        {pending ? "Deleting…" : "Delete"}
      </Button>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Delete this post?"
        description="Its comments and lightbulb votes will be removed too. This can't be undone."
        confirmLabel="Delete post"
        onConfirm={() =>
          startTransition(async () => {
            const result = await deletePost(postId);
            if (result && !result.ok) flashError(result.error);
          })
        }
      />
      {error && (
        <span role="alert" className="relative z-10 text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
