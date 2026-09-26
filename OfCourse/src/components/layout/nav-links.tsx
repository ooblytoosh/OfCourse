"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { mainNav } from "@/lib/site";
import { cn } from "@/lib/utils";

// Primary navigation. Vertical in the sidebar, horizontal on small screens.
export function NavLinks({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        orientation === "vertical" ? "flex flex-col gap-1" : "grid grid-cols-4 gap-1",
      )}
    >
      {mainNav.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : href === "/profile"
              ? pathname.startsWith("/profile") || pathname.startsWith("/settings")
              : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center rounded-xl text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-card hover:text-foreground",
              orientation === "vertical" ? "gap-3 px-3 py-2" : "justify-center gap-1.5 px-1 py-2",
              active && "bg-card text-foreground shadow-sm ring-1 ring-border",
            )}
          >
            <Icon className={cn("size-4 shrink-0", orientation === "horizontal" && "max-[379px]:hidden")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
