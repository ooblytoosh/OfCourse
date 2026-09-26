"use client";

import { TriangleAlert } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <EmptyState icon={TriangleAlert} title="Something went wrong loading this page">
      <p>Check your connection and try again.</p>
      <Button variant="outline" className="mt-3" onClick={reset}>
        Try again
      </Button>
    </EmptyState>
  );
}
