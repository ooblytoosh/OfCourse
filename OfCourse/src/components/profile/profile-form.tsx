"use client";

import { useActionState } from "react";

import { selectClass } from "@/components/auth/signup-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile, type ProfileFormState, type ProfileFormValues } from "@/lib/actions/profile";
import { PROFILE_LIMITS } from "@/lib/profile-rules";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

export function ProfileForm({
  initial,
  gradYears,
}: {
  initial: ProfileFormValues;
  gradYears: number[];
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(updateProfile, undefined);
  const values = state?.values ?? initial;
  const errors = state?.errors ?? {};

  // Keyed on each response so fields restart from the submitted values.
  return (
    <form key={state?.attempt ?? 0} action={action} className="flex flex-col gap-4" noValidate>
      {errors.form && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {errors.form}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={values.name} maxLength={PROFILE_LIMITS.name} aria-invalid={Boolean(errors.name)} />
          <FieldError message={errors.name} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" defaultValue={values.username} aria-invalid={Boolean(errors.username)} />
          <FieldError message={errors.username} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="major">Major</Label>
          <Input id="major" name="major" defaultValue={values.major} maxLength={PROFILE_LIMITS.major} aria-invalid={Boolean(errors.major)} />
          <FieldError message={errors.major} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="gradYear">Graduation year</Label>
          <select id="gradYear" name="gradYear" defaultValue={values.gradYear} className={selectClass} aria-invalid={Boolean(errors.gradYear)}>
            <option value="">Not set</option>
            {gradYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <FieldError message={errors.gradYear} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={values.bio}
          maxLength={PROFILE_LIMITS.bio}
          placeholder="How do you like to learn? What are you happy to help with?"
          aria-invalid={Boolean(errors.bio)}
        />
        <FieldError message={errors.bio} />
      </div>
      <div className="flex items-center justify-end gap-3">
        {state?.saved && (
          <span className="text-sm text-emerald-700" role="status">
            Saved
          </span>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
