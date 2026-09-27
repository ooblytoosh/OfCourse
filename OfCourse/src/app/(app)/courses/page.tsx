import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CourseGrid } from "@/components/course/course-card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { searchCourses } from "@/lib/data/courses";
import { getProfile } from "@/lib/data/profiles";

export const metadata: Metadata = { title: "Courses" };

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  // Verified students see their own university's courses; everyone else sees all.
  const school = profile?.verified ? profile.university : null;
  const courses = await searchCourses(query, school?.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={query ? `Results for “${query}”` : school ? `${school.shortName} courses` : "Courses"}
        description={
          query
            ? `${courses.length} ${courses.length === 1 ? "course" : "courses"} found`
            : "Ratings, reviews, study threads and resources from the students who took each course."
        }
      />
      {courses.length > 0 ? (
        <CourseGrid courses={courses} />
      ) : (
        <EmptyState icon={SearchX} title="No courses match that search">
          Try a course code like “CS 1332” or a name like “data structures”.{" "}
          <Link href="/courses" className="font-medium text-foreground underline-offset-4 hover:underline">
            See all courses
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
