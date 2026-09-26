"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useTransition } from "react";

import { ButtonLink } from "@/components/button-link";
import { Button } from "@/components/ui/button";
import { useFlashError } from "@/hooks/use-flash-error";
import { deletePost } from "@/lib/actions/community";

// Edit / Delete, shown to a post's author.
export function PostOwnerActions({ postId, editHref }: { postId: string; editHref: string }) {
  const [pending, startTransition] = useTransition();
  const [error, flashError] = useFlashError();

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
        onClick={() => {
          if (!confirm("Delete this post? Its comments and votes will be removed too.")) return;
          startTransition(async () => {
            const result = await deletePost(postId);
            if (result && !result.ok) flashError(result.error);
          });
        }}
      >
        <Trash2 />
        {pending ? "Deleting…" : "Delete"}
      </Button>
      {error && (
        <span role="alert" className="relative z-10 text-xs text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
