import { Injectable, Logger } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { salaryHistory, payrollPeriods, payrollRows } from '@europrint/schemas';
import { sql, eq, and, count, desc, gte, lte } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IHrPayrollRepository } from './i-hr-payroll.repo';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleHrPayrollRepository implements IHrPayrollRepository {
  private readonly logger = new Logger(DrizzleHrPayrollRepository.name);

  async findAll(opts: { limit: number; offset: number; userId?: number; changeType?: string; fromDate?: string; toDate?: string }): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const { limit, offset, userId, changeType, fromDate, toDate } = opts;
      const conditions = [];
      if (userId) conditions.push(eq(salaryHistory.userId, userId));
      if (changeType) conditions.push(eq(salaryHistory.changeType, changeType));
      if (fromDate) conditions.push(gte(salaryHistory.effectiveDate, new Date(String(fromDate))));
      if (toDate) conditions.push(lte(salaryHistory.effectiveDate, new Date(String(toDate))));
      const wh = conditions.length > 0 ? and(...conditions) : undefined;
      const [data, countResult] = await Promise.all([
        wh ? db.select().from(salaryHistory).where(wh).orderBy(desc(salaryHistory.createdAt)).limit(limit).offset(offset)
           : db.select().from(salaryHistory).orderBy(desc(salaryHistory.createdAt)).limit(limit).offset(offset),
        wh ? db.select({ count: count() }).from(salaryHistory).where(wh).limit(1).offset(0)
           : db.select({ count: count() }).from(salaryHistory).limit(1).offset(0),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error)?.message || 'Maosh tarixi topilmadi'); }
  }

  async create(dto: Record<string, unknown>): Promise<Result<Record<string, unknown>>> {
    try {
      const result = await db.insert(salaryHistory).values({ ...dto } as typeof salaryHistory.$inferInsert).returning();
      return Ok((result[0] as Record<string, unknown>));
    } catch (e: unknown) { return Err((e as Error)?.message || 'Yaratishda xatolik'); }
  }

  // ─── Payroll period closure (T7.4) ──────────────────────────────────────
  async findPeriodById(periodId: number): Promise<Result<Row | null>> {
    try {
      const rows = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, periodId)).limit(1);
      return Ok((Array.isArray(rows) ? (rows[0] ?? null) : null) as Row | null);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Davr #${periodId} topilmadi`);
    }
  }

  async listRowsByPeriod(periodId: number): Promise<Result<Row[]>> {
    try {
      const rows = await db.select().from(payrollRows).where(eq(payrollRows.periodId, periodId));
      return Ok((Array.isArray(rows) ? rows : []) as Row[]);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Payroll qatorlari topilmadi: #${periodId}`);
    }
  }

  async markPeriodClosed(periodId: number, _totals: { totalBase: number; totalBonus: number; totalDeductions: number; totalNet: number; rowCount: number }): Promise<Result<Row>> {
    try {
      // payroll_periods canonical schema uses `closed_at` (timestamp) — no `approvalDate` column.
      const rows = await db
        .update(payrollPeriods)
        .set({ status: 'closed', closed_at: new Date() })
        .where(eq(payrollPeriods.id, periodId))
        .returning();
      return Ok(((Array.isArray(rows) ? rows[0] : {}) ?? {}) as Row);
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Davr yopishda xatolik: #${periodId}`);
    }
  }

  async markRowsPosted(periodId: number): Promise<Result<{ updated: number }>> {
    try {
      const updated = await db
        .update(payrollRows)
        .set({ status: 'posted' })
        .where(eq(payrollRows.periodId, periodId))
        .returning({ id: payrollRows.id });
      return Ok({ updated: Array.isArray(updated) ? updated.length : 0 });
    } catch (e: unknown) {
      return Err((e as Error)?.message || `Qatorlarni posted qilishda xatolik: #${periodId}`);
    }
  }

  async insertGlJournalLines(
    periodId: number,
    lines: ReadonlyArray<{ account: string; debit: number; credit: number; memo: string }>,
  ): Promise<Result<{ inserted: number }>> {
    try {
      const safeLines = Array.isArray(lines) ? lines : [];
      if (safeLines.length === 0) {
        this.logger.log(`GL journal: period #${periodId} → 0 lines, skipping insert`);
        return Ok({ inserted: 0 });
      }
      for (const line of safeLines) {
        const lineAmount = line.debit !== 0 ? line.debit : line.credit;
        await runQuery(sql`
          INSERT INTO entries
            (entry_date, document_type, document_id, amount, description,
             debit_account, credit_account, currency, posted_at, created_at)
          VALUES (
            TO_CHAR(NOW(), 'YYYY-MM-DD'),
            'payroll',
            ${periodId},
            ${String(lineAmount)},
            ${line.memo ?? 'Payroll GL entry'},
            ${line.account},
            ${line.account},
            'UZS',
            NOW(),
            NOW()
          )
        `);
      }
      this.logger.log(`GL journal: period #${periodId} → ${safeLines.length} lines inserted`);
      return Ok({ inserted: safeLines.length });
    } catch (e: unknown) {
      return Err((e as Error)?.message || `GL journal yozishda xatolik: #${periodId}`);
    }
  }
}
