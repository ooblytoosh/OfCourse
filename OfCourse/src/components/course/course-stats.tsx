import { Clock, Gauge, ThumbsUp } from "lucide-react";
import Link from "next/link";

import {
  difficultyReading,
  TONE_CLASSES,
  workloadReading,
  wouldTakeAgainReading,
  type StatReading,
} from "@/lib/course-stats";
import type { CourseDetail } from "@/lib/data/courses";
import { formatCount } from "@/lib/format";
import { cn } from "@/lib/utils";

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  reading,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  unit?: string;
  reading: StatReading | null;
}) {
  const tone = reading ? TONE_CLASSES[reading.tone] : null;
  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-xl border bg-background/60 p-3 backdrop-blur-sm sm:gap-3 sm:p-4">
      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <p className="flex items-center gap-1.5 text-[0.7rem] font-medium text-muted-foreground sm:text-xs">
          <Icon className="hidden size-3.5 sm:block" aria-hidden />
          {label}
        </p>
        {reading && (
          <span className={cn("text-[0.7rem] font-medium", tone?.text)} data-tone={reading.tone}>
            {reading.label}
          </span>
        )}
      </div>
      <p className="flex flex-wrap items-baseline gap-x-1">
        <span className={cn("text-2xl font-semibold tracking-tight tabular-nums sm:text-4xl", tone?.text)}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground sm:text-sm">{unit}</span>}
      </p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tone?.bar)}
          style={{ width: `${reading?.percent ?? 0}%` }}
        />
      </div>
    </div>
  );
}

// The three student-reported numbers, color-coded from good to heavy.
export function CourseStats({ course }: { course: CourseDetail }) {
  const s = course.stats;
  return (
    <section aria-label="Course stats" className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <MetricCard
          icon={Clock}
          label="Typical Workload"
          value={s ? String(s.workloadHoursPerWeek) : "–"}
          unit="hrs/week"
          reading={s ? workloadReading(s.workloadHoursPerWeek) : null}
        />
        <MetricCard
          icon={Gauge}
          label="Difficulty"
          value={s ? s.difficulty.toFixed(1) : "–"}
          unit="/ 10"
          reading={s ? difficultyReading(s.difficulty) : null}
        />
        <MetricCard
          icon={ThumbsUp}
          label="Would take again"
          value={s ? `${s.wouldTakeAgainPct}%` : "–"}
          reading={s ? wouldTakeAgainReading(s.wouldTakeAgainPct) : null}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {s
          ? `Averages from ${formatCount(s.ratingCount, "student rating")}. Student opinions, not an OfCourse rating.`
          : "No ratings yet."}{" "}
        <Link
          href={`/c/${course.slug}?tab=reviews#rate`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {course.viewerRating ? "Edit your rating" : "Rate this course"}
        </Link>
      </p>
    </section>
  );
}
