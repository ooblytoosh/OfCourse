import { Bookmark } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { PostCard } from "@/components/post/post-card";
import { requireUser } from "@/lib/auth";
import { getSavedPosts } from "@/lib/data/posts";

export const metadata: Metadata = { title: "Saved" };

export default async function SavedPage() {
  const user = await requireUser("/saved");
  const posts = await getSavedPosts(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Saved" description="Posts you've bookmarked, newest first." />
      {posts.length > 0 ? (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} signedIn showCourse />
          ))}
        </div>
      ) : (
        <EmptyState icon={Bookmark} title="Nothing saved yet">
          Tap <span className="font-medium text-foreground">Save</span> on any post to keep it here.{" "}
          <Link href="/courses" className="font-medium text-foreground underline-offset-4 hover:underline">
            Browse courses
          </Link>
        </EmptyState>
      )}
    </div>
  );
}
