/**
 * @module useKanbanBoard.drag
 * @description Drag-and-drop handler factory for the kanban board hook.
 *   Builds onDragStart / onDragEnd functions wired to mutations. Split out so
 *   the parent hook stays under 300 lines.
 */

import type { Dispatch } from "react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  format,
  isBefore,
  startOfDay,
  endOfWeek,
  addWeeks,
} from "date-fns";
import { getProp } from "@/pages/kanban/kanban-utils";
import type {
  KanbanColumn,
  CardWithOwner,
} from "@/components/kanban/types";
import { DEADLINE_COLUMNS } from "@/components/kanban/types";
import type { KanbanAction } from "./useKanbanBoard.state";

interface MutateFn<T> { mutate: (vars: T) => void; }

interface BuildDragHandlersOpts {
  allCards: CardWithOwner[];
  columns: KanbanColumn[];
  cardsByColumn: Record<string, CardWithOwner[]>;
  dispatch: Dispatch<KanbanAction>;
  toast: (opts: { title: string; variant?: "destructive" }) => void;
  updateCardMutation: MutateFn<{ id: string; [key: string]: unknown }>;
  moveCardMutation: MutateFn<{ id: string; columnId: string; sortOrder: number }>;
}

export function buildDragHandlers(opts: BuildDragHandlersOpts) {
  const { allCards, columns, cardsByColumn, dispatch, toast, updateCardMutation, moveCardMutation } = opts;

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    if ((Array.isArray(allCards) ? allCards : []).find((c) => String(c.id) === String(active.id))) {
      dispatch({ type: "SET_ACTIVE_CARD_ID", id: String(active.id) });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    dispatch({ type: "SET_ACTIVE_CARD_ID", id: null });
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const card = (Array.isArray(allCards) ? allCards : []).find((c) => String(c.id) === activeId);
    if (!card) return;

    const overId = String(over.id);

    if (overId.startsWith("deadline-")) {
      const columnKey = overId.replace("deadline-", "") as keyof typeof DEADLINE_COLUMNS;
      let newDueDate: string | null = null;
      const today = startOfDay(new Date());
      switch (columnKey) {
        case "today":
          newDueDate = format(today, "yyyy-MM-dd");
          break;
        case "thisWeek":
          newDueDate = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
          break;
        case "nextWeek":
          newDueDate = format(endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
          break;
        case "noDeadline":
          newDueDate = null;
          break;
        case "overdue":
          toast({ title: "Kechikkan ustuniga tashlab bo'lmaydi", variant: "destructive" });
          return;
      }
      updateCardMutation.mutate({ id: activeId, dueDate: newDueDate });
      return;
    }

    const overCard = (Array.isArray(allCards) ? allCards : []).find((c) => String(c.id) === overId);
    if (overCard) {
      const rawOver = overCard as unknown as Record<string, unknown>;
      const targetColumnId = overCard.columnId ?? rawOver.column_id;
      const rawSortOrder = overCard.sortOrder ?? rawOver.sort_order;
      const targetSortOrder = Number.isFinite(Number(rawSortOrder)) ? Number(rawSortOrder) + 0.5 : 0;
      moveCardMutation.mutate({
        id: activeId,
        columnId: String(targetColumnId ?? ""),
        sortOrder: targetSortOrder,
      });
      return;
    }

    const overColumn = (Array.isArray(columns) ? columns : []).find((c) => String(c.id) === overId);
    if (overColumn) {
      const rawCardOver = card as unknown as Record<string, unknown>;
      const currentColumnId = card.columnId ?? rawCardOver.column_id;
      if (String(currentColumnId) === String(overColumn.id)) return;
      const targetCards = cardsByColumn[String(overColumn.id)] ?? [];
      moveCardMutation.mutate({
        id: activeId,
        columnId: String(overColumn.id),
        sortOrder: targetCards.length,
      });
      return;
    }
  }

  return { handleDragStart, handleDragEnd };
}

export function isCardOverdue(card: CardWithOwner): boolean {
  return !!card.dueDate && isBefore(new Date(card.dueDate), startOfDay(new Date()));
}

export function getCardColumnId(card: CardWithOwner): string {
  return String(card.columnId ?? getProp<string>(card, "column_id") ?? "");
}
