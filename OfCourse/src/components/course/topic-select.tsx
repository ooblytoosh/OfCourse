"use client";

import { useRouter } from "next/navigation";

import type { Unit } from "@/lib/data/courses";
import { slugify } from "@/lib/format";

// Topic filter organized by syllabus unit. Picking a topic reloads the tab
// filtered to it.
export function TopicSelect({
  units,
  value,
  baseHref,
}: {
  units: Unit[];
  value: string | null;
  baseHref: string;
}) {
  const router = useRouter();
  if (units.every((u) => u.topics.length === 0)) return null;

  return (
    <>
      <label htmlFor="topic-filter" className="sr-only">
        Filter by topic
      </label>
      <select
        id="topic-filter"
        value={value ?? ""}
        onChange={(e) => {
          const url = new URL(baseHref, window.location.origin);
          if (e.target.value) url.searchParams.set("topic", e.target.value);
          else url.searchParams.delete("topic");
          router.push(`${url.pathname}${url.search}`);
        }}
        className="h-8 max-w-56 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">All topics</option>
        {units.map((unit) =>
          unit.topics.length ? (
            <optgroup
              key={unit.id ?? "other"}
              label={unit.position ? `Unit ${unit.position}: ${unit.name}` : unit.name}
            >
              {unit.topics.map((t) => (
                <option key={t.id} value={slugify(t.name)}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          ) : null,
        )}
      </select>
    </>
  );
}
