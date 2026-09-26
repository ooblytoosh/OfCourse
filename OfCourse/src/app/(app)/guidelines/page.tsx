import type { Metadata } from "next";

import { ContentGuidelines } from "@/components/content-guidelines";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Community guidelines" };

export default function GuidelinesPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Community guidelines"
        description="OfCourse is built on students sharing their own original work and experiences. Restricted course materials don't belong here."
      />
      <ContentGuidelines />
    </div>
  );
}
