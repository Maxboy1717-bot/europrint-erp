import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ResponsiveContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-auto p-4 md:p-6", className)}>
      <div className="max-w-screen-2xl mx-auto">{children}</div>
    </div>
  );
}

interface PageHeaderProps {
  label?: string;
  title: string;
  boldWord?: string;
  subtitle?: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function PageHeader({
  label,
  title,
  boldWord,
  subtitle,
  description,
  icon: _icon,
  actions,
  children,
  className,
  "data-testid": testId,
}: PageHeaderProps) {
  const rightContent = actions ?? children;
  return (
    <div className={cn("flex flex-row items-center justify-between gap-4 mb-8", className)}>
      <div className="flex flex-col gap-1">
        <h1 
          className="text-4xl font-light tracking-tight text-on-surface"
          data-testid={testId}
        >
          {title}
          {boldWord && (
            <span className="font-bold text-primary"> {boldWord}</span>
          )}
        </h1>
        {(subtitle ?? description) && (
          <p className="text-sm text-on-surface-variant">
            {subtitle ?? description}
          </p>
        )}
      </div>
      {rightContent && (
        <div className="flex items-center gap-2 shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  );
}
