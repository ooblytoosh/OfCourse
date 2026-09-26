import { authorName, UserAvatar } from "@/components/user-avatar";
import type { Author } from "@/lib/data/posts";
import { timeAgo } from "@/lib/format";

// "(avatar) Alex Chen · Took it Spring 2026 · 3 days ago"
export function PostMeta({
  author,
  semester,
  createdAt,
}: {
  author: Author | null;
  semester: string | null;
  createdAt: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
      <UserAvatar author={author} className="size-6" />
      <span className="font-medium text-foreground">{authorName(author)}</span>
      {semester && (
        <>
          <span aria-hidden>·</span>
          <span>Took it {semester}</span>
        </>
      )}
      <span aria-hidden>·</span>
      <time dateTime={createdAt} title={new Date(createdAt).toLocaleString("en-US")}>
        {timeAgo(createdAt)}
      </time>
    </div>
  );
}
