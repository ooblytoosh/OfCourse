import { BadgeCheck, PenLine } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { CourseStats } from "@/components/course/course-stats";
import { JoinButton } from "@/components/course/join-button";
import type { CourseDetail } from "@/lib/data/courses";
import type { Participation } from "@/lib/participation";
import { formatCount } from "@/lib/format";

// Course hero: the student stats first and biggest, with the course's name,
// university and community size around them.
export function CourseHeader({
  course,
  signedIn,
  participation,
}: {
  course: CourseDetail;
  signedIn: boolean;
  participation: Participation;
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl border bg-card">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_18rem_at_0%_0%,var(--glow-1),transparent_70%),radial-gradient(34rem_16rem_at_100%_0%,var(--glow-2),transparent_70%)]"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-brand-gradient" />
      <div className="relative flex flex-col gap-6 p-5 sm:p-7">
        <CourseStats course={course} />

        <div className="flex flex-col gap-4 border-t pt-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Link href="/courses" className="hover:text-foreground hover:underline">
                Courses
              </Link>
              <span aria-hidden>/</span>
              <span>{course.university}</span>
              <span aria-hidden>/</span>
              <span className="font-medium text-foreground">{course.code}</span>
            </nav>
            <h1 className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              <span className="rounded-lg shine bg-brand-gradient px-2.5 py-1 font-mono text-base font-semibold text-brand-foreground shadow-[0_6px_18px_-8px_var(--brand)] sm:text-lg">
                {course.code}
              </span>
              {course.name}
            </h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span>{course.university}</span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <BadgeCheck className="size-4 text-sky-500 dark:text-sky-400" aria-hidden />
                {formatCount(course.verifiedStudentCount, "Verified Student")}
              </span>
              <span aria-hidden>·</span>
              {formatCount(course.postCount, "post")}
            </p>
            {course.description && (
              <p className="mt-3 max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
                {course.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <ButtonLink href={`/new?course=${course.slug}`} variant="outline" size="lg" className="px-3.5">
              <PenLine />
              Write a post
            </ButtonLink>
            <JoinButton
              courseId={course.id}
              joined={course.viewerIsMember}
              signedIn={signedIn}
              participation={participation}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
