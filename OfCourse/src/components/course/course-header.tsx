import { BadgeCheck, PenLine } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { CourseStats } from "@/components/course/course-stats";
import { JoinButton } from "@/components/course/join-button";
import type { CourseDetail } from "@/lib/data/courses";
import { formatCount } from "@/lib/format";

// Course title block with the student-reported stats right beneath it.
export function CourseHeader({ course, signedIn }: { course: CourseDetail; signedIn: boolean }) {
  return (
    <header className="flex flex-col gap-6 rounded-2xl border bg-card p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
            <Link href="/courses" className="hover:text-foreground hover:underline">
              Courses
            </Link>
            <span aria-hidden className="mx-1.5">
              /
            </span>
            <span className="font-medium text-foreground">
              {course.university} · {course.code}
            </span>
          </nav>
          <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight text-balance">
            {course.name}
          </h1>
          {course.description && (
            <p className="mt-2 max-w-2xl text-muted-foreground">{course.description}</p>
          )}
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1 font-medium">
              <BadgeCheck className="size-4 text-sky-700" aria-hidden />
              {formatCount(course.verifiedStudentCount, "Verified Student")}
            </span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="text-muted-foreground">{formatCount(course.postCount, "post")}</span>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <ButtonLink
            href={`/new?course=${course.slug}`}
            variant="outline"
            size="lg"
            className="px-4"
          >
            <PenLine />
            Write a post
          </ButtonLink>
          <JoinButton courseId={course.id} joined={course.viewerIsMember} signedIn={signedIn} />
        </div>
      </div>

      <CourseStats course={course} />
    </header>
  );
}
