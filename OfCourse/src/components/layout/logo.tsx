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
      <span className="grid size-7 place-items-center rounded-lg shine bg-brand-gradient text-sm font-bold text-brand-foreground shadow-[0_4px_14px_-4px_var(--brand)]">
        O
      </span>
      <span className={cn("text-lg", compact && "hidden sm:inline")}>
        Of<span className="text-gradient">Course</span>
      </span>
    </Link>
  );
}
