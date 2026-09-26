import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignupForm } from "@/components/auth/signup-form";
import { SetupNotice } from "@/components/setup-notice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { getUniversities } from "@/lib/data/profiles";
import { gradYearOptions } from "@/lib/profile-rules";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/profile");
  const universities = isSupabaseConfigured() ? await getUniversities() : [];

  return (
    <div className="flex flex-col gap-4">
      <SetupNotice />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Join OfCourse</CardTitle>
          <CardDescription>
            Sign up with your university email to join your school&apos;s courses as a verified
            student.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SignupForm universities={universities} gradYears={gradYearOptions()} />
          <p className="text-center text-xs text-muted-foreground">
            Next, you&apos;ll confirm your email with a code and review the{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
              OfCourse terms
            </Link>
            .
          </p>
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
