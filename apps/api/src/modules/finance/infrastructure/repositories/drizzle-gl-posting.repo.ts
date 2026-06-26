/**
 * @module drizzle-gl-posting.repo
 * @description Repository / data-access layer. Inserts GL journal entries into the
 * `entries` table. Wraps Drizzle ORM queries; returns Result<T>.
 * NOTE: Imports `entries` from @workspace/db (canonical fi-gl schema with entryNumber)
 * rather than @europrint/schemas which resolves to the stub (missing entryNumber column).
 * @layer Infrastructure (Finance)
 */

import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { entries, accounts } from '@workspace/db';
import { sql, inArray } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';
import { IGlPostingRepository } from '../../domain/repositories/i-gl-posting.repo';

/**
 * Resolve GL account CODES (e.g. '5010') to the integer accounts.id the live `entries.*_account_id`
 * columns require (the Drizzle def says varchar but the live columns are integer FKs to accounts.id).
 * Returns a code→id map; callers Err if any code is missing rather than insert a wrong/NULL account.
 */
async function resolveAccountIds(codes: string[]): Promise<Map<string, number>> {
  const distinct = [...new Set(codes.filter(Boolean))];
  if (distinct.length === 0) return new Map();
  // inArray -> "account_code IN ($1,$2,...)". (A raw sql`= ANY(${distinct})` mis-binds the
  // JS array as a row tuple "ANY(($1,$2))" which Postgres rejects, breaking every multi-leg journal.)
  const rows = await db
    .select({ account_code: accounts.accountCode, id: accounts.id })
    .from(accounts)
    .where(inArray(accounts.accountCode, distinct));
  return new Map((Array.isArray(rows) ? rows : []).map((r) => [String(r.account_code), Number(r.id)]));
}

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
      // #04 fix: rows carry account CODES in debitAccountId/creditAccountId (both real legs, no 'OFFSET').
      // Resolve them to integer accounts.id (live entries.*_account_id are integer) before insert; if any
      // code is absent from the chart of accounts, fail honestly (no wrong/NULL account, no fake-green).
      const idByCode = await resolveAccountIds(rows.flatMap((r) => [r.debitAccountId, r.creditAccountId]));
      const missing = [...new Set(rows.flatMap((r) => [r.debitAccountId, r.creditAccountId]).filter((c) => c && !idByCode.has(c)))];
      if (missing.length) return Err(AppErr('DB_ERROR', `GL account code(s) not in chart of accounts: ${missing.join(', ')}`));

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
            debitAccountId: String(idByCode.get(row.debitAccountId)),   // int accounts.id (Drizzle varchar drift)
            creditAccountId: String(idByCode.get(row.creditAccountId)),
            debitAccount: row.debitAccountId,                            // human-readable code text
            creditAccount: row.creditAccountId,
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

  async findEntryIdByReference(reference: string): Promise<Result<number | null>> {
    try {
      // entry_number is `${reference}-${ts}-${n}`; the trailing '-' separator makes the prefix exact
      // (SI-123-% does NOT match SI-1234-...). Returns the earliest entry id for this business event.
      const res = await runQuery<{ id: number }>(
        sql`SELECT id FROM entries WHERE entry_number LIKE ${reference + '-%'} ORDER BY id LIMIT 1`,
      );
      const row = Array.isArray(res.rows) ? res.rows[0] : undefined;
      return Ok(row ? Number(row.id) : null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `GL_REF_LOOKUP_FAILED: ${String(e)}`));
    }
  }

  async findClosedPeriodForDate(entryDate: string): Promise<Result<{ id: number; periodCode: string } | null>> {
    try {
      // EP-FIN-064 period lock. accounting_periods.start_date/end_date and entries.entry_date are all
      // varchar ISO dates (YYYY-MM-DD) → lexicographic BETWEEN is the correct calendar order for ISO.
      // A period is locked when status='closed' OR is_closed=true (both columns track the same fact).
      // We pick the first locked period that contains the entry date; an open/absent period → null (allowed).
      const res = await runQuery<{ id: number; period_code: string }>(
        sql`SELECT id, period_code
              FROM accounting_periods
             WHERE (status = 'closed' OR is_closed = true)
               AND ${entryDate} >= start_date
               AND ${entryDate} <= end_date
             ORDER BY id
             LIMIT 1`,
      );
      const row = Array.isArray(res.rows) ? res.rows[0] : undefined;
      return Ok(row ? { id: Number(row.id), periodCode: String(row.period_code) } : null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `GL_PERIOD_LOOKUP_FAILED: ${String(e)}`));
    }
  }
}
