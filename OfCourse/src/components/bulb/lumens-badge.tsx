import { BulbIcon } from "@/components/bulb/bulb-icon";
import { cn } from "@/lib/utils";

// "💡 128": a student's Lumens (lightbulb ON votes received).
export function LumensBadge({ lumens, className }: { lumens: number; className?: string }) {
  return (
    <span
      title={`${lumens.toLocaleString("en-US")} Lumens: how much students lit up their posts and comments`}
      className={cn("inline-flex items-center gap-0.5 text-xs font-medium text-brand tabular-nums", className)}
    >
      <BulbIcon level={lumens > 0 ? 4 : 0} size={11} className="text-muted-foreground" />
      {lumens.toLocaleString("en-US")}
      <span className="sr-only"> Lumens</span>
    </span>
  );
}
