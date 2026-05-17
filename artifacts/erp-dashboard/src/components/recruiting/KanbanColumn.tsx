import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import type { FunnelStage } from "@/components/recruiting/types";
import { getPhaseForStage } from "@/components/recruiting/helpers";

export interface KanbanColumnProps {
  stage: { key: FunnelStage; label: string; accent: string };
  count: number;
  itemIds: number[];
  children: React.ReactNode;
  isLoading?: boolean;
  isEmpty?: boolean;
}

/**
 * A single column in the Kanban board.
 *
 * Uses dnd-kit `useDroppable` so candidates can be dropped anywhere
 * in the column area, plus `SortableContext` so the children act as
 * sortable items (active styling, keyboard reorder).
 *
 * Visual contract matches the original RecruitingKanban column header:
 * accent dot, label, badge with count, optional HC phase tag.
 */
export function KanbanColumn({
  stage,
  count,
  itemIds,
  children,
  isLoading,
  isEmpty,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${stage.key}`,
    data: { type: "column", stage: stage.key },
  });

  const phase = getPhaseForStage(stage.key);

  return (
    <div
      ref={setNodeRef}
      data-testid={`column-stage-${stage.key}`}
      data-stage={stage.key}
      aria-label={stage.label}
      className={`flex flex-col bg-surface-container-low rounded-xl p-4 w-64 shrink-0 min-h-[400px] transition-colors ${
        isOver ? "ring-2 ring-primary/60 bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stage.accent}`} />
          <span className="text-sm font-semibold uppercase tracking-wider text-on-surface-variant">
            {stage.label}
          </span>
        </div>
        <Badge variant="secondary" data-testid={`badge-count-${stage.key}`}>
          {count}
        </Badge>
      </div>
      {phase && (
        <div
          className={`text-[9px] mb-2 px-1.5 py-0.5 rounded ${phase.color}/15 text-muted-foreground font-medium`}
        >
          {phase.num}-bosqich: {phase.label}
        </div>
      )}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        <SortableContext
          items={Array.isArray(itemIds) ? itemIds : []}
          strategy={verticalListSortingStrategy}
        >
          {isLoading && (
            <div className="text-xs text-muted-foreground text-center py-4">
              Yuklanmoqda...
            </div>
          )}
          {children}
          {!isLoading && isEmpty && (
            <div
              data-testid={`column-empty-${stage.key}`}
              className="text-xs text-muted-foreground text-center py-4 opacity-50"
            >
              Bo'sh
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
