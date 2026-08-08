/**
 * @module drizzle-finance-extended.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

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
      // Single-pass aggregate: income/expense sums + row count + current-month period.
      // FE Summary type expects: totalIncome, totalExpense, netAmount, transactionCount, period{from,to}.
      const r = await runQuery<{
        totalIncome: string;
        totalExpense: string;
        netAmount: string;
        transactionCount: string;
        periodFrom: string;
        periodTo: string;
      }>(sql`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'income'),  0) AS "totalIncome",
          COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'expense'), 0) AS "totalExpense",
          COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'income'),  0)
            - COALESCE(SUM(amount) FILTER (WHERE transaction_type = 'expense'), 0) AS "netAmount",
          COUNT(*)                                                              AS "transactionCount",
          date_trunc('month', NOW())::date                                      AS "periodFrom",
          NOW()::date                                                            AS "periodTo"
        FROM income_expense_transactions
      `);
      const row = r.rows[0];
      return Ok({
        totalIncome:      Number(row?.totalIncome      ?? 0),
        totalExpense:     Number(row?.totalExpense     ?? 0),
        netAmount:        Number(row?.netAmount        ?? 0),
        transactionCount: Number(row?.transactionCount ?? 0),
        period: {
          from: String(row?.periodFrom ?? ''),
          to:   String(row?.periodTo   ?? ''),
        },
      });
    } catch (e: unknown) { return Err((e as Error).message || 'Xulosa topilmadi'); }
  }

  async createIncomeExpense(dto: Row): Promise<Result<Row>> {
    try {
      const transactionDate  = dto.transactionDate  != null ? String(dto.transactionDate)  : null;
      const transactionType  = dto.transactionType  != null ? String(dto.transactionType)  : 'income';
      const amount           = dto.amount           != null ? Number(dto.amount)           : null;
      const categoryId       = dto.categoryId       != null ? Number(dto.categoryId)       : null;
      const description      = dto.description      != null ? String(dto.description)      : null;
      // income_expense_transactions.transaction_number is NOT NULL with no DB default;
      // generate deterministically (same pattern as createInventoryCount → INV-...).
      const r = await runQuery<Row>(sql`
        INSERT INTO income_expense_transactions
          (transaction_number, transaction_date, transaction_type, amount, category_id, description)
        VALUES (
          'TXN-' || to_char(NOW(), 'YYYYMMDDHH24MISS'),
          ${transactionDate},
          ${transactionType},
          ${amount},
          ${categoryId},
          ${description}
        )
        RETURNING *
      `);
      return Ok((r.rows[0] ?? {}) as Row);
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

  async createInventoryCount(dto: Row): Promise<Result<Row>> {
    try {
      const warehouseId = dto.warehouseId != null ? Number(dto.warehouseId) : null;
      const countDate   = dto.countDate  != null ? String(dto.countDate)    : null;
      const countType   = dto.countType  != null ? String(dto.countType)    : 'full';
      const notes       = dto.notes      != null ? String(dto.notes)        : null;
      // Raw parametrized SQL (Qoida B): inventory_counts has columns the Drizzle stub may lack;
      // count_number/count_date/count_type are NOT NULL, so generate count_number + default the rest.
      const r = await runQuery<Row>(sql`
        INSERT INTO inventory_counts (count_number, count_date, warehouse_id, count_type, notes)
        VALUES ('INV-' || to_char(NOW(), 'YYYYMMDDHH24MISS'), COALESCE(${countDate}::date, CURRENT_DATE), ${warehouseId}, ${countType}, ${notes})
        RETURNING *
      `);
      return Ok((r.rows[0] ?? {}) as Row);
    } catch (e: unknown) { return Err((e as Error).message || 'Inventarizatsiya yaratishda xatolik'); }
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

  async createAsset(dto: Row): Promise<Result<Row>> {
    try {
      const name          = dto.name          != null ? String(dto.name)          : null;
      const code          = dto.code          != null ? String(dto.code)          : null;
      const category      = dto.category      != null ? String(dto.category)      : null;
      const purchaseDate  = dto.purchaseDate  != null ? String(dto.purchaseDate)  : null;
      const purchaseValue = dto.purchaseValue != null ? Number(dto.purchaseValue) : null;
      // asset_items is the table findAssetInventory() reads. Generate asset_code
      // (AST-<timestamp>) when not supplied; seed current_value from purchase_value.
      const r = await runQuery<Row>(sql`
        INSERT INTO asset_items (asset_code, name, category, purchase_date, purchase_value, current_value, status)
        VALUES (COALESCE(${code}, 'AST-' || to_char(NOW(), 'YYYYMMDDHH24MISS')), ${name}, ${category}, ${purchaseDate}::date, ${purchaseValue}, ${purchaseValue}, 'active')
        RETURNING *
      `);
      return Ok((r.rows[0] ?? {}) as Row);
    } catch (e: unknown) { return Err((e as Error).message || 'Aktiv yaratishda xatolik'); }
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

  async findAssetInventorySummary(): Promise<Result<Row>> {
    try {
      const r = await runQuery<{ total: string; active: string; depreciated: string; total_value: string }>(sql`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'active') AS active,
          COUNT(*) FILTER (WHERE status = 'depreciated') AS depreciated,
          COALESCE(SUM(current_value), 0) AS total_value
        FROM asset_items
      `);
      const row = r.rows[0] ?? { total: '0', active: '0', depreciated: '0', total_value: '0' };
      return Ok({
        total:      Number(row.total),
        active:     Number(row.active),
        depreciated: Number(row.depreciated),
        totalValue: Number(row.total_value),
      });
    } catch (e: unknown) {
      this.logger.warn(`findAssetInventorySummary: ${(e as Error).message}`);
      return Err((e as Error).message || 'Asset summary topilmadi');
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
