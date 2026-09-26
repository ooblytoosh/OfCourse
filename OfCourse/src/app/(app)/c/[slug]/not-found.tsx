import { SearchX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";

export default function CourseNotFound() {
  return (
    <EmptyState icon={SearchX} title="We couldn't find that course">
      It may not have a community yet.{" "}
      <Link href="/courses" className="font-medium text-foreground underline-offset-4 hover:underline">
        Browse all courses
      </Link>
    </EmptyState>
  );
}
