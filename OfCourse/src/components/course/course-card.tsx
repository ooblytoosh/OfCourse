import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { CourseListItem } from "@/lib/data/courses";
import { formatCount } from "@/lib/format";

// Each course keeps the same accent color everywhere (hue from its slug).
function courseHue(slug: string): number {
  let hash = 7;
  for (const ch of slug) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
  return hash % 360;
}

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
  const hue = courseHue(course.slug);
  return (
    <Link
      href={`/c/${course.slug}`}
      className="surface surface-interactive group relative flex h-full flex-col gap-2 overflow-hidden p-4 pt-5"
      style={{ "--course": `oklch(0.66 0.17 ${hue})` } as React.CSSProperties}
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundImage: `linear-gradient(90deg, oklch(0.66 0.17 ${hue}), oklch(0.66 0.17 ${(hue + 50) % 360}))` }}
      />
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-[color-mix(in_oklch,var(--course)_14%,transparent)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--course)]">
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
