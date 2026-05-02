import type { ReactNode, ComponentType } from "react";
import { cn } from "@/lib/utils";

interface BlueCTACardProps {
  title: string;
  description?: string;
  badge?: string;
  children?: ReactNode;
  className?: string;
  icon?: ComponentType<{ className?: string }>;
  value?: string | number;
  valueLabel?: string;
}

export function BlueCTACard({
  title,
  description,
  badge,
  children,
  className,
  icon: Icon,
  value,
  valueLabel,
}: BlueCTACardProps) {
  return (
    <div className={cn(
      "rounded-2xl bg-blue-700 dark:bg-blue-800 text-white p-6",
      "shadow-[0_4px_20px_rgba(29,78,216,0.25)] dark:shadow-[0_4px_20px_rgba(29,78,216,0.15)]",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="w-7 h-7 rounded-lg bg-surface-container-lowest/15 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-white" />
            </div>
          )}
          <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
            {title}
          </p>
        </div>
        {badge && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-surface-container-lowest/15 text-white">
            {badge}
          </span>
        )}
      </div>
      {value !== undefined && (
        <div className="mb-3">
          <p className="text-4xl font-black text-white leading-none">{value}</p>
          {valueLabel && (
            <p className="text-xs text-blue-200 mt-1 font-semibold uppercase tracking-wide">{valueLabel}</p>
          )}
        </div>
      )}
      {description && (
        <p className="text-sm text-blue-100 mb-4 leading-relaxed">{description}</p>
      )}
      {children}
    </div>
  );
}
