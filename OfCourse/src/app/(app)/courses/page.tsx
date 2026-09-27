import { Search, SearchX, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CourseCard, CourseGrid } from "@/components/course/course-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { SectionTitle } from "@/components/section-title";
import { getCurrentUser } from "@/lib/auth";
import { searchCourses } from "@/lib/data/courses";
import { getProfile } from "@/lib/data/profiles";
import { getRecommendedCourses } from "@/lib/data/recommendations";

export const metadata: Metadata = { title: "Explore" };

// Explore: recommended classes, then every course (or search results).
export default async function ExplorePage({ searchParams }: PageProps<"/courses">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  // Verified students see their own university's courses; everyone else sees all.
  const school = profile?.verified ? profile.university : null;
  const [courses, recommended] = await Promise.all([
    searchCourses(query, school?.id),
    query
      ? Promise.resolve([])
      : getRecommendedCourses({ universityId: school?.id, viewerId: user?.id, major: profile?.major }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <PageHeader
          title={query ? `Results for “${query}”` : school ? `Explore ${school.shortName} courses` : "Explore courses"}
          description={
            query
              ? `${courses.length} ${courses.length === 1 ? "course" : "courses"} found`
              : "Ratings, reviews, study threads and resources from the students who took each course."
          }
        />
        <form action="/courses" role="search" className="relative max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search by code or name, e.g. CS 1332"
            aria-label="Search courses"
            className="h-11 w-full rounded-xl border bg-card pr-4 pl-10 text-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20"
          />
        </form>
      </div>

      {recommended.length > 0 && (
        <section aria-labelledby="recommended-heading" className="flex flex-col gap-3">
          <SectionTitle id="recommended-heading">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="size-4 text-brand" aria-hidden />
              {user ? "Recommended for you" : "Recommended classes"}
            </span>
          </SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((course) => (
              <li key={course.id}>
                <CourseCard course={course} meta={course.reason} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="all-heading" className="flex flex-col gap-3">
        {!query && <SectionTitle id="all-heading">{school ? `All ${school.shortName} courses` : "All courses"}</SectionTitle>}
        {courses.length > 0 ? (
          <CourseGrid courses={courses} />
        ) : (
          <EmptyState icon={SearchX} title={query ? "No courses match that search" : "No courses here yet"}>
            {query ? (
              <>
                Try a course code like “CS 1332” or a name like “data structures”.{" "}
                <Link href="/courses" className="font-medium text-foreground underline-offset-4 hover:underline">
                  See all courses
                </Link>
              </>
            ) : (
              "Courses for your university will show up here as they're added."
            )}
          </EmptyState>
        )}
      </section>
    </div>
  );
}
