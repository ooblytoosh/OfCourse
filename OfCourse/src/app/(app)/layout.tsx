import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { JoinedCourses } from "@/components/layout/joined-courses";
import { NavLinks } from "@/components/layout/nav-links";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getProfile } from "@/lib/data/profiles";
import { VERIFY_HREF } from "@/lib/participation";

// App shell: top bar, left navigation, main content.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // New students agree to the terms (on /welcome) before using the app.
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  if (profile && !profile.termsAcceptedAt) redirect("/welcome");
  const needsVerification = Boolean(profile && !profile.verified);

  return (
    <>
      <SiteHeader />
      {needsVerification && (
        <div className="border-b border-brand/25 bg-brand/[0.08]">
          <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 text-sm lg:px-8">
            <p className="flex items-center gap-2">
              <ShieldCheck className="size-4 shrink-0 text-brand" aria-hidden />
              <span>
                <span className="font-medium">Verify your university email</span>
                <span className="text-muted-foreground"> to join courses, post, comment, vote with lightbulbs and use the AI.</span>
              </span>
            </p>
            <Link href={VERIFY_HREF} className="font-medium text-brand underline-offset-4 hover:underline">
              Verify now →
            </Link>
          </div>
        </div>
      )}
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
