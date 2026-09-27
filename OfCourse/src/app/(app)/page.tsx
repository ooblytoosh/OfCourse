import { PenLine, Search, Sparkles, Users } from "lucide-react";
import Link from "next/link";

import { CourseGrid } from "@/components/course/course-card";
import { SectionTitle } from "@/components/section-title";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getJoinedCourses, searchCourses } from "@/lib/data/courses";

const steps = [
  { icon: PenLine, title: "Students share", body: "Notes, explanations, reviews and advice from people who took the course." },
  { icon: Sparkles, title: "AI connects it", body: "Ask a question and get an answer built from those posts, with links to each one." },
  { icon: Users, title: "You learn from them", body: "Read the originals, see who wrote them, and find their other posts." },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const [allCourses, joined] = await Promise.all([
    searchCourses(),
    user ? getJoinedCourses(user.id) : Promise.resolve([]),
  ]);
  const joinedSlugs = new Set(joined.map((c) => c.slug));
  const popular = [...allCourses]
    .filter((c) => !joinedSlugs.has(c.slug))
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 6);

  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col items-start gap-5 pt-4">
        <p className="inline-flex items-center gap-1.5 rounded-full border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <Sparkles className="size-3.5 text-brand" aria-hidden />
          Built by students, for students
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          Learn from the <span className="text-gradient">students who took it.</span>
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Real notes, reviews and advice from students who already took your courses, plus AI
          that helps you find what you need.
        </p>
        <form action="/courses" role="search" className="flex w-full max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              type="search"
              placeholder="Find your course, e.g. CS 1332"
              aria-label="Search courses"
              className="h-12 w-full rounded-xl border bg-card pr-4 pl-10 text-base shadow-sm outline-none transition-shadow focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/20"
            />
          </div>
          <Button type="submit" className="h-12 rounded-xl px-5">
            Search
          </Button>
        </form>
      </section>

      {joined.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle>Your courses</SectionTitle>
          <CourseGrid courses={joined} />
        </section>
      )}

      {popular.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionTitle
            action={
              <Link href="/courses" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                See all
              </Link>
            }
          >
            Popular courses
          </SectionTitle>
          <CourseGrid courses={popular} />
        </section>
      )}

      <section aria-labelledby="how-heading" className="flex flex-col gap-4">
        <SectionTitle id="how-heading">How it works</SectionTitle>
        <ol className="grid gap-6 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white shadow-[0_8px_20px_-10px_var(--brand)]">
                <Icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="font-medium">{title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="text-sm text-muted-foreground">
        OfCourse is for students&apos; own work and experiences, never exams, answer keys or
        restricted course materials.{" "}
        <Link href="/guidelines" className="font-medium text-foreground underline-offset-4 hover:underline">
          Read the guidelines
        </Link>
      </p>
    </div>
  );
}
