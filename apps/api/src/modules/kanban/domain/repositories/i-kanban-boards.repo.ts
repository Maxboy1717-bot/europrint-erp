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
  /** Per-column WIP-limit override (owner decision 2026-07-13). NULL = use the
   *  global KANBAN_WIP_LIMIT_JARAYONDA default (kanban-boards.service.ts). */
  wip_limit: number | null;
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
  /** Owner 4-field request (2026-07-13): Tiraj/progress — numeric column, pg driver returns numeric as string. */
  progress: string | null;
  /** Owner 4-field request (2026-07-13): stansiya-operator — FK -> work_centers.id. */
  station_operator_id: number | null;
  /** Owner 4-field request (2026-07-13): Izoh-belgi — "has important note" flag. */
  comment_flag: boolean;
  /** Owner 2026-07-13: hide from the general board (kanban-visibility.helper.ts kanbanConfidentialClause). */
  is_confidential: boolean;
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
  /** Per-column WIP-limit override (owner decision 2026-07-13). NULL = use the
   *  global KANBAN_WIP_LIMIT_JARAYONDA default. */
  wip_limit: number | null;
}

export interface UpdateColumnInput {
  name: string | null;
  color: string | null;
  sort_order: number | null;
  /** Per-column WIP-limit override (owner decision 2026-07-13). NULL leaves the
   *  column's current wip_limit unchanged (repo update uses COALESCE). */
  wip_limit: number | null;
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
  /** Owner 4-field request (2026-07-13): Tiraj/progress. */
  progress: number | null;
  /** Owner 4-field request (2026-07-13): stansiya-operator — FK -> work_centers.id. */
  station_operator_id: string | null;
  /** Owner 4-field request (2026-07-13): Izoh-belgi flag. DB column is NOT NULL DEFAULT false. */
  comment_flag: boolean;
  /** Owner 2026-07-13: confidential-card flag; null -> DB default (false). */
  is_confidential: boolean | null;
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
  /** Owner 4-field request (2026-07-13): Tiraj/progress. null = no change (COALESCE). */
  progress: number | null;
  /** Owner 4-field request (2026-07-13): stansiya-operator FK. null = no change (COALESCE). */
  station_operator_id: number | null;
  /** Owner 4-field request (2026-07-13): Izoh-belgi flag. null = no change (COALESCE). */
  comment_flag: boolean | null;
  /** Owner 2026-07-13: null = leave unchanged (COALESCE), else set exactly. */
  is_confidential: boolean | null;
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

/**
 * Payload used by {@link IKanbanBoardsRepo.createKanbanForQcInspection}. `inspectionId`
 * is the live-DB `qc_inspections.id` (stringified) — see submit-inspection.handler.ts's
 * doc-comment confirming it has round-tripped through findById before the QcFailedEvent
 * is published, so it is safe to store as `related_id` (same String(id) convention as
 * {@link CreateKanbanForOrderInput}).
 */
export interface CreateKanbanForQcInspectionInput {
  inspectionId: string;
  orderId:      number;
  reason:       string;
}

/**
 * Payload used by {@link IKanbanBoardsRepo.createKanbanForMesSession}. `sessionId` and
 * `ppId` are both real integer ids (`mes_production_sessions.id` / production-plan id)
 * taken directly from the command, not a synthetic aggregate id.
 */
export interface CreateKanbanForMesSessionInput {
  sessionId: number;
  ppId:      number;
}

/**
 * Payload used by {@link IKanbanBoardsRepo.createKanbanForDesignTask}. `designOrderId`
 * is the `DesignOrder` aggregate's UUID (request-design.handler.ts: `design.id`) — it
 * is NOT the `design_orders` integer PK (pre-existing two-worlds drift; see the G4
 * `related_ref` convention already reserved for this exact case). `salesOrderId` is the
 * real `sales_orders.id`.
 */
export interface CreateKanbanForDesignTaskInput {
  designOrderId: string;
  salesOrderId:  number;
  customerId:    number;
}

/**
 * Payload used by {@link IKanbanBoardsRepo.createKanbanForMaintenanceRequest}.
 * `requestId`/`taskId` are real integer ids (`mes_maintenance_requests.id` /
 * `mes_maintenance_tasks.id`) created by `MesMaintenanceRepository.createFromDowntime`
 * when an emergency/breakdown downtime auto-opens a technician task (VISION 08-mes#37).
 */
export interface CreateKanbanForMaintenanceInput {
  requestId:   number;
  taskId:      number;
  equipmentId: number | null;
  reasonCode:  string;
  description: string;
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

  /**
   * QC/MES/Design/waste Kanban fan-out (owner decision 2026-07-13): mirrors
   * {@link createKanbanForOrder}'s board-lookup + card-insert shape, but targets a
   * QC-labelled board (`type='qc'` or a fuzzy name match) instead of the sales board.
   * Same "skip silently, never block the source workflow" semantic — if no QC board
   * exists yet this returns Ok(void) without inserting.
   */
  createKanbanForQcInspection(input: CreateKanbanForQcInspectionInput): Promise<Result<void>>;

  /**
   * QC/MES/Design/waste Kanban fan-out (owner decision 2026-07-13): mirrors
   * {@link createKanbanForOrder} but targets a production/MES-labelled board. Same
   * "skip silently" semantic as {@link createKanbanForQcInspection}.
   */
  createKanbanForMesSession(input: CreateKanbanForMesSessionInput): Promise<Result<void>>;

  /**
   * QC/MES/Design/waste Kanban fan-out (owner decision 2026-07-13): mirrors
   * {@link createKanbanForOrder} but targets a design-labelled board. Stores
   * `designOrderId` in `related_ref` (not `related_id`) since it is a UUID, not the
   * integer `design_orders` PK — see {@link CreateKanbanForDesignTaskInput}. Same
   * "skip silently" semantic as {@link createKanbanForQcInspection}.
   */
  createKanbanForDesignTask(input: CreateKanbanForDesignTaskInput): Promise<Result<void>>;

  /**
   * MES emergency/breakdown downtime Kanban fan-out (VISION 08-mes#37 completion —
   * mirrors {@link createKanbanForMesSession}'s board-lookup + card-insert shape).
   * Targets a maintenance/MES-labelled board (`type='maintenance'`/`'mes'` or a fuzzy
   * name match). Same "skip silently, never block the source workflow" semantic as
   * {@link createKanbanForQcInspection} — a missing board never blocks the already
   * persisted `mes_maintenance_requests`/`mes_maintenance_tasks` rows.
   */
  createKanbanForMaintenanceRequest(input: CreateKanbanForMaintenanceInput): Promise<Result<void>>;
}
