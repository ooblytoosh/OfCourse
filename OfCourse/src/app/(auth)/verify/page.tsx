import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import type { CodeMode } from "@/app/(auth)/actions";
import { CodeForm } from "@/components/auth/code-form";

export const metadata: Metadata = { title: "Verify your email" };

const MODES: CodeMode[] = ["signup", "email", "email_change"];

// Step 2 of sign-up: enter the code emailed to your university address.
export default async function VerifyPage({ searchParams }: PageProps<"/verify">) {
  const { email, mode, next, code } = await searchParams;
  // Links in the emails point here with the code filled in. Nothing happens
  // until the student presses Verify, so mail scanners that open links can't
  // use up the code.
  const prefilled = typeof code === "string" && /^\d{6,10}$/.test(code) ? code : "";
  const address = typeof email === "string" ? email : "";
  const codeMode = MODES.includes(mode as CodeMode) ? (mode as CodeMode) : "signup";

  return (
    <div className="flex flex-col gap-6 surface p-6 sm:p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-brand/10 text-brand">
          <MailCheck className="size-6" aria-hidden />
        </span>
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-muted-foreground">
          We sent an email to{" "}
          <span className="font-medium text-foreground">{address || "your university address"}</span>.{" "}
          {prefilled
            ? "Your code is filled in below. Press Verify to finish."
            : "Type the code from that email below, or click the link in it."}
        </p>
        <p className="text-xs text-muted-foreground">
          Open the link in this browser. It can take a minute to arrive, so check spam too.
        </p>
      </div>
      {address ? (
        <CodeForm
          email={address}
          mode={codeMode}
          next={typeof next === "string" ? next : "/welcome"}
          defaultCode={prefilled}
        />
      ) : (
        <p className="text-center text-sm">
          <Link href="/signup" className="font-medium underline-offset-4 hover:underline">
            Start from sign up
          </Link>
        </p>
      )}
      <p className="text-center text-xs text-muted-foreground">
        Wrong address?{" "}
        <Link href="/signup" className="underline-offset-4 hover:underline">
          Sign up again
        </Link>
      </p>
    </div>
  );
}
