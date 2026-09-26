"use client";

import { ShieldCheck } from "lucide-react";
import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPost, type PostFormState } from "@/lib/actions/community";
import {
  ACADEMIC_INTEGRITY_ATTESTATION,
  POST_LIMITS,
  POST_TYPES,
  POSTABLE_TYPES,
} from "@/lib/content-policy";
import { cn } from "@/lib/utils";

type ComposerCourse = {
  id: string;
  code: string;
  name: string;
  university: string;
  topics: { id: string; name: string }[];
};

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

type ComposerProps = {
  courses: ComposerCourse[];
  semesters: string[];
  initialCourseId?: string;
};

export function PostComposer(props: ComposerProps) {
  const [state, action, pending] = useActionState<PostFormState, FormData>(createPost, undefined);
  // Remount the fields after every server response so each uncontrolled input
  // starts from the submitted values. (React resets forms after an action, and
  // a <select> wouldn't pick up a changed defaultValue on its own.)
  return (
    <ComposerForm
      key={state?.attempt ?? 0}
      {...props}
      state={state}
      action={action}
      pending={pending}
    />
  );
}

function ComposerForm({
  courses,
  semesters,
  initialCourseId,
  state,
  action,
  pending,
}: ComposerProps & {
  state: PostFormState;
  action: (formData: FormData) => void;
  pending: boolean;
}) {
  const errors = state?.errors ?? {};
  const values = state?.values;

  const defaultCourseId = values?.courseId ?? initialCourseId ?? "";
  const [courseId, setCourseId] = useState(defaultCourseId);
  const [integrity, setIntegrity] = useState(values?.integrity ?? false);
  const course = courses.find((c) => c.id === courseId);

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {errors.form && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {errors.form}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="courseId">Course</Label>
          <select
            id="courseId"
            name="courseId"
            defaultValue={defaultCourseId}
            onChange={(e) => setCourseId(e.target.value)}
            aria-invalid={Boolean(errors.courseId)}
            className={selectClass}
          >
            <option value="" disabled>
              Choose a course
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}: {c.name} ({c.university})
              </option>
            ))}
          </select>
          <FieldError message={errors.courseId} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="type">Post type</Label>
          <select
            id="type"
            name="type"
            defaultValue={values?.type ?? ""}
            aria-invalid={Boolean(errors.type)}
            className={selectClass}
          >
            <option value="" disabled>
              Choose a type
            </option>
            {POSTABLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {POST_TYPES[type].label}: {POST_TYPES[type].description}
              </option>
            ))}
          </select>
          <FieldError message={errors.type} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={values?.title}
          maxLength={POST_LIMITS.titleMax}
          placeholder="e.g. How I studied for CS 1332"
          aria-invalid={Boolean(errors.title)}
        />
        <FieldError message={errors.title} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          defaultValue={values?.content}
          maxLength={POST_LIMITS.contentMax}
          placeholder="Share your own notes, explanations, advice or experience…"
          aria-invalid={Boolean(errors.content)}
          className="min-h-56"
        />
        <FieldError message={errors.content} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">
          Topics <span className="font-normal text-muted-foreground">(optional, up to {POST_LIMITS.maxTopics})</span>
        </legend>
        {course ? (
          course.topics.length > 0 ? (
            <div className="flex flex-wrap gap-2" key={course.id}>
              {course.topics.map((t) => (
                <label
                  key={t.id}
                  className="cursor-pointer rounded-full border px-3 py-1 text-sm transition-colors select-none has-checked:border-brand has-checked:bg-brand/10 has-checked:text-brand has-focus-visible:ring-3 has-focus-visible:ring-ring/50"
                >
                  <input
                    type="checkbox"
                    name="topicIds"
                    value={t.id}
                    defaultChecked={values?.topicIds.includes(t.id)}
                    className="sr-only"
                  />
                  {t.name}
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">This course has no topics yet.</p>
          )
        ) : (
          <p className="text-sm text-muted-foreground">Choose a course to see its topics.</p>
        )}
        <FieldError message={errors.topicIds} />
      </fieldset>

      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor="semester">Semester you took it</Label>
        <select
          id="semester"
          name="semester"
          defaultValue={values?.semester ?? ""}
          aria-invalid={Boolean(errors.semester)}
          className={selectClass}
        >
          <option value="" disabled>
            Choose a semester
          </option>
          {semesters.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <FieldError message={errors.semester} />
      </div>

      <div
        className={cn(
          "flex flex-col gap-2 rounded-xl border p-4",
          errors.integrity ? "border-destructive bg-destructive/5" : "bg-muted/50",
        )}
      >
        <label className="flex cursor-pointer gap-3 text-sm">
          <input
            type="checkbox"
            name="integrity"
            defaultChecked={values?.integrity}
            onChange={(e) => setIntegrity(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-brand"
          />
          <span>
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="size-4 text-brand" />
              Academic integrity
            </span>
            <span className="mt-1 block">{ACADEMIC_INTEGRITY_ATTESTATION}</span>
          </span>
        </label>
        {errors.integrity && (
          <p className="pl-7 text-sm text-destructive" role="alert">
            Check this box to publish.
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        {!integrity && (
          <span className="text-sm text-muted-foreground">Confirm academic integrity to publish</span>
        )}
        <Button type="submit" size="lg" className="px-5" disabled={pending || !integrity}>
          {pending ? "Publishing…" : "Publish"}
        </Button>
      </div>
    </form>
  );
}
