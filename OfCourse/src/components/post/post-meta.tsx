import Link from "next/link";

import { authorName, UserAvatar } from "@/components/user-avatar";
import { VerifiedBadge } from "@/components/verified-badge";
import type { Author } from "@/lib/data/posts";
import { profileHref } from "@/lib/links";
import { timeAgo } from "@/lib/format";

// "(avatar) Alex Chen · ✓ Georgia Tech · Spring 2026 · 3 days ago"
// The name and avatar link to the author's profile.
export function PostMeta({
  author,
  semester,
  createdAt,
  editedAt,
}: {
  author: Author | null;
  semester: string | null;
  createdAt: string;
  editedAt?: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
      {author ? (
        <Link
          href={profileHref(author)}
          className="relative z-10 inline-flex items-center gap-1.5 font-medium text-foreground hover:underline"
        >
          <UserAvatar author={author} className="size-6" />
          {authorName(author)}
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
          <UserAvatar author={null} className="size-6" />
          {authorName(null)}
        </span>
      )}
      {author?.university && (
        <>
          <span aria-hidden>·</span>
          <VerifiedBadge university={author.university} />
        </>
      )}
      {semester && (
        <>
          <span aria-hidden>·</span>
          <span title="Semester they took the course">{semester}</span>
        </>
      )}
      <span aria-hidden>·</span>
      <time dateTime={createdAt} title={new Date(createdAt).toLocaleString("en-US")}>
        {timeAgo(createdAt)}
      </time>
      {editedAt && (
        <span title={`Edited ${new Date(editedAt).toLocaleString("en-US")}`}>· edited</span>
      )}
    </div>
  );
}
