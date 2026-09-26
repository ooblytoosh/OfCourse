import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="mt-1 font-medium">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
