/**
 * @module EPNumberedSection
 * @description Canonical EuroPrint numbered section/step header.
 *   Used in multi-step forms, wizards, and structured content pages.
 *
 *   Usage:
 *     <EPNumberedSection step={1} title={t("productType")} status="success" statusLabel={t("selected")}>
 *       <p>Section content here</p>
 *     </EPNumberedSection>
 *
 *   The step circle is orange (primary) when active, muted when inactive.
 *   Children are indented (ml-10) to align with the title text.
 */

import * as React from "react";
import { EPStatusPill, type EPStatusTone } from "./EPStatusPill";
import { cn } from "@/lib/utils";

interface EPNumberedSectionProps {
  /** Step number displayed in the circle. */
  step: number;
  /** Section heading text. */
  title: React.ReactNode;
  /** Optional status tone for the status pill next to the title. */
  status?: EPStatusTone;
  /** Optional label text for the status pill. */
  statusLabel?: string;
  /**
   * Whether this step is the currently active step.
   * Active steps show an orange circle; inactive steps show a muted circle.
   * @default false
   */
  active?: boolean;
  className?: string;
  /** Optional content rendered below the header, indented to align with title. */
  children?: React.ReactNode;
}

export function EPNumberedSection({
  step,
  title,
  status,
  statusLabel,
  active = false,
  className,
  children,
}: EPNumberedSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className={cn(
            "h-7 w-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0 select-none transition-colors",
            active
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {step}
        </span>
        <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
        {status && (
          <EPStatusPill tone={status} size="sm">
            {statusLabel}
          </EPStatusPill>
        )}
      </div>
      {children && (
        <div className="ml-10">{children}</div>
      )}
    </div>
  );
}
