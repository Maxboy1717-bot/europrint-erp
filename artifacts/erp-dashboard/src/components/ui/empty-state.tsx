/**
 * @module ui/empty-state
 * @description Thin adapter over canonical EmptyState.
 * Canonical source: components/EmptyState.tsx  →  components/dizayn-new/EmptyState.tsx
 *
 * Keeps the old `action: { label, onClick }` API and icon-as-component API
 * that existing consumers (BOMManagement, CapacityPlanningSections,
 * CapacityPlanningTabs, ProgramsTabTable, AllExams, HRMap) use.
 */
import { Button } from "@/components/ui/button";
import { Plus, type LucideIcon } from "lucide-react";
import { EmptyState as CanonicalEmptyState } from "@/components/EmptyState";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  const iconNode = <Icon className="w-7 h-7" />;

  const actionNode = action ? (
    <Button onClick={action.onClick} data-testid="button-empty-state-action">
      <Plus className="w-4 h-4 mr-2" />
      {action.label}
    </Button>
  ) : undefined;

  return (
    <CanonicalEmptyState
      icon={iconNode}
      title={title}
      description={description}
      action={actionNode}
    />
  );
}
