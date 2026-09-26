"use client";

import { useActionState, useState, useTransition } from "react";

import { SignInLink } from "@/components/sign-in-link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { rateCourse, removeRating, type RatingFormState } from "@/lib/actions/community";
import type { CourseRating } from "@/lib/data/courses";
import { cn } from "@/lib/utils";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

// "Rate this course" in the course sidebar. Students see and edit only their
// own rating; everyone sees the averages.
export function RateCourse({
  courseId,
  signedIn,
  rating,
  semesters,
}: {
  courseId: string;
  signedIn: boolean;
  rating: CourseRating | null;
  semesters: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<RatingFormState, FormData>(
    async (prev, formData) => {
      const result = await rateCourse(prev, formData);
      if (result?.saved) setOpen(false);
      return result;
    },
    undefined,
  );
  const [removing, startRemove] = useTransition();

  if (!signedIn) {
    return (
      <SignInLink className="text-sm font-medium text-foreground underline-offset-4 hover:underline">
        Sign in to rate this course
      </SignInLink>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-2 text-sm">
        {rating && (
          <p className="text-muted-foreground">
            Your rating: {rating.workloadHours} hrs/week · {rating.difficulty}/10 ·{" "}
            {rating.wouldTakeAgain ? "would take again" : "wouldn't take again"}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
            {rating ? "Edit your rating" : "Rate this course"}
          </Button>
          {rating && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={removing}
              onClick={() => startRemove(async () => void (await removeRating(courseId)))}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form key={state?.attempt ?? 0} action={action} className="flex flex-col gap-3 text-sm">
      <input type="hidden" name="courseId" value={courseId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workloadHours">Hours per week</Label>
        <input
          id="workloadHours"
          name="workloadHours"
          type="number"
          min={0}
          max={60}
          required
          defaultValue={rating?.workloadHours ?? ""}
          className={cn(selectClass, "px-2.5")}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="difficulty">Difficulty (1 = easy, 10 = hardest)</Label>
        <select id="difficulty" name="difficulty" defaultValue={rating?.difficulty ?? ""} className={selectClass} required>
          <option value="" disabled>
            Choose
          </option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Would you take it again?</legend>
        <div className="flex gap-4">
          {(["yes", "no"] as const).map((v) => (
            <label key={v} className="flex items-center gap-1.5">
              <input
                type="radio"
                name="wouldTakeAgain"
                value={v}
                required
                defaultChecked={rating ? (rating.wouldTakeAgain ? v === "yes" : v === "no") : false}
                className="accent-brand"
              />
              {v === "yes" ? "Yes" : "No"}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rating-semester">
          Semester <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <select id="rating-semester" name="semester" defaultValue={rating?.semester ?? ""} className={selectClass}>
          <option value="">Not set</option>
          {semesters.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      {state?.error && (
        <p className="text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save rating"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
