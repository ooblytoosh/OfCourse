import { Sparkles } from "lucide-react";
import Link from "next/link";

import { COURSE_TAB_ORDER, COURSE_TABS, type CourseTab } from "@/lib/content-policy";
import { cn } from "@/lib/utils";

const tabClass = (active: boolean) =>
  cn(
    "-mb-px flex items-center gap-2 border-b-2 py-2.5 text-sm font-medium transition-colors duration-200",
    active ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
  );

// Underlined tabs: the course's three post sections, then "Ask AI".
export function CourseTabs({
  slug,
  active,
  counts,
}: {
  slug: string;
  active: CourseTab | "ask";
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
                className={tabClass(isActive)}
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
        <li>
          <Link
            href={`/c/${slug}?tab=ask`}
            aria-current={active === "ask" ? "page" : undefined}
            scroll={false}
            className={tabClass(active === "ask")}
          >
            <Sparkles className={cn("size-4", active === "ask" ? "text-brand" : "")} aria-hidden />
            Ask AI
          </Link>
        </li>
      </ul>
    </nav>
  );
}
