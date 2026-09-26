import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AskStudentKnowledge } from "@/components/ai/ask-student-knowledge";
import { CourseHeader } from "@/components/course/course-header";
import { CourseSidebar } from "@/components/course/course-sidebar";
import { CourseTabs } from "@/components/course/course-tabs";
import { FeedControls, feedHref } from "@/components/course/feed-controls";
import { ResourcesByUnit } from "@/components/course/resources-by-unit";
import { ReviewsTab } from "@/components/course/reviews-tab";
import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post/post-card";
import { getCurrentUser } from "@/lib/auth";
import { COURSE_TAB_ORDER, COURSE_TABS, type CourseTab } from "@/lib/content-policy";
import { getCourse, getCourseTopics, getCourseUnits } from "@/lib/data/courses";
import { FEED_SORTS, getCourseFeed, getPostTypeCounts, type FeedSort } from "@/lib/data/posts";
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
  const signedIn = Boolean(user);

  const course = await getCourse(slug, user?.id);
  if (!course) notFound();

  const tabParam = param(search.tab);
  const tab: CourseTab = COURSE_TAB_ORDER.includes(tabParam as CourseTab)
    ? (tabParam as CourseTab)
    : "reviews";
  const sortParam = param(search.sort);
  const sort: FeedSort = FEED_SORTS.includes(sortParam as FeedSort) ? (sortParam as FeedSort) : "hot";
  const q = param(search.q);

  const [topics, typeCounts] = await Promise.all([
    getCourseTopics(course.id),
    getPostTypeCounts(course.id),
  ]);
  const units = await getCourseUnits(course.id, topics);
  const topicParam = param(search.topic);
  const activeTopic = topicParam ? topics.find((t) => slugify(t.name) === topicParam) : undefined;
  const topic = activeTopic ? topicParam : null;

  const counts = Object.fromEntries(
    COURSE_TAB_ORDER.map((t) => [
      t,
      (COURSE_TABS[t].types as readonly string[]).reduce(
        (sum, type) => sum + (typeCounts[type as keyof typeof typeCounts] ?? 0),
        0,
      ),
    ]),
  ) as Record<CourseTab, number>;

  const posts = await getCourseFeed({
    courseId: course.id,
    types: COURSE_TABS[tab].types,
    sort: tab === "threads" ? sort : "top",
    topicId: activeTopic?.id,
    query: q ?? undefined,
    viewerId: user?.id,
    limit: 100,
  });

  const filterNote = (q || activeTopic) && (
    <p className="text-sm text-muted-foreground">
      {posts.length} {posts.length === 1 ? "post" : "posts"}
      {activeTopic && ` in ${activeTopic.name}`}
      {q && ` matching “${q}”`} ·{" "}
      <Link
        href={feedHref(course.slug, { tab, sort })}
        className="font-medium text-foreground underline-offset-4 hover:underline"
      >
        Clear filters
      </Link>
    </p>
  );

  return (
    <div className="flex flex-col gap-6">
      <CourseHeader course={course} signedIn={signedIn} />

      <AskStudentKnowledge courseId={course.id} courseCode={course.code} signedIn={signedIn} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="flex min-w-0 flex-col gap-4">
          <CourseTabs slug={course.slug} active={tab} counts={counts} />

          {tab === "reviews" ? (
            <ReviewsTab
              course={course}
              reviews={posts}
              signedIn={signedIn}
              semesters={semesterOptions()}
            />
          ) : (
            <>
              <FeedControls
                slug={course.slug}
                tab={tab}
                sort={sort}
                topic={topic}
                q={q}
                units={units}
                showSort={tab === "threads"}
              />
              {filterNote}
              {posts.length === 0 ? (
                <EmptyState icon={SearchX} title="Nothing here yet">
                  {q || activeTopic
                    ? "Try a different topic or keyword."
                    : "Be the first to share something with this course."}{" "}
                  <Link
                    href={`/new?course=${course.slug}`}
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Write a post
                  </Link>
                </EmptyState>
              ) : tab === "resources" ? (
                <ResourcesByUnit slug={course.slug} units={units} posts={posts} topic={topic} />
              ) : (
                <div className="flex flex-col gap-3">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} signedIn={signedIn} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <aside>
          <CourseSidebar course={course} units={units} />
        </aside>
      </div>
    </div>
  );
}
