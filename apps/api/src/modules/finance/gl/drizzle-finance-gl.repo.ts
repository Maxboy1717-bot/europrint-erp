/**
 * @module drizzle-finance-gl.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { glDocuments, accounts, entries } from '@europrint/schemas';
import { eq, or, desc, count, sql } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';
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

  async createAccount(dto: Record<string, unknown>): Promise<Result<object>> {
    const VALID_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];
    const accountCode = String(dto.accountNumber ?? '').trim();
    const accountName = String(dto.accountName ?? '').trim();
    const accountType = String(dto.accountType ?? '').trim();
    if (!accountCode) return Err(AppErr('VALIDATION', 'Hisob kodi talab qilinadi'));
    if (!accountName) return Err(AppErr('VALIDATION', 'Hisob nomi talab qilinadi'));
    if (!VALID_TYPES.includes(accountType)) {
      return Err(AppErr('VALIDATION', `Hisob turi noto'g'ri. Ruxsat etilgan: ${VALID_TYPES.join(', ')}`));
    }
    try {
      const existing = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.accountCode, accountCode)).limit(1);
      if (existing.length > 0) return Err(AppErr('CONFLICT', `Hisob kodi '${accountCode}' allaqachon mavjud`));
      const parentId = dto.parentId;
      const values: typeof accounts.$inferInsert = {
        accountCode,
        accountName,
        accountType,
        ...(parentId !== undefined && parentId !== null && String(parentId).trim() !== '' ? { parentAccountId: String(parentId) } : {}),
        ...(typeof dto.active === 'boolean' ? { isActive: dto.active } : {}),
      };
      const result = await db.insert(accounts).values(values).returning();
      return Ok(result[0] as object);
    } catch (e: unknown) {
      const msg = (e as Error)?.message || 'Hisob yaratishda xatolik';
      if (/duplicate key|unique constraint/i.test(msg)) return Err(AppErr('CONFLICT', `Hisob kodi '${accountCode}' allaqachon mavjud`));
      return Err(AppErr('DB_ERROR', msg));
    }
  }

  async getTrialBalance(date?: string): Promise<Result<{ debit: number; credit: number; balanced: boolean; date: string }>> {
    try {
      const targetDate = date ?? new Date().toISOString().slice(0, 10);
      const rows = await db.select({
        totalDebit:  sql<number>`COALESCE(SUM(CASE WHEN ${entries.debitAccountId}  IS NOT NULL THEN ${entries.amount}::numeric ELSE 0 END), 0)`,
        totalCredit: sql<number>`COALESCE(SUM(CASE WHEN ${entries.creditAccountId} IS NOT NULL THEN ${entries.amount}::numeric ELSE 0 END), 0)`,
      }).from(entries)
        .where(sql`${entries.entryDate} <= ${targetDate}`);
      const debit  = Number(rows[0]?.totalDebit  ?? 0);
      const credit = Number(rows[0]?.totalCredit ?? 0);
      return Ok({ debit, credit, balanced: Math.abs(debit - credit) < 0.01, date: targetDate });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Trial balance xatolik'); }
  }

  async getLedger(accountCode: string, limit = 50, offset = 0): Promise<Result<Row[]>> {
    try {
      const rows = await db.select().from(entries)
        .where(or(
          eq(entries.debitAccountId,  accountCode),
          eq(entries.creditAccountId, accountCode),
        ))
        .orderBy(desc(entries.entryDate))
        .limit(limit).offset(offset);
      return Ok(rows as Row[]);
    } catch (e: unknown) { return Err((e as Error)?.message || 'Ledger xatolik'); }
  }
}
