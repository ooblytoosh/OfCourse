import type { Metadata } from "next";

import { signOut } from "@/app/(auth)/actions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profile"
        description="Your public student profile is coming soon."
        comingSoon
      />
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5">
        <div>
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
