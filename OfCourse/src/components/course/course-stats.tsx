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
    <div className="surface flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="size-3.5" aria-hidden />
          {label}
        </p>
        {reading && (
          <span className={cn("text-[0.7rem] font-medium", tone?.text)} data-tone={reading.tone}>
            {reading.label}
          </span>
        )}
      </div>
      <p className="flex items-baseline gap-1">
        <span className={cn("text-3xl font-semibold tracking-tight tabular-nums", tone?.text)}>{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
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
      <div className="grid gap-3 sm:grid-cols-3">
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
