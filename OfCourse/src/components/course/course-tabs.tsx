import Link from "next/link";

import { COURSE_TAB_ORDER, COURSE_TABS, type CourseTab } from "@/lib/content-policy";
import { cn } from "@/lib/utils";

// Segmented switcher between the course's three sections.
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
    <nav aria-label="Course sections" className="max-w-full overflow-x-auto">
      <ul className="inline-flex min-w-max gap-1 rounded-xl bg-muted p-1">
        {COURSE_TAB_ORDER.map((tab) => {
          const isActive = tab === active;
          return (
            <li key={tab}>
              <Link
                href={`/c/${slug}?tab=${tab}`}
                aria-current={isActive ? "page" : undefined}
                scroll={false}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {COURSE_TABS[tab].label}
                <span className={cn("text-xs tabular-nums", isActive ? "text-brand" : "opacity-70")}>
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
