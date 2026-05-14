/**
 * @module KanbanBoardDialogs
 * @description Dialog layer for KanbanBoard.
 *
 * KanbanBoard's dialogs are already fully encapsulated in dedicated components
 * (BoardDialogs, RobotsDialog, FlowsDialog, TemplatesDialog, ReportsDialog,
 * TaskDetailSheet). This file simply re-exports them under a single surface so
 * the orchestration file stays clean.
 */

export { BoardDialogs } from "@/components/kanban/BoardDialogs";
export { RobotsDialog } from "./kanban/RobotsDialog";
export { FlowsDialog } from "./kanban/FlowsDialog";
export { TemplatesDialog } from "./kanban/TemplatesDialog";
export { ReportsDialog } from "./kanban/ReportsDialog";
export { TaskDetailSheet } from "./kanban/TaskDetailSheet";
