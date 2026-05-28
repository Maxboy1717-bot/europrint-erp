/**
 * @module EPComingSoon
 * @description Canonical EuroPrint "coming soon" state for 501 NOT_IMPLEMENTED
 *   endpoints. Shows a Clock icon with a friendly Uzbek label.
 *
 *   Usage: Replace the main content of a page/section when the backend returns
 *   HTTP 501. Use `useNotImplemented(error)` hook to detect the condition.
 *
 *     if (useNotImplemented(error)) return <EPComingSoon />;
 */

import * as React from "react";
import { Clock } from "lucide-react";
import { EPCard } from "./EPCard";
import { cn } from "@/lib/utils";

interface EPComingSoonProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "card" | "inline";
  className?: string;
}

export function EPComingSoon({
  title = "Tez orada",
  description = "Bu bo'lim hali ishlab chiqilmoqda. Yaqin orada ishga tushiriladi.",
  variant = "card",
  className,
}: EPComingSoonProps) {
  const body = (
    <div className="flex flex-col items-center text-center gap-3">
      <div
        className="h-12 w-12 rounded-full flex items-center justify-center"
        style={{ background: "hsl(var(--muted))" }}
      >
        <Clock
          className="h-6 w-6"
          style={{ color: "hsl(var(--muted-foreground))" }}
          strokeWidth={1.75}
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-[14px] font-semibold">{title}</h3>
        {description && (
          <p className="text-[13px] text-muted-foreground max-w-[420px]">
            {description}
          </p>
        )}
      </div>
    </div>
  );

  if (variant === "inline") {
    return <div className={cn("py-10", className)}>{body}</div>;
  }
  return <EPCard className={cn("py-12", className)} padding={32}>{body}</EPCard>;
}
