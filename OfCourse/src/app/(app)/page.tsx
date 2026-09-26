import { PenLine, Search, Sparkles, Users } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { CourseList } from "@/components/course/course-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { getJoinedCourses, searchCourses } from "@/lib/data/courses";
import { siteConfig } from "@/lib/site";

const steps = [
  {
    icon: PenLine,
    title: "Students share",
    body: "Their own notes, explanations, study guides and honest advice, written after taking the course.",
  },
  {
    icon: Sparkles,
    title: "AI connects it",
    body: "Ask a question in a course and get a summary of what students there have written, with links to every post it used.",
  },
  {
    icon: Users,
    title: "You learn from them",
    body: "Open the original posts, see who wrote them, and find their other contributions.",
  },
];

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
        <p className="text-sm font-semibold text-brand">Student-built course knowledge for university students</p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {siteConfig.tagline}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          {siteConfig.description} Every course has a space where students share what
          they learned, and AI helps you find it.
        </p>
        <div>
          <ButtonLink href="/courses" size="lg" className="h-10 px-5">
            Explore courses
          </ButtonLink>
        </div>
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
          <Button type="submit" variant="outline" className="h-10 px-4">
            Search
          </Button>
        </form>
      </section>

      <section aria-labelledby="how-heading" className="flex flex-col gap-3">
        <h2 id="how-heading" className="sr-only">
          How OfCourse works
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="rounded-xl border bg-card p-4">
              <p className="flex items-center gap-2 font-medium">
                <span className="grid size-7 place-items-center rounded-lg bg-brand/10 text-brand">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="sr-only">Step {i + 1}: </span>
                  {title}
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {joined.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Your courses</h2>
          <CourseList courses={joined} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Popular courses</h2>
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
