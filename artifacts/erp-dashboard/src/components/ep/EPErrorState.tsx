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
import { useTranslation } from '@/lib/i18n';

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
  /** Raw error object — shown as a diagnostic detail line below the description. */
  error?: unknown;
  /** Failed URL — shown so the user knows WHICH endpoint failed. */
  url?: string;
  className?: string;
}

/** Translate raw error to a user-friendly title + description in Uzbek. */
function describeError(error: unknown): { title: string; description: string; severity: 'error' | 'warning' } {
  if (!error) {
    return {
      title: "Ma'lumotlarni yuklashda xatolik",
      description: "Server javob bermayapti yoki internet aloqasi yo'q.",
      severity: 'error',
    };
  }
  const err = error as { status?: number; message?: string; name?: string };
  const status = err.status;
  const msg = err.message || String(error);

  if (status === 401) return {
    title: "Avtorizatsiya kerak",
    description: "Sessiya muddati tugagan. Qaytadan kiring.",
    severity: 'warning',
  };
  if (status === 403) return {
    title: "Ruxsat yo'q",
    description: "Bu sahifani ko'rish uchun ruxsatingiz yo'q.",
    severity: 'warning',
  };
  if (status === 404) return {
    title: "Topilmadi (404)",
    description: "Bu endpoint backend'da yo'q yoki yo'q qilingan. Sahifa hali tayyor emas.",
    severity: 'warning',
  };
  if (status === 501) return {
    title: "Tez orada tayyor bo'ladi",
    description: "Bu funksiya hali ishga tushirilmagan — backend stub javob qaytaryapti. Yaqin orada to'liq ishlaydi.",
    severity: 'warning',
  };
  if (status === 500 || status === 502 || status === 503) return {
    title: `Server xatosi (${status})`,
    description: msg.length > 200 ? msg.slice(0, 200) + '…' : msg,
    severity: 'error',
  };
  if (err.name === 'TypeError' && /fetch|network/i.test(msg)) return {
    title: "Tarmoq xatosi",
    description: "Backend ishlamayapti yoki kompyuter internet bilan ulanmagan.",
    severity: 'error',
  };
  return {
    title: "Ma'lumotlarni yuklashda xatolik",
    description: msg.length > 200 ? msg.slice(0, 200) + '…' : msg,
    severity: 'error',
  };
}

export function EPErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  variant = "card",
  severity,
  error,
  url,
  className,
}: EPErrorStateProps) {
  const { t } = useTranslation("common");
  // If error is provided, derive a smart title/description/severity from it.
  const derived = error ? describeError(error) : null;
  const resolvedSeverity = severity ?? derived?.severity ?? 'error';
  const resolvedTitle = title ?? derived?.title ?? t("malumotlarniYuklashdaXatolik");
  const resolvedDescription = description ?? derived?.description ?? t("serverJavobBermayaptiYokiInternet");
  const resolvedRetryLabel = retryLabel ?? t("qaytaUrinibKorish");
  const palette =
    resolvedSeverity === "warning"
      ? { soft: "var(--ep-yellow-soft)", solid: "var(--ep-yellow)" }
      : { soft: "var(--ep-red-soft)",    solid: "var(--ep-red)"    };

  // Diagnostic detail: status + URL on a small line under the description.
  const errAny = error as { status?: number } | null;
  const diagnostic = error || url ? (
    <p className="text-[11px] text-muted-foreground/70 font-mono mt-1 break-all">
      {errAny?.status ? `${errAny.status} · ` : ''}{url || ''}
    </p>
  ) : null;

  const body = (
    <div className="flex flex-col items-center text-center gap-3">
      <div
        className="h-12 w-12 rounded-full flex items-center justify-center ep-scale-in"
        style={{ background: palette.soft }}
      >
        <AlertCircle className="h-6 w-6" style={{ color: palette.solid }} />
      </div>
      <div className="space-y-1">
        <h3 className="text-[14px] font-semibold">{resolvedTitle}</h3>
        <p className="text-[13px] text-muted-foreground max-w-[420px]">
          {resolvedDescription}
        </p>
        {diagnostic}
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-1 gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {resolvedRetryLabel}
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
