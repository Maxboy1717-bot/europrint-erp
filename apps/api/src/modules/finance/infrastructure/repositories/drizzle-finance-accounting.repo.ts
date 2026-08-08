/**
 * @module drizzle-finance-accounting.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql, SQL } from 'drizzle-orm';
import { db , runQuery } from '@shared/db';
import { safeCall } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleFinanceAccountingRepo {
  private readonly logger = new Logger(DrizzleFinanceAccountingRepo.name);

  async findAccounts(type: string | undefined, limit: number, offset: number) {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT id, code, name, account_type, parent_id, is_active
        FROM accounts
        WHERE (${type ?? null}::text IS NULL OR account_type = ${type ?? null})
        ORDER BY code LIMIT ${limit} OFFSET ${offset}
      `);
      return rows.rows as Row[];
    });
  }

  async getDashboard(): Promise<Row> {
    // OWNER QARORI 2026-07-02 (Moliya-GL-Kassa): finance_invoices = kanonik invoice-manba.
    // sales_invoices/purchase_invoices endi yozuvchisiz (0 satr) — AR/AP shu yerdan emas,
    // finance_invoices'dan (invoice_type='sales'/'purchase') olinadi.
    const rows = await runQuery<Row>(sql`
      SELECT
        (SELECT COUNT(*) FROM gl_documents) AS gl_total,
        (SELECT COUNT(*) FROM gl_documents WHERE status = 'posted') AS gl_posted,
        -- GL two-world fix (2026-07-14): gl_lines has zero writers since the
        -- 2026-06-22 SAP#76 consolidation (commit f45f5886) onto entries (ADR-003
        -- canonical). Counting entries here so this stat isn't permanently frozen at 0.
        (SELECT COUNT(*) FROM entries) AS gl_entries,
        (SELECT COUNT(*) FROM accounting_periods WHERE status = 'open') AS periods_open,
        (SELECT COUNT(*) FROM accounting_periods WHERE status = 'closed') AS periods_closed,
        (SELECT COALESCE(SUM(total_amount),0) FROM finance_invoices WHERE invoice_type = 'sales') AS ar_total,
        (SELECT COALESCE(SUM(total_amount),0) FROM finance_invoices WHERE invoice_type = 'sales' AND payment_status = 'unpaid') AS ar_unpaid,
        (SELECT COALESCE(SUM(total_amount),0) FROM finance_invoices WHERE invoice_type = 'purchase') AS ap_total,
        (SELECT COALESCE(SUM(total_amount),0) FROM finance_invoices WHERE invoice_type = 'purchase' AND payment_status = 'unpaid') AS ap_unpaid
    `);
    return (rows.rows[0] ?? {}) as Row;
  }

  async getGlDocuments(where: SQL, limitVal: number, offsetVal: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT * FROM gl_documents WHERE ${where} ORDER BY created_at DESC LIMIT ${limitVal} OFFSET ${offsetVal}
    `);
    return rows.rows as Row[];
  }

  async getGlDocumentsFiltered(filter: { status?: string; documentType?: string; startDate?: string; endDate?: string }, limitVal: number, offsetVal: number): Promise<Row[]> {
    const conditions: SQL[] = [];
    if (filter.status)       conditions.push(sql`status = ${filter.status}`);
    if (filter.documentType) conditions.push(sql`document_type = ${filter.documentType}`);
    if (filter.startDate)    conditions.push(sql`document_date >= ${filter.startDate}`);
    if (filter.endDate)      conditions.push(sql`document_date <= ${filter.endDate}`);
    const where = conditions.length === 0 ? sql`1=1` : sql.join(conditions, sql` AND `);
    return this.getGlDocuments(where, limitVal, offsetVal);
  }

  async getMaterialsFiltered(filter: { warehouseId?: string; startDate?: string; endDate?: string; moveType?: string }, limitVal: number, offsetVal: number): Promise<Row[]> {
    const conditions: SQL[] = [];
    if (filter.warehouseId) conditions.push(sql`sm.warehouse_id = ${Number(filter.warehouseId) || 0}`);
    if (filter.startDate)   conditions.push(sql`sm.move_date >= ${filter.startDate}`);
    if (filter.endDate)     conditions.push(sql`sm.move_date <= ${filter.endDate}`);
    if (filter.moveType)    conditions.push(sql`sm.move_type = ${filter.moveType}`);
    const where = conditions.length === 0 ? sql`1=1` : sql.join(conditions, sql` AND `);
    return this.getMaterials(where, limitVal, offsetVal);
  }

  async getPeriods(): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`SELECT * FROM accounting_periods ORDER BY fiscal_year DESC, month DESC`);
    return rows.rows as Row[];
  }

  async getPeriodById(id: number): Promise<Row | null> {
    const rows = await runQuery<Row>(sql`SELECT id, status FROM accounting_periods WHERE id = ${id}`);
    return (rows.rows[0] ?? null) as Row | null;
  }

  async closePeriod(id: number, closedBy: number | null): Promise<Row> {
    const rows = await runQuery<Row>(sql`
      UPDATE accounting_periods SET status = 'closed', closed_by = ${closedBy}, closed_at = NOW() WHERE id = ${id} RETURNING *
    `);
    return (rows.rows[0] ?? {}) as Row;
  }

  async getMaterials(where: SQL, limitVal: number, offsetVal: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT sm.id, sm.move_number, sm.move_date, sm.move_type, sm.quantity, sm.unit_cost, sm.total_cost, sm.reference, w.name AS warehouse_name
      FROM stock_moves sm LEFT JOIN warehouses w ON w.id = sm.warehouse_id
      WHERE ${where}
      ORDER BY sm.move_date DESC LIMIT ${limitVal} OFFSET ${offsetVal}
    `);
    return rows.rows as Row[];
  }

  async getMaterialsByOrder(orderId: string): Promise<{ moves: Row[]; summary: Row }> {
    const [movesResult, summaryResult] = await Promise.all([
      runQuery<Row>(sql`SELECT * FROM stock_moves WHERE reference = ${orderId} ORDER BY move_date DESC`),
      runQuery<Row>(sql`SELECT COUNT(*) AS move_count, COALESCE(SUM(quantity),0) AS total_quantity, COALESCE(SUM(total_cost),0) AS total_cost FROM stock_moves WHERE reference = ${orderId}`),
    ]);
    return { moves: movesResult.rows as Row[], summary: (summaryResult.rows[0] ?? {}) as Row };
  }

  async getInventoryValuation(): Promise<{ materials: Row[]; summary: Row }> {
    const [matsResult, summaryResult] = await Promise.all([
      // T21-B1 #24 master-data converge: raw_materials valuation kept as-is (canonical
      // stock/price source); ADDITIV int-link mc.kod AS canonical_card_kod surfaces the
      // material_cards (kanonik) tie without changing valuation numbers (Q-39/Q-40).
      runQuery<Row>(sql`
        SELECT rm.id, rm.code, rm.name, rm.category, rm.unit, rm.current_stock, rm.unit_price,
               (rm.current_stock * rm.unit_price) AS total_value,
               COALESCE(w.name, '') AS warehouse_name,
               mc.kod AS canonical_card_kod
        FROM raw_materials rm
        LEFT JOIN warehouses w ON w.id = rm.warehouse_id
        LEFT JOIN material_cards mc ON mc.id = rm.material_card_id
        WHERE rm.is_active = true ORDER BY (rm.current_stock * rm.unit_price) DESC
      `),
      runQuery<Row>(sql`SELECT COUNT(*) AS total_items, COALESCE(SUM(current_stock),0) AS total_stock, COALESCE(SUM(current_stock * unit_price),0) AS total_value FROM raw_materials WHERE is_active = true`),
    ]);
    return { materials: matsResult.rows as Row[], summary: (summaryResult.rows[0] ?? {}) as Row };
  }

  async getExpenseReports(statusParam: string | null, limit: number, offset: number): Promise<Row[]> {
    const rows = await runQuery<Row>(sql`
      SELECT er.id, er.title, er.status, er.total_amount, er.currency, er.submitted_at, er.approved_at, er.created_at, (u.first_name || ' ' || u.last_name) AS employee_name
      FROM expense_reports er LEFT JOIN users u ON u.id = er.employee_id
      WHERE (${statusParam}::text IS NULL OR er.status = ${statusParam})
      ORDER BY er.created_at DESC LIMIT ${limit} OFFSET ${offset}
    `);
    return rows.rows as Row[];
  }

  async getExpenseReportById(id: string): Promise<Row | null> {
    const rows = await runQuery<Row>(sql`
      SELECT er.id, er.title, er.status, er.total_amount, er.currency, er.submitted_at, er.approved_at, er.created_at, (u.first_name || ' ' || u.last_name) AS employee_name
      FROM expense_reports er LEFT JOIN users u ON u.id = er.employee_id
      WHERE er.id = ${id} LIMIT 1
    `);
    return (rows.rows[0] ?? null) as Row | null;
  }
}
