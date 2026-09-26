import type { VariantProps } from "class-variance-authority";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// A Next.js <Link> styled as a shadcn Button.
export function ButtonLink({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) {
  return (
    <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
