import * as React from "react";
import { Loader2, AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AsyncBoundary — sahifaning 4 holatini birga boshqaradi:
 *   1. loading  → Spinner
 *   2. error    → Xato + Retry tugma
 *   3. empty    → Bo'sh holat (data null/[]/{})
 *   4. data     → children render
 *
 * Foydalanish:
 *   const { data, isLoading, isError, error, refetch } = useQuery(...);
 *   return (
 *     <AsyncBoundary
 *       isLoading={isLoading}
 *       isError={isError}
 *       error={error}
 *       isEmpty={!data || (Array.isArray(data) && data.length === 0)}
 *       onRetry={refetch}
 *     >
 *       {data && <YourContent data={data} />}
 *     </AsyncBoundary>
 *   );
 *
 * Audit #09: Sahifada 4 holat birga bo'lishi shart.
 */
export interface AsyncBoundaryProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  error?: unknown;
  onRetry?: () => void;
  children: React.ReactNode;

  /** Loading holatida ko'rsatiladigan custom UI (default: Spinner) */
  loadingFallback?: React.ReactNode;
  /** Empty holatida ko'rsatiladigan matn */
  emptyText?: string;
  /** Empty holatida ko'rsatiladigan custom UI */
  emptyFallback?: React.ReactNode;
  /** Xato holatida ko'rsatiladigan matn */
  errorText?: string;
  /** Spinner uchun min-height (loading paytida) */
  minHeight?: string;
}

function getErrorMessage(error: unknown): string {
  if (!error) return "Noma'lum xatolik";
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (typeof error === "object" && error !== null) {
    const e = error as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
  }
  return "Noma'lum xatolik";
}

export function AsyncBoundary({
  isLoading,
  isError,
  isEmpty,
  error,
  onRetry,
  children,
  loadingFallback,
  emptyText = "Hozircha ma'lumot yo'q",
  emptyFallback,
  errorText,
  minHeight = "200px",
}: AsyncBoundaryProps) {
  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;
    return (
      <div
        className="flex items-center justify-center w-full"
        style={{ minHeight }}
        data-testid="async-loading"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center w-full gap-3 text-center"
        style={{ minHeight }}
        data-testid="async-error"
      >
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-sm text-on-surface-variant max-w-md">
          {errorText ?? getErrorMessage(error)}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            Qayta urinish
          </Button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    if (emptyFallback) return <>{emptyFallback}</>;
    return (
      <div
        className="flex flex-col items-center justify-center w-full gap-3 text-center"
        style={{ minHeight }}
        data-testid="async-empty"
      >
        <Inbox className="h-10 w-10 text-on-surface-variant" />
        <p className="text-sm text-on-surface-variant">{emptyText}</p>
      </div>
    );
  }

  return <>{children}</>;
}
