import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FeedSort } from "@/lib/data/posts";

// Keyword search over this course's posts (titles and content).
export function CommunitySearch({
  slug,
  q,
  sort,
  topic,
}: {
  slug: string;
  q: string | null;
  sort: FeedSort;
  topic: string | null;
}) {
  return (
    <form action={`/c/${slug}`} className="rounded-xl border bg-card p-4">
      <label htmlFor="community-q" className="text-sm font-medium">
        What are you trying to figure out?
      </label>
      <div className="mt-2 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="community-q"
            name="q"
            defaultValue={q ?? ""}
            placeholder="e.g. AVL rotations, hashing, recursion…"
            className="h-9 pl-9"
          />
        </div>
        {sort !== "hot" && <input type="hidden" name="sort" value={sort} />}
        {topic && <input type="hidden" name="topic" value={topic} />}
        <Button type="submit" size="lg">
          Search posts
        </Button>
      </div>
    </form>
  );
}
