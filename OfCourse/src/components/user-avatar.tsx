import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Author } from "@/lib/data/posts";
import { initials } from "@/lib/format";

export function authorName(author: Author | null): string {
  return author?.name || author?.username || "Former student";
}

export function UserAvatar({ author, className }: { author: Author | null; className?: string }) {
  const name = authorName(author);
  return (
    <Avatar className={className}>
      {author?.avatar_url && <AvatarImage src={author.avatar_url} alt="" />}
      <AvatarFallback className="bg-muted text-[0.7rem] font-medium text-foreground/80 ring-1 ring-border ring-inset">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
