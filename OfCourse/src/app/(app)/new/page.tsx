import type { Metadata } from "next";

import { ContentGuidelines } from "@/components/content-guidelines";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { ACADEMIC_INTEGRITY_ATTESTATION } from "@/lib/content-policy";

export const metadata: Metadata = { title: "New post" };

// Placeholder for the post composer (Phase 2). The composer must require the
// academic-integrity attestation below before a post can be submitted.
export default async function NewPostPage() {
  await requireUser("/new");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New post"
        description="Share notes, study guides, explanations and advice with your course."
        comingSoon
      />
      <ContentGuidelines />
      <p className="rounded-xl border bg-muted/50 p-4 text-sm">
        Every post will require you to confirm:{" "}
        <span className="italic">“{ACADEMIC_INTEGRITY_ATTESTATION}”</span>
      </p>
    </div>
  );
}
