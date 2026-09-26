import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Saved" };

export default async function SavedPage() {
  await requireUser("/saved");

  return (
    <PageHeader
      title="Saved"
      description="Posts you bookmark will show up here."
      comingSoon
    />
  );
}
