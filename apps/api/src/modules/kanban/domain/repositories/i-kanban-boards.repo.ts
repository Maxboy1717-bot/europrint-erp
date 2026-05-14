/**
 * @module i-kanban-boards.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

export interface KanbanBoard {
  id: string;
  name: string;
  type: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface KanbanColumn {
  id: string;
  board_id: string;
  name: string;
  sort_order: number;
  color: string | null;
  created_at: Date;
}

export interface KanbanCard {
  id: string;
  board_id: string;
  column_id: string;
  title: string;
  description: string | null;
  priority: string;
  due_date: Date | null;
  sort_order: number;
  owner_user_id: string | null;
  related_type: string | null;
  related_id: string | null;
  source: string | null;
  start_date: Date | null;
  estimated_time: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface KanbanBoardDetail extends KanbanBoard {
  columns: KanbanColumn[];
  cards: KanbanCard[];
}

export interface CreateBoardInput {
  name: string;
  type: string;
  description: string | null;
}

export interface CreateColumnInput {
  board_id: string;
  name: string;
  sort_order: number;
  color: string | null;
}

export interface UpdateColumnInput {
  name: string | null;
  color: string | null;
  sort_order: number | null;
}

export interface CreateCardInput {
  board_id: string;
  column_id: string | null;
  title: string;
  description: string | null;
  priority: string;
  due_date: string | null;
  owner_user_id: string | null;
}

export interface UpdateCardInput {
  title: string | null;
  description: string | null;
  priority: string | null;
  due_date: string | null;          // varchar in DB
  start_date: string | null;        // varchar in DB
  owner_user_id: string | null;
  estimated_time: number | null;    // integer in DB
  parent_card_id: number | null;    // integer in DB
  project_id: number | null;        // integer in DB
  related_type: string | null;
  related_id: number | null;        // integer in DB
  recurrence_pattern: string | null;
  recurrence_interval: number | null;
  recurrence_end_date: string | null; // varchar in DB
}

export interface MoveCardInput {
  column_id: string | null;
  sort_order: number | null;
}

export const KANBAN_BOARDS_REPO = Symbol('KANBAN_BOARDS_REPO');

export interface IKanbanBoardsRepo {
  getBoards(): Promise<Result<KanbanBoard[]>>;
  getBoardById(boardId: string): Promise<Result<KanbanBoardDetail>>;
  createBoard(input: CreateBoardInput): Promise<Result<KanbanBoard>>;
  deleteBoard(boardId: string): Promise<Result<void>>;
  getMaxColumnOrder(boardId: string): Promise<Result<number>>;
  addColumn(input: CreateColumnInput): Promise<Result<KanbanColumn>>;
  updateColumn(boardId: string, columnId: string, input: UpdateColumnInput): Promise<Result<KanbanColumn>>;
  deleteColumn(boardId: string, columnId: string): Promise<Result<void>>;
  addCard(input: CreateCardInput): Promise<Result<KanbanCard>>;
  updateCard(id: string, input: UpdateCardInput): Promise<Result<KanbanCard>>;
  moveCard(id: string, input: MoveCardInput): Promise<Result<KanbanCard>>;
  deleteCard(id: string): Promise<Result<void>>;
}
