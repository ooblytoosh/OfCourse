import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { ProfileForm } from "@/components/profile/profile-form";
import { VerificationForm } from "@/components/profile/verification-form";
import { VerifiedBadge } from "@/components/verified-badge";
import { requireUser } from "@/lib/auth";
import { emailMatchesDomain, getProfile, getUniversities } from "@/lib/data/profiles";
import { profileHref } from "@/lib/links";
import { gradYearOptions } from "@/lib/profile-rules";

export const metadata: Metadata = { title: "Settings" };

function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="surface scroll-mt-20 p-5 sm:p-6">
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default async function SettingsPage({ searchParams }: PageProps<"/settings">) {
  const user = await requireUser("/settings");
  const { welcome } = await searchParams;
  const [profile, universities] = await Promise.all([getProfile(user.id), getUniversities()]);
  const email = user.email ?? "";
  const suggested = universities.find((u) => emailMatchesDomain(email, u.domain));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Settings" description="Your public profile and university verification." />

      {welcome && (
        <p className="rounded-xl border bg-muted/50 p-4 text-sm">
          Welcome to OfCourse! One last step: verify your university email below.
        </p>
      )}

      <Section
        id="verification"
        title="University verification"
        description="Verified students show a badge on their posts and profile. It confirms you control an email address at your university. It doesn't share your email."
      >
        {profile?.university ? (
          <div className="flex flex-col gap-2">
            <VerifiedBadge
              university={profile.university.shortName}
              domain={profile.university.domain}
              size="lg"
              className="w-fit"
            />
            <p className="text-sm text-muted-foreground">
              Verified with {email}. Only you can see this address.
            </p>
          </div>
        ) : (
          <VerificationForm
            universities={universities}
            accountEmail={email}
            suggestedUniversityId={suggested?.id}
          />
        )}
      </Section>

      <Section title="Profile" description="Shown on your public profile and next to your posts.">
        {profile && (
          <>
            <AvatarUploader
              author={{
                id: profile.id,
                name: profile.name,
                username: profile.username,
                avatar_url: profile.avatarUrl,
                verified: profile.verified,
                university: null,
                lumens: profile.lumens,
              }}
            />
            <div className="my-5 border-t" />
            <ProfileForm
              gradYears={gradYearOptions()}
              initial={{
                name: profile.name ?? "",
                username: profile.username ?? "",
                major: profile.major ?? "",
                gradYear: profile.gradYear ? String(profile.gradYear) : "",
                bio: profile.bio ?? "",
              }}
            />
            <Link
              href={profileHref(profile)}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              View your profile
              <ExternalLink className="size-3.5" />
            </Link>
          </>
        )}
      </Section>

      <Section title="Account">
        <p className="text-sm">
          Signed in as <span className="font-medium">{email}</span>. To log out, use{" "}
          <Link href="/profile" className="font-medium underline-offset-4 hover:underline">
            your profile
          </Link>
          .
        </p>
      </Section>
    </div>
  );
}
