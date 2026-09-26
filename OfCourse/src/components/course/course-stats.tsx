import { Clock, Gauge, ThumbsUp, Users } from "lucide-react";
import Link from "next/link";

import type { CourseDetail } from "@/lib/data/courses";
import { formatCount } from "@/lib/format";

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  percent,
  caption,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  unit?: string;
  // 0–100; draws a bar under the value.
  percent?: number;
  caption?: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-background p-4">
      <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </p>
      <p className="flex flex-wrap items-baseline gap-x-1">
        <span className="text-3xl font-semibold tracking-tight tabular-nums">{value}</span>
        {unit && <span className="text-sm whitespace-nowrap text-muted-foreground">{unit}</span>}
      </p>
      {percent !== undefined && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
        </div>
      )}
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}

// Workload, difficulty, would-take-again and verified students, as metric cards.
// Ratings are averages of student reports, not OfCourse's own judgement.
export function CourseStats({ course }: { course: CourseDetail }) {
  const s = course.stats;
  return (
    <section aria-label="Course stats" className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric
          icon={Clock}
          label="Typical workload"
          value={s ? String(s.workloadHoursPerWeek) : "–"}
          unit={s ? "hrs / week" : undefined}
        />
        <Metric
          icon={Gauge}
          label="Difficulty"
          value={s ? s.difficulty.toFixed(1) : "–"}
          unit="/ 10"
          percent={s ? s.difficulty * 10 : 0}
        />
        <Metric
          icon={ThumbsUp}
          label="Would take again"
          value={s ? `${s.wouldTakeAgainPct}%` : "–"}
          percent={s ? s.wouldTakeAgainPct : 0}
        />
        <Metric
          icon={Users}
          label="Verified students"
          value={course.verifiedStudentCount.toLocaleString("en-US")}
          caption="with a verified university email"
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
