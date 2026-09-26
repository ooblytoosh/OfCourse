import { UserX } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";

export default function ProfileNotFound() {
  return (
    <EmptyState icon={UserX} title="We couldn't find that student">
      <Link href="/courses" className="font-medium text-foreground underline-offset-4 hover:underline">
        Browse courses
      </Link>
    </EmptyState>
  );
}
