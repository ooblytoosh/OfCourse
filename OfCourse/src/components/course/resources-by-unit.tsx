import { ArrowBigUp, FileText, MessageSquare } from "lucide-react";
import Link from "next/link";

import { PostTypeBadge } from "@/components/post/post-type-badge";
import { authorName } from "@/components/user-avatar";
import { profileHref } from "@/lib/links";
import type { Unit } from "@/lib/data/courses";
import type { PostSummary } from "@/lib/data/posts";
import { slugify } from "@/lib/format";
import { cn } from "@/lib/utils";

function ResourceRow({ post }: { post: PostSummary }) {
  return (
    <li className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <Link
          href={`/c/${post.course.slug}/posts/${post.id}`}
          className="font-medium leading-snug hover:underline"
        >
          {post.title}
        </Link>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <PostTypeBadge type={post.type} />
          {post.author ? (
            <Link href={profileHref(post.author)} className="hover:text-foreground hover:underline">
              {authorName(post.author)}
            </Link>
          ) : (
            <span>{authorName(null)}</span>
          )}
          {post.semester && <span>· {post.semester}</span>}
        </p>
      </div>
      <p className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground tabular-nums">
        <span className="inline-flex items-center gap-1" title="Upvotes">
          <ArrowBigUp className="size-3.5" aria-hidden />
          {post.voteScore}
          <span className="sr-only">upvotes</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <MessageSquare className="size-3.5" aria-hidden />
          {post.commentCount}
          <span className="sr-only">comments</span>
        </span>
      </p>
    </li>
  );
}

// Resources organized like a syllabus: each unit lists its topics and the
// notes, study guides and explanations tagged with them. A post that covers
// several units is listed under each; posts without topics go under "General".
export function ResourcesByUnit({
  slug,
  units,
  posts,
  topic,
}: {
  slug: string;
  units: Unit[];
  posts: PostSummary[];
  topic: string | null;
}) {
  const unitOfTopic = new Map<string, number>();
  units.forEach((unit, i) => unit.topics.forEach((t) => unitOfTopic.set(t.id, i)));

  const sections = units.map((unit) => ({ unit, posts: [] as PostSummary[] }));
  const general: PostSummary[] = [];
  for (const post of posts) {
    const indexes = new Set(
      post.topics.map((t) => unitOfTopic.get(t.id)).filter((i) => i !== undefined),
    );
    if (indexes.size) indexes.forEach((i) => sections[i].posts.push(post));
    else general.push(post);
  }

  const visible = topic
    ? sections.filter((s) => s.unit.topics.some((t) => slugify(t.name) === topic) || s.posts.length)
    : sections;

  return (
    <div className="flex flex-col gap-4">
      {visible.map(({ unit, posts: unitPosts }) => (
        <section
          key={unit.id ?? "other"}
          id={`unit-${unit.position ?? "other"}`}
          className="surface scroll-mt-20 overflow-hidden"
        >
          <div className="border-b bg-muted/40 px-4 py-3">
            <h3 className="font-semibold">
              {unit.position ? (
                <>
                  <span className="text-muted-foreground">Unit {unit.position}:</span> {unit.name}
                </>
              ) : (
                unit.name
              )}
            </h3>
            {unit.topics.length > 0 && (
              <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                {unit.topics.map((t) => {
                  const active = slugify(t.name) === topic;
                  return (
                    <li key={t.id}>
                      <Link
                        href={
                          active
                            ? `/c/${slug}?tab=resources`
                            : `/c/${slug}?tab=resources&topic=${slugify(t.name)}`
                        }
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "text-xs hover:underline",
                          active ? "font-semibold text-brand" : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {t.name}
                        <span className="ml-1 tabular-nums opacity-70">{t.postCount}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {unitPosts.length > 0 ? (
            <ul className="divide-y">
              {unitPosts.map((post) => (
                <ResourceRow key={post.id} post={post} />
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
              <FileText className="size-4" aria-hidden />
              No resources for this unit yet.
              <Link href={`/new?course=${slug}&type=note`} className="font-medium text-foreground hover:underline">
                Share your notes
              </Link>
            </p>
          )}
        </section>
      ))}

      {general.length > 0 && (
        <section className="surface overflow-hidden">
          <h3 className="border-b bg-muted/40 px-4 py-3 font-semibold">General</h3>
          <ul className="divide-y">
            {general.map((post) => (
              <ResourceRow key={post.id} post={post} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
