import { MessageSquareQuote, PenLine } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/button-link";
import { RateCourse } from "@/components/course/rate-course";
import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post/post-card";
import type { CourseDetail } from "@/lib/data/courses";
import type { PostSummary } from "@/lib/data/posts";
import { VERIFY_HREF } from "@/lib/participation";

// "Course Reviews & Stats": your rating, then written reviews from students.
export function ReviewsTab({
  course,
  reviews,
  signedIn,
  semesters,
  canRate = true,
}: {
  course: CourseDetail;
  reviews: PostSummary[];
  signedIn: boolean;
  semesters: string[];
  // False for signed-in students who aren't verified at this university.
  canRate?: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section id="rate" className="surface scroll-mt-20 p-5">
        <h3 className="font-semibold">Rate this course</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {!course.stats && "Nobody has rated this course yet. "}
          Took {course.code}? Add your workload, difficulty and whether
          you&apos;d take it again. Only the averages are shown, unless you
          include your rating in a review. Writing a review updates it too.
        </p>
        <div className="mt-4">
          {signedIn && !canRate ? (
            <p className="text-sm">
              <Link
                href={VERIFY_HREF}
                className="font-medium text-brand underline-offset-4 hover:underline"
              >
                Verify your university email
              </Link>{" "}
              to rate {course.code}.
            </p>
          ) : (
            <RateCourse
              courseId={course.id}
              signedIn={signedIn}
              rating={course.viewerRating}
              semesters={semesters}
            />
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">Student reviews</h3>
          <ButtonLink
            href={`/new?course=${course.slug}&type=experience`}
            variant="outline"
            size="sm"
          >
            <PenLine />
            Write a review
          </ButtonLink>
        </div>
        {reviews.length > 0 ? (
          <div className="flex flex-col gap-3">
            {reviews.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                signedIn={signedIn}
                canVote={canRate}
              />
            ))}
          </div>
        ) : (
          <EmptyState icon={MessageSquareQuote} title="No written reviews yet">
            Share how {course.code} went for you: workload, difficulty and what
            helped.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
