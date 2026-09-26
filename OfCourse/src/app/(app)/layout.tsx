import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { JoinedCourses } from "@/components/layout/joined-courses";
import { NavLinks } from "@/components/layout/nav-links";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profiles";

// App shell: top bar, left navigation, main content.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // New students agree to the terms (on /welcome) before using the app.
  const user = await getCurrentUser();
  if (user) {
    const profile = await getProfile(user.id);
    if (profile && !profile.termsAcceptedAt) redirect("/welcome");
  }

  return (
    <>
      <SiteHeader />
      <div className="border-b md:hidden">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-2">
          <NavLinks orientation="horizontal" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4">
        <aside className="hidden w-52 shrink-0 md:block">
          <div className="sticky top-14 flex flex-col gap-6 py-6">
            <NavLinks orientation="vertical" />
            <Suspense fallback={null}>
              <JoinedCourses />
            </Suspense>
            <Link
              href="/guidelines"
              className="px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              Community guidelines
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 py-8">{children}</main>
      </div>
    </>
  );
}
