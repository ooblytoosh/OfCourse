import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { getJoinedCourses } from "@/lib/data/courses";

// "Your courses" list in the left sidebar.
export async function JoinedCourses() {
  const user = await getCurrentUser();
  if (!user) return null;
  const courses = await getJoinedCourses(user.id);
  if (courses.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        Your courses
      </p>
      {courses.map((c) => (
        <Link
          key={c.id}
          href={`/c/${c.slug}`}
          className="truncate rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {c.code}
        </Link>
      ))}
    </div>
  );
}
