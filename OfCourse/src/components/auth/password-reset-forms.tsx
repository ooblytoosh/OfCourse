"use client";

import { useActionState } from "react";

import { requestPasswordReset, resetPassword, type ResetState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function FormError({ message }: { message?: string }) {
  return message ? (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  ) : null;
}

// Step 1: which account to reset.
export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ResetState, FormData>(requestPasswordReset, undefined);
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="identifier">Username or email</Label>
        <Input id="identifier" name="identifier" autoComplete="username" required autoFocus />
      </div>
      <FormError message={state?.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Email me a reset code"}
      </Button>
    </form>
  );
}

// Step 2: the emailed code (unless the reset link already signed you in) and
// a new password.
export function ResetPasswordForm({ email, needsCode }: { email: string; needsCode: boolean }) {
  const [state, action, pending] = useActionState<ResetState, FormData>(resetPassword, undefined);
  return (
    <form key={state?.attempt ?? 0} action={action} className="flex flex-col gap-4">
      {needsCode && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reset-email">Email</Label>
            <Input id="reset-email" name="email" type="email" defaultValue={email} autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Code from the email</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
              className="font-mono tracking-[0.3em]"
            />
          </div>
        </>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">New password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      <FormError message={state?.error} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}
