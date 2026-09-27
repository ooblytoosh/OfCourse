import { MessageSquare } from "lucide-react";
import Link from "next/link";

import { BulbVote } from "@/components/bulb/bulb-vote";
import { PostMeta } from "@/components/post/post-meta";
import { PostTypeBadge } from "@/components/post/post-type-badge";
import { SaveButton } from "@/components/post/save-button";
import { TopicChip } from "@/components/post/topic-chip";
import type { PostSummary } from "@/lib/data/posts";
import { preview } from "@/lib/format";

// A post in a list: its lightbulb on the left; type, title, author, preview and
// actions on the right. The whole card opens the post; buttons sit above it.
export function PostCard({
  post,
  signedIn,
  canVote = true,
  showCourse = false,
}: {
  post: PostSummary;
  signedIn: boolean;
  canVote?: boolean;
  showCourse?: boolean;
}) {
  const href = `/c/${post.course.slug}/posts/${post.id}`;

  return (
    <article className="surface surface-interactive relative flex gap-4 p-4 sm:p-5">
      <BulbVote
        kind="post"
        id={post.id}
        bulb={post.bulb}
        signedIn={signedIn}
        canVote={canVote}
        layout="stacked"
        className="shrink-0 self-start"
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <PostTypeBadge type={post.type} />
          {showCourse && (
            <Link
              href={`/c/${post.course.slug}`}
              className="relative z-10 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              {post.course.code}
            </Link>
          )}
        </div>

        <h2 className="mt-2 text-[1.02rem] leading-snug font-semibold tracking-tight">
          <Link href={href} className="after:absolute after:inset-0 after:rounded-xl">
            {post.title}
          </Link>
        </h2>

        <div className="mt-1.5">
          <PostMeta
            author={post.author}
            semester={post.semester}
            createdAt={post.createdAt}
            editedAt={post.editedAt}
          />
        </div>

        <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {preview(post.content, 260)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          {post.topics.map((t) => (
            <TopicChip key={t.id} courseSlug={post.course.slug} name={t.name} postType={post.type} />
          ))}
          <div className="ml-auto flex items-center gap-1">
            <Link
              href={`${href}#comments`}
              className="relative z-10 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <MessageSquare className="size-4" aria-hidden />
              {post.commentCount}
              <span className="sr-only">comments</span>
            </Link>
            <SaveButton postId={post.id} saved={post.viewerHasSaved} signedIn={signedIn} />
          </div>
        </div>
      </div>
    </article>
  );
}
