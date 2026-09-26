import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CourseList } from "@/components/course/course-list";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { searchCourses } from "@/lib/data/courses";

export const metadata: Metadata = { title: "Courses" };

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const courses = await searchCourses(query);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={query ? `Results for “${query}”` : "Course communities"}
        description={
          query
            ? `${courses.length} ${courses.length === 1 ? "course" : "courses"} found`
            : "Every course has its own community of students who took it."
        }
      />
      {courses.length > 0 ? (
        <CourseList courses={courses} />
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
