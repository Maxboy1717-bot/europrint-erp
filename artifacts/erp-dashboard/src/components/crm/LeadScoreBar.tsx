/**
 * @module LeadScoreBar
 * @description React UI component.
 */

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LeadScoreBarProps {
  score: number;
  showLabel?: boolean;
  showTier?: boolean;
  size?: "sm" | "md";
}

export function LeadScoreBar({
  score,
  showLabel = true,
  showTier = true,
  size = "md",
}: LeadScoreBarProps) {
  const tier = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";

  const tierConfig = {
    hot: { label: "Issiq", color: "text-[var(--ep-green)]", bg: "bg-green-500" },
    warm: { label: "Iliq", color: "text-[var(--ep-yellow)]", bg: "bg-yellow-500" },
    cold: { label: "Sovuq", color: "text-[var(--ep-red)]", bg: "bg-red-500" },
  };

  const config = tierConfig[tier];

  return (
    <div className={cn("flex items-center gap-2", size === "sm" ? "gap-1.5" : "gap-2")}>
      <div className={cn("flex-1", size === "sm" ? "h-1.5" : "h-2")}>
        <Progress
          value={score}
          className={cn(
            "rounded-full",
            size === "sm" ? "h-1.5" : "h-2",
            score >= 70 ? "[&>div]:bg-green-500" : score >= 40 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500"
          )}
        />
      </div>
      {showLabel && (
        <span
          className={cn(
            "font-medium tabular-nums",
            config.color,
            size === "sm" ? "text-xs w-8" : "text-sm w-10"
          )}
        >
          {score}/100
        </span>
      )}
      {showTier && (
        <span
          className={cn(
            "px-1.5 py-0.5 rounded-full font-medium",
            config.color,
            "bg-current/10",
            size === "sm" ? "text-[10px]" : "text-xs"
          )}
          style={{ backgroundColor: `color-mix(in srgb, currentColor 10%, transparent)` }}
        >
          {config.label}
        </span>
      )}
    </div>
  );
}
