import { Check, X } from "lucide-react";
import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { PostComposer } from "@/components/post/post-composer";
import { requireUser } from "@/lib/auth";
import { POST_TYPES, POSTABLE_TYPES, PROHIBITED_CONTENT } from "@/lib/content-policy";
import { getCoursesWithTopics } from "@/lib/data/courses";
import { semesterOptions } from "@/lib/semesters";

export const metadata: Metadata = { title: "New post" };

export default async function NewPostPage({ searchParams }: PageProps<"/new">) {
  const { course: courseSlug } = await searchParams;
  await requireUser(typeof courseSlug === "string" ? `/new?course=${courseSlug}` : "/new");

  const courses = await getCoursesWithTopics();
  const initialCourse = courses.find((c) => c.slug === courseSlug);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div className="flex min-w-0 flex-col gap-6">
        <PageHeader
          title="Create a post"
          description="Share what you learned with the students taking the course after you."
        />
        <PostComposer
          courses={courses}
          semesters={semesterOptions()}
          initialCourseId={initialCourse?.id}
        />
      </div>

      <aside className="flex flex-col gap-4 text-sm lg:pt-2">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-medium">Share your own work</h2>
          <ul className="mt-2 space-y-1.5">
            {POSTABLE_TYPES.map((type) => (
              <li key={type} className="flex gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                {POST_TYPES[type].label}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-medium">Never post</h2>
          <ul className="mt-2 space-y-1.5">
            {PROHIBITED_CONTENT.map((item) => (
              <li key={item} className="flex gap-2">
                <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
