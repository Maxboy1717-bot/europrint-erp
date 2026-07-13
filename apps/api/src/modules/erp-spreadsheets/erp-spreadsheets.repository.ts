/**
 * @module erp-spreadsheets.repository
 * @description Drizzle CRUD for erp_spreadsheets (Jadval, Phase B-2). Owner-scoped reads;
 * soft-delete only. Mirrors erp-documents.repository (cells instead of content/content_html).
 */

import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db, erp_spreadsheets } from '@shared/db';
import type { ErpSpreadsheetRow } from '@shared/db';

export interface CreateSheetInput {
  title: string;
  cells: unknown;
  sensitivityTier: string;
  ownerId: number;
}

export interface UpdateSheetPatch {
  title?: string;
  cells?: unknown;
  sensitivityTier?: string;
}

@Injectable()
export class ErpSpreadsheetsRepository {
  async create(input: CreateSheetInput): Promise<ErpSpreadsheetRow> {
    const [row] = await db
      .insert(erp_spreadsheets)
      .values({
        title: input.title,
        cells: input.cells as ErpSpreadsheetRow['cells'],
        sensitivity_tier: input.sensitivityTier,
        owner_id: input.ownerId,
      })
      .returning();
    return row;
  }

  async listByOwner(ownerId: number): Promise<ErpSpreadsheetRow[]> {
    return db
      .select()
      .from(erp_spreadsheets)
      .where(and(eq(erp_spreadsheets.owner_id, ownerId), isNull(erp_spreadsheets.deleted_at)))
      .orderBy(desc(erp_spreadsheets.updated_at));
  }

  async getById(id: string): Promise<ErpSpreadsheetRow | null> {
    const [row] = await db
      .select()
      .from(erp_spreadsheets)
      .where(and(eq(erp_spreadsheets.id, id), isNull(erp_spreadsheets.deleted_at)))
      .limit(1);
    return row ?? null;
  }

  async update(id: string, patch: UpdateSheetPatch): Promise<ErpSpreadsheetRow | null> {
    const set: Record<string, unknown> = { updated_at: new Date() };
    if (patch.title !== undefined) set.title = patch.title;
    if (patch.cells !== undefined) set.cells = patch.cells;
    if (patch.sensitivityTier !== undefined) set.sensitivity_tier = patch.sensitivityTier;
    set.version = sql`${erp_spreadsheets.version} + 1`;
    const [row] = await db
      .update(erp_spreadsheets)
      .set(set)
      .where(and(eq(erp_spreadsheets.id, id), isNull(erp_spreadsheets.deleted_at)))
      .returning();
    return row ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const rows = await db
      .update(erp_spreadsheets)
      .set({ deleted_at: new Date() })
      .where(and(eq(erp_spreadsheets.id, id), isNull(erp_spreadsheets.deleted_at)))
      .returning({ id: erp_spreadsheets.id });
    return rows.length > 0;
  }
}
