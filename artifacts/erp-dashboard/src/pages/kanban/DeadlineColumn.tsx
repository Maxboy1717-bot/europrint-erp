/**
 * @module DeadlineColumn
 * @description React page component. Route-level UI.
 */

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { type CardWithOwner, type T, DEADLINE_COLUMNS } from "./kanban-types";
import { SortableTaskCard } from "./KanbanCard";

export function DeadlineColumn({
  columnKey,
  cards,
  onCardClick,
  onAddCard,
  t,
}: {
  columnKey: keyof typeof DEADLINE_COLUMNS;
  cards: CardWithOwner[];
  onCardClick: (card: CardWithOwner) => void;
  onAddCard?: () => void;
  t: typeof T.uz & ((key: string) => string);
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `deadline-${columnKey}`,
  });
  
  const config = DEADLINE_COLUMNS[columnKey];
  const columnNames: Record<string, string> = {
    overdue: t.columns.overdue,
    today: t.columns.today,
    thisWeek: t.columns.thisWeek,
    nextWeek: t.columns.nextWeek,
    noDeadline: t.columns.noDeadline,
  };

  return (
    <div 
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 rounded-xl overflow-hidden shadow-sm ${config.color} ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}`} 
      data-testid={`deadline-column-${columnKey}`}
    >
      <div className={`px-4 py-3 ${config.headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-sm ${config.headerText}`}>{columnNames[columnKey]}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full bg-card/20 ${config.headerText}`}>
              {cards.length}
            </span>
          </div>
          {columnKey !== "overdue" && onAddCard && (
            <Button 
              size="icon" 
              variant="ghost" 
              className={`h-6 w-6 ${config.headerText} hover:bg-card/20`}
              onClick={(e) => { e.stopPropagation(); onAddCard(); }}
              data-testid={`button-add-card-${columnKey}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-3">
        <SortableContext items={(Array.isArray(cards) ? cards : []).map(c => c.id ?? "")} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[100px]">
            {(Array.isArray(cards) ? cards : []).map((card) => (
              <SortableTaskCard key={card.id} card={card} onClick={() => onCardClick(card)} t={t} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
