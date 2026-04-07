import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

interface KpiTileProps {
  label: string;
  value: string;
  delta?: number | null;
  hint?: string;
  invertDelta?: boolean; // for KPIs where lower is better (e.g. negative_share)
}

export function KpiTile({ label, value, delta, hint, invertDelta = false }: KpiTileProps) {
  const isUp = (delta ?? 0) >= 0;
  const isPositive = invertDelta ? !isUp : isUp;
  return (
    <Card className="space-y-3">
      <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {label}
      </div>
      <div className="text-3xl font-semibold tracking-tight">{value}</div>
      {delta !== undefined && delta !== null && (
        <div
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            isPositive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          )}
        >
          {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(delta * 100).toFixed(1)}%
        </div>
      )}
      {hint && <p className="text-xs text-neutral-500 dark:text-neutral-400">{hint}</p>}
    </Card>
  );
}
