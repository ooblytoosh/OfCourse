import { Badge } from "@/components/ui/badge";

// Standard page title block, with an optional "coming in Phase N" badge for
// placeholder routes.
export function PageHeader({
  title,
  description,
  comingSoon,
}: {
  title: string;
  description?: string;
  comingSoon?: boolean;
}) {
  return (
    <div className="space-y-2 border-b pb-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {comingSoon && <Badge variant="secondary">Coming soon</Badge>}
      </div>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  );
}
