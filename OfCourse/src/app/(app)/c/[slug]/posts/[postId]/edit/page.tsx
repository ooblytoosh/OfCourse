import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { PostComposer } from "@/components/post/post-composer";
import { requireUser } from "@/lib/auth";
import { getCoursesWithTopics } from "@/lib/data/courses";
import { getPost } from "@/lib/data/posts";
import { semesterOptions } from "@/lib/semesters";

export const metadata: Metadata = { title: "Edit post" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditPostPage({
  params,
}: PageProps<"/c/[slug]/posts/[postId]/edit">) {
  const { slug, postId } = await params;
  if (!UUID.test(postId)) notFound();
  const user = await requireUser(`/c/${slug}/posts/${postId}/edit`);

  const post = await getPost(postId, user.id);
  if (!post) notFound();
  const postUrl = `/c/${post.course.slug}/posts/${post.id}`;
  // Only the author can edit; everyone else goes back to the post.
  if (post.author?.id !== user.id) redirect(postUrl);

  const courses = (await getCoursesWithTopics()).filter((c) => c.id === post.course.id);
  // Keep the post's own semester selectable even if it's older than the list.
  const semesters = semesterOptions();
  if (post.semester && !semesters.includes(post.semester)) semesters.push(post.semester);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Edit post" description={`${post.course.code}: ${post.course.name}`} />
      <PostComposer
        courses={courses}
        semesters={semesters}
        initialCourseId={post.course.id}
        editing={{
          postId: post.id,
          values: {
            courseId: post.course.id,
            type: post.type,
            title: post.title,
            content: post.content,
            semester: post.semester ?? "",
            topicIds: post.topics.map((t) => t.id),
            integrity: false,
          },
        }}
      />
    </div>
  );
}
