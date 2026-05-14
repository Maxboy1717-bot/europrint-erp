/**
 * @module api-state
 * @description React UI component.
 */

import { PageLoader } from "@/components/PageLoader";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/EmptyState";

interface ApiStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onRetry?: () => void;
  children: React.ReactNode;
  loadingText?: string;
}

export function ApiState({
  isLoading,
  isError,
  error,
  isEmpty = false,
  emptyMessage = "Ma'lumot topilmadi",
  onRetry,
  children,
}: ApiStateProps) {
  if (isLoading) return <PageLoader />;
  if (isError)
    return (
      <ErrorState
        message={error?.message ?? "Xatolik yuz berdi"}
        onRetry={onRetry}
      />
    );
  if (isEmpty) return <EmptyState title={emptyMessage} />;
  return <>{children}</>;
}
