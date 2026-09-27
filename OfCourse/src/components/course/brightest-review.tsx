import Link from "next/link";

import { BulbIcon } from "@/components/bulb/bulb-icon";
import { PostMeta } from "@/components/post/post-meta";
import { BULB_LEVELS, bulbSummary } from "@/lib/bulb";
import type { PostSummary } from "@/lib/data/posts";
import { preview } from "@/lib/format";

// The single most helpful review of the course, glowing at the top of its page.
export function BrightestReview({ post }: { post: PostSummary }) {
  return (
    <section aria-labelledby="brightest-heading" className="rounded-2xl bg-brand-gradient p-px shadow-[0_20px_50px_-30px_var(--brand)]">
      <div className="relative overflow-hidden rounded-[calc(1rem-1px)] bg-card p-5 sm:p-6">
        <div aria-hidden className="pointer-events-none absolute -top-16 -left-10 size-56 rounded-full bg-[radial-gradient(circle,var(--glow-1),transparent_70%)]" />
        <div className="relative flex gap-4">
          <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
            <BulbIcon level={post.bulb.level} size={34} />
            <span className="text-[0.65rem] font-semibold tracking-wide text-brand uppercase">{BULB_LEVELS[post.bulb.level]}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p id="brightest-heading" className="text-xs font-semibold tracking-wide text-brand uppercase">
              Brightest review
            </p>
            <h2 className="mt-1 text-lg leading-snug font-semibold">
              <Link href={`/c/${post.course.slug}/posts/${post.id}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <div className="mt-1.5">
              <PostMeta author={post.author} semester={post.semester} createdAt={post.createdAt} />
            </div>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{preview(post.content, 320)}</p>
            <p className="mt-2 text-xs text-muted-foreground">{bulbSummary(post.bulb.lit, post.bulb.off, post.bulb.level)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
