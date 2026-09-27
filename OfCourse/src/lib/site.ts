import { Bookmark, Compass, Home, UserRound, type LucideIcon } from "lucide-react";

export const siteConfig = {
  name: "OfCourse",
  tagline: "Learn from the students who took it.",
  description:
    "OfCourse is a student-powered knowledge network for university courses.",
};

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const mainNav: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/courses", label: "Explore", icon: Compass },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/profile", label: "Profile", icon: UserRound },
];

// Base URL used in auth emails. Falls back to the request origin when unset.
export function getSiteUrl(origin?: string | null): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    origin ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}
