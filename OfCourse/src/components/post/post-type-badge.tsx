import { POST_TYPES, type PostType } from "@/lib/content-policy";
import { cn } from "@/lib/utils";

// Each type gets its own hue, as a soft tint rather than a loud fill.
const TINT: Record<PostType, string> = {
  study_guide: "bg-sky-500/12 text-sky-700 ring-sky-500/25 dark:text-sky-300",
  explanation: "bg-violet-500/12 text-violet-700 ring-violet-500/25 dark:text-violet-300",
  advice: "bg-amber-500/12 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  note: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
  discussion: "bg-slate-500/12 text-slate-700 ring-slate-500/25 dark:text-slate-300",
  experience: "bg-rose-500/12 text-rose-700 ring-rose-500/25 dark:text-rose-300",
  resource: "bg-teal-500/12 text-teal-700 ring-teal-500/25 dark:text-teal-300",
};

// Post type as a small tinted pill, e.g. "Study Guide".
export function PostTypeBadge({ type, className }: { type: PostType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.7rem] leading-none font-medium ring-1 ring-inset",
        TINT[type],
        className,
      )}
    >
      {POST_TYPES[type].label}
    </span>
  );
}
