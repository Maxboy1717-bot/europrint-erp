/**
 * @module useKanbanBoard.mutations
 * @description All kanban-board mutations (board/column/card create/update/delete/move,
 *   quick-start). Returns a bundle consumed by the main hook. Split out so the
 *   parent hook stays under 300 lines.
 */

import { useMutation } from "@tanstack/react-query";
import type { Dispatch } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type {
  KanbanBoardType,
  KanbanColumn,
  BoardWithData,
  CardWithOwner,
} from "@/components/kanban/types";
import type { KanbanAction } from "./useKanbanBoard.state";

type Toaster = (opts: { title: string; description?: string; variant?: "destructive" }) => void;

export function useKanbanMutations(
  selectedBoardId: string | null,
  dispatch: Dispatch<KanbanAction>,
  toast: Toaster
) {
  const createBoardMutation = useMutation({
    mutationFn: async (data: { name: string; type: string }) => {
      return await apiRequest("POST", "/api/kanban/boards", data);
    },
    onSuccess: (newBoard) => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      dispatch({ type: "SET_BOARD_ID", id: String((newBoard as { id: string | number }).id) });
      dispatch({ type: "SET_SHOW_CREATE_BOARD", open: false });
      dispatch({ type: "SET_BOARD_NAME", name: "" });
      toast({ title: "Doska yaratildi" });
    },
    onError: (err: Error) => {
      toast({ title: "Doska yaratishda xato", description: err.message, variant: "destructive" });
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: async (data: { name: string; sortOrder: number }) => {
      return await apiRequest<KanbanColumn>(
        "POST",
        `/api/kanban/boards/${selectedBoardId}/columns`,
        data
      );
    },
    onSuccess: (newColumn) => {
      if (newColumn && selectedBoardId) {
        queryClient.setQueryData<BoardWithData>(
          ["/api/kanban/boards", selectedBoardId],
          (old) => {
            if (!old) return old;
            const cols = Array.isArray(old.columns) ? old.columns : [];
            if (cols.some((c) => c.id === newColumn.id)) return old;
            return { ...old, columns: [...cols, newColumn] };
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
      dispatch({ type: "SET_SHOW_ADD_COLUMN", open: false });
      dispatch({ type: "SET_COLUMN_NAME", name: "" });
      toast({ title: "Ustun qo'shildi" });
    },
    onError: (err: Error) => {
      toast({ title: "Ustun yaratishda xato", description: err.message, variant: "destructive" });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      columnId: string;
      sortOrder: number;
      priority: string;
    }) => {
      return await apiRequest<CardWithOwner>(
        "POST",
        `/api/kanban/boards/${selectedBoardId}/cards`,
        data
      );
    },
    onSuccess: (newCard) => {
      if (newCard && selectedBoardId) {
        queryClient.setQueryData<BoardWithData>(
          ["/api/kanban/boards", selectedBoardId],
          (old) => {
            if (!old) return old;
            const cards = Array.isArray(old.cards) ? old.cards : [];
            if (cards.some((c) => c.id === newCard.id)) return old;
            return { ...old, cards: [...cards, newCard] };
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
      dispatch({ type: "SET_SHOW_QUICK_TASK", open: false });
      dispatch({ type: "SET_QUICK_TASK_TITLE", title: "" });
      toast({ title: "Vazifa yaratildi" });
    },
    onError: (err: Error) => {
      toast({ title: "Vazifa yaratishda xato", description: err.message, variant: "destructive" });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      await apiRequest("PUT", `/api/kanban/cards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
    },
    onError: (err: Error) => {
      toast({ title: "Kartani yangilashda xato", description: err.message, variant: "destructive" });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await apiRequest("DELETE", `/api/kanban/cards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
      dispatch({ type: "SET_EDIT_CARD", card: null });
    },
    onError: (err: Error) => {
      toast({ title: "Kartani o'chirishda xato", description: err.message, variant: "destructive" });
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: async (columnId: string) => {
      await apiRequest("DELETE", `/api/kanban/boards/${selectedBoardId}/columns/${columnId}`);
    },
    onSuccess: (_v, columnId) => {
      queryClient.setQueryData<BoardWithData>(
        ["/api/kanban/boards", selectedBoardId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            columns: (old.columns || []).filter((c) => String(c.id) !== String(columnId)),
          };
        }
      );
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
      toast({ title: "Ustun o'chirildi" });
    },
    onError: (err: Error) => {
      toast({ title: "Ustunni o'chirishda xato", description: err.message, variant: "destructive" });
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: async (boardId: string) => {
      await apiRequest("DELETE", `/api/kanban/boards/${boardId}`);
      return boardId;
    },
    onSuccess: (_result, boardId) => {
      queryClient.setQueryData<KanbanBoardType[]>(["/api/kanban/boards"], (old) => {
        const remaining = (Array.isArray(old) ? old : []).filter(
          (b) => String(b.id) !== String(boardId)
        );
        if (remaining.length > 0) {
          setTimeout(() => dispatch({ type: "SET_BOARD_ID", id: String(remaining[0].id) }), 0);
        } else {
          dispatch({ type: "SET_BOARD_ID", id: null });
        }
        return remaining;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      toast({ title: "Doska o'chirildi" });
    },
    onError: (err: Error) => {
      toast({ title: "Doskani o'chirishda xato", description: err.message, variant: "destructive" });
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: async ({
      id,
      columnId,
      sortOrder,
    }: {
      id: string;
      columnId: string;
      sortOrder: number;
    }) => {
      await apiRequest("PUT", `/api/kanban/cards/${id}/move`, { columnId, sortOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
    },
    onError: (err: Error) => {
      toast({ title: "Kartani ko'chirishda xato", description: err.message, variant: "destructive" });
    },
  });

  const quickStartMutation = useMutation({
    mutationFn: async () => {
      const board = (await apiRequest("POST", "/api/kanban/boards", {
        name: "Buyurtmalar Kanbani",
        type: "custom",
      })) as { id: string };

      const defaultCols = [
        { name: "Kiruvchi", sortOrder: 0 },
        { name: "Rejada", sortOrder: 1 },
        { name: "Jarayonda", sortOrder: 2 },
        { name: "Tekshiruvda", sortOrder: 3 },
        { name: "Bajarildi", sortOrder: 4 },
        { name: "Bekor qilindi", sortOrder: 5 },
      ];
      await Promise.all(
        defaultCols.map((col) =>
          apiRequest("POST", `/api/kanban/boards/${board.id}/columns`, col)
        )
      );
      return board;
    },
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      dispatch({ type: "SET_BOARD_ID", id: String(board.id) });
      toast({ title: "✓ Europrint Kanban tayyor! 6 ta ustun yaratildi." });
    },
    onError: () => {
      toast({ title: "Xato yuz berdi", variant: "destructive" });
    },
  });

  return {
    createBoardMutation,
    createColumnMutation,
    createCardMutation,
    updateCardMutation,
    deleteCardMutation,
    deleteColumnMutation,
    deleteBoardMutation,
    moveCardMutation,
    quickStartMutation,
  };
}
