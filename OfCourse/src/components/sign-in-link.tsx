"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Link to /login that brings the user back to the current page afterwards.
// Used in place of action buttons when nobody is signed in.
export function SignInLink({
  className,
  children,
  title,
}: {
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  return (
    <Link
      href={`/login?next=${encodeURIComponent(pathname)}`}
      className={className}
      title={title ?? "Sign in to continue"}
    >
      {children}
    </Link>
  );
}
