import { BadgeCheck, BookOpen, Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOut } from "@/app/(auth)/actions";
import { Logo } from "@/components/layout/logo";
import { TermsForm } from "@/components/onboarding/terms-form";
import { TermsContent } from "@/components/terms-content";
import { VerifiedBadge } from "@/components/verified-badge";
import { requireUser, safeRedirectPath } from "@/lib/auth";
import { getProfile } from "@/lib/data/profiles";
import { WELCOME_POINTS } from "@/lib/terms";

export const metadata: Metadata = { title: "Welcome" };

const ICONS = [Users, Sparkles, BookOpen];

// Shown once after sign-up (and to any student who hasn't agreed yet): a quick
// intro to OfCourse and the terms they must accept to continue.
export default async function WelcomePage({ searchParams }: PageProps<"/welcome">) {
  const { next } = await searchParams;
  const user = await requireUser("/welcome");
  const profile = await getProfile(user.id);
  const nextPath = safeRedirectPath(typeof next === "string" ? next : "/");
  if (profile?.termsAcceptedAt) redirect(nextPath);

  const firstName = profile?.name?.split(" ")[0];

  return (
    <div className="flex flex-1 flex-col items-center bg-muted/40 px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Logo />
          <form action={signOut}>
            <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>

        <section className="animate-in fade-in slide-in-from-bottom-2 surface p-6 duration-500 sm:p-8">
          <p className="text-sm font-semibold text-brand">Step 1 of 2 · Welcome</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {firstName ? `Welcome, ${firstName}!` : "Welcome to OfCourse!"}
          </h1>
          {profile?.university ? (
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              Your email is verified:
              <VerifiedBadge university={profile.university.shortName} domain={profile.university.domain} size="lg" />
            </p>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <BadgeCheck className="size-4" aria-hidden />
              You can verify your university email anytime in Settings.
            </p>
          )}
          <ul className="mt-6 grid gap-3 sm:grid-cols-3">
            {WELCOME_POINTS.map((point, i) => {
              const Icon = ICONS[i % ICONS.length];
              return (
                <li key={point.title} className="rounded-xl bg-muted/50 p-4">
                  <Icon className="size-5 text-brand" aria-hidden />
                  <p className="mt-2 text-sm font-medium">{point.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{point.body}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="animate-in fade-in slide-in-from-bottom-2 surface p-6 delay-150 duration-500 fill-mode-both sm:p-8">
          <p className="text-sm font-semibold text-brand">Step 2 of 2 · Terms</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">The OfCourse ground rules</h2>
          <p className="mt-1 text-sm text-muted-foreground">Short and plain. Please read them before you start.</p>
          <div className="mt-5 max-h-80 overflow-y-auto rounded-xl border p-4">
            <TermsContent />
          </div>
          <div className="mt-5">
            <TermsForm next={nextPath} />
          </div>
        </section>
      </div>
    </div>
  );
}
