import {
  DndContext,
  DragOverlay,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FolderKanban, Plus } from "lucide-react";
import { KanbanColumn } from "@/pages/kanban/KanbanColumn";
import { CardOverlay } from "@/pages/kanban/KanbanCard";
import { KanbanTranslations, KanbanColumn as KanbanColumnType, CardWithOwner } from "@/components/kanban/types";

interface KanbanBoardViewProps {
  sensors: SensorDescriptor<SensorOptions>[];
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  columns: KanbanColumnType[];
  cardsByColumn: Record<string, CardWithOwner[]>;
  setShowEditCard: (card: CardWithOwner) => void;
  setShowAddColumn: (show: boolean) => void;
  setShowQuickTask: (show: boolean) => void;
  setQuickTaskTitle: (title: string) => void;
  selectedBoardId: string | null;
  activeCard: CardWithOwner | null;
  t: KanbanTranslations;
}

export function KanbanBoardView({
  sensors,
  handleDragStart,
  handleDragEnd,
  columns,
  cardsByColumn,
  setShowEditCard,
  setShowAddColumn,
  setShowQuickTask,
  setQuickTaskTitle,
  selectedBoardId,
  activeCard,
  t,
}: KanbanBoardViewProps) {
  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <ScrollArea className="w-full h-full">
        <div className="flex gap-4 pb-4 min-h-full">
          {columns.length === 0 ? (
            <div className="flex flex-col items-center justify-center w-full py-24 gap-4 text-muted-foreground">
              <FolderKanban className="h-14 w-14 opacity-40" />
              <p className="text-sm font-medium">Ustunlar yo'q</p>
              <Button size="sm" variant="outline" onClick={() => setShowAddColumn(true)}><Plus className="h-4 w-4 mr-1" />Ustun qo'shish</Button>
            </div>
          ) : (
            (Array.isArray(columns) ? columns : []).map((col) => (
              <KanbanColumn key={col.id} column={col} cards={cardsByColumn[col.id] || []} onCardClick={setShowEditCard}
                onAddCard={() => { if (selectedBoardId) { setQuickTaskTitle(""); setShowQuickTask(true); } }} t={t} />
            ))
          )}
          <div className="shrink-0 flex items-start pt-1">
            <Button variant="outline" size="sm" className="h-9 border-dashed border-slate-300 dark:border-slate-600 text-muted-foreground hover:text-foreground"
              onClick={() => setShowAddColumn(true)} data-testid="button-add-column"><Plus className="h-4 w-4 mr-1" />Ustun qo'shish</Button>
          </div>
        </div>
      </ScrollArea>
      <DragOverlay>{activeCard && <CardOverlay card={activeCard} />}</DragOverlay>
    </DndContext>
  );
}
