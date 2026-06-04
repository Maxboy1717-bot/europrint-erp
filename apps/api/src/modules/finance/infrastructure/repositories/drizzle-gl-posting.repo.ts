/**
 * @module drizzle-gl-posting.repo
 * @description Repository / data-access layer. Inserts GL journal entries into the
 * `entries` table. Wraps Drizzle ORM queries; returns Result<T>.
 * NOTE: Imports `entries` from @workspace/db (canonical fi-gl schema with entryNumber)
 * rather than @europrint/schemas which resolves to the stub (missing entryNumber column).
 * @layer Infrastructure (Finance)
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { entries } from '@workspace/db';
import { Result, Ok, Err, AppErr } from '@common/result';
import { IGlPostingRepository } from '../../domain/repositories/i-gl-posting.repo';

@Injectable()
export class DrizzleGlPostingRepository implements IGlPostingRepository {
  async insertEntry(data: {
    entryNumber: string;
    entryDate: string;
    documentType: string;
    documentId?: string;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    description?: string;
    createdBy?: number;
  }): Promise<Result<number>> {
    try {
      const insertValues: typeof entries.$inferInsert = {
        entryNumber: data.entryNumber,
        entryDate: data.entryDate,
        documentType: data.documentType,
        documentId: data.documentId ?? null,
        debitAccountId: data.debitAccountId,
        creditAccountId: data.creditAccountId,
        amount: data.amount,
        description: data.description ?? null,
        createdBy: data.createdBy ?? null,
      };

      const result = await db
        .insert(entries)
        .values(insertValues)
        .returning({ id: entries.id });

      const inserted = result[0];
      if (!inserted) {
        return Err(AppErr('DB_ERROR', 'GL entry insert returned no rows'));
      }
      return Ok(inserted.id);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `GL_INSERT_FAILED: ${String(e)}`));
    }
  }

  async insertJournal(rows: Array<{
    entryNumber: string;
    entryDate: string;
    documentType: string;
    documentId?: string;
    debitAccountId: string;
    creditAccountId: string;
    amount: number;
    description?: string;
    createdBy?: number;
  }>): Promise<Result<number>> {
    try {
      // Atomic: all journal legs commit together — a mid-journal failure rolls
      // back every leg (no orphaned half-journal). Mirrors saveBudget pattern.
      const firstId = await db.transaction(async (tx) => {
        let first: number | undefined;
        for (const row of rows) {
          const insertValues: typeof entries.$inferInsert = {
            entryNumber: row.entryNumber,
            entryDate: row.entryDate,
            documentType: row.documentType,
            documentId: row.documentId ?? null,
            debitAccountId: row.debitAccountId,
            creditAccountId: row.creditAccountId,
            amount: row.amount,
            description: row.description ?? null,
            createdBy: row.createdBy ?? null,
          };
          const inserted = await tx.insert(entries).values(insertValues).returning({ id: entries.id });
          if (!inserted[0]) throw new Error('GL entry insert returned no rows');
          if (first === undefined) first = inserted[0].id;
        }
        return first ?? 0;
      });
      return Ok(firstId);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `GL_JOURNAL_INSERT_FAILED: ${String(e)}`));
    }
  }
}
