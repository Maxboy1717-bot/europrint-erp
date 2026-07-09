/**
 * @module i-kanban-boards.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';

/** Kanban karta ko'rinishini hisoblash uchun kerakli minimal viewer konteksti (M0). */
export interface KanbanViewerContext {
  id: number;
  role?: string;
}

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
  /** G4: UUID manbalar (masalan cc_document) uchun — related_id INTEGER, UUID sig'maydi. */
  related_ref: string | null;
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
  /** EP-KAN-027: kim topshirdi (assigner) — assigner-confirm uchun. Odatda yaratuvchi. */
  assigner_user_id: string | null;
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

/**
 * Payload used by {@link IKanbanBoardsRepo.createKanbanForOrder} to record the
 * minimum sales-order context required to construct an inbox kanban card.
 */
export interface CreateKanbanForOrderInput {
  orderId:     number;
  orderNumber: string;
  totalAmount: number;
  companyId:   number;
}

export const KANBAN_BOARDS_REPO = Symbol('KANBAN_BOARDS_REPO');

export interface IKanbanBoardsRepo {
  getBoards(): Promise<Result<KanbanBoard[]>>;
  getBoardById(boardId: string, viewer?: KanbanViewerContext): Promise<Result<KanbanBoardDetail>>;
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

  /**
   * Locates the sales/order board (by `type='sales'` or a fuzzy name match) and
   * inserts an inbox card for the freshly created order. Wrapped in a DB
   * transaction so the board/column lookup and the card insert are atomic.
   *
   * If no matching board or column exists, the method returns Ok(void) without
   * inserting — this is the same "skip silently" semantic the original raw-SQL
   * handler used so a missing kanban board never blocks order creation.
   */
  createKanbanForOrder(input: CreateKanbanForOrderInput): Promise<Result<void>>;

  /**
   * Moves all kanban cards linked to `orderId` into the board's "cancelled"
   * column (if one exists) and appends a `[Bekor qilindi: <orderNumber>]` note
   * to each card's description. If no cancelled column exists for the card's
   * board the cards are soft-deleted instead. Wrapped in a DB transaction so
   * the column lookup, the update, and the fallback soft-delete are atomic.
   */
  moveOrderCardToCancelled(orderId: number, orderNumber: string): Promise<Result<void>>;

  /**
   * Golden-thread sync (§15 #127 / vision #22): when a sales order's status
   * changes, append a dated status note to every kanban card linked to that
   * order (`related_type='sales_order'`) so the transition is visible/auditable
   * on the card. Mirrors the note-append half of {@link moveOrderCardToCancelled}
   * but does NOT move the card between columns — the status→column mapping is an
   * owner policy decision (Guruh-B). Best-effort: when no card is linked to the
   * order this is a no-op that still returns Ok(void).
   */
  appendOrderStatusNote(
    orderId: number,
    oldStatus: string,
    newStatus: string,
  ): Promise<Result<void>>;

  /**
   * SD status → Kanban column auto-move (owner-decisions batch item 4, Guruh-B).
   * Reads the `kanban_status_column_map` rule for `newStatus` and, if present, moves
   * every linked sales_order card to the mapped column (same board only, and only
   * when it changes column; sort_order = MAX+1 in the target). INERT by default: the
   * map ships with ZERO rows, so with no rule this is a no-op that returns Ok(void).
   * SEPARATE from {@link appendOrderStatusNote} (note-append stays column-agnostic).
   * Best-effort: any failure returns Err (never throws) so a move miss can't break
   * the SD status change.
   */
  moveOrderCardByStatusMap(orderId: number, newStatus: string): Promise<Result<void>>;
}
