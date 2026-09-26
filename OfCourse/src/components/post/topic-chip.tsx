import { Hash } from "lucide-react";
import Link from "next/link";

import { tabForPostType, type PostType } from "@/lib/content-policy";
import { slugify } from "@/lib/format";
import { cn } from "@/lib/utils";

// A topic tag. Links to the course tab where posts like this one live,
// filtered to that topic.
export function TopicChip({
  courseSlug,
  name,
  postType,
  className,
}: {
  courseSlug: string;
  name: string;
  postType: PostType;
  className?: string;
}) {
  return (
    <Link
      href={`/c/${courseSlug}?tab=${tabForPostType(postType)}&topic=${slugify(name)}`}
      className={cn(
        "relative z-10 inline-flex items-center gap-0.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground hover:underline",
        className,
      )}
    >
      <Hash className="size-3" aria-hidden />
      {name}
    </Link>
  );
}
