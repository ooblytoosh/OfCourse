import type { Metadata } from "next";
import Link from "next/link";

import { signUp } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";
import { SetupNotice } from "@/components/setup-notice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-4">
      <SetupNotice />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Join OfCourse</CardTitle>
          <CardDescription>
            Use your university email to join your school&apos;s course communities.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <AuthForm
            action={signUp}
            submitLabel="Create account"
            fields={[
              { name: "name", label: "Name", type: "text", autoComplete: "name" },
              { name: "email", label: "School email", type: "email", autoComplete: "email" },
              { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
            ]}
          />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
