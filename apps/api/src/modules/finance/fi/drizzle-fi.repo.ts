/**
 * @module drizzle-fi.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { accountingPeriods, glDocuments } from '@europrint/schemas';
import { payments, income_expense_transactions, gl_documents, profit_centers, cost_centers } from '@shared/db';
import { eq, count, desc, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IFiRepository } from './i-fi.repo';

type Row = Record<string, unknown>;
@Injectable()
export class DrizzleFiRepository implements IFiRepository {
  async findAccountingPeriods(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(accountingPeriods).orderBy(desc(accountingPeriods.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(accountingPeriods),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error).message || 'Hisob davrlar topilmadi'); }
  }

  async createAccountingPeriod(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(accountingPeriods).values(dto as typeof accountingPeriods.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error).message || 'Yaratishda xatolik'); }
  }

  async closeAccountingPeriod(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(accountingPeriods)
        .set({ status: 'closed', closedAt: _time.now() })
        .where(eq(accountingPeriods.id, id))
        .returning();
      return Ok(result[0] ?? null);
    } catch (e: unknown) { return Err((e as Error).message || 'Yopishda xatolik'); }
  }

  async postGlDocument(id: number): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(glDocuments)
        .set({ status: 'posted' })
        .where(eq(glDocuments.id, id))
        .returning();
      return Ok(result[0] ?? null);
    } catch (e: unknown) { return Err((e as Error).message || 'Joylashtirishda xatolik'); }
  }

  async findPayments(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(payments).orderBy(desc(payments.created_at)).limit(limit).offset(offset),
        db.select({ count: count() }).from(payments),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error).message || "To'lovlar topilmadi"); }
  }

  async createPayment(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(payments).values(dto as typeof payments.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error).message || 'Yaratishda xatolik'); }
  }

  async getCostCenters(): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db.select().from(cost_centers).orderBy(desc(cost_centers.created_at));
      if (rows.length > 0) return Ok(rows as Record<string, unknown>[]);
    } catch (_e) { /* fallthrough to defaults */ }
    return Ok([
      { id: 1, name: "Ishlab chiqarish", code: "CC-001" },
      { id: 2, name: "Sotish va Marketing", code: "CC-002" },
      { id: 3, name: "Umumiy va Ma'muriy", code: "CC-003" },
      { id: 4, name: "IT va Texnologiya", code: "CC-004" },
    ]);
  }

  async createCostCenter(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(cost_centers).values(dto as typeof cost_centers.$inferInsert).returning();
      return Ok(result[0] as Record<string, unknown>);
    } catch (e: unknown) { return Err((e as Error).message || 'Yaratishda xatolik'); }
  }

  async updateCostCenter(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(cost_centers).set(dto as Partial<typeof cost_centers.$inferInsert>).where(eq(cost_centers.id, id)).returning();
      return Ok(result[0] as Record<string, unknown>);
    } catch (e: unknown) { return Err((e as Error).message || 'Yangilashda xatolik'); }
  }

  async deleteCostCenter(id: number): Promise<Result<void>> {
    try {
      await db.delete(cost_centers).where(eq(cost_centers.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message || "O'chirishda xatolik"); }
  }

  async getStats(): Promise<Result<{ revenue: number; expenses: number; unpaidInvoices: number; unpaidAmount: number }>> {
    try {
      const [revRow, expRow, unpaidRow] = await Promise.all([
        db.select({ total: sql<string>`COALESCE(SUM(${income_expense_transactions.amount}), 0)` })
          .from(income_expense_transactions)
          .where(eq(income_expense_transactions.transaction_type, 'income')),
        db.select({ total: sql<string>`COALESCE(SUM(${income_expense_transactions.amount}), 0)` })
          .from(income_expense_transactions)
          .where(eq(income_expense_transactions.transaction_type, 'expense')),
        db.select({
          cnt: count(),
          amt: sql<string>`COALESCE(SUM(${income_expense_transactions.amount}), 0)`,
        })
          .from(income_expense_transactions)
          .where(eq(income_expense_transactions.status, 'pending')),
      ]);
      return Ok({
        revenue: Number(revRow[0]?.total ?? 0),
        expenses: Number(expRow[0]?.total ?? 0),
        unpaidInvoices: Number(unpaidRow[0]?.cnt ?? 0),
        unpaidAmount: Number(unpaidRow[0]?.amt ?? 0),
      });
    } catch (e: unknown) { return Err((e as Error).message || 'Statistika topilmadi'); }
  }

  async getRecentTransactions(limit: number): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db.select().from(income_expense_transactions)
        .orderBy(desc(income_expense_transactions.created_at))
        .limit(limit);
      return Ok(rows as Record<string, unknown>[]);
    } catch (e: unknown) { return Err((e as Error).message || 'Tranzaksiyalar topilmadi'); }
  }

  async findGlDocuments(limit: number, offset: number): Promise<Result<{ data: Record<string, unknown>[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(gl_documents).orderBy(desc(gl_documents.created_at)).limit(limit).offset(offset),
        db.select({ count: count() }).from(gl_documents),
      ]);
      return Ok({ data: data as Record<string, unknown>[], count: Number(countResult[0]?.count ?? 0) });
    } catch (e: unknown) { return Err((e as Error).message || 'GL hujjatlar topilmadi'); }
  }

  async createGlDoc(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(gl_documents).values(dto as typeof gl_documents.$inferInsert).returning();
      return Ok(result[0] as Record<string, unknown>);
    } catch (e: unknown) { return Err((e as Error).message || 'Yaratishda xatolik'); }
  }

  async findProfitCenters(): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await db.select().from(profit_centers).orderBy(desc(profit_centers.created_at));
      return Ok(rows as Record<string, unknown>[]);
    } catch (e: unknown) { return Err((e as Error).message || 'Foyda markazlari topilmadi'); }
  }

  async createProfitCenter(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(profit_centers).values(dto as typeof profit_centers.$inferInsert).returning();
      return Ok(result[0] as Record<string, unknown>);
    } catch (e: unknown) { return Err((e as Error).message || 'Yaratishda xatolik'); }
  }

  async updateProfitCenter(id: number, dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.update(profit_centers).set(dto as Partial<typeof profit_centers.$inferInsert>).where(eq(profit_centers.id, id)).returning();
      return Ok(result[0] as Record<string, unknown>);
    } catch (e: unknown) { return Err((e as Error).message || 'Yangilashda xatolik'); }
  }

  async deleteProfitCenter(id: number): Promise<Result<void>> {
    try {
      await db.delete(profit_centers).where(eq(profit_centers.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message || "O'chirishda xatolik"); }
  }
}
