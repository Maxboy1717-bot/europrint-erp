import { useState, useMemo } from "react";
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
  Employee,
  ViewMode,
  RoleFilter,
  FilterState,
  KanbanTemplate,
  BoardWithData,
  CardWithOwner,
  DEADLINE_COLUMNS,
} from "@/components/kanban/types";

export function useKanbanBoard() {
  const { toast } = useToast();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [showEditCard, setShowEditCard] = useState<CardWithOwner | null>(null);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [showRobots, setShowRobots] = useState(false);
  const [showFlows, setShowFlows] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newColumnName, setNewColumnName] = useState("");
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskType, setQuickTaskType] = useState<"task" | "project" | "template">("task");
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    columnId: null,
    priority: null,
    assigneeId: null,
    overdue: false,
    hasNewComments: false,
    tagId: null,
    tagName: null,
  });

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
  });

  const { data: templates = [] } = useQuery<KanbanTemplate[]>({
    queryKey: ["/api/kanban/templates"],
    queryFn: async () => {
      const res = await fetch("/api/kanban/templates", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    select: (data) => data || [],
  });

  const { data: unreadCountData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/kanban/notifications/unread-count"],
    queryFn: async () => {
      const res = await fetch("/api/kanban/notifications/unread-count", { credentials: "include" });
      if (!res.ok) return { unreadCount: 0 };
      return res.json();
    },
  });
  const unreadCount = unreadCountData?.unreadCount ?? 0;

  const createBoardMutation = useMutation({
    mutationFn: async (data: { name: string; type: string }) => {
      const res = await apiRequest("POST", "/api/kanban/boards", data);
      return res;
    },
    onSuccess: (newBoard) => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards"] });
      setSelectedBoardId(newBoard.id);
      setShowCreateBoard(false);
      setNewBoardName("");
      toast({ title: "Doska yaratildi" });
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: async (data: { name: string; sortOrder: number }) => {
      await apiRequest("POST", `/api/kanban/boards/${selectedBoardId}/columns`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
      setShowAddColumn(false);
      setNewColumnName("");
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: { title: string; columnId: string; sortOrder: number; priority: string }) => {
      await apiRequest("POST", `/api/kanban/boards/${selectedBoardId}/cards`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
      setShowQuickTask(false);
      setQuickTaskTitle("");
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      await apiRequest("PUT", `/api/kanban/cards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: string) => {
      await apiRequest("DELETE", `/api/kanban/cards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
      setShowEditCard(null);
    },
  });

  const moveCardMutation = useMutation({
    mutationFn: async ({ id, columnId, sortOrder }: { id: string; columnId: string; sortOrder: number }) => {
      await apiRequest("PUT", `/api/kanban/cards/${id}/move`, { columnId, sortOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kanban/boards", selectedBoardId] });
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
    for (const col of columns) map[col.id] = [];
    for (const card of filteredCards) {
      if (map[card.columnId]) map[card.columnId].push(card);
      else map[card.columnId] = [card];
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
    if ((Array.isArray(allCards) ? allCards : []).find((c) => c.id === active.id)) {
      setActiveCardId(active.id as string);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveCardId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const card = (Array.isArray(allCards) ? allCards : []).find((c) => c.id === activeId);
    if (!card) return;

    const overId = over.id as string;
    
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

    const overCard = (Array.isArray(allCards) ? allCards : []).find((c) => c.id === overId);
    if (overCard) {
      moveCardMutation.mutate({
        id: activeId,
        columnId: overCard.columnId,
        sortOrder: overCard.sortOrder,
      });
    }
  };

  return {
    selectedBoardId, setSelectedBoardId,
    viewMode, setViewMode,
    roleFilter, setRoleFilter,
    activeCardId, setActiveCardId,
    showEditCard, setShowEditCard,
    showCreateBoard, setShowCreateBoard,
    showAddColumn, setShowAddColumn,
    showQuickTask, setShowQuickTask,
    showRobots, setShowRobots,
    showFlows, setShowFlows,
    showTemplates, setShowTemplates,
    showReports, setShowReports,
    showNotifications, setShowNotifications,
    newBoardName, setNewBoardName,
    newColumnName, setNewColumnName,
    quickTaskTitle, setQuickTaskTitle,
    quickTaskType, setQuickTaskType,
    filters, setFilters,
    sensors,
    boards, boardsLoading, boardsError, refetchBoards,
    boardData, boardLoading,
    employees,
    templates,
    unreadCount,
    createBoardMutation,
    createColumnMutation,
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
