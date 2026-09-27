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
        <div className="mx-auto max-w-[1600px] overflow-x-auto px-4 py-2">
          <NavLinks orientation="horizontal" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 gap-6 px-4 lg:gap-10 lg:px-8">
        <aside className="hidden w-52 shrink-0 md:block lg:w-56">
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
        <main className="min-w-0 flex-1 py-6 lg:py-10">
          <div className="mx-auto w-full max-w-[1280px]">{children}</div>
        </main>
        {/* Balances the left navigation so content sits in the middle of wide screens. */}
        <div aria-hidden className="hidden w-56 shrink-0 min-[1700px]:block" />
      </div>
    </>
  );
}
