/**
 * @module useKanbanBoard
 * @description Top-level kanban board hook. Composes state (useKanbanBoard.state),
 *   mutations (useKanbanBoard.mutations) and drag handlers (useKanbanBoard.drag)
 *   into the single API consumed by KanbanBoardView. Split to respect the
 *   300-line file budget.
 */

import { useReducer, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isBefore, startOfDay } from "date-fns";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { getDeadlineCategory } from "@/pages/kanban/kanban-types";
import { getProp } from "@/pages/kanban/kanban-utils";
import {
  KanbanBoardType,
  Employee,
  ViewMode,
  RoleFilter,
  FilterState,
  KanbanTemplate,
  BoardWithData,
  CardWithOwner,
  DEADLINE_COLUMNS,
} from "@/components/kanban/types";

import { initialKanbanState, kanbanReducer } from "./useKanbanBoard.state";
import { useKanbanMutations } from "./useKanbanBoard.mutations";
import { buildDragHandlers } from "./useKanbanBoard.drag";

export function useKanbanBoard() {
  const { toast } = useToast();
  const [state, dispatch] = useReducer(kanbanReducer, initialKanbanState);

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

  const { data: boards = [], isLoading: boardsLoading, isError: boardsError, refetch: refetchBoards } =
    useQuery<KanbanBoardType[]>({ queryKey: ["/api/kanban/boards"] });

  const { data: boardData, isLoading: boardLoading } = useQuery<BoardWithData>({
    queryKey: ["/api/kanban/boards", selectedBoardId],
    enabled: !!selectedBoardId,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/kanban/employees"],
    select: (data) =>
      (Array.isArray(data) ? data : []).map((emp) => ({
        id: String(getProp<string>(emp, "id") ?? ""),
        fullName: String(getProp<string>(emp, "fullName", "full_name") ?? "Noma'lum"),
        profileImageUrl: getProp<string | null>(emp, "profileImageUrl", "profile_image_url") ?? null,
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

  const mutations = useKanbanMutations(selectedBoardId, dispatch, toast);

  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (boards.length > 0 && !selectedBoardId && !autoSelectedRef.current) {
      autoSelectedRef.current = true;
      dispatch({ type: "SET_BOARD_ID", id: String(boards[0].id) });
    }
  }, [boards, selectedBoardId]);

  const columns = boardData?.columns || [];
  const allCards = boardData?.cards || [];

  const filteredCards = useMemo(() => {
    return (Array.isArray(allCards) ? allCards : []).filter((card) => {
      if (
        filters.search &&
        !(card.title ?? "").toLowerCase().includes(filters.search.toLowerCase()) &&
        !card.description?.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (filters.priority && card.priority !== filters.priority) return false;
      if (filters.assigneeId && card.ownerUserId !== filters.assigneeId) return false;
      if (
        filters.overdue &&
        (!card.dueDate || !isBefore(new Date(card.dueDate), startOfDay(new Date())))
      )
        return false;
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
    for (const col of columns) map[String(col.id)] = [];
    for (const card of filteredCards) {
      const colId = String(card.columnId ?? getProp<string>(card, "column_id") ?? "");
      if (!colId || colId === "undefined" || colId === "null") continue;
      if (map[colId]) map[colId].push(card);
      else map[colId] = [card];
    }
    return map;
  }, [filteredCards, columns]);

  const activeCard = useMemo(
    () =>
      (Array.isArray(allCards) ? allCards : []).find((c) => c.id === activeCardId) || null,
    [allCards, activeCardId]
  );

  const overdueCount = useMemo(() => {
    return (Array.isArray(allCards) ? allCards : []).filter(
      (card) => card.dueDate && isBefore(new Date(card.dueDate), startOfDay(new Date()))
    ).length;
  }, [allCards]);

  const newCommentsCount = useMemo(() => {
    return (Array.isArray(allCards) ? allCards : []).filter(
      (card) => (card.commentsCount || 0) > 0
    ).length;
  }, [allCards]);

  const hasActiveFilters = !!(
    filters.search ||
    filters.priority ||
    filters.assigneeId ||
    filters.overdue ||
    filters.hasNewComments ||
    filters.tagId
  );

  const { handleDragStart, handleDragEnd } = buildDragHandlers({
    allCards,
    columns,
    cardsByColumn,
    dispatch,
    toast,
    updateCardMutation: mutations.updateCardMutation,
    moveCardMutation: mutations.moveCardMutation,
  });

  return {
    selectedBoardId,
    setSelectedBoardId: (id: string | number | null) =>
      dispatch({ type: "SET_BOARD_ID", id: id !== null ? String(id) : null }),
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
    setQuickTaskType: (taskType: "task" | "project" | "template") =>
      dispatch({ type: "SET_QUICK_TASK_TYPE", taskType }),
    filters,
    setFilters: (update: FilterState | ((f: FilterState) => FilterState)) => {
      const next = typeof update === "function" ? update(filters) : update;
      dispatch({ type: "SET_FILTERS", filters: next });
    },
    sensors,
    boards,
    boardsLoading,
    boardsError,
    refetchBoards,
    boardData,
    boardLoading,
    employees,
    templates,
    unreadCount,
    ...mutations,
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
