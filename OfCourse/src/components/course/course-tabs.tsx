import Link from "next/link";

import { COURSE_TAB_ORDER, COURSE_TABS, type CourseTab } from "@/lib/content-policy";
import { cn } from "@/lib/utils";

// Underlined tabs for the course's three sections.
export function CourseTabs({
  slug,
  active,
  counts,
}: {
  slug: string;
  active: CourseTab;
  counts: Record<CourseTab, number>;
}) {
  return (
    <nav aria-label="Course sections" className="max-w-full overflow-x-auto border-b">
      <ul className="flex min-w-max gap-5">
        {COURSE_TAB_ORDER.map((tab) => {
          const isActive = tab === active;
          return (
            <li key={tab}>
              <Link
                href={`/c/${slug}?tab=${tab}`}
                aria-current={isActive ? "page" : undefined}
                scroll={false}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 py-2.5 text-sm font-medium transition-colors duration-200",
                  isActive
                    ? "border-brand text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {COURSE_TABS[tab].label}
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 text-xs tabular-nums",
                    isActive ? "bg-brand text-brand-foreground" : "bg-muted",
                  )}
                >
                  {counts[tab]}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
