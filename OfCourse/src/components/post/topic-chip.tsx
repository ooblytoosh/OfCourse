import Link from "next/link";

import { slugify } from "@/lib/format";
import { cn } from "@/lib/utils";

// A topic tag. Links to the course feed filtered by that topic.
export function TopicChip({
  courseSlug,
  name,
  className,
}: {
  courseSlug: string;
  name: string;
  className?: string;
}) {
  return (
    <Link
      href={`/c/${courseSlug}?topic=${slugify(name)}`}
      className={cn(
        "relative z-10 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground",
        className,
      )}
    >
      {name}
    </Link>
  );
}
