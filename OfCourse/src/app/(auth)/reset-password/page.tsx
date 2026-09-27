import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/password-reset-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Set a new password" };

// Reached two ways: after asking for a reset code (?email=...), or from the
// reset link in the email, which signs the student in first.
export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { email } = await searchParams;
  const address = typeof email === "string" ? email : "";
  const signedIn = Boolean(await getCurrentUser());
  const needsCode = Boolean(address) || !signedIn;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Set a new password</CardTitle>
        <CardDescription>
          {needsCode
            ? `If ${address || "that account"} exists, we emailed it a code. Enter it with your new password. Check spam if it doesn't show up in a minute.`
            : "Choose a new password for your account."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ResetPasswordForm email={address} needsCode={needsCode} />
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/forgot-password" className="underline-offset-4 hover:text-foreground hover:underline">
            Send a new code
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
