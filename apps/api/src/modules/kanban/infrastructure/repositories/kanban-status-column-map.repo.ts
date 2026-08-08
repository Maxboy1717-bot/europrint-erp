/**
 * @module kanban-status-column-map.repo
 * @description Repository / data-access layer for `kanban_status_column_map`
 *   (schema-kanban.ts:97-102). This is ONLY the in-app CRUD surface so an admin
 *   can populate/edit the (sd_status -> kanban_column_id) rules from inside the
 *   ERP instead of raw SQL. The mechanism that actually READS this table to
 *   auto-move kanban cards (`KanbanCardsRepository.moveOrderCardByStatusMap`,
 *   triggered from `OrderStatusChangedKanbanHandler`) is untouched — this repo
 *   is a separate, independent slice living alongside it.
 *
 * DB note: `kanban_status_column_map.kanban_column_id` has a live FK constraint
 * (`kanban_status_column_map_kanban_column_id_fkey` -> kanban_columns(id)) and
 * `sd_status` has a live UNIQUE constraint (`kanban_status_column_map_sd_status_key`)
 * even though the Drizzle table declaration in schema-kanban.ts doesn't spell out
 * `.references()` inline — verified live via `_audit/q.cjs` (2026-08-03). Both are
 * caught below (Postgres codes 23503 / 23505) and translated to clean Result errors.
 */

import { Injectable, Logger } from '@nestjs/common';
import { eq, isNull, asc } from 'drizzle-orm';
import { db } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';
import { kanbanStatusColumnMap, kanbanColumns, kanbanBoards } from '../kanban-tables';

export interface StatusColumnMappingRow {
  id: number;
  sdStatus: string;
  kanbanColumnId: number;
  columnName: string;
  boardId: number;
  boardName: string;
  createdAt: Date | null;
}

export interface KanbanColumnOptionRow {
  id: number;
  name: string;
  boardId: number;
  boardName: string;
}

export interface CreateStatusColumnMapInput {
  sdStatus: string;
  kanbanColumnId: number;
}

export interface UpdateStatusColumnMapInput {
  sdStatus?: string;
  kanbanColumnId?: number;
}

const PG_UNIQUE_VIOLATION     = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

@Injectable()
export class KanbanStatusColumnMapRepository {
  private readonly logger = new Logger(KanbanStatusColumnMapRepository.name);

  /** Barcha xarita qatorlari, ustun nomi + board nomi bilan (o'qilishi uchun JOIN). */
  async listMappings(): Promise<Result<StatusColumnMappingRow[]>> {
    try {
      const rows = await db
        .select({
          id:             kanbanStatusColumnMap.id,
          sdStatus:       kanbanStatusColumnMap.sdStatus,
          kanbanColumnId: kanbanStatusColumnMap.kanbanColumnId,
          columnName:     kanbanColumns.name,
          boardId:        kanbanColumns.board_id,
          boardName:      kanbanBoards.name,
          createdAt:      kanbanStatusColumnMap.createdAt,
        })
        .from(kanbanStatusColumnMap)
        .innerJoin(kanbanColumns, eq(kanbanStatusColumnMap.kanbanColumnId, kanbanColumns.id))
        .innerJoin(kanbanBoards, eq(kanbanColumns.board_id, kanbanBoards.id))
        .orderBy(asc(kanbanStatusColumnMap.sdStatus));
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (error) {
      this.logger.error('listMappings: ' + (error as Error).message);
      return Err(AppErr('DB_ERROR', (error as Error).message));
    }
  }

  /** Mavjud kanban ustunlari (create/edit formadagi dropdown uchun). */
  async listColumns(): Promise<Result<KanbanColumnOptionRow[]>> {
    try {
      const rows = await db
        .select({
          id:        kanbanColumns.id,
          name:      kanbanColumns.name,
          boardId:   kanbanColumns.board_id,
          boardName: kanbanBoards.name,
        })
        .from(kanbanColumns)
        .innerJoin(kanbanBoards, eq(kanbanColumns.board_id, kanbanBoards.id))
        .where(isNull(kanbanColumns.deleted_at))
        .orderBy(asc(kanbanBoards.name), asc(kanbanColumns.sort_order));
      return Ok(Array.isArray(rows) ? rows : []);
    } catch (error) {
      this.logger.error('listColumns: ' + (error as Error).message);
      return Err(AppErr('DB_ERROR', (error as Error).message));
    }
  }

  async createMapping(input: CreateStatusColumnMapInput): Promise<Result<StatusColumnMappingRow>> {
    try {
      const rows = await db
        .insert(kanbanStatusColumnMap)
        .values({ sdStatus: input.sdStatus, kanbanColumnId: input.kanbanColumnId })
        .returning();
      const created = rows[0];
      if (!created) return Err(AppErr('DB_ERROR', 'Xarita qatori yaratilmadi'));

      const withJoin = await this.findById(created.id);
      if (withJoin.ok) return withJoin;
      // Column/board join lookup failed for some reason — still return the raw row.
      return Ok({
        id: created.id,
        sdStatus: created.sdStatus,
        kanbanColumnId: created.kanbanColumnId,
        columnName: '',
        boardId: 0,
        boardName: '',
        createdAt: created.createdAt ?? null,
      });
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === PG_UNIQUE_VIOLATION) {
        return Err(AppErr('CONFLICT', `"${input.sdStatus}" holati uchun xarita allaqachon mavjud`));
      }
      if (code === PG_FOREIGN_KEY_VIOLATION) {
        return Err(AppErr('VALIDATION', `kanbanColumnId=${input.kanbanColumnId} — bunday ustun mavjud emas`));
      }
      this.logger.error('createMapping: ' + (error as Error).message);
      return Err(AppErr('DB_ERROR', (error as Error).message));
    }
  }

  async updateMapping(id: number, input: UpdateStatusColumnMapInput): Promise<Result<StatusColumnMappingRow>> {
    try {
      const patch: Partial<typeof kanbanStatusColumnMap.$inferInsert> = {};
      if (input.sdStatus !== undefined) patch.sdStatus = input.sdStatus;
      if (input.kanbanColumnId !== undefined) patch.kanbanColumnId = input.kanbanColumnId;

      if (Object.keys(patch).length === 0) {
        return this.findById(id);
      }

      const rows = await db
        .update(kanbanStatusColumnMap)
        .set(patch)
        .where(eq(kanbanStatusColumnMap.id, id))
        .returning();
      const updated = rows[0];
      if (!updated) return Err(AppErr('NOT_FOUND', `Xarita qatori topilmadi: id=${id}`));

      const withJoin = await this.findById(updated.id);
      return withJoin.ok ? withJoin : Ok({
        id: updated.id,
        sdStatus: updated.sdStatus,
        kanbanColumnId: updated.kanbanColumnId,
        columnName: '',
        boardId: 0,
        boardName: '',
        createdAt: updated.createdAt ?? null,
      });
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (code === PG_UNIQUE_VIOLATION) {
        return Err(AppErr('CONFLICT', `"${input.sdStatus}" holati uchun xarita allaqachon mavjud`));
      }
      if (code === PG_FOREIGN_KEY_VIOLATION) {
        return Err(AppErr('VALIDATION', `kanbanColumnId=${input.kanbanColumnId} — bunday ustun mavjud emas`));
      }
      this.logger.error('updateMapping: ' + (error as Error).message);
      return Err(AppErr('DB_ERROR', (error as Error).message));
    }
  }

  async deleteMapping(id: number): Promise<Result<void>> {
    try {
      const rows = await db
        .delete(kanbanStatusColumnMap)
        .where(eq(kanbanStatusColumnMap.id, id))
        .returning({ id: kanbanStatusColumnMap.id });
      if (!rows[0]) return Err(AppErr('NOT_FOUND', `Xarita qatori topilmadi: id=${id}`));
      return Ok(undefined);
    } catch (error) {
      this.logger.error('deleteMapping: ' + (error as Error).message);
      return Err(AppErr('DB_ERROR', (error as Error).message));
    }
  }

  private async findById(id: number): Promise<Result<StatusColumnMappingRow>> {
    try {
      const rows = await db
        .select({
          id:             kanbanStatusColumnMap.id,
          sdStatus:       kanbanStatusColumnMap.sdStatus,
          kanbanColumnId: kanbanStatusColumnMap.kanbanColumnId,
          columnName:     kanbanColumns.name,
          boardId:        kanbanColumns.board_id,
          boardName:      kanbanBoards.name,
          createdAt:      kanbanStatusColumnMap.createdAt,
        })
        .from(kanbanStatusColumnMap)
        .innerJoin(kanbanColumns, eq(kanbanStatusColumnMap.kanbanColumnId, kanbanColumns.id))
        .innerJoin(kanbanBoards, eq(kanbanColumns.board_id, kanbanBoards.id))
        .where(eq(kanbanStatusColumnMap.id, id))
        .limit(1);
      const row = rows[0];
      if (!row) return Err(AppErr('NOT_FOUND', `Xarita qatori topilmadi: id=${id}`));
      return Ok(row);
    } catch (error) {
      this.logger.error('findById: ' + (error as Error).message);
      return Err(AppErr('DB_ERROR', (error as Error).message));
    }
  }
}
