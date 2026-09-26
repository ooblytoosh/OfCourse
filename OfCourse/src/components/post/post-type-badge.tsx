import {
  BookOpen,
  Brain,
  Compass,
  Lightbulb,
  Link2,
  MessagesSquare,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";

import { POST_TYPES, type PostType } from "@/lib/content-policy";
import { cn } from "@/lib/utils";

const STYLES: Record<PostType, { icon: LucideIcon; className: string }> = {
  study_guide: { icon: BookOpen, className: "bg-blue-50 text-blue-700 ring-blue-200" },
  explanation: { icon: Brain, className: "bg-violet-50 text-violet-700 ring-violet-200" },
  advice: { icon: Lightbulb, className: "bg-amber-50 text-amber-800 ring-amber-200" },
  note: { icon: NotebookPen, className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  discussion: { icon: MessagesSquare, className: "bg-slate-100 text-slate-700 ring-slate-200" },
  experience: { icon: Compass, className: "bg-rose-50 text-rose-700 ring-rose-200" },
  resource: { icon: Link2, className: "bg-teal-50 text-teal-700 ring-teal-200" },
};

export function PostTypeBadge({ type }: { type: PostType }) {
  const { icon: Icon, className } = STYLES[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase ring-1 ring-inset",
        className,
      )}
    >
      <Icon className="size-3" />
      {POST_TYPES[type].label}
    </span>
  );
}
