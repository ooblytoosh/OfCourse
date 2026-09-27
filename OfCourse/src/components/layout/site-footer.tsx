import { Sparkles } from "lucide-react";
import Link from "next/link";

import { AI_DISCLAIMER } from "@/lib/ai/disclaimer";

// On every page: the AI disclaimer and the ground rules.
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-background/60 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p className="flex max-w-3xl items-start gap-2">
          <Sparkles className="mt-px size-3.5 shrink-0 text-brand" aria-hidden />
          <span>
            <span className="font-medium text-foreground">About AI on OfCourse:</span> {AI_DISCLAIMER}
          </span>
        </p>
        <nav aria-label="Footer" className="flex shrink-0 gap-4">
          <Link href="/guidelines" className="hover:text-foreground">
            Guidelines
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <span>© {new Date().getFullYear()} OfCourse</span>
        </nav>
      </div>
    </footer>
  );
}
