import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AskStudentKnowledge } from "@/components/ai/ask-student-knowledge";
import { CourseHeader } from "@/components/course/course-header";
import { CourseSidebar } from "@/components/course/course-sidebar";
import { FeedControls, feedHref } from "@/components/course/feed-controls";
import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post/post-card";
import { getCurrentUser } from "@/lib/auth";
import { getCourse, getCourseTopics } from "@/lib/data/courses";
import { FEED_SORTS, getCourseFeed, type FeedSort } from "@/lib/data/posts";
import { slugify } from "@/lib/format";
import { semesterOptions } from "@/lib/semesters";

export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourse(slug);
  return { title: course ? `${course.code}: ${course.name}` : "Course not found" };
}

function param(value: string | string[] | undefined): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default async function CoursePage({ params, searchParams }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const search = await searchParams;
  const user = await getCurrentUser();

  const course = await getCourse(slug, user?.id);
  if (!course) notFound();

  const sortParam = param(search.sort);
  const sort: FeedSort = FEED_SORTS.includes(sortParam as FeedSort) ? (sortParam as FeedSort) : "hot";
  const q = param(search.q);

  const topics = await getCourseTopics(course.id);
  const topicParam = param(search.topic);
  const activeTopic = topicParam ? topics.find((t) => slugify(t.name) === topicParam) : undefined;
  const topic = activeTopic ? topicParam : null;

  const posts = await getCourseFeed({
    courseId: course.id,
    sort,
    topicId: activeTopic?.id,
    query: q ?? undefined,
    viewerId: user?.id,
  });

  return (
    <div className="flex flex-col gap-6">
      <CourseHeader course={course} signedIn={Boolean(user)} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="flex min-w-0 flex-col gap-4">
          <AskStudentKnowledge
            courseId={course.id}
            courseCode={course.code}
            signedIn={Boolean(user)}
            keywordSearchHref={`/c/${course.slug}`}
          />
          <FeedControls slug={course.slug} sort={sort} topic={topic} q={q} topics={topics} />

          {q && (
            <p className="text-sm text-muted-foreground">
              {posts.length} {posts.length === 1 ? "post" : "posts"} matching “{q}”
              {activeTopic && ` in ${activeTopic.name}`} ·{" "}
              <Link
                href={feedHref(course.slug, { sort, topic })}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Clear search
              </Link>
            </p>
          )}

          {posts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} signedIn={Boolean(user)} />
              ))}
            </div>
          ) : (
            <EmptyState icon={SearchX} title="No posts here yet">
              {q || activeTopic
                ? "Try a different search or topic."
                : "Be the first to share something with this course."}{" "}
              <Link
                href={`/new?course=${course.slug}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Create a post
              </Link>
            </EmptyState>
          )}
        </div>

        <aside>
          <CourseSidebar
            course={course}
            topics={topics}
            signedIn={Boolean(user)}
            semesters={semesterOptions()}
          />
        </aside>
      </div>
    </div>
  );
}
