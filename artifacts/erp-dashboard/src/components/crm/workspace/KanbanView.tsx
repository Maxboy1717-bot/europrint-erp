/**
 * @module KanbanView
 * @description React UI component.
 */

import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
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
      {/* ── Gorizontal scroll ───────────────────────────────────── */}
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden"
        style={{
          /* Safari smooth scroll */
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(163,177,198,0.40) transparent",
        }}
      >
        <div
          className="flex h-full px-5 py-4 gap-5 min-w-max items-start"
        >
          {(Array.isArray(stages) ? stages : []).map((stage, idx) => (
            <KanbanColumn
              key={stage.stageId}
              stage={stage}
              entities={itemsByStage[stage.stageId] || []}
              entityType={activeEntity}
              totalValue={stageValues[stage.stageId]}
              onEntityClick={onItemClick}
              onAddTask={onAddTask}
              onQuickAdd={() => onQuickAdd(stage.stageId)}
              stageIndex={idx}
              totalStages={stages.length}
            />
          ))}
        </div>
      </div>

      {/* ── Drag overlay: karta sichqoncha ostida ──────────────── */}
      <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
        {activeItemId && activeItem ? (
          <div
            className="w-full sm:w-[270px] cursor-grabbing"
            style={{
              transform: "rotate(3deg) scale(1.03)",
              boxShadow:
                "12px 16px 40px rgba(163,177,198,0.55), -4px -4px 16px rgba(255,255,255,0.60)",
              borderRadius: "16px",
              opacity: 0.92,
            }}
          >
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
