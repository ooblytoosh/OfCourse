import { Search } from "lucide-react";
import Link from "next/link";

import { CourseList } from "@/components/course/course-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { getJoinedCourses, searchCourses } from "@/lib/data/courses";
import { siteConfig } from "@/lib/site";

export default async function HomePage() {
  const user = await getCurrentUser();
  const [allCourses, joined] = await Promise.all([
    searchCourses(),
    user ? getJoinedCourses(user.id) : Promise.resolve([]),
  ]);
  const featured = [...allCourses].sort((a, b) => b.postCount - a.postCount).slice(0, 6);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-5 pt-2">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {siteConfig.tagline}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          {siteConfig.description} Notes, study guides, explanations and honest advice, shared
          by the students who came before you.
        </p>
        <form action="/courses" role="search" className="flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              type="search"
              placeholder="Find your course, e.g. CS 1332"
              aria-label="Search courses"
              className="h-10 pl-9"
            />
          </div>
          <Button type="submit" className="h-10 px-4">
            Search
          </Button>
        </form>
      </section>

      {joined.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Your communities</h2>
          <CourseList courses={joined} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Popular communities</h2>
          <Link href="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            All courses
          </Link>
        </div>
        <CourseList courses={featured} />
      </section>

      <p className="text-sm text-muted-foreground">
        OfCourse is for students&apos; own original work and experiences, never exams, answer
        keys, or restricted course materials.{" "}
        <Link href="/guidelines" className="font-medium text-foreground underline-offset-4 hover:underline">
          Read the guidelines
        </Link>
      </p>
    </div>
  );
}
