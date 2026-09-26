import Link from "next/link";

import { cn } from "@/lib/utils";

// `compact` hides the wordmark on small screens, leaving just the mark.
export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="OfCourse home"
      className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}
    >
      <span className="grid size-7 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
        O
      </span>
      <span className={cn("text-lg", compact && "hidden sm:inline")}>
        Of<span className="text-brand">Course</span>
      </span>
    </Link>
  );
}
