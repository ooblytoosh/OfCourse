"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import {
  resendEmailCode,
  verifyEmailCode,
  type CodeFormState,
  type CodeMode,
} from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";

const RESEND_SECONDS = 60;

// "Enter the code we emailed you." Used after sign-up and in Settings.
export function CodeForm({ email, mode, next }: { email: string; mode: CodeMode; next: string }) {
  const [state, action, pending] = useActionState<CodeFormState, FormData>(verifyEmailCode, undefined);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const [notice, setNotice] = useState<string | null>(null);
  const [resending, startResend] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  return (
    <div className="flex flex-col gap-4">
      <form key={state?.attempt ?? 0} action={action} className="flex flex-col gap-3">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="mode" value={mode} />
        <input type="hidden" name="next" value={next} />
        <label htmlFor="code" className="text-sm font-medium">
          Verification code
        </label>
        <input
          id="code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9 ]*"
          maxLength={12}
          autoFocus
          placeholder="123456"
          aria-invalid={Boolean(state?.error)}
          className="h-14 rounded-xl border border-input bg-background px-4 text-center font-mono text-2xl tracking-[0.4em] outline-none transition-shadow focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/30 aria-invalid:border-destructive"
        />
        {state?.error && (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        )}
        <Button type="submit" size="lg" className="h-11" disabled={pending}>
          {pending ? "Checking…" : "Verify"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Didn&apos;t get it? Check spam, or{" "}
        <button
          type="button"
          disabled={cooldown > 0 || resending}
          onClick={() =>
            startResend(async () => {
              const result = await resendEmailCode(email, mode);
              setNotice(result.message);
              if (result.ok) setCooldown(RESEND_SECONDS);
            })
          }
          className="font-medium text-foreground underline-offset-4 hover:underline disabled:text-muted-foreground disabled:no-underline"
        >
          {cooldown > 0 ? `send a new code in ${cooldown}s` : resending ? "sending…" : "send a new code"}
        </button>
        .
      </p>
      {notice && (
        <p className="text-center text-sm" role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
