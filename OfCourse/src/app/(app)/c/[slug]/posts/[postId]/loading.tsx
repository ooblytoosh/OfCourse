import { Skeleton } from "@/components/ui/skeleton";

export default function PostLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6" aria-busy="true" aria-label="Loading post">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-96 rounded-2xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
  );
}
