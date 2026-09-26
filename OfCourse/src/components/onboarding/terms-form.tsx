"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { acceptTerms, type TermsState } from "@/lib/actions/onboarding";

export function TermsForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<TermsState, FormData>(acceptTerms, undefined);
  const [agreed, setAgreed] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors has-checked:border-brand has-checked:bg-brand/5">
        <input
          type="checkbox"
          name="agree"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-brand"
        />
        <span>
          I&apos;ve read and agree to the OfCourse terms above, including sharing only my own
          work and following my university&apos;s academic integrity rules.
        </span>
      </label>
      {state?.error && (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-11" disabled={!agreed || pending}>
        {pending ? "Saving…" : "Agree and continue"}
      </Button>
    </form>
  );
}
