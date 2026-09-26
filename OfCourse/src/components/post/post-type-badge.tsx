import { POST_TYPES, type PostType } from "@/lib/content-policy";
import { cn } from "@/lib/utils";

const DOT: Record<PostType, string> = {
  study_guide: "bg-blue-500",
  explanation: "bg-violet-500",
  advice: "bg-amber-500",
  note: "bg-emerald-500",
  discussion: "bg-slate-400",
  experience: "bg-rose-500",
  resource: "bg-teal-500",
};

// Post type as a small colored dot and label, e.g. "● Study Guide".
export function PostTypeBadge({ type, className }: { type: PostType; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground", className)}>
      <span className={cn("size-2 rounded-full", DOT[type])} aria-hidden />
      {POST_TYPES[type].label}
    </span>
  );
}
