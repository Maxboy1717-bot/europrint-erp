/**
 * @module EPPageHeader
 * @description Canonical EuroPrint page header — sits at the top of every
 *   ERP page (above the KPI row).
 *
 *   Desktop anatomy:
 *
 *     ┌────────────────────────────────────────────────────────────┐
 *     │ Dashboard · HR · Xodimlar              [Eksport] [+ Yangi] │
 *     │                                                            │
 *     │ Xodimlar                                                   │
 *     │ 412 ta xodim, 8 ta bo'lim                                  │
 *     └────────────────────────────────────────────────────────────┘
 *
 *   Mobile anatomy (<640px) — breadcrumb, title, then actions stack vertically
 *   and actions become full-width side-by-side buttons:
 *
 *     ┌────────────────────────────────┐
 *     │ Dashboard · HR · Xodimlar      │
 *     │                                │
 *     │ Xodimlar                       │
 *     │ 412 ta xodim, 8 ta bo'lim      │
 *     │                                │
 *     │ ┌──────────┐ ┌───────────────┐ │
 *     │ │ Eksport  │ │  + Yangi      │ │
 *     │ └──────────┘ └───────────────┘ │
 *     └────────────────────────────────┘
 *
 *   - Breadcrumb on top-left (12px, muted, separators · or /)
 *   - Action buttons stack below on mobile, on the right on desktop
 *   - 20px page title (semibold)
 *   - Optional 13px muted subtitle
 *
 *   Use Uzbek sentence case throughout. Action button label = verb-first
 *   2-4 words ("Yangi xodim qo'shish", "Hisobotni eksport qilish").
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface EPPageHeaderProps {
  /** 20px / semibold page title (Uzbek sentence case). */
  title: React.ReactNode;
  /** Optional 13px muted line below the title. */
  subtitle?: React.ReactNode;
  /** Breadcrumb (e.g. <>Dashboard · HR · <b>Xodimlar</b></>). */
  breadcrumb?: React.ReactNode;
  /** Action buttons (1-3 buttons recommended). */
  actions?: React.ReactNode;
  /** Status pill shown next to the title (e.g. live indicator). */
  status?: React.ReactNode;
  className?: string;
}

export function EPPageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  status,
  className,
}: EPPageHeaderProps) {
  return (
    <header
      className={cn(
        "ep-fade-up flex flex-col gap-3 pb-2 sm:pb-4",
        className,
      )}
    >
      {breadcrumb && (
        <nav className="text-[12px] text-muted-foreground flex items-center flex-wrap gap-x-1.5 min-h-[18px]">
          {breadcrumb}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="ep-h1">{title}</h1>
            {status}
          </div>
          {subtitle && (
            <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap [&>*]:flex-1 sm:[&>*]:flex-none sm:flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}
