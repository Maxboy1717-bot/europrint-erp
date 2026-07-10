/**
 * @module i-crm-deals.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Result } from '@common/result';
type Row = Record<string, unknown>;

/**
 * One append-only stage-transition audit row (VISION-3340 #34). Shared shape used by
 * both the deal and lead repos' recordStageHistory(). `entityId` is a string so it can
 * carry a deal UUID or a stringified lead id; `fromStage` is null when the prior stage
 * is unknown; `changedBy` is null when no acting user is available.
 */
export interface StageHistoryEntry {
  entityType: 'deal' | 'lead';
  entityId: string;
  fromStage: string | null;
  toStage: string;
  changedBy: number | null;
}

/**
 * One CRM-export audit entry (Item 14, vision 13-crm#14). Captures who exported, under what role,
 * how many rows, and whether the result was row-scoped (non-privileged) or a full dump (privileged).
 */
export interface ExportAuditEntry {
  userId: number | null;
  userRole: string | null;
  rowCount: number;
  scoped: boolean;
}

export interface ICrmDealsRepository {
  // ownerId (Item A row-scoping): when provided (non-privileged caller), restrict to that owner's deals.
  findAll(limit: number, offset: number, ownerId?: number | null): Promise<Result<{ data: Row[]; count: number }>>;
  /** Item 14: full row-scoped export dump (no pagination, safety-capped). ownerId null → privileged → all rows. */
  findAllForExport(ownerId?: number | null): Promise<Result<Row[]>>;
  /** Item 14: append an 'export' audit_logs row (vision 13-crm#14 "eksport urinishi loglanadi"). */
  recordExportAudit(entry: ExportAuditEntry): Promise<Result<void>>;
  findById(id: string): Promise<Result<any | null>>;
  create(dto: Record<string, unknown>, createdBy?: number): Promise<Result<Record<string, unknown>>>;
  update(id: string, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>>;
  softDelete(id: string): Promise<Result<void>>;
  /** VISION-3340 #34: append a stage-change audit row to crm_stage_history. */
  recordStageHistory(entry: StageHistoryEntry): Promise<Result<void>>;
}
export const CRM_DEALS_REPO = 'ICrmDealsRepository';
