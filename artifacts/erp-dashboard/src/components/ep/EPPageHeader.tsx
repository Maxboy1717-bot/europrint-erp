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
import { useTranslation } from '@/lib/i18n';

interface EPPageHeaderProps {
  /** 20px / semibold page title (Uzbek sentence case). */
  title: React.ReactNode;
  /** Optional 13px muted line below the title. */
  subtitle?: React.ReactNode;
  /** Breadcrumb (e.g. <>{t("dashboardHr")}<b>{t("xodimlar")}</b></>). */
  breadcrumb?: React.ReactNode;
  /** Action buttons (1-3 buttons recommended). */
  actions?: React.ReactNode;
  /** Status pill shown next to the title (e.g. live indicator). */
  status?: React.ReactNode;
  className?: string;
  /** Optional icon rendered alongside title. */
  icon?: React.ReactNode;
  /** Extra children rendered after header (e.g. tabs row). */
  children?: React.ReactNode;
  /** Optional refresh handler (renders refresh button when supplied). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRefresh?: (...args: never[]) => unknown;
  /** Optional create handler (renders create button when supplied). */
  onOpenCreate?: () => void;
  /** Optional create dialog slot rendered after actions. */
  createDialogSlot?: React.ReactNode;
  /** Optional translation map (legacy callers). */
  text?: unknown;
  /** Optional auxiliary boolean flag (legacy callers). */
  modelsLoaded?: boolean;
  /** Optional language code (legacy callers). */
  lang?: string;
  /** Optional language toggle (legacy callers). */
  onToggleLang?: () => void;
  /** Optional test id. */
  "data-testid"?: string;
}

export function EPPageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  status,
  className,
}: EPPageHeaderProps) {
  const { t } = useTranslation("common");
  return (
    <header
      className={cn(
        // min-h-fit: in a constrained flex-column page (h-full), a flex item's
        // automatic min-size is min-content — which compressed this header below
        // its real content height, dropping the subtitle out of the header box so
        // the next sibling (KPI row) overlapped it. fit-content pins the full height.
        "ep-fade-up flex flex-col gap-3 pb-2 sm:pb-4 min-h-fit",
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
