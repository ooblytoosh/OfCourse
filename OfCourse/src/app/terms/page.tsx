import type { Metadata } from "next";
import Link from "next/link";

import { Logo } from "@/components/layout/logo";
import { TermsContent } from "@/components/terms-content";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-muted/40 px-4 py-10">
      <div className="flex w-full max-w-2xl flex-col gap-6">
        <Logo />
        <section className="surface p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight">OfCourse terms</h1>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">
            The rules every student agrees to when they join.
          </p>
          <TermsContent />
        </section>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to OfCourse
        </Link>
      </div>
    </div>
  );
}
