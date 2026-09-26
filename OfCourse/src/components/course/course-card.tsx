import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { CourseListItem } from "@/lib/data/courses";
import { formatCount } from "@/lib/format";

// The one way a course is shown in lists: home, search results and profiles.
export function CourseCard({
  course,
  meta,
}: {
  course: Pick<CourseListItem, "slug" | "code" | "name"> & Partial<CourseListItem>;
  // Replaces the default "N students · N posts" line.
  meta?: string;
}) {
  const defaultMeta =
    course.memberCount !== undefined && course.postCount !== undefined
      ? `${formatCount(course.memberCount, "student")} · ${formatCount(course.postCount, "post")}`
      : undefined;
  return (
    <Link
      href={`/c/${course.slug}`}
      className="surface surface-interactive group flex h-full flex-col gap-2 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
          {course.code}
        </span>
        <ArrowUpRight
          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden
        />
      </div>
      <p className="font-semibold leading-snug">{course.name}</p>
      {course.university && <p className="text-xs text-muted-foreground">{course.university}</p>}
      {(meta ?? defaultMeta) && (
        <p className="mt-auto pt-1 text-xs text-muted-foreground">{meta ?? defaultMeta}</p>
      )}
    </Link>
  );
}

export function CourseGrid({ courses }: { courses: CourseListItem[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
        <li key={course.id}>
          <CourseCard course={course} />
        </li>
      ))}
    </ul>
  );
}
