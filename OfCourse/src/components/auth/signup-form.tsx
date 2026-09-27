"use client";

import { useActionState, useState } from "react";

import { signUp, type SignupState } from "@/app/(auth)/actions";
import { MajorSelect } from "@/components/major-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { University } from "@/lib/data/profiles";
import { UNLISTED_UNIVERSITY } from "@/lib/profile-rules";

export const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

export function SignupForm({
  universities,
  gradYears,
}: {
  universities: University[];
  gradYears: number[];
}) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signUp, undefined);

  // Remount the fields after each server response so they start from the
  // submitted values (React resets forms after an action).
  return (
    <Fields
      key={state?.attempt ?? 0}
      state={state}
      action={action}
      pending={pending}
      universities={universities}
      gradYears={gradYears}
    />
  );
}

function Fields({
  state,
  action,
  pending,
  universities,
  gradYears,
}: {
  state: SignupState;
  action: (formData: FormData) => void;
  pending: boolean;
  universities: University[];
  gradYears: number[];
}) {
  const errors = state?.errors ?? {};
  const values = state?.values;
  const [universityId, setUniversityId] = useState(
    values?.universityId ?? (universities.length === 1 ? universities[0].id : ""),
  );
  const university = universities.find((u) => u.id === universityId);

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {errors.form && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {errors.form}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" defaultValue={values?.name} aria-invalid={Boolean(errors.name)} />
          <FieldError message={errors.name} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            name="username"
            autoComplete="username"
            placeholder="e.g. alexchen"
            defaultValue={values?.username}
            aria-invalid={Boolean(errors.username)}
          />
          <FieldError message={errors.username} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="universityId">University</Label>
        <select
          id="universityId"
          name="universityId"
          defaultValue={universityId}
          onChange={(e) => setUniversityId(e.target.value)}
          aria-invalid={Boolean(errors.universityId)}
          className={selectClass}
        >
          <option value="" disabled>
            Choose your university
          </option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
          <option value={UNLISTED_UNIVERSITY}>My university isn&apos;t listed</option>
        </select>
        <FieldError message={errors.universityId} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{university ? `${university.shortName} email` : "Email"}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder={university ? `you@${university.domain}` : "you@example.edu"}
          defaultValue={values?.email}
          aria-invalid={Boolean(errors.email)}
        />
        <FieldError message={errors.email} />
        <p className="text-xs text-muted-foreground">
          {universityId === UNLISTED_UNIVERSITY
            ? "You can use OfCourse without a verified university for now."
            : "We'll email you a 6-digit code. Entering it verifies you as a student there."}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
        />
        <FieldError message={errors.password} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="major">
            Major <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <MajorSelect id="major" defaultValue={values?.major} invalid={Boolean(errors.major)} />
          <FieldError message={errors.major} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="gradYear">
            Graduation year <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <select
            id="gradYear"
            name="gradYear"
            defaultValue={values?.gradYear ?? ""}
            aria-invalid={Boolean(errors.gradYear)}
            className={selectClass}
          >
            <option value="">Choose a year</option>
            {gradYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <FieldError message={errors.gradYear} />
        </div>
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
