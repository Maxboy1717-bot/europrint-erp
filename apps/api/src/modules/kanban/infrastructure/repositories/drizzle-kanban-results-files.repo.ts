/**
 * @module drizzle-kanban-results-files.repo
 * @description Results & Files sub-repository — split out of
 *   `DrizzleKanbanAnalyticsRepository` to keep individual files under 300
 *   lines (Rule 16). Public method names preserved; the parent repo delegates.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { and, eq, desc, isNull } from 'drizzle-orm';
import { db } from '@shared/db';
import { kanbanResults, kanbanResultFiles, kanbanFiles } from '@shared/db';
import { safeCall, Result, Err, Ok } from '@common/result';

@Injectable()
export class DrizzleKanbanResultsFilesRepository {

  // ─── Results ──────────────────────────────────────────────────────────────

  async getCardResults(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () =>
      db.select().from(kanbanResults)
        .where(eq(kanbanResults.cardId, cardId))
        .orderBy(desc(kanbanResults.createdAt)),
    );
  }

  async createResult(cardId: string, createdById: number, description?: string): Promise<Result<Record<string, unknown>>> {
    const rows = await safeCall(async () =>
      db.insert(kanbanResults).values({
        cardId,
        createdById,
        description: description ?? null,
      }).returning(),
    );
    if (!rows.ok) return Err(rows.error);
    const row = rows.data[0];
    if (!row) return Err('Natija yaratishda xato');
    return Ok(row);
  }

  async getResultFiles(resultId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () =>
      db.select().from(kanbanResultFiles)
        .where(eq(kanbanResultFiles.resultId, resultId))
        .orderBy(desc(kanbanResultFiles.createdAt)),
    );
  }

  async deleteResultFile(fileId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await db.delete(kanbanResultFiles).where(eq(kanbanResultFiles.id, fileId));
    });
  }

  async addResultFile(resultId: string, data: {
    fileName: string; fileUrl: string; fileSize?: number; mimeType?: string;
  }): Promise<Result<Record<string, unknown>>> {
    const rows = await safeCall(async () =>
      db.insert(kanbanResultFiles).values({
        resultId,
        fileName: data.fileName,
        fileUrl:  data.fileUrl,
        fileSize: data.fileSize ?? null,
        mimeType: data.mimeType ?? null,
      }).returning(),
    );
    if (!rows.ok) return Err(rows.error);
    const row = rows.data[0];
    if (!row) return Err('Natija faylini saqlashda xato');
    return Ok(row);
  }

  // ─── Files ────────────────────────────────────────────────────────────────

  async getCardFiles(cardId: string): Promise<Result<Record<string, unknown>[]>> {
    return safeCall(async () =>
      db.select().from(kanbanFiles)
        .where(and(eq(kanbanFiles.cardId, cardId), isNull(kanbanFiles.deletedAt)))
        .orderBy(desc(kanbanFiles.createdAt)),
    );
  }

  async createFile(data: {
    cardId: string; fileName: string; fileUrl: string;
    fileSize?: number; mimeType?: string; uploadedById?: number;
  }): Promise<Result<Record<string, unknown>>> {
    const rows = await safeCall(async () =>
      db.insert(kanbanFiles).values({
        cardId: data.cardId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize ?? null,
        mimeType: data.mimeType ?? null,
        uploadedById: data.uploadedById ?? null,
      }).returning(),
    );
    if (!rows.ok) return Err(rows.error);
    const row = rows.data[0];
    if (!row) return Err('Fayl saqlashda xato');
    return Ok(row);
  }

  async deleteFile(fileId: string): Promise<Result<void>> {
    return safeCall(async () => {
      await db.update(kanbanFiles)
        .set({ deletedAt: _time.now() })
        .where(eq(kanbanFiles.id, fileId));
    });
  }
}
