import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Author } from "@/lib/data/posts";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const COLORS = [
  "bg-sky-100 text-sky-800",
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-800",
  "bg-violet-100 text-violet-800",
  "bg-teal-100 text-teal-800",
];

function colorFor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export function authorName(author: Author | null): string {
  return author?.name || author?.username || "Former student";
}

export function UserAvatar({ author, className }: { author: Author | null; className?: string }) {
  const name = authorName(author);
  return (
    <Avatar className={className}>
      {author?.avatar_url && <AvatarImage src={author.avatar_url} alt="" />}
      <AvatarFallback className={cn("text-[0.7rem] font-medium", colorFor(author?.id ?? name))}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
