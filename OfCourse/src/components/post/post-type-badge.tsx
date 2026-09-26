import { POST_TYPES, type PostType } from "@/lib/content-policy";
import { cn } from "@/lib/utils";

// Post type as a small monochrome pill, e.g. "Study Guide".
export function PostTypeBadge({ type, className }: { type: PostType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[0.7rem] leading-none font-medium text-foreground/80 ring-1 ring-border ring-inset",
        className,
      )}
    >
      {POST_TYPES[type].label}
    </span>
  );
}
