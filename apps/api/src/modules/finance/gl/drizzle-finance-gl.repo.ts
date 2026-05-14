/**
 * @module drizzle-finance-gl.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { glDocuments, accounts } from '@europrint/schemas';
import { eq, isNull, desc, count } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IFinanceGlRepository } from './i-finance-gl.repo';

type Row = Record<string, unknown>;
type GlDocumentRow = typeof glDocuments.$inferSelect;

@Injectable()
export class DrizzleFinanceGlRepository implements IFinanceGlRepository {
  async findAllDocuments(limit: number, offset: number): Promise<Result<{ data: GlDocumentRow[]; count: number }>> {
    try {
      const [countResult, data] = await Promise.all([
        db.select({ count: count() }).from(glDocuments),
        db.select().from(glDocuments).orderBy(desc(glDocuments.createdAt)).limit(limit).offset(offset),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'GL hujjatlar topilmadi'); }
  }

  async findAllAccounts(): Promise<Result<object[]>> {
    try {
      const rows = await db.select().from(accounts);
      return Ok(rows);
    } catch (e: unknown) { return Err((e as Error)?.message || 'GL hisoblar topilmadi'); }
  }

  async findAccountById(id: number): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1).offset(0);
      return Ok((rows)[0] || null);
    } catch (e: unknown) { return Err((e as Error)?.message || `GL hisob #${id} topilmadi`); }
  }

  async postDocument(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(glDocuments).values({ ...dto, status: 'posted' } as typeof glDocuments.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Hujjat joylashtirishda xatolik'); }
  }

  async seedAccounts(rows: Record<string, unknown>[]): Promise<Result<object[]>> {
    try {
      const results = await db
        .insert(accounts)
        .values(rows as (typeof accounts.$inferInsert)[])
        .onConflictDoNothing()
        .returning();
      return Ok(results);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Hisoblarni seed qilishda xatolik'); }
  }
}
