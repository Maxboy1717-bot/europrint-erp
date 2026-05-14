/**
 * @module EPErrorState
 * @description Canonical EuroPrint error UI — replaces the bare
 *   "Ma'lumotlarni yuklashda xatolik. Qayta urinib ko'ring." text that
 *   used to appear unstyled across the dashboard. Anatomy:
 *
 *     ┌─────────────────────────────────────────┐
 *     │              ┌─────┐                    │
 *     │              │  !  │  (red soft tile)   │
 *     │              └─────┘                    │
 *     │   Ma'lumotlarni yuklashda xatolik       │
 *     │   Server javob bermayapti. Iltimos,     │
 *     │   internet aloqasini tekshiring.        │
 *     │                                         │
 *     │      [   Qayta urinib ko'rish   ]       │
 *     │                                         │
 *     └─────────────────────────────────────────┘
 *
 *   - 48px round red-soft tile + AlertCircle icon
 *   - 14px / 600 title
 *   - 13px muted description
 *   - Outlined retry button with refresh icon
 *
 *   Use `variant="card"` (default) to wrap the error in an EP card frame;
 *   use `variant="inline"` for an unwrapped block (e.g. inside a table cell).
 */

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EPCard } from "./EPCard";
import { cn } from "@/lib/utils";

interface EPErrorStateProps {
  /** Title — 14px semibold. Default: "Ma'lumotlarni yuklashda xatolik". */
  title?: React.ReactNode;
  /** Description — 13px muted. */
  description?: React.ReactNode;
  /** Retry handler — if omitted, the button is hidden. */
  onRetry?: () => void;
  /** Retry button label. Default: "Qayta urinib ko'rish". */
  retryLabel?: string;
  /** Show the error frame inside a card (default) or as a plain block. */
  variant?: "card" | "inline";
  /** Visual error severity — affects icon tint. */
  severity?: "error" | "warning";
  className?: string;
}

export function EPErrorState({
  title = "Ma'lumotlarni yuklashda xatolik",
  description = "Server javob bermayapti yoki internet aloqasi yo'q. Iltimos, qaytadan urinib ko'ring.",
  onRetry,
  retryLabel = "Qayta urinib ko'rish",
  variant = "card",
  severity = "error",
  className,
}: EPErrorStateProps) {
  const palette =
    severity === "warning"
      ? { soft: "var(--ep-yellow-soft)", solid: "var(--ep-yellow)" }
      : { soft: "var(--ep-red-soft)",    solid: "var(--ep-red)"    };

  const body = (
    <div className="flex flex-col items-center text-center gap-3">
      <div
        className="h-12 w-12 rounded-full flex items-center justify-center ep-scale-in"
        style={{ background: palette.soft }}
      >
        <AlertCircle className="h-6 w-6" style={{ color: palette.solid }} />
      </div>
      <div className="space-y-1">
        <h3 className="text-[14px] font-semibold">{title}</h3>
        <p className="text-[13px] text-muted-foreground max-w-[420px]">
          {description}
        </p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-1 gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {retryLabel}
        </Button>
      )}
    </div>
  );

  if (variant === "inline") {
    return <div className={cn("py-8", className)}>{body}</div>;
  }

  return (
    <EPCard className={cn("py-10", className)} padding={32}>
      {body}
    </EPCard>
  );
}
