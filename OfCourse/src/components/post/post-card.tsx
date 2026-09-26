import { MessageSquare } from "lucide-react";
import Link from "next/link";

import { HelpfulButton } from "@/components/post/helpful-button";
import { PostMeta } from "@/components/post/post-meta";
import { PostTypeBadge } from "@/components/post/post-type-badge";
import { SaveButton } from "@/components/post/save-button";
import { TopicChip } from "@/components/post/topic-chip";
import type { PostSummary } from "@/lib/data/posts";
import { preview } from "@/lib/format";

// A post in a list: type, title, who wrote it, a short preview, then actions.
// The whole card opens the post; buttons and links sit above that link.
export function PostCard({
  post,
  signedIn,
  showCourse = false,
}: {
  post: PostSummary;
  signedIn: boolean;
  showCourse?: boolean;
}) {
  const href = `/c/${post.course.slug}/posts/${post.id}`;

  return (
    <article className="surface surface-interactive relative p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
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

      <h2 className="mt-1.5 text-[1.05rem] leading-snug font-semibold tracking-tight">
        <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl">
          {post.title}
        </Link>
      </h2>

      <div className="mt-2">
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

      {post.topics.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1">
          {post.topics.map((t) => (
            <TopicChip key={t.id} courseSlug={post.course.slug} name={t.name} postType={post.type} />
          ))}
        </div>
      )}

      <div className="mt-3 -ml-2 flex flex-wrap items-center gap-1">
        <HelpfulButton
          postId={post.id}
          marked={post.viewerFoundHelpful}
          count={post.voteScore}
          signedIn={signedIn}
        />
        <Link
          href={`${href}#comments`}
          className="relative z-10 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MessageSquare className="size-4" aria-hidden />
          {post.commentCount}
          <span className="sr-only">comments</span>
        </Link>
        <SaveButton postId={post.id} saved={post.viewerHasSaved} signedIn={signedIn} />
      </div>
    </article>
  );
}
