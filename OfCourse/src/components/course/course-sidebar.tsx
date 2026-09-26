import Link from "next/link";

import type { CourseDetail, Unit } from "@/lib/data/courses";
import { slugify } from "@/lib/format";

// Right-hand outline: the course syllabus by unit, linking into Resources.
export function CourseSidebar({ course, units }: { course: CourseDetail; units: Unit[] }) {
  const numbered = units.filter((u) => u.position !== null);
  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border bg-card p-4">
        <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Syllabus</h2>
        {numbered.length > 0 ? (
          <ol className="mt-3 flex flex-col gap-3">
            {units.map((unit) => (
              <li key={unit.id ?? "other"}>
                <Link
                  href={`/c/${course.slug}?tab=resources#unit-${unit.position ?? "other"}`}
                  className="text-sm font-medium hover:underline"
                >
                  {unit.position ? `Unit ${unit.position}: ${unit.name}` : unit.name}
                </Link>
                {unit.topics.length > 0 && (
                  <ul className="mt-1 flex flex-wrap gap-x-2.5 gap-y-0.5">
                    {unit.topics.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/c/${course.slug}?tab=resources&topic=${slugify(t.name)}`}
                          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {t.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No syllabus units yet.</p>
        )}
      </section>

      <p className="px-1 text-xs text-muted-foreground">
        Share only your own work.{" "}
        <Link href="/guidelines" className="underline underline-offset-2 hover:text-foreground">
          Community guidelines
        </Link>
      </p>
    </div>
  );
}
