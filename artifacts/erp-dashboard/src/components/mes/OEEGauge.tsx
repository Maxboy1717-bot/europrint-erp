/**
 * @module OEEGauge
 * @description React UI component.
 */

import { cn } from "@/lib/utils";

interface OEEGaugeProps {
  value: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export function OEEGauge({
  value,
  size = 120,
  showLabel = true,
  className,
}: OEEGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - clamped / 100);

  const color =
    clamped >= 85 ? "#22c55e" : clamped >= 65 ? "#f59e0b" : "#ef4444";
  const textColor =
    clamped >= 85
      ? "text-[var(--ep-green)]"
      : clamped >= 65
      ? "text-[var(--ep-yellow)]"
      : "text-[var(--ep-red)]";

  const label =
    clamped >= 85 ? "Yaxshi" : clamped >= 65 ? "O'rta" : "Past";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1",
        className
      )}
      style={{ width: size }}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          width={size}
          height={size}
          className="-rotate-90"
        >
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold leading-none", textColor, size > 80 ? "text-2xl" : "text-lg")}>
            {clamped}%
          </span>
          {showLabel && size > 80 && (
            <span className="text-xs text-muted-foreground mt-0.5">OEE</span>
          )}
        </div>
      </div>
      {showLabel && (
        <span className={cn("text-xs font-medium", textColor)}>{label}</span>
      )}
    </div>
  );
}
