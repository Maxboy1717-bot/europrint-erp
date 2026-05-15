/**
 * @module useKanbanBoard.state
 * @description State, action, reducer and initial state for the kanban board hook.
 * Split out so the parent hook stays under 300 lines.
 */

import type {
  ViewMode,
  RoleFilter,
  FilterState,
  CardWithOwner,
} from "@/components/kanban/types";

export type KanbanState = {
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

export type KanbanAction =
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

export const initialKanbanState: KanbanState = {
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

export function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
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
