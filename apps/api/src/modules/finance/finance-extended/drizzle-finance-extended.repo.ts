import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { financeCategories, incomeExpenseTransactions } from '@europrint/schemas';
import { inventoryCounts } from '@europrint/schemas';
import { eq, count, desc, sum, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IFinanceExtendedRepository } from './i-finance-extended.repo';

type Row = Record<string, unknown>;
type FinanceCategoryRow = typeof financeCategories.$inferSelect;
type IncomeExpenseRow = typeof incomeExpenseTransactions.$inferSelect;
type InventoryCountRow = typeof inventoryCounts.$inferSelect;

@Injectable()
export class DrizzleFinanceExtendedRepository implements IFinanceExtendedRepository {
  private readonly logger = new Logger(DrizzleFinanceExtendedRepository.name);

  async findCategories(limit: number, offset: number): Promise<Result<{ data: FinanceCategoryRow[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(financeCategories).orderBy(desc(financeCategories.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(financeCategories),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error).message || 'Kategoriyalar topilmadi'); }
  }

  async findCategoryById(id: number): Promise<Result<object | null>> {
    try {
      const rows = await db.select().from(financeCategories).where(eq(financeCategories.id, id)).limit(1);
      return Ok(rows[0] ?? null);
    } catch (e: unknown) { return Err((e as Error).message || `Kategoriya #${id} topilmadi`); }
  }

  async createCategory(dto: Row): Promise<Result<Row>> {
    try {
      const result = await db.insert(financeCategories).values(dto as typeof financeCategories.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error).message || 'Yaratishda xatolik'); }
  }

  async updateCategory(id: number, dto: Row): Promise<Result<Row>> {
    try {
      const result = await db.update(financeCategories).set(dto).where(eq(financeCategories.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error).message || 'Yangilashda xatolik'); }
  }

  async deleteCategory(id: number): Promise<Result<void>> {
    try {
      await db.delete(financeCategories).where(eq(financeCategories.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message || "O'chirishda xatolik"); }
  }

  async findIncomeExpense(limit: number, offset: number): Promise<Result<{ data: IncomeExpenseRow[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(incomeExpenseTransactions).orderBy(desc(incomeExpenseTransactions.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(incomeExpenseTransactions),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error).message || 'Kirish-chiqish topilmadi'); }
  }

  async findIncomeExpenseSummary(): Promise<Result<Row>> {
    try {
      const [income, expense] = await Promise.all([
        db.select({ total: sum(incomeExpenseTransactions.amount) }).from(incomeExpenseTransactions).where(sql`${incomeExpenseTransactions.transactionType} = 'income'`),
        db.select({ total: sum(incomeExpenseTransactions.amount) }).from(incomeExpenseTransactions).where(sql`${incomeExpenseTransactions.transactionType} = 'expense'`),
      ]);
      const totalIncome = Number(income[0]?.total || 0);
      const totalExpense = Number(expense[0]?.total || 0);
      return Ok({ totalIncome, totalExpense, netBalance: totalIncome - totalExpense });
    } catch (e: unknown) { return Err((e as Error).message || 'Xulosa topilmadi'); }
  }

  async createIncomeExpense(dto: Row): Promise<Result<Row>> {
    try {
      const result = await db.insert(incomeExpenseTransactions).values(dto as typeof incomeExpenseTransactions.$inferInsert).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error).message || 'Yaratishda xatolik'); }
  }

  async updateIncomeExpense(id: number, dto: Row): Promise<Result<Row>> {
    try {
      const result = await db.update(incomeExpenseTransactions).set(dto).where(eq(incomeExpenseTransactions.id, id)).returning();
      return Ok(result[0]);
    } catch (e: unknown) { return Err((e as Error).message || 'Yangilashda xatolik'); }
  }

  async deleteIncomeExpense(id: number): Promise<Result<void>> {
    try {
      await db.delete(incomeExpenseTransactions).where(eq(incomeExpenseTransactions.id, id));
      return Ok(undefined);
    } catch (e: unknown) { return Err((e as Error).message || "O'chirishda xatolik"); }
  }

  async findInventoryCounts(limit: number, offset: number): Promise<Result<{ data: InventoryCountRow[]; count: number }>> {
    try {
      const [data, countResult] = await Promise.all([
        db.select().from(inventoryCounts).orderBy(desc(inventoryCounts.createdAt)).limit(limit).offset(offset),
        db.select({ count: count() }).from(inventoryCounts),
      ]);
      return Ok({ data, count: Number(countResult[0]?.count || 0) });
    } catch (e: unknown) { return Err((e as Error).message || 'Inventarizatsiya topilmadi'); }
  }

  async findAssetInventory(limit: number, offset: number, status?: string): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const [rowsResult, countResult] = await Promise.all([
        runQuery<Row>(sql`
          SELECT ai.id, ai.name, ai.category, ai.status, ai.serial_number, ai.purchase_date, ai.purchase_value, ai.department_id, ai.notes, ai.created_at
          FROM asset_items ai
          WHERE (${status ?? null}::text IS NULL OR ai.status = ${status ?? null})
          ORDER BY ai.created_at DESC LIMIT ${limit} OFFSET ${offset}
        `),
        runQuery<{ cnt: number }>(sql`SELECT COUNT(*) AS cnt FROM asset_items WHERE (${status ?? null}::text IS NULL OR status = ${status ?? null})`),
      ]);
      return Ok({ data: rowsResult.rows as Row[], count: Number(countResult.rows[0]?.cnt ?? 0) });
    } catch (e: unknown) {
      this.logger.warn(`findAssetInventory (asset_items not migrated): ${(e as Error).message}`);
      return Err((e as Error).message);
    }
  }

  async findAssetInventoryById(id: string): Promise<Result<object | null>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT ai.id, ai.name, ai.category, ai.status, ai.serial_number, ai.purchase_date, ai.purchase_value, ai.department_id, ai.notes, ai.created_at
        FROM asset_items ai WHERE ai.id::text = ${id} LIMIT 1
      `);
      return Ok((rows.rows[0] ?? null) as Row | null);
    } catch (e: unknown) {
      this.logger.warn(`findAssetInventoryById (asset_items not migrated): ${(e as Error).message}`);
      return Err((e as Error).message);
    }
  }

  async findDailyMetrics(limit: number, offset: number, date?: string): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT dr.id, dr.employee_id, dr.report_date, dr.tasks_completed, dr.hours_worked, dr.notes, dr.created_at
        FROM employee_daily_reports dr
        WHERE (${date ?? null}::date IS NULL OR dr.report_date = ${date ?? null}::date)
        ORDER BY dr.report_date DESC, dr.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `);
      return Ok({ data: rows.rows as Row[], count: rows.rows.length });
    } catch (e: unknown) {
      this.logger.warn(`findDailyMetrics (employee_daily_reports not migrated): ${(e as Error).message}`);
      return Err((e as Error).message);
    }
  }

  async findOvertime(limit: number, offset: number, period?: string): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT a.id, a.employee_id, a.attendance_date, a.overtime_minutes, a.status,
               e.first_name || ' ' || e.last_name AS employee_name
        FROM attendance a LEFT JOIN employees e ON e.id = a.employee_id
        WHERE a.overtime_minutes > 0
          AND (${period ?? null}::date IS NULL OR date_trunc('month', a.attendance_date) = date_trunc('month', ${period ?? null}::date))
        ORDER BY a.attendance_date DESC LIMIT ${limit} OFFSET ${offset}
      `);
      return Ok({ data: rows.rows as Row[], count: rows.rows.length });
    } catch (e: unknown) {
      this.logger.warn(`findOvertime: ${(e as Error).message}`);
      return Err((e as Error).message);
    }
  }

  async findCustoms(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT cd.id, cd.declaration_number, cd.date, cd.status, cd.total_value, cd.customs_duty, cd.description, cd.created_at
        FROM customs_declarations cd ORDER BY cd.date DESC LIMIT ${limit} OFFSET ${offset}
      `);
      return Ok({ data: rows.rows as Row[], count: rows.rows.length });
    } catch (e: unknown) {
      this.logger.warn(`findCustoms (customs_declarations not migrated): ${(e as Error).message}`);
      return Err((e as Error).message);
    }
  }

  async findInsurance(limit: number, offset: number): Promise<Result<{ data: Row[]; count: number }>> {
    try {
      const rows = await runQuery<Row>(sql`
        SELECT eb.id, eb.employee_id, eb.benefit_type, eb.provider, eb.policy_number, eb.start_date, eb.end_date, eb.monthly_cost, eb.status, eb.created_at
        FROM employee_benefits eb WHERE eb.benefit_type = 'insurance' ORDER BY eb.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `);
      return Ok({ data: rows.rows as Row[], count: rows.rows.length });
    } catch (e: unknown) {
      this.logger.warn(`findInsurance (employee_benefits not migrated): ${(e as Error).message}`);
      return Err((e as Error).message);
    }
  }
}
