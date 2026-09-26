import { ListTree } from "lucide-react";
import Link from "next/link";

import type { Unit } from "@/lib/data/courses";
import { slugify } from "@/lib/format";
import { cn } from "@/lib/utils";

// The course syllabus by unit. Each topic opens the resources for it.
export function SyllabusSidebar({
  slug,
  units,
  activeTopic,
}: {
  slug: string;
  units: Unit[];
  activeTopic: string | null;
}) {
  if (units.length === 0) return null;
  return (
    <nav aria-labelledby="syllabus-heading" className="surface p-4">
      <h2 id="syllabus-heading" className="flex items-center gap-2 text-sm font-semibold">
        <ListTree className="size-4 text-muted-foreground" aria-hidden />
        Course syllabus
      </h2>
      <ol className="mt-3 flex flex-col gap-4">
        {units.map((unit) => (
          <li key={unit.id ?? "other"}>
            <p className="flex items-baseline gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {unit.position !== null ? `Unit ${unit.position}` : "More"}
            </p>
            <p className="mt-0.5 text-sm font-medium">{unit.name}</p>
            {unit.topics.length > 0 && (
              <ul className="mt-1.5 flex flex-col border-l">
                {unit.topics.map((t) => {
                  const topicSlug = slugify(t.name);
                  const active = topicSlug === activeTopic;
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/c/${slug}?tab=resources&topic=${topicSlug}`}
                        scroll={false}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "-ml-px flex items-center justify-between gap-2 border-l py-1 pr-1 pl-3 text-sm transition-colors",
                          active
                            ? "border-foreground font-medium text-foreground"
                            : "border-transparent text-muted-foreground hover:border-foreground/40 hover:text-foreground",
                        )}
                      >
                        <span className="truncate">{t.name}</span>
                        <span className="text-xs tabular-nums opacity-70">{t.postCount}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
