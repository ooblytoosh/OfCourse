import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { BulbVote } from "@/components/bulb/bulb-vote";
import { CommentForm } from "@/components/post/comment-form";
import { CommentThread } from "@/components/post/comment-thread";
import { PostMeta } from "@/components/post/post-meta";
import { PostOwnerActions } from "@/components/post/post-owner-actions";
import { PostTypeBadge } from "@/components/post/post-type-badge";
import { SaveButton } from "@/components/post/save-button";
import { TopicChip } from "@/components/post/topic-chip";
import { VerifyPrompt } from "@/components/verify-prompt";
import { getCurrentUser } from "@/lib/auth";
import { getComments, getPost } from "@/lib/data/posts";
import { getProfile } from "@/lib/data/profiles";
import { participationFor } from "@/lib/participation";
import { formatCount } from "@/lib/format";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: PageProps<"/c/[slug]/posts/[postId]">): Promise<Metadata> {
  const { postId } = await params;
  const post = UUID.test(postId) ? await getPost(postId) : null;
  return { title: post ? `${post.title} · ${post.course.code}` : "Post not found" };
}

export default async function PostPage({ params, searchParams }: PageProps<"/c/[slug]/posts/[postId]">) {
  const { slug, postId } = await params;
  const { csort } = await searchParams;
  const commentSort = csort === "new" ? "new" : "brightest";
  if (!UUID.test(postId)) notFound();

  const user = await getCurrentUser();
  const [post, comments, profile] = await Promise.all([
    getPost(postId, user?.id),
    getComments(postId, { viewerId: user?.id, sort: commentSort }),
    user ? getProfile(user.id) : Promise.resolve(null),
  ]);
  if (!post) notFound();
  // Keep URLs canonical if the course slug in the link is wrong.
  if (post.course.slug !== slug) redirect(`/c/${post.course.slug}/posts/${post.id}`);

  const signedIn = Boolean(user);
  const participation = participationFor(profile, post.course);

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

        <div className="mt-6 flex flex-wrap items-center gap-1 border-t pt-4">
          <BulbVote
            kind="post"
            id={post.id}
            bulb={post.bulb}
            canVote={!signedIn || participation.allowed}
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Comments</h2>
          {comments.length > 1 && (
            <nav aria-label="Sort comments" className="flex rounded-lg bg-muted p-0.5 text-xs font-medium">
              {(["brightest", "new"] as const).map((s) => (
                <Link
                  key={s}
                  href={`?csort=${s}#comments`}
                  scroll={false}
                  aria-current={commentSort === s ? "page" : undefined}
                  className={
                    commentSort === s
                      ? "rounded-md bg-card px-2.5 py-1 text-foreground shadow-sm"
                      : "px-2.5 py-1 text-muted-foreground hover:text-foreground"
                  }
                >
                  {s === "brightest" ? "Brightest" : "Newest"}
                </Link>
              ))}
            </nav>
          )}
        </div>
        {signedIn && !participation.allowed ? (
          <VerifyPrompt participation={participation} compact />
        ) : (
          <CommentForm postId={post.id} signedIn={signedIn} />
        )}
        <CommentThread
          comments={comments}
          postId={post.id}
          signedIn={signedIn}
          canReply={participation.allowed}
          viewerId={user?.id}
        />
      </section>
    </div>
  );
}
