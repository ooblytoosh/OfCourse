import { Plus, Search } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";

function initials(nameOrEmail: string): string {
  return nameOrEmail
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export async function SiteHeader() {
  const user = await getCurrentUser();
  const displayName =
    (user?.user_metadata?.name as string | undefined) ?? user?.email ?? "";

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4 lg:px-8">
        <Logo compact className="shrink-0" />

        {/* Global course search. */}
        <form action="/courses" role="search" className="relative mx-auto w-full max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            name="q"
            placeholder="Search courses..."
            aria-label="Search courses"
            className="h-9 rounded-lg border-transparent bg-muted pl-9 focus-visible:border-ring"
          />
        </form>

        <div className="flex shrink-0 items-center gap-1.5">
          <ThemeToggle />
          <ButtonLink href="/new" size="lg" className="rounded-lg px-3">
            <Plus />
            <span className="hidden sm:inline">New Post</span>
          </ButtonLink>
          {user ? (
            <Link href="/profile" aria-label="Your profile" className="rounded-full">
              <Avatar>
                <AvatarFallback className="bg-brand-gradient font-semibold text-white">{initials(displayName)}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <ButtonLink href="/login" variant="outline" size="lg" className="rounded-lg px-3">
              Sign in
            </ButtonLink>
          )}
        </div>
      </div>
    </header>
  );
}
