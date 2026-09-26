import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CommentForm } from "@/components/post/comment-form";
import { CommentThread } from "@/components/post/comment-thread";
import { HelpfulButton } from "@/components/post/helpful-button";
import { PostMeta } from "@/components/post/post-meta";
import { PostOwnerActions } from "@/components/post/post-owner-actions";
import { PostTypeBadge } from "@/components/post/post-type-badge";
import { SaveButton } from "@/components/post/save-button";
import { TopicChip } from "@/components/post/topic-chip";
import { getCurrentUser } from "@/lib/auth";
import { getComments, getPost } from "@/lib/data/posts";
import { formatCount } from "@/lib/format";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: PageProps<"/c/[slug]/posts/[postId]">): Promise<Metadata> {
  const { postId } = await params;
  const post = UUID.test(postId) ? await getPost(postId) : null;
  return { title: post ? `${post.title} · ${post.course.code}` : "Post not found" };
}

export default async function PostPage({ params }: PageProps<"/c/[slug]/posts/[postId]">) {
  const { slug, postId } = await params;
  if (!UUID.test(postId)) notFound();

  const user = await getCurrentUser();
  const [post, comments] = await Promise.all([getPost(postId, user?.id), getComments(postId)]);
  if (!post) notFound();
  // Keep URLs canonical if the course slug in the link is wrong.
  if (post.course.slug !== slug) redirect(`/c/${post.course.slug}/posts/${post.id}`);

  const signedIn = Boolean(user);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href={`/c/${post.course.slug}`}
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {post.course.university} · {post.course.code}: {post.course.name}
      </Link>

      <article className="surface p-5 sm:p-7">
        <PostTypeBadge type={post.type} />
        <h1 className="mt-3 text-2xl leading-tight font-semibold tracking-tight sm:text-3xl">
          {post.title}
        </h1>
        <div className="mt-3">
          <PostMeta
            author={post.author}
            semester={post.semester}
            createdAt={post.createdAt}
            editedAt={post.editedAt}
          />
        </div>

        {post.topics.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1">
            {post.topics.map((t) => (
              <TopicChip key={t.id} courseSlug={post.course.slug} name={t.name} postType={post.type} />
            ))}
          </div>
        )}

        <div className="mt-6 text-[0.95rem] leading-7 whitespace-pre-line">{post.content}</div>

        <div className="mt-6 -ml-2.5 flex flex-wrap items-center gap-1 border-t pt-3">
          <HelpfulButton
            postId={post.id}
            marked={post.viewerFoundHelpful}
            count={post.voteScore}
            signedIn={signedIn}
          />
          <span className="px-2.5 text-sm text-muted-foreground">
            {formatCount(post.commentCount, "comment")}
          </span>
          <SaveButton postId={post.id} saved={post.viewerHasSaved} signedIn={signedIn} />
          {user && post.author?.id === user.id && (
            <div className="ml-auto">
              <PostOwnerActions
                postId={post.id}
                editHref={`/c/${post.course.slug}/posts/${post.id}/edit`}
              />
            </div>
          )}
        </div>
      </article>

      <section id="comments" className="flex scroll-mt-20 flex-col gap-5">
        <h2 className="text-lg font-semibold">Comments</h2>
        <CommentForm postId={post.id} signedIn={signedIn} />
        <CommentThread
          comments={comments}
          postId={post.id}
          signedIn={signedIn}
          viewerId={user?.id}
        />
      </section>
    </div>
  );
}
