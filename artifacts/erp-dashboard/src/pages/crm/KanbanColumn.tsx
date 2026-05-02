import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { KanbanColumnHeader } from "@/components/crm/KanbanColumnHeader";
import { EntityCard } from "./EntityCard";
import type { KanbanColumnProps } from "./crm-types";

export function KanbanColumn({ stage, entities, entityType, totalValue, onEntityClick, onAddTask, onQuickAdd }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.stageId,
    data: { stageId: stage.stageId },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-80 flex-shrink-0 flex flex-col bg-muted/30 rounded-lg",
        isOver && "ring-2 ring-primary"
      )}
      data-testid={`column-${stage.stageId}`}
    >
      <div className="p-3 border-b border-border">
        <KanbanColumnHeader
          stageName={stage.name}
          stageColor={stage.color || undefined}
          itemCount={entities.length}
          totalValue={totalValue || 0}
          currency={entityType === "deals" ? "UZS" : "EUR"}
          onQuickAdd={onQuickAdd}
        />
      </div>

      <ScrollArea className="flex-1 max-h-[calc(100vh-320px)]">
        <SortableContext
          id={stage.stageId}
          items={(Array.isArray(entities) ? entities : []).map(e => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="p-2 space-y-2">
            {(Array.isArray(entities) ? entities : []).map(entity => (
              <EntityCard
                key={entity.id}
                entity={entity}
                entityType={entityType}
                onClick={onEntityClick}
                onAddTask={onAddTask}
              />
            ))}
            {entities.length === 0 && (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                Bo'sh
              </div>
            )}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
