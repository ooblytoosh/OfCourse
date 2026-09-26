import { Clock, Flame, TrendingUp } from "lucide-react";
import Link from "next/link";

import type { Topic } from "@/lib/data/courses";
import type { FeedSort } from "@/lib/data/posts";
import { slugify } from "@/lib/format";
import { cn } from "@/lib/utils";

const SORTS: { value: FeedSort; label: string; icon: typeof Flame }[] = [
  { value: "hot", label: "Hot", icon: Flame },
  { value: "new", label: "New", icon: Clock },
  { value: "top", label: "Top", icon: TrendingUp },
];

// Builds a course feed URL, keeping the other filters.
export function feedHref(
  slug: string,
  params: { sort?: FeedSort; topic?: string | null; q?: string | null },
) {
  const search = new URLSearchParams();
  if (params.sort && params.sort !== "hot") search.set("sort", params.sort);
  if (params.topic) search.set("topic", params.topic);
  if (params.q) search.set("q", params.q);
  const qs = search.toString();
  return `/c/${slug}${qs ? `?${qs}` : ""}`;
}

// Hot / New / Top tabs and topic filter chips. Topics are filters on the one
// course community, not separate communities.
export function FeedControls({
  slug,
  sort,
  topic,
  q,
  topics,
}: {
  slug: string;
  sort: FeedSort;
  topic: string | null;
  q: string | null;
  topics: Topic[];
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {SORTS.map(({ value, label, icon: Icon }) => (
          <Link
            key={value}
            href={feedHref(slug, { sort: value, topic, q })}
            aria-current={sort === value ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              sort === value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </div>

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="Filter by topic">
          <Chip href={feedHref(slug, { sort, q })} active={!topic}>
            All
          </Chip>
          {topics.map((t) => {
            const value = slugify(t.name);
            return (
              <Chip
                key={t.id}
                href={feedHref(slug, { sort, topic: value, q })}
                active={topic === value}
              >
                {t.name}
              </Chip>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Chip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-brand bg-brand/10 text-brand"
          : "text-muted-foreground hover:border-foreground/30 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
