/**
 * @module page-state
 * @description React UI component.
 */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import {
  TableSkeleton,
  CardSkeleton,
  DashboardSkeleton,
  FormSkeleton,
  ListSkeleton,
} from "@/components/ui/loading-skeleton";

/**
 * PageState — sahifa holatini boshqaradigan universal wrapper.
 *
 * 4 ta holatni avtomatik aniqlaydi:
 *   1) loading  → tegishli skeleton ko'rsatadi
 *   2) error    → ErrorState (retry bilan)
 *   3) empty    → EmptyState (icon + action bilan)
 *   4) ready    → children render qiladi
 *
 * Misol:
 * ```tsx
 * const { data, isLoading, isError, refetch } = useQuery(...);
 *
 * <PageState
 *   isLoading={isLoading}
 *   isError={isError}
 *   isEmpty={!data || data.length === 0}
 *   onRetry={refetch}
 *   skeleton="table"
 *   emptyTitle="Buyurtmalar topilmadi"
 *   emptyDescription="Hozircha bironta buyurtma yaratilmagan."
 * >
 *   {data.map(item => <OrderCard key={item.id} order={item} />)}
 * </PageState>
 * ```
 */
export interface PageStateProps {
  /** React Query yoki shu kabi hookdan kelgan loading flag */
  isLoading?: boolean;

  /** Xato holati */
  isError?: boolean;

  /** Bo'sh natija (data.length === 0 yoki data === null) */
  isEmpty?: boolean;

  /** Retry callback (xato yuz berganda "Qayta yuklash" tugmasi uchun) */
  onRetry?: () => void;

  /** Skeleton turi — kontentga mos keladigan turini tanlang */
  skeleton?: "table" | "card" | "dashboard" | "form" | "list" | "custom";

  /** Custom skeleton (skeleton="custom" bo'lsa) */
  customSkeleton?: ReactNode;

  /** Skeleton uchun jadval qatorlar/ustunlar soni */
  skeletonRows?: number;
  skeletonColumns?: number;

  /** Xato sarlavhasi va matni (default — "Xatolik yuz berdi") */
  errorTitle?: string;
  errorMessage?: string;

  /** Bo'sh holat icon, sarlavha, matn va action */
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };

  /** Asosiy kontent — loading/error/empty bo'lmaganda render qilinadi */
  children: ReactNode;
}

export function PageState({
  isLoading = false,
  isError = false,
  isEmpty = false,
  onRetry,
  skeleton = "table",
  customSkeleton,
  skeletonRows = 5,
  skeletonColumns = 4,
  errorTitle,
  errorMessage,
  emptyIcon = Inbox,
  emptyTitle = "Ma'lumot topilmadi",
  emptyDescription = "Hozircha bu yerda ko'rsatish uchun ma'lumot yo'q.",
  emptyAction,
  children,
}: PageStateProps) {
  // 1) LOADING — eng yuqori ustuvorlik
  if (isLoading) {
    if (skeleton === "custom" && customSkeleton) {
      return <>{customSkeleton}</>;
    }
    return <SkeletonByType skeleton={skeleton} rows={skeletonRows} columns={skeletonColumns} />;
  }

  // 2) ERROR — loading tugagandan keyin
  if (isError) {
    return <ErrorState title={errorTitle} message={errorMessage} onRetry={onRetry} />;
  }

  // 3) EMPTY — error yo'q, lekin data bo'sh
  if (isEmpty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  // 4) READY — hammasi yaxshi, kontentni ko'rsatamiz
  return <>{children}</>;
}

/* -------------------------------------------------------------------------- */
/*  Helper: skeleton turini tanlovchi ichki komponent                         */
/* -------------------------------------------------------------------------- */

interface SkeletonByTypeProps {
  skeleton: PageStateProps["skeleton"];
  rows: number;
  columns: number;
}

function SkeletonByType({ skeleton, rows, columns }: SkeletonByTypeProps) {
  switch (skeleton) {
    case "table":
      return <TableSkeleton rows={rows} columns={columns} />;
    case "card":
      return <CardSkeleton />;
    case "dashboard":
      return <DashboardSkeleton />;
    case "form":
      return <FormSkeleton />;
    case "list":
      return <ListSkeleton />;
    default:
      return <TableSkeleton rows={rows} columns={columns} />;
  }
}
