import { Plus } from "lucide-react";

import { ButtonLink } from "@/components/button-link";
import { JoinButton } from "@/components/course/join-button";
import type { CourseDetail } from "@/lib/data/courses";
import { formatCount } from "@/lib/format";

export function CourseHeader({ course, signedIn }: { course: CourseDetail; signedIn: boolean }) {
  return (
    <header className="overflow-hidden rounded-2xl border bg-card">
      <div className="h-16 bg-gradient-to-r from-brand/80 via-brand/50 to-amber-300/60 sm:h-20" />
      <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-4">
          <div className="-mt-8 grid size-16 shrink-0 place-items-center rounded-2xl border-4 border-card bg-foreground font-mono text-xs font-bold text-background sm:size-20 sm:text-sm">
            {course.code}
          </div>
          <div className="min-w-0 pt-2">
            <p className="text-sm font-semibold text-muted-foreground">c/{course.slug}</p>
            <h1 className="text-2xl leading-tight font-semibold tracking-tight">
              {course.code}: {course.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {course.university} · {formatCount(course.memberCount, "member")} ·{" "}
              {formatCount(course.postCount, "post")}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <ButtonLink
            href={`/new?course=${course.slug}`}
            variant="outline"
            size="lg"
            className="rounded-full px-4"
          >
            <Plus />
            Create post
          </ButtonLink>
          <JoinButton courseId={course.id} joined={course.viewerIsMember} signedIn={signedIn} />
        </div>
      </div>
    </header>
  );
}
