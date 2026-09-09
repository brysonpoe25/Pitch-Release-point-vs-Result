import { Badge } from "@/components/ui/badge";
import { OUTCOME_COLORS } from "@/lib/outcomes";
import { cn } from "@/lib/utils";
import type { Outcome } from "@/lib/types";

export function OutcomeBadge({
  outcome,
  className,
}: {
  outcome: Outcome | string;
  className?: string;
}) {
  const color = OUTCOME_COLORS[outcome as Outcome] ?? OUTCOME_COLORS.Other;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 border-transparent bg-secondary font-normal", className)}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      {outcome}
    </Badge>
  );
}
