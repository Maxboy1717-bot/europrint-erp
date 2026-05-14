/**
 * @module EPEmptyState
 * @description Canonical EuroPrint empty state — used in lists, tables, and
 *   detail panels when no data exists yet. Anatomy:
 *
 *     ┌─────────────────────────────────────────┐
 *     │             ┌─────┐                     │
 *     │             │  +  │  (muted tile)       │
 *     │             └─────┘                     │
 *     │     Hali ma'lumot yo'q                  │
 *     │     Birinchi yozuvni qo'shing           │
 *     │                                         │
 *     │      [   Yangi xodim qo'shish   ]       │
 *     └─────────────────────────────────────────┘
 *
 *   - Encouraging tone (not "No data")
 *   - Always offers a next step (action button)
 *   - 48px round muted tile
 *
 *   `action` should be the primary creation CTA — verb-first 2-4 word Uzbek
 *   ("Yangi xodim qo'shish", not "Add new").
 */

import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { EPCard } from "./EPCard";
import { cn } from "@/lib/utils";

interface EPEmptyStateProps {
  /** Lucide icon to show in the 48px round tile (e.g. Users, Building2). */
  icon: LucideIcon;
  /** 14px / 600 title. */
  title: React.ReactNode;
  /** Optional 13px muted description guiding the user. */
  description?: React.ReactNode;
  /** Action node — typically a Button with verb-first label. */
  action?: React.ReactNode;
  variant?: "card" | "inline";
  className?: string;
}

export function EPEmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "card",
  className,
}: EPEmptyStateProps) {
  const body = (
    <div className="flex flex-col items-center text-center gap-3">
      <div
        className="h-12 w-12 rounded-full flex items-center justify-center ep-scale-in"
        style={{ background: "hsl(var(--muted))" }}
      >
        <Icon
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
      {action && <div className="mt-1">{action}</div>}
    </div>
  );

  if (variant === "inline") {
    return <div className={cn("py-10", className)}>{body}</div>;
  }
  return <EPCard className={cn("py-12", className)} padding={32}>{body}</EPCard>;
}
