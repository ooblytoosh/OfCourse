"use client";

import { useActionState, useState } from "react";

import { CodeForm } from "@/components/auth/code-form";
import { selectClass } from "@/components/auth/signup-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startVerification, type VerificationState } from "@/lib/actions/profile";
import type { University } from "@/lib/data/profiles";

// Choose university -> enter university email -> we email a link -> verified.
export function VerificationForm({
  universities,
  accountEmail,
  suggestedUniversityId,
}: {
  universities: University[];
  accountEmail: string;
  suggestedUniversityId?: string;
}) {
  const [state, action, pending] = useActionState<VerificationState, FormData>(
    startVerification,
    undefined,
  );
  const [universityId, setUniversityId] = useState(
    state?.universityId ?? suggestedUniversityId ?? (universities.length === 1 ? universities[0].id : ""),
  );
  const university = universities.find((u) => u.id === universityId);

  if (state?.sentTo && state.mode) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm" role="status">
          We emailed a code to <span className="font-medium">{state.sentTo}</span>.
          {state.mode === "email_change" &&
            " Entering it switches your account to that address. Supabase may also email your current address to approve the change."}
        </p>
        <CodeForm email={state.sentTo} mode={state.mode} next="/settings" />
      </div>
    );
  }

  return (
    <form key={state?.attempt ?? 0} action={action} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="verify-university">University</Label>
          <select
            id="verify-university"
            name="universityId"
            defaultValue={universityId}
            onChange={(e) => setUniversityId(e.target.value)}
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
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="verify-email">University email</Label>
          <Input
            id="verify-email"
            name="email"
            type="email"
            defaultValue={state?.email ?? accountEmail}
            placeholder={university ? `you@${university.domain}` : "you@school.edu"}
            aria-invalid={Boolean(state?.error)}
          />
        </div>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          We&apos;ll email you a code to confirm you own this address.
        </p>
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? "Sending…" : "Send code"}
        </Button>
      </div>
    </form>
  );
}
