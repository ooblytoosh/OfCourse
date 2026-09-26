"use client";

import { Camera } from "lucide-react";
import { useActionState, useRef, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { removeAvatar, uploadAvatar, type AvatarState } from "@/lib/actions/profile";
import type { Author } from "@/lib/data/posts";

// Profile photo: pick an image and it uploads immediately.
export function AvatarUploader({ author }: { author: Author }) {
  const [state, action, uploading] = useActionState<AvatarState, FormData>(uploadAvatar, undefined);
  const [removing, startRemove] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const busy = uploading || removing;

  return (
    <form ref={formRef} action={action} className="flex items-center gap-4">
      <UserAvatar author={author} className="size-16 [&_[data-slot=avatar-fallback]]:text-lg" />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50 ${busy ? "pointer-events-none opacity-50" : ""}`}
          >
            <Camera className="size-4" />
            {uploading ? "Uploading…" : author.avatar_url ? "Change photo" : "Upload photo"}
            <input
              type="file"
              name="avatar"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                if (e.target.files?.length) formRef.current?.requestSubmit();
              }}
            />
          </label>
          {author.avatar_url && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => startRemove(async () => void (await removeAvatar()))}
            >
              {removing ? "Removing…" : "Remove"}
            </Button>
          )}
        </div>
        {state?.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">PNG, JPG, WebP or GIF, up to 2 MB.</p>
        )}
      </div>
    </form>
  );
}
