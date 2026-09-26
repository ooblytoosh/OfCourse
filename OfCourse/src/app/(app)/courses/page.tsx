import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Courses" };

export default async function CoursesPage({ searchParams }: PageProps<"/courses">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Courses"
        description="Every course will have its own student community."
        comingSoon
      />
      <p className="text-muted-foreground">
        {query
          ? `Course search for “${query}” is coming soon.`
          : "Course directory and search are coming soon."}
      </p>
    </div>
  );
}
