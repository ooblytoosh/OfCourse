import { ArrowBigUp, BadgeAlert, Bookmark, MessageSquare, PenLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ButtonLink } from "@/components/button-link";
import { CourseCard } from "@/components/course/course-card";
import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post/post-card";
import { PostTypeBadge } from "@/components/post/post-type-badge";
import { SectionTitle } from "@/components/section-title";
import { UserAvatar } from "@/components/user-avatar";
import { VerifiedBadge } from "@/components/verified-badge";
import { getCurrentUser } from "@/lib/auth";
import { getProfile, getProfileActivity } from "@/lib/data/profiles";
import { formatCount, preview, timeAgo } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/u/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const profile = await getProfile(handle);
  return { title: profile ? (profile.name ?? `@${profile.username}`) : "Student not found" };
}

function Stat({ value, label, href }: { value: number; label: string; href?: string }) {
  const body = (
    <>
      <span className="block text-2xl font-semibold tabular-nums">{value.toLocaleString("en-US")}</span>
      <span className="block text-sm text-muted-foreground">{label}</span>
    </>
  );
  return href ? (
    <Link href={href} className="surface surface-interactive p-4">
      {body}
    </Link>
  ) : (
    <div className="surface p-4">{body}</div>
  );
}


export default async function ProfilePage({ params }: PageProps<"/u/[handle]">) {
  const { handle } = await params;
  const [profile, viewer] = await Promise.all([getProfile(handle), getCurrentUser()]);
  if (!profile) notFound();
  // Prefer /u/<username> once a student has one.
  if (profile.username && handle !== profile.username) redirect(`/u/${profile.username}`);

  const isSelf = viewer?.id === profile.id;
  const activity = await getProfileActivity(profile.id, viewer?.id);
  const featured = [...activity.posts]
    .filter((p) => p.voteScore > 0)
    .sort((a, b) => b.voteScore - a.voteScore)
    .slice(0, 3);
  const displayName = profile.name ?? profile.username ?? "Student";
  const academic = [profile.major, profile.university?.shortName].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col gap-8">
      <header className="surface flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
        <UserAvatar
          author={{ id: profile.id, name: displayName, username: profile.username, avatar_url: profile.avatarUrl, verified: profile.verified, university: null }}
          className="size-20 text-2xl [&_[data-slot=avatar-fallback]]:text-xl"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">{displayName}</h1>
            {profile.university && (
              <VerifiedBadge
                university={profile.university.shortName}
                domain={profile.university.domain}
                size="lg"
              />
            )}
          </div>
          {profile.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
          {(academic || profile.gradYear) && (
            <p className="mt-2 text-sm">
              {academic}
              {academic && profile.gradYear && " · "}
              {profile.gradYear && `Class of ${profile.gradYear}`}
            </p>
          )}
          {profile.bio && <p className="mt-3 max-w-xl text-[0.95rem] italic">“{profile.bio}”</p>}
          <p className="mt-3 text-xs text-muted-foreground">
            Joined{" "}
            {new Date(profile.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        </div>
        {isSelf && (
          <ButtonLink href="/settings" variant="outline" className="shrink-0">
            <PenLine />
            Edit profile
          </ButtonLink>
        )}
      </header>

      {isSelf && !profile.verified && (
        <div className="flex flex-col gap-3 rounded-xl border bg-muted/50 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <BadgeAlert className="mt-0.5 size-4 shrink-0" />
            Verify your university email so classmates know you&apos;re a real student.
          </p>
          <ButtonLink href="/settings#verification" size="sm" className="shrink-0">
            Verify now
          </ButtonLink>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={activity.posts.length + activity.commentCount} label="Contributions" />
        <Stat value={activity.helpfulVotes} label="Upvotes received" />
        <Stat value={activity.commentCount} label="Comments" />
        {activity.savedCount !== null ? (
          <Stat value={activity.savedCount} label="Saved resources" href="/saved" />
        ) : (
          <Stat value={activity.courses.length} label="Courses" />
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-8">
          {featured.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Featured contributions</SectionTitle>
              <ul className="grid gap-3 sm:grid-cols-2">
                {featured.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/c/${post.course.slug}/posts/${post.id}`}
                      className="surface surface-interactive flex h-full flex-col gap-2 p-4"
                    >
                      <PostTypeBadge type={post.type} />
                      <span className="line-clamp-3 font-medium leading-snug">{post.title}</span>
                      <span className="mt-auto flex items-center gap-3 text-sm whitespace-nowrap text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <ArrowBigUp className="size-4" aria-hidden />
                          {post.voteScore} upvotes
                        </span>
                        <span>{post.course.code}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-3">
            <SectionTitle count={activity.posts.length}>Posts</SectionTitle>
            {activity.posts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {activity.posts.map((post) => (
                  <PostCard key={post.id} post={post} signedIn={Boolean(viewer)} showCourse />
                ))}
              </div>
            ) : (
              <EmptyState icon={PenLine} title={isSelf ? "You haven't posted yet" : "No posts yet"}>
                {isSelf ? (
                  <Link href="/new" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Share something with a course
                  </Link>
                ) : (
                  `${displayName} hasn't shared anything yet.`
                )}
              </EmptyState>
            )}
          </section>

          {activity.comments.length > 0 && (
            <section className="flex flex-col gap-3">
              <SectionTitle>Recent comments</SectionTitle>
              <ul className="surface divide-y">
                {activity.comments.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/c/${c.post.course.slug}/posts/${c.post.id}#comments`}
                      className="flex flex-col gap-1 p-4 transition-colors hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MessageSquare className="size-3.5" />
                        on <span className="font-medium text-foreground">{c.post.title}</span>
                        · {c.post.course.code} · {timeAgo(c.createdAt)}
                      </span>
                      <span className="text-sm">{preview(c.content, 200)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-3">
          <SectionTitle>Courses</SectionTitle>
          {activity.courses.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {activity.courses.map((course) => (
                <li key={course.slug}>
                  <CourseCard
                    course={course}
                    meta={[course.semester, formatCount(course.contributions, "contribution")]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No courses yet.</p>
          )}
          {isSelf && activity.savedCount !== null && (
            <Link
              href="/saved"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <Bookmark className="size-4" />
              View your saved resources
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
