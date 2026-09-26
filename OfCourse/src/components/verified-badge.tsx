import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";

// Shows that a student verified an email address at their university. It says
// exactly that and no more: email-domain verification doesn't prove enrollment.
export function VerifiedBadge({
  university,
  domain,
  size = "sm",
  className,
}: {
  university: string;
  domain?: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  const title = domain
    ? `Verified ${university} email address (@${domain})`
    : `Verified ${university} email address`;
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 font-medium text-muted-foreground",
        size === "lg"
          ? "rounded-md bg-muted px-2 py-0.5 text-sm text-foreground/85 ring-1 ring-border ring-inset"
          : "text-xs",
        className,
      )}
    >
      <BadgeCheck className={cn("text-foreground", size === "lg" ? "size-4" : "size-3.5")} aria-hidden />
      <span>
        {university}
        {size === "lg" && " Verified"}
      </span>
      <span className="sr-only">(verified university email)</span>
    </span>
  );
}
