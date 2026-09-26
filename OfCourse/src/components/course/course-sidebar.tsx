import Link from "next/link";

import type { CourseDetail, Topic } from "@/lib/data/courses";
import { formatCount, slugify } from "@/lib/format";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export function CourseSidebar({ course, topics }: { course: CourseDetail; topics: Topic[] }) {
  const popular = topics.filter((t) => t.postCount > 0).slice(0, 6);

  return (
    <div className="flex flex-col gap-4">
      <Section title="About">
        <p className="font-semibold">
          {course.code}: {course.name}
        </p>
        <p className="text-sm text-muted-foreground">{course.university}</p>
        {course.description && <p className="mt-2 text-sm">{course.description}</p>}
      </Section>

      <Section title="Community">
        <dl className="flex flex-col gap-1.5">
          <Stat label="Members" value={course.memberCount.toLocaleString("en-US")} />
          <Stat label="Posts" value={course.postCount.toLocaleString("en-US")} />
        </dl>
      </Section>

      {popular.length > 0 && (
        <Section title="Popular topics">
          <ul className="flex flex-col gap-1">
            {popular.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/c/${course.slug}?topic=${slugify(t.name)}`}
                  className="flex justify-between rounded-md px-2 py-1 text-sm hover:bg-muted"
                >
                  <span>{t.name}</span>
                  <span className="text-muted-foreground tabular-nums">{t.postCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {course.stats && (
        <Section title="Course stats">
          <dl className="flex flex-col gap-1.5">
            <Stat label="Typical workload" value={`${course.stats.workloadHoursPerWeek} hrs/week`} />
            <Stat label="Difficulty" value={`${course.stats.difficulty.toFixed(1)} / 10`} />
            <Stat label="Would take again" value={`${course.stats.wouldTakeAgainPct}%`} />
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Averaged from {formatCount(course.stats.responseCount, "student report")}.
            {course.stats.isDemo && " Demo data for this preview."} These are student
            opinions, not an OfCourse rating.
          </p>
        </Section>
      )}

      <p className="px-1 text-xs text-muted-foreground">
        Share only your own work.{" "}
        <Link href="/guidelines" className="underline underline-offset-2 hover:text-foreground">
          Community guidelines
        </Link>
      </p>
    </div>
  );
}
