/**
 * @module KanbanBoardView
 * @description React UI component.
 */

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import { FolderKanban, Plus } from "lucide-react";
import { KanbanColumn } from "@/pages/kanban/KanbanColumn";
import { CardOverlay } from "@/pages/kanban/KanbanCard";
import { KanbanTranslations, KanbanColumn as KanbanColumnType, CardWithOwner } from "@/components/kanban/types";
import { useTranslation } from '@/lib/i18n';

interface KanbanBoardViewProps {
  sensors:              SensorDescriptor<SensorOptions>[];
  handleDragStart:      (event: DragStartEvent) => void;
  handleDragEnd:        (event: DragEndEvent)   => void;
  columns:              KanbanColumnType[];
  cardsByColumn:        Record<string, CardWithOwner[]>;
  setShowEditCard:      (card: CardWithOwner) => void;
  setShowAddColumn:     (show: boolean) => void;
  setShowQuickTask:     (show: boolean) => void;
  setQuickTaskTitle:    (title: string) => void;
  onDeleteColumn:       (columnId: string) => void;
  selectedBoardId:      string | null;
  activeCard:           CardWithOwner | null;
  t:                    KanbanTranslations;
  onQuickAddColumnId?:  (id: string | number | null) => void;
}

export function KanbanBoardView({
  sensors, handleDragStart, handleDragEnd,
  columns, cardsByColumn,
  setShowEditCard, setShowAddColumn, setShowQuickTask, setQuickTaskTitle,
  onDeleteColumn, selectedBoardId, activeCard,
  t, onQuickAddColumnId,
}: KanbanBoardViewProps) {
  const { t } = useTranslation("common");
  const [quickAddColumnId, setQuickAddColumnId] = useState<string | number | null>(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div
        className="flex-1 overflow-x-auto overflow-y-hidden"
        style={{ WebkitOverflowScrolling: "touch", minHeight: 0, height: "100%" }}
      >
        <div className="flex gap-5 h-full" style={{ padding: "4px 8px 24px" }}>
          {columns.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center w-full py-24 gap-4"
              style={{ color: "#A0AEC0" }}
            >
              <FolderKanban style={{ width: 48, height: 48, opacity: 0.4 }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: "#718096" }}>{t("ustunlarYoq")}</p>
              <button
                onClick={() => setShowAddColumn(true)}
                style={{
                  fontSize: 13, fontWeight: 500,
                  padding: "8px 18px", borderRadius: 12,
                  border: "1.5px dashed rgba(163,177,198,0.50)",
                  background: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  color: "#718096",
                  boxShadow: "4px 4px 12px rgba(163,177,198,0.30), -2px -2px 8px rgba(255,255,255,0.80)",
                  transition: "box-shadow 0.18s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "5px 5px 14px rgba(163,177,198,0.40), -3px -3px 10px rgba(255,255,255,0.85)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "4px 4px 12px rgba(163,177,198,0.30), -2px -2px 8px rgba(255,255,255,0.80)"; }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                {t("ustunQoshish")}
              </button>
            </div>
          ) : (
            (Array.isArray(columns) ? columns : []).map(col => (
              <KanbanColumn
                key={col.id}
                column={col}
                cards={cardsByColumn[String(col.id)] || []}
                onCardClick={setShowEditCard}
                onAddCard={() => {
                  if (selectedBoardId) {
                    setQuickAddColumnId(col.id);
                    onQuickAddColumnId?.(col.id);
                    setQuickTaskTitle("");
                    setShowQuickTask(true);
                  }
                }}
                onDeleteColumn={onDeleteColumn}
                t={t}
              />
            ))
          )}

          {/* + Ustun qo'shish tugmasi */}
          {columns.length > 0 && (
            <div className="shrink-0 flex items-start" style={{ paddingTop: 4 }}>
              <button
                onClick={() => setShowAddColumn(true)}
                data-testid="button-add-column"
                style={{
                  fontSize: 12, fontWeight: 600,
                  padding: "8px 16px", borderRadius: 14,
                  border: "1.5px dashed rgba(163,177,198,0.50)",
                  background: "#FFFFFF",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  color: "#718096",
                  boxShadow: "3px 3px 10px rgba(163,177,198,0.25), -2px -2px 6px rgba(255,255,255,0.70)",
                  transition: "box-shadow 0.18s",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "5px 5px 14px rgba(163,177,198,0.40), -3px -3px 8px rgba(255,255,255,0.85)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "3px 3px 10px rgba(163,177,198,0.25), -2px -2px 6px rgba(255,255,255,0.70)"; }}
              >
                <Plus style={{ width: 14, height: 14 }} />
                {t("ustunQoshish")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18,0.67,0.6,1.22)" }}>
        {activeCard ? <CardOverlay card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
