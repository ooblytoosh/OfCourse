import Link from "next/link";

import { COURSE_TAB_ORDER, COURSE_TABS, type CourseTab } from "@/lib/content-policy";
import { cn } from "@/lib/utils";

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
    <nav aria-label="Course sections" className="-mx-1 overflow-x-auto border-b">
      <ul className="flex min-w-max gap-1 px-1">
        {COURSE_TAB_ORDER.map((tab) => {
          const isActive = tab === active;
          return (
            <li key={tab}>
              <Link
                href={`/c/${slug}?tab=${tab}`}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-3 pt-1 pb-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {COURSE_TABS[tab].label}
                <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
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
