"use client";

import { Camera } from "lucide-react";
import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { removeAvatar, uploadAvatar, type AvatarState } from "@/lib/actions/profile";
import type { Author } from "@/lib/data/posts";
import { resizeToSquare } from "@/lib/resize-image";

// Photos can be picked up to this size; they are shrunk before upload.
const PICK_MAX_BYTES = 20 * 1024 * 1024;
// Small GIFs upload as-is so they stay animated.
const GIF_KEEP_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/heic", "image/heif"];

// Profile photo: pick an image and it's resized in the browser, then uploaded.
export function AvatarUploader({ author }: { author: Author }) {
  const [state, action, uploading] = useActionState<AvatarState, FormData>(uploadAvatar, undefined);
  const [removing, startRemove] = useTransition();
  const [preparing, startPrepare] = useTransition();
  const [localError, setLocalError] = useState<string | null>(null);
  const busy = uploading || removing || preparing;
  const error = localError ?? state?.error;

  const pick = (file: File) => {
    setLocalError(null);
    if (!ACCEPTED.includes(file.type) && !/\.(heic|heif)$/i.test(file.name)) {
      return setLocalError("Use a PNG, JPG, WebP, GIF or HEIC image.");
    }
    if (file.size > PICK_MAX_BYTES) return setLocalError("Photos can be up to 20 MB.");
    startPrepare(async () => {
      let upload = file;
      if (!(file.type === "image/gif" && file.size <= GIF_KEEP_BYTES)) {
        try {
          upload = await resizeToSquare(file);
        } catch {
          setLocalError("Couldn't read that image. Try a JPG or PNG.");
          return;
        }
      }
      const formData = new FormData();
      formData.set("avatar", upload);
      // Work after an await must be wrapped in a transition again.
      startPrepare(() => action(formData));
    });
  };

  return (
    <div className="flex items-center gap-4">
      <UserAvatar author={author} className="size-16 [&_[data-slot=avatar-fallback]]:text-lg" />
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label
            className={`inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors hover:bg-muted has-focus-visible:ring-3 has-focus-visible:ring-ring/50 ${busy ? "pointer-events-none opacity-50" : ""}`}
          >
            <Camera className="size-4" />
            {preparing ? "Preparing…" : uploading ? "Uploading…" : author.avatar_url ? "Change photo" : "Upload photo"}
            <input
              type="file"
              name="avatar"
              accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) pick(file);
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
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WebP, GIF or HEIC, up to 20 MB. We&apos;ll resize it for you.
          </p>
        )}
      </div>
    </div>
  );
}
