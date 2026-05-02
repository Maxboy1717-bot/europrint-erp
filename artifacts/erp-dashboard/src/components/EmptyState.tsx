/**
 * EmptyState + Skeleton komponentlari — dizayn-new integration
 * Eski API bilan backward-compatible: title, description, actionLabel, onAction, icon, image
 * Yangi API: variant, action, className, size
 */
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  EmptyState as EmptyStateNew,
  TableSkeleton,
  CardSkeleton,
  StatsGridSkeleton,
  PageSkeleton,
} from "./dizayn-new/EmptyState";

export { TableSkeleton, CardSkeleton, StatsGridSkeleton, PageSkeleton };
export type { } from "./dizayn-new/EmptyState";

// Eski va yangi API birlashtirilgan
interface EmptyStateProps {
  // ─── Eski API (backward-compatible) ───
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  image?: string;
  // ─── Yangi API ───
  variant?: "default" | "search" | "employees" | "documents" | "error" | "offline" | "empty-box";
  action?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  action,
  variant = "default",
  className,
  size = "md",
}: EmptyStateProps) {
  const resolvedAction = action ?? (
    actionLabel && onAction ? (
      <Button onClick={onAction} data-testid="button-empty-state-action">
        <Plus className="w-4 h-4 mr-2" />
        {actionLabel}
      </Button>
    ) : undefined
  );

  return (
    <EmptyStateNew
      variant={variant}
      icon={icon}
      title={title}
      description={description}
      action={resolvedAction}
      className={className}
      size={size}
    />
  );
}

export default EmptyState;
