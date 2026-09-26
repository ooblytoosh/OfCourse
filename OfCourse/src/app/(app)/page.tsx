import { BookOpenText, LibraryBig, Sparkles, Users } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { siteConfig } from "@/lib/site";

const features = [
  {
    icon: Users,
    title: "A community for every course",
    body: "Each course gets its own space where students who took it trade what they learned.",
  },
  {
    icon: BookOpenText,
    title: "Knowledge made by students",
    body: "Notes, study guides, explanations and honest advice, all written by students themselves.",
  },
  {
    icon: Sparkles,
    title: "Search it all with AI",
    body: "Soon: ask a question and get answers drawn from everything your classmates have shared.",
  },
];

const exampleCourses = [
  { code: "CS 1332", name: "Data Structures and Algorithms" },
  { code: "CS 2110", name: "Computer Organization and Programming" },
  { code: "MATH 1554", name: "Linear Algebra" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6 pt-4">
        <p className="text-sm font-medium text-brand">
          The student-powered course network
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {siteConfig.tagline}
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          {siteConfig.description} Find out what a class is really like, and
          learn from the notes and advice of those who came before you.
        </p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/courses" size="lg" className="px-4">
            Browse courses
          </ButtonLink>
          <ButtonLink href="/signup" variant="outline" size="lg" className="px-4">
            Join with your school email
          </ButtonLink>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border p-5">
            <Icon className="size-5 text-brand" />
            <h2 className="mt-3 font-medium">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border">
        <div className="flex items-center gap-2 border-b px-5 py-3 text-sm font-medium">
          <LibraryBig className="size-4 text-muted-foreground" />
          Georgia Tech
        </div>
        <ul className="divide-y">
          {exampleCourses.map((course) => (
            <li key={course.code} className="flex items-baseline gap-3 px-5 py-3">
              <span className="w-24 shrink-0 font-mono text-sm font-medium">
                {course.code}
              </span>
              <span className="text-sm text-muted-foreground">{course.name}</span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        OfCourse is for students&apos; own original work and experiences, never
        exams, answer keys, or restricted course materials.{" "}
        <Link href="/guidelines" className="font-medium text-foreground underline-offset-4 hover:underline">
          Read the guidelines
        </Link>
      </p>
    </div>
  );
}
