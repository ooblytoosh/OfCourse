import { Clock, Flame, Lightbulb, Search } from "lucide-react";
import Link from "next/link";

import { TopicSelect } from "@/components/course/topic-select";
import type { CourseTab } from "@/lib/content-policy";
import type { Unit } from "@/lib/data/courses";
import type { FeedSort } from "@/lib/data/posts";
import { cn } from "@/lib/utils";

const SORTS: { value: FeedSort; label: string; icon: typeof Flame }[] = [
  { value: "hot", label: "Hot", icon: Flame },
  { value: "new", label: "New", icon: Clock },
  { value: "top", label: "Most helpful", icon: Lightbulb },
];

export type FeedParams = { tab: CourseTab; sort?: FeedSort; topic?: string | null; q?: string | null };

// Builds a course page URL, keeping the other filters.
export function feedHref(slug: string, params: FeedParams) {
  const search = new URLSearchParams({ tab: params.tab });
  if (params.sort && params.sort !== "hot") search.set("sort", params.sort);
  if (params.topic) search.set("topic", params.topic);
  if (params.q) search.set("q", params.q);
  return `/c/${slug}?${search}`;
}

// Toolbar above a tab's posts: sort (optional), a topic picker organized by
// syllabus unit, and a keyword filter.
export function FeedControls({
  slug,
  tab,
  sort,
  topic,
  q,
  units,
  showSort = true,
}: {
  slug: string;
  tab: CourseTab;
  sort: FeedSort;
  topic: string | null;
  q: string | null;
  units: Unit[];
  showSort?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      {showSort ? (
        <div className="flex gap-1" role="group" aria-label="Sort posts">
          {SORTS.map(({ value, label, icon: Icon }) => (
            <Link
              key={value}
              href={feedHref(slug, { tab, sort: value, topic, q })}
              aria-current={sort === value ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                sort === value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      ) : (
        <span />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <TopicSelect units={units} value={topic} baseHref={feedHref(slug, { tab, sort, q })} />
        <form action={`/c/${slug}`} role="search" className="relative">
          <input type="hidden" name="tab" value={tab} />
          {sort !== "hot" && <input type="hidden" name="sort" value={sort} />}
          {topic && <input type="hidden" name="topic" value={topic} />}
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="keyword-q" className="sr-only">
            Filter posts by keyword
          </label>
          <input
            id="keyword-q"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Filter by keyword"
            className="h-8 w-44 rounded-lg border border-input bg-transparent pr-2 pl-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </form>
      </div>
    </div>
  );
}
