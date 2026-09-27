import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Author } from "@/lib/data/posts";
import { initials } from "@/lib/format";

// A stable, friendly color per student (hue from their id).
function hueFor(id: string): number {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return hash % 360;
}

export function authorName(author: Author | null): string {
  return author?.name || author?.username || "Former student";
}

export function UserAvatar({ author, className }: { author: Author | null; className?: string }) {
  const name = authorName(author);
  const hue = hueFor(author?.id ?? name);
  return (
    <Avatar className={className}>
      {author?.avatar_url && <AvatarImage src={author.avatar_url} alt="" />}
      <AvatarFallback
        className="text-[0.7rem] font-semibold text-white"
        style={{
          backgroundImage: `linear-gradient(135deg, oklch(0.64 0.16 ${hue}), oklch(0.54 0.18 ${(hue + 40) % 360}))`,
        }}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
