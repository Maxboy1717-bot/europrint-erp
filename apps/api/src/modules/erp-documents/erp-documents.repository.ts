/**
 * @module erp-documents.repository
 * @description Drizzle CRUD for erp_documents (erkin hujjatlar, Phase A2). Owner-scoped
 * reads; soft-delete only (deleted_at) — audited documents are never hard-deleted.
 */

import { Injectable } from '@nestjs/common';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db, erp_documents } from '@shared/db';
import type { ErpDocumentRow } from '@shared/db';

export interface CreateErpDocInput {
  title: string;
  content: unknown;
  contentHtml?: string | null;
  sensitivityTier: string;
  ownerId: number;
}

export interface UpdateErpDocPatch {
  title?: string;
  content?: unknown;
  contentHtml?: string | null;
  sensitivityTier?: string;
}

@Injectable()
export class ErpDocumentsRepository {
  async create(input: CreateErpDocInput): Promise<ErpDocumentRow> {
    const [row] = await db
      .insert(erp_documents)
      .values({
        title: input.title,
        content: input.content as ErpDocumentRow['content'],
        content_html: input.contentHtml ?? null,
        sensitivity_tier: input.sensitivityTier,
        owner_id: input.ownerId,
      })
      .returning();
    return row;
  }

  async listByOwner(ownerId: number): Promise<ErpDocumentRow[]> {
    return db
      .select()
      .from(erp_documents)
      .where(and(eq(erp_documents.owner_id, ownerId), isNull(erp_documents.deleted_at)))
      .orderBy(desc(erp_documents.updated_at));
  }

  async getById(id: string): Promise<ErpDocumentRow | null> {
    const [row] = await db
      .select()
      .from(erp_documents)
      .where(and(eq(erp_documents.id, id), isNull(erp_documents.deleted_at)))
      .limit(1);
    return row ?? null;
  }

  async update(id: string, patch: UpdateErpDocPatch): Promise<ErpDocumentRow | null> {
    const set: Record<string, unknown> = { updated_at: new Date() };
    if (patch.title !== undefined) set.title = patch.title;
    if (patch.content !== undefined) set.content = patch.content;
    if (patch.contentHtml !== undefined) set.content_html = patch.contentHtml;
    if (patch.sensitivityTier !== undefined) set.sensitivity_tier = patch.sensitivityTier;
    // Bump version on every save (simple monotonic counter; full history is a later option).
    set.version = sql`${erp_documents.version} + 1`;
    const [row] = await db
      .update(erp_documents)
      .set(set)
      .where(and(eq(erp_documents.id, id), isNull(erp_documents.deleted_at)))
      .returning();
    return row ?? null;
  }

  async softDelete(id: string): Promise<boolean> {
    const rows = await db
      .update(erp_documents)
      .set({ deleted_at: new Date() })
      .where(and(eq(erp_documents.id, id), isNull(erp_documents.deleted_at)))
      .returning({ id: erp_documents.id });
    return rows.length > 0;
  }
}
