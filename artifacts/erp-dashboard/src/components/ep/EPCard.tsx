/**
 * @module EPCard
 * @description Canonical EuroPrint card — 10px radius, 1px warm border,
 *   white surface, optional interactive hover-lift (translateY(-3px) + soft
 *   tinted shadow + border tint toward primary). Use this everywhere instead
 *   of raw `<div className="rounded-lg border p-6">` so cards stay consistent.
 *
 *   `interactive` adds the hover/lift animation — set this for clickable cards
 *   (KPI tiles, module shortcuts, kanban cards, list items). Omit it for
 *   static dashboard panels (charts, tables, info blocks).
 *
 *   `module` adds a 3px left-border accent in the chosen module's hue.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export type EPModuleColor = "sd" | "pp" | "hr" | "warehouse" | "fi" | "org" | "primary";

interface EPCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Enable hover-lift + icon tile rotation on hover. */
  interactive?: boolean;
  /** Add a 3px colored left-border (module accent). */
  module?: EPModuleColor;
  /** Override the default 18px inner padding. Pass `0` for flush content. */
  padding?: number | string;
  /** Inset shadow on the card (used for emphasised cards). */
  elevated?: boolean;
}

const moduleVar: Record<EPModuleColor, string> = {
  sd:        "var(--mod-sd)",
  pp:        "var(--mod-pp)",
  hr:        "var(--mod-hr)",
  warehouse: "var(--mod-warehouse)",
  fi:        "var(--mod-fi)",
  org:       "var(--mod-org)",
  primary:   "var(--ep-primary)",
};

export const EPCard = React.forwardRef<HTMLDivElement, EPCardProps>(
  ({ interactive, module, padding = 18, elevated, className, style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "ep-card",
          interactive && "ep-card-interactive cursor-pointer",
          className,
        )}
        style={{
          padding,
          boxShadow: elevated ? "var(--sh-md)" : undefined,
          borderLeftWidth: module ? 3 : undefined,
          borderLeftColor: module ? moduleVar[module] : undefined,
          ...style,
        }}
        {...props}
      />
    );
  },
);
EPCard.displayName = "EPCard";
