import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signIn } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { SetupNotice } from "@/components/setup-notice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser, safeRedirectPath } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const returnTo = safeRedirectPath(typeof next === "string" ? next : undefined);
  if (await getCurrentUser()) redirect(returnTo);

  return (
    <div className="flex flex-col gap-4">
      <SetupNotice />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>Sign in to your OfCourse account.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AuthForm
            action={signIn}
            submitLabel="Sign in"
            next={returnTo}
            initialError={typeof error === "string" ? error : undefined}
            fields={[
              { name: "email", label: "School email", type: "email", autoComplete: "email" },
              { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
            ]}
          />
          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
