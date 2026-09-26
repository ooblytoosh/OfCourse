// Heading for a section within a page, with an optional count or action.
export function SectionTitle({
  children,
  count,
  action,
  id,
}: {
  children: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
  id?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 id={id} className="flex items-center gap-2 text-base font-semibold">
        {children}
        {count !== undefined && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
            {count}
          </span>
        )}
      </h2>
      {action}
    </div>
  );
}
