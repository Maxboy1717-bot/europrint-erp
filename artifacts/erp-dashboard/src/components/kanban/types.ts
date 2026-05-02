import {
  type KanbanBoard as KanbanBoardType,
  type KanbanCard,
  type KanbanColumn,
} from "@shared/schema";
import {
  type CardWithOwner,
  type BoardWithData,
  type Employee,
  type ViewMode,
  type RoleFilter,
  type FilterState,
  type KanbanTemplate,
  type KanbanTranslations,
  DEADLINE_COLUMNS,
} from "../../pages/kanban/kanban-types";

export type {
  KanbanBoardType,
  KanbanCard,
  KanbanColumn,
  CardWithOwner,
  BoardWithData,
  Employee,
  ViewMode,
  RoleFilter,
  FilterState,
  KanbanTemplate,
  KanbanTranslations,
};

export { DEADLINE_COLUMNS };
