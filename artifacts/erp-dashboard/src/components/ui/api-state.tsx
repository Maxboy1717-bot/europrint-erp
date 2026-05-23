/**
 * @module api-state
 * @description React UI component.
 */

import { PageLoader } from "@/components/PageLoader";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/EmptyState";
import { tLabel } from '@/lib/i18n/tLabel';

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
  emptyMessage,
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
  const _emptyMessage = emptyMessage ?? tLabel("common.api-state.tsx.malumotTopilmadi", "Ma'lumot topilmadi");
  if (isEmpty) return <EmptyState title={_emptyMessage} />;
  return <>{children}</>;
}
