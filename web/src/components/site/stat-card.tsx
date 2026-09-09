import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sublabel,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sublabel?: string;
  className?: string;
}) {
  return (
    <Card className={cn("gap-1 py-4", className)}>
      <CardContent className="flex flex-col gap-1">
        <span className="text-2xl font-bold tabular-nums tracking-tight sm:text-3xl">
          {value}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {sublabel && (
          <span className="text-xs text-muted-foreground/80">{sublabel}</span>
        )}
      </CardContent>
    </Card>
  );
}
