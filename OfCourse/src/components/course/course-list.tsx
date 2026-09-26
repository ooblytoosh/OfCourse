import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { CourseListItem } from "@/lib/data/courses";
import { formatCount } from "@/lib/format";

export function CourseList({ courses }: { courses: CourseListItem[] }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border bg-card">
      {courses.map((course) => (
        <li key={course.id}>
          <Link
            href={`/c/${course.slug}`}
            className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-muted/60"
          >
            <span className="grid h-10 w-20 shrink-0 place-items-center rounded-lg bg-foreground font-mono text-[0.7rem] font-bold text-background">
              {course.code}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted-foreground">{course.university}</span>
              <span className="block truncate font-medium">
                {course.code} · {course.name}
              </span>
              <span className="block text-xs text-muted-foreground">
                {formatCount(course.memberCount, "student")} · {formatCount(course.postCount, "post")}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
