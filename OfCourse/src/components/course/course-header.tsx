import { BadgeCheck, PenLine } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { JoinButton } from "@/components/course/join-button";
import type { CourseDetail } from "@/lib/data/courses";
import { formatCount } from "@/lib/format";

// Course hero: code, title, university and how many students are here.
export function CourseHeader({ course, signedIn }: { course: CourseDetail; signedIn: boolean }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
        <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
          {course.name}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-foreground ring-1 ring-border ring-inset">
            {course.code}
          </span>
          <span>{course.university}</span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1 font-medium text-foreground">
            <BadgeCheck className="size-4" aria-hidden />
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
        <JoinButton courseId={course.id} joined={course.viewerIsMember} signedIn={signedIn} />
      </div>
    </header>
  );
}
