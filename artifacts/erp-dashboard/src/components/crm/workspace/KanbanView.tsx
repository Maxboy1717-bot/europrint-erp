import {
  DndContext,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { KanbanColumn } from "@/pages/crm/KanbanColumn";
import { EntityCard } from "@/pages/crm/EntityCard";
import { KanbanViewProps } from "./types";

export function KanbanView({
  stages,
  itemsByStage,
  activeEntity,
  stageValues,
  onItemClick,
  onAddTask,
  onQuickAdd,
  sensors,
  handleDragStart,
  handleDragEnd,
  activeItemId,
  activeItem,
}: KanbanViewProps) {
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full p-4 gap-4 min-w-max">
          {(Array.isArray(stages) ? stages : []).map((stage) => (
            <KanbanColumn
              key={stage.stageId}
              stage={stage}
              entities={itemsByStage[stage.stageId] || []}
              entityType={activeEntity}
              totalValue={stageValues[stage.stageId]}
              onEntityClick={onItemClick}
              onAddTask={onAddTask}
              onQuickAdd={() => onQuickAdd(stage.stageId)}
            />
          ))}
        </div>
      </ScrollArea>
      <DragOverlay>
        {activeItemId && activeItem ? (
          <div className="w-72 shadow-2xl rotate-3 cursor-grabbing opacity-90 transition-transform duration-200">
            <EntityCard
              entity={activeItem}
              entityType={activeEntity}
              isDragging
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
