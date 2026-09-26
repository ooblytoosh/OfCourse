import { BadgeCheck, Clock, Gauge, PenLine, ThumbsUp } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { JoinButton } from "@/components/course/join-button";
import type { CourseDetail } from "@/lib/data/courses";
import { formatCount } from "@/lib/format";

function Stat({
  icon: Icon,
  label,
  value,
  unit,
  percent,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  unit?: string;
  percent?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-1 sm:px-5 sm:first:pl-0">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className="flex flex-wrap items-baseline gap-x-1">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-sm whitespace-nowrap text-muted-foreground">{unit}</span>}
      </p>
      {percent !== undefined && (
        <div className="h-1 w-full max-w-28 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-700"
            style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Course title, key facts, and the student-reported stats right under it.
export function CourseHeader({ course, signedIn }: { course: CourseDetail; signedIn: boolean }) {
  const s = course.stats;
  return (
    <header className="surface flex flex-col gap-6 p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/courses" className="hover:text-foreground hover:underline">
              Courses
            </Link>
            <span aria-hidden>/</span>
            <span>{course.university}</span>
          </nav>
          <h1 className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-3xl leading-tight font-semibold tracking-tight text-balance">
            <span className="rounded-lg bg-brand/10 px-2 py-0.5 text-base font-semibold text-brand">
              {course.code}
            </span>
            {course.name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <BadgeCheck className="size-4 text-sky-600" aria-hidden />
              {formatCount(course.verifiedStudentCount, "Verified Student")}
            </span>
            <span aria-hidden>·</span>
            {formatCount(course.postCount, "post")}
          </p>
          {course.description && <p className="mt-2 max-w-2xl text-muted-foreground">{course.description}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <ButtonLink href={`/new?course=${course.slug}`} variant="outline" size="lg" className="px-4">
            <PenLine />
            Write a post
          </ButtonLink>
          <JoinButton courseId={course.id} joined={course.viewerIsMember} signedIn={signedIn} />
        </div>
      </div>

      <section aria-label="Course stats" className="flex flex-col gap-3 border-t pt-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-0 sm:divide-x">
          <Stat icon={Clock} label="Typical workload" value={s ? String(s.workloadHoursPerWeek) : "–"} unit={s ? "hrs/week" : undefined} />
          <Stat icon={Gauge} label="Difficulty" value={s ? s.difficulty.toFixed(1) : "–"} unit="/ 10" percent={s ? s.difficulty * 10 : 0} />
          <Stat icon={ThumbsUp} label="Would take again" value={s ? `${s.wouldTakeAgainPct}%` : "–"} percent={s ? s.wouldTakeAgainPct : 0} />
          <Stat icon={BadgeCheck} label="Verified students" value={course.verifiedStudentCount.toLocaleString("en-US")} />
        </div>
        <p className="text-xs text-muted-foreground">
          {s
            ? `Averages from ${formatCount(s.ratingCount, "student rating")}. Student opinions, not an OfCourse rating.`
            : "No ratings yet."}{" "}
          <Link href={`/c/${course.slug}?tab=reviews#rate`} className="font-medium text-foreground underline-offset-4 hover:underline">
            {course.viewerRating ? "Edit your rating" : "Rate this course"}
          </Link>
        </p>
      </section>
    </header>
  );
}
