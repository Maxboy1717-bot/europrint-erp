/**
 * @module useKanbanBoard
 * @description React custom hook.
 */

import { useReducer, useMemo, useEffect, useRef } from "react";
import { getProp } from "@/pages/kanban/kanban-utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  format, isBefore, startOfDay, endOfWeek, addWeeks,
} from "date-fns";
import {
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  getDeadlineCategory,
} from "@/pages/kanban/kanban-types";
import {
  KanbanBoardType,
  KanbanColumn,
  Employee,
  ViewMode,
  RoleFilter,
  FilterState,
  KanbanTemplate,
  BoardWithData,
  CardWithOwner,
  DEADLINE_COLUMNS,
} from "@/components/kanban/types";

// ─── State & Reducer ─────────────────────────────────────────────────────────

type KanbanState = {
  selectedBoardId: string | null;
  viewMode: ViewMode;
  roleFilter: RoleFilter;
  activeCardId: string | null;
  showEditCard: CardWithOwner | null;
  showCreateBoard: boolean;
  showAddColumn: boolean;
  showQuickTask: boolean;
  showRobots: boolean;
  showFlows: boolean;
  showTemplates: boolean;
  showReports: boolean;
  showNotifications: boolean;
  newBoardName: string;
  newColumnName: string;
  quickTaskTitle: string;
  quickTaskType: "task" | "project" | "template";
  filters: FilterState;
};

type KanbanAction =
  | { type: "SET_BOARD_ID"; id: string | null }
  | { type: "SET_VIEW_MODE"; mode: ViewMode }
  | { type: "SET_ROLE_FILTER"; filter: RoleFilter }
  | { type: "SET_ACTIVE_CARD_ID"; id: string | null }
  | { type: "SET_EDIT_CARD"; card: CardWithOwner | null }
  | { type: "SET_SHOW_CREATE_BOARD"; open: boolean }
  | { type: "SET_SHOW_ADD_COLUMN"; open: boolean }
  | { type: "SET_SHOW_QUICK_TASK"; open: boolean }
  | { type: "SET_SHOW_ROBOTS"; open: boolean }
  | { type: "SET_SHOW_FLOWS"; open: boolean }
  | { type: "SET_SHOW_TEMPLATES"; open: boolean }
  | { type: "SET_SHOW_REPORTS"; open: boolean }
  | { type: "SET_SHOW_NOTIFICATIONS"; open: boolean }
  | { type: "SET_BOARD_NAME"; name: string }
  | { type: "SET_COLUMN_NAME"; name: string }
  | { type: "SET_QUICK_TASK_TITLE"; title: string }
  | { type: "SET_QUICK_TASK_TYPE"; taskType: "task" | "project" | "template" }
  | { type: "SET_FILTERS"; filters: FilterState };

const initialState: KanbanState = {
  selectedBoardId: null,
  viewMode: "kanban",
  roleFilter: "all",
  activeCardId: null,
  showEditCard: null,
  showCreateBoard: false,
  showAddColumn: false,
  showQuickTask: false,
  showRobots: false,
  showFlows: false,
  showTemplates: false,
  showReports: false,
  showNotifications: false,
  newBoardName: "",
  newColumnName: "",
  quickTaskTitle: "",
  quickTaskType: "task",
  filters: {
    search: "",
    columnId: null,
    priority: null,
    assigneeId: null,
    overdue: false,
    hasNewComments: false,
    tagId: null,
    tagName: null,
  },
};

function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case "SET_BOARD_ID": return { ...state, selectedBoardId: action.id };
    case "SET_VIEW_MODE": return { ...state, viewMode: action.mode };
    case "SET_ROLE_FILTER": return { ...state, roleFilter: action.filter };
    case "SET_ACTIVE_CARD_ID": return { ...state, activeCardId: action.id };
    case "SET_EDIT_CARD": return { ...state, showEditCard: action.card };
    case "SET_SHOW_CREATE_BOARD": return { ...state, showCreateBoard: action.open };
    case "SET_SHOW_ADD_COLUMN": return { ...state, showAddColumn: action.open };
    case "SET_SHOW_QUICK_TASK": return { ...state, showQuickTask: action.open };
    case "SET_SHOW_ROBOTS": return { ...state, showRobots: action.open };
    case "SET_SHOW_FLOWS": return { ...state, showFlows: action.open };
    case "SET_SHOW_TEMPLATES": return { ...state, showTemplates: action.open };
    case "SET_SHOW_REPORTS": return { ...state, showReports: action.open };
    case "SET_SHOW_NOTIFICATIONS": return { ...state, showNotifications: action.open };
    case "SET_BOARD_NAME": return { ...state, newBoardName: action.name };
    case "SET_COLUMN_NAME": return { ...state, newColumnName: action.name };
    case "SET_QUICK_TASK_TITLE": return { ...state, quickTaskTitle: action.title };
    case "SET_QUICK_TASK_TYPE": return { ...state, quickTaskType: action.taskType };
    case "SET_FILTERS": return { ...state, filters: action.filters };
    default: return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useKanbanBoard() {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(kanbanReducer, initialState);

  const {
    selectedBoardId, viewMode, roleFilter, activeCardId, showEditCard,
    showCreateBoard, showAddColumn, showQuickTask, showRobots, showFlows,
    showTemplates, showReports, showNotifications,
    newBoardName, newColumnName, quickTaskTitle, quickTaskType, filters,
  } = state;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const { data: boards = [], isLoading: boardsLoading, isError: boardsError, refetch: refetchBoards } = useQuery<KanbanBoardType[]>({
    queryKey: ["/api/kanban/boards"],
  });

  const { data: boardData, isLoading: boardLoading } = useQuery<BoardWithData>({
    queryKey: ["/api/kanban/boards", selectedBoardId],
    enabled: !!selectedBoardId,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/kanban/employees"],
    select: (data) => (Array.isArray(data) ? data : []).map((emp) => ({
      id:              String(getProp<string>(emp, 'id') ?? ""),
      fullName:        String(getProp<string>(emp, 'fullName', 'full_name') ?? "Noma'lum"),
      profileImageUrl: getProp<string | null>(emp, 'profileImageUrl', 'profile_image_url') ?? null,
    } satisfies Employee)),
  });

  const { data: templates = [] } = useQuery<KanbanTemplate[]>({
    queryKey: ["/api/kanban/templates"],
    select: (data) => data || [],
  });

  const { data: unreadCountData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/kanban/notifications/unread-count"],
  });
  const unreadCount = unreadCountData?.unreadCount ?? 0;

  const createBoardMutation = useMutation({
    mutationFn: async (data: { name: string; type: string }) => {
      const res = await apiRequest("POST", "/api/kanban/boards", data);
      return res;
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
      // Return new column so onSuccess can do an immediate cache update
      return await apiRequest<KanbanColumn>("POST", `/api/kanban/boards/${selectedBoardId}/columns`, data);
    },
    onSuccess: (newColumn) => {
      // Immediate optimistic cache update — column appears without waiting for refetch
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
      // Background sync with server
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
    mutationFn: async (data: { title: string; columnId: string; sortOrder: number; priority: string }) => {
      return await apiRequest<CardWithOwner>("POST", `/api/kanban/boards/${selectedBoardId}/cards`, data);
    },
    onSuccess: (newCard) => {
      // Immediate optimistic cache update — card appears without waiting for refetch
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
      // Remove column from cache immediately
      queryClient.setQueryData<BoardWithData>(
        ["/api/kanban/boards", selectedBoardId],
        (old) => {
          if (!old) return old;
          return { ...old, columns: (old.columns || []).filter((c) => String(c.id) !== String(columnId)) };
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
      // O'chirilgan doskadan keyingi doskaga avtomatik o'tish
      queryClient.setQueryData<KanbanBoardType[]>(["/api/kanban/boards"], (old) => {
        const remaining = (Array.isArray(old) ? old : []).filter((b) => String(b.id) !== String(boardId));
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
    mutationFn: async ({ id, columnId, sortOrder }: { id: string; columnId: string; sortOrder: number }) => {
      await apiRequest("PUT", `/api/kanban/cards/${id}/move`, { columnId, sortOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
    },
    onError: (err: Error) => {
      toast({ title: "Kartani ko'chirishda xato", description: err.message, variant: "destructive" });
    },
  });

  // ── Birinchi doskani avtomatik tanlash (ref guard — cheksiz tsiklni oldini oladi) ──
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (boards.length > 0 && !selectedBoardId && !autoSelectedRef.current) {
      autoSelectedRef.current = true;
      dispatch({ type: "SET_BOARD_ID", id: String(boards[0].id) });
    }
  }, [boards, selectedBoardId]);

  // ── Europrint tezkor boshlash ───────────────────────────────────────────────
  const quickStartMutation = useMutation({
    mutationFn: async () => {
      const board = await apiRequest("POST", "/api/kanban/boards", {
        name: "Buyurtmalar Kanbani",
        type: "custom",
      }) as { id: string };

      const defaultCols = [
        { name: "Kiruvchi",      sortOrder: 0 },
        { name: "Rejada",        sortOrder: 1 },
        { name: "Jarayonda",     sortOrder: 2 },
        { name: "Tekshiruvda",   sortOrder: 3 },
        { name: "Bajarildi",     sortOrder: 4 },
        { name: "Bekor qilindi", sortOrder: 5 },
      ];
      await Promise.all(
        defaultCols.map(col => apiRequest("POST", `/api/kanban/boards/${board.id}/columns`, col))
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

  const columns = boardData?.columns || [];
  const allCards = boardData?.cards || [];

  const filteredCards = useMemo(() => {
    return (Array.isArray(allCards) ? allCards : []).filter((card) => {
      if (filters.search && !(card.title ?? "").toLowerCase().includes(filters.search.toLowerCase()) &&
          !card.description?.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.priority && card.priority !== filters.priority) return false;
      if (filters.assigneeId && card.ownerUserId !== filters.assigneeId) return false;
      if (filters.overdue && (!card.dueDate || !isBefore(new Date(card.dueDate), startOfDay(new Date())))) return false;
      return true;
    });
  }, [allCards, filters]);

  const cardsByDeadline = useMemo(() => {
    const result: Record<keyof typeof DEADLINE_COLUMNS, CardWithOwner[]> = {
      overdue: [],
      today: [],
      thisWeek: [],
      nextWeek: [],
      noDeadline: [],
    };

    (Array.isArray(filteredCards) ? filteredCards : []).forEach((card) => {
      const category = getDeadlineCategory(card.dueDate ?? null);
      result[category].push(card);
    });

    Object.keys(result).forEach((key) => {
      result[key as keyof typeof DEADLINE_COLUMNS].sort((a, b) => a.sortOrder - b.sortOrder);
    });

    return result;
  }, [filteredCards]);

  const cardsByColumn = useMemo(() => {
    const map: Record<string, CardWithOwner[]> = {};
    // col.id may be a number (serial PK) — coerce to string for consistent key lookup
    for (const col of columns) map[String(col.id)] = [];
    for (const card of filteredCards) {
      // Backend returns snake_case (column_id); TypeScript type says columnId — handle both
      const colId = String(card.columnId ?? getProp<string>(card, 'column_id') ?? "");
      if (!colId || colId === "undefined" || colId === "null") continue;
      if (map[colId]) map[colId].push(card);
      else map[colId] = [card];
    }
    return map;
  }, [filteredCards, columns]);

  const activeCard = useMemo(() => (Array.isArray(allCards) ? allCards : []).find((c) => c.id === activeCardId) || null, [allCards, activeCardId]);

  const overdueCount = useMemo(() => {
    return (Array.isArray(allCards) ? allCards : []).filter((card) => card.dueDate && isBefore(new Date(card.dueDate), startOfDay(new Date()))).length;
  }, [allCards]);

  const newCommentsCount = useMemo(() => {
    return (Array.isArray(allCards) ? allCards : []).filter((card) => (card.commentsCount || 0) > 0).length;
  }, [allCards]);

  const hasActiveFilters = !!(filters.search || filters.priority || filters.assigneeId || filters.overdue || filters.hasNewComments || filters.tagId);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if ((Array.isArray(allCards) ? allCards : []).find((c) => String(c.id) === String(active.id))) {
      dispatch({ type: "SET_ACTIVE_CARD_ID", id: String(active.id) });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
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
        case "today": newDueDate = format(today, "yyyy-MM-dd"); break;
        case "thisWeek": newDueDate = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"); break;
        case "nextWeek": newDueDate = format(endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 }), "yyyy-MM-dd"); break;
        case "noDeadline": newDueDate = null; break;
        case "overdue": toast({ title: "Kechikkan ustuniga tashlab bo'lmaydi", variant: "destructive" }); return;
      }
      updateCardMutation.mutate({ id: activeId, dueDate: newDueDate });
      return;
    }

    // ── 1. Drop on another card → move to that card's column at its sort position ─
    const overCard = (Array.isArray(allCards) ? allCards : []).find((c) => String(c.id) === overId);
    if (overCard) {
      const rawOver = overCard as unknown as Record<string, unknown>;
      const targetColumnId = overCard.columnId ?? rawOver.column_id;
      const rawSortOrder   = overCard.sortOrder ?? rawOver.sort_order;
      // NaN guard — sort_order ba'zida string yoki undefined bo'lishi mumkin
      // +0.5 to insert after target without colliding on the same sortOrder
      const targetSortOrder = Number.isFinite(Number(rawSortOrder)) ? Number(rawSortOrder) + 0.5 : 0;
      moveCardMutation.mutate({
        id: activeId,
        columnId: String(targetColumnId ?? ""),
        sortOrder: targetSortOrder,
      });
      return;
    }

    // ── 2. Drop on empty column (or end of column) → move to that column ─────────
    const overColumn = (Array.isArray(columns) ? columns : []).find((c) => String(c.id) === overId);
    if (overColumn) {
      const rawCardOver = card as unknown as Record<string, unknown>;
      const currentColumnId = card.columnId ?? rawCardOver.column_id;
      // Agar allaqachon shu ustunda bo'lsa — hech narsa qilmaymiz
      if (String(currentColumnId) === String(overColumn.id)) return;
      // Ustun oxiriga qo'shamiz (cardsByColumn dan aniq soni — allCards dan emas)
      const targetCards = cardsByColumn[String(overColumn.id)] ?? [];
      moveCardMutation.mutate({
        id: activeId,
        columnId: String(overColumn.id),
        sortOrder: targetCards.length,
      });
      return;
    }
  };

  return {
    selectedBoardId,
    setSelectedBoardId: (id: string | number | null) => dispatch({ type: "SET_BOARD_ID", id: id !== null ? String(id) : null }),
    viewMode,
    setViewMode: (mode: ViewMode) => dispatch({ type: "SET_VIEW_MODE", mode }),
    roleFilter,
    setRoleFilter: (filter: RoleFilter) => dispatch({ type: "SET_ROLE_FILTER", filter }),
    activeCardId,
    setActiveCardId: (id: string | null) => dispatch({ type: "SET_ACTIVE_CARD_ID", id }),
    showEditCard,
    setShowEditCard: (card: CardWithOwner | null) => dispatch({ type: "SET_EDIT_CARD", card }),
    showCreateBoard,
    setShowCreateBoard: (open: boolean) => dispatch({ type: "SET_SHOW_CREATE_BOARD", open }),
    showAddColumn,
    setShowAddColumn: (open: boolean) => dispatch({ type: "SET_SHOW_ADD_COLUMN", open }),
    showQuickTask,
    setShowQuickTask: (open: boolean) => dispatch({ type: "SET_SHOW_QUICK_TASK", open }),
    showRobots,
    setShowRobots: (open: boolean) => dispatch({ type: "SET_SHOW_ROBOTS", open }),
    showFlows,
    setShowFlows: (open: boolean) => dispatch({ type: "SET_SHOW_FLOWS", open }),
    showTemplates,
    setShowTemplates: (open: boolean) => dispatch({ type: "SET_SHOW_TEMPLATES", open }),
    showReports,
    setShowReports: (open: boolean) => dispatch({ type: "SET_SHOW_REPORTS", open }),
    showNotifications,
    setShowNotifications: (open: boolean) => dispatch({ type: "SET_SHOW_NOTIFICATIONS", open }),
    newBoardName,
    setNewBoardName: (name: string) => dispatch({ type: "SET_BOARD_NAME", name }),
    newColumnName,
    setNewColumnName: (name: string) => dispatch({ type: "SET_COLUMN_NAME", name }),
    quickTaskTitle,
    setQuickTaskTitle: (title: string) => dispatch({ type: "SET_QUICK_TASK_TITLE", title }),
    quickTaskType,
    setQuickTaskType: (taskType: "task" | "project" | "template") => dispatch({ type: "SET_QUICK_TASK_TYPE", taskType }),
    filters,
    // Updater funksiyasini ham, to'g'ridan-to'g'ri qiymatni ham qabul qiladi
    setFilters: (update: FilterState | ((f: FilterState) => FilterState)) => {
      const next = typeof update === "function" ? update(filters) : update;
      dispatch({ type: "SET_FILTERS", filters: next });
    },
    sensors,
    boards, boardsLoading, boardsError, refetchBoards,
    boardData, boardLoading,
    employees,
    templates,
    unreadCount,
    createBoardMutation,
    quickStartMutation,
    createColumnMutation,
    deleteColumnMutation,
    deleteBoardMutation,
    createCardMutation,
    updateCardMutation,
    deleteCardMutation,
    moveCardMutation,
    columns,
    allCards,
    filteredCards,
    cardsByDeadline,
    cardsByColumn,
    activeCard,
    overdueCount,
    newCommentsCount,
    hasActiveFilters,
    handleDragStart,
    handleDragEnd,
  };
}
