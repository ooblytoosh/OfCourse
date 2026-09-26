import { SearchX } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/layout/logo";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <Logo />
      <SearchX className="size-10 text-muted-foreground" aria-hidden />
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">That page doesn&apos;t exist or has moved.</p>
      </div>
      <div className="flex gap-4 text-sm font-medium">
        <Link href="/" className="underline-offset-4 hover:underline">
          Home
        </Link>
        <Link href="/courses" className="underline-offset-4 hover:underline">
          Browse courses
        </Link>
      </div>
    </div>
  );
}
