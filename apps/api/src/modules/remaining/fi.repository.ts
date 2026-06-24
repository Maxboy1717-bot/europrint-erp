/**
 * @module fi.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { execCostCenterSoftDelete, execProfitCenterSoftDelete } from '@common/database/queries-fi-extra';
import { sql } from 'drizzle-orm';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

@Injectable()
export class FiRepository {
  async getRevenue(): Promise<Result<{ total: string }[]>> {
    return safeCall(async () => {
      const rows = await runQuery<{ total: string }>(sql`SELECT COALESCE(SUM(total_amount), 0) AS total FROM sales_invoices WHERE payment_status = 'paid'`);
      return rows.rows;
      }, 'DB_ERROR');
  }

  async getExpenses(): Promise<Result<{ total: string }[]>> {
    return safeCall(async () => {
      const rows = await runQuery<{ total: string }>(sql`SELECT COALESCE(SUM(total_amount), 0) AS total FROM purchase_invoices WHERE payment_status IN ('paid', 'partial')`);
      return rows.rows;
      }, 'DB_ERROR');
  }

  async getUnpaidStats(): Promise<Result<{ count: number; amount: string }[]>> {
    return safeCall(async () => {
      const rows = await runQuery<{ count: number; amount: string }>(sql`SELECT COUNT(*) AS count, COALESCE(SUM(total_amount - COALESCE(paid_amount, 0)), 0) AS amount FROM sales_invoices WHERE payment_status = 'unpaid'`);
      return rows.rows;
      }, 'DB_ERROR');
  }

  async getRecentTransactions(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`SELECT id, transaction_type, description, counterparty_name, amount, transaction_date, status FROM income_expense_transactions ORDER BY created_at DESC LIMIT 5`);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getCostCenters(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`SELECT * FROM cost_centers WHERE deleted_at IS NULL ORDER BY created_at DESC`);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getCostCenter(id: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`SELECT * FROM cost_centers WHERE id = ${id} LIMIT 1`);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async createCostCenter(body: Row): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO cost_centers (code, name, name_ru, description, is_active, created_at, updated_at)
        VALUES (${body['code'] ?? null}, ${body['name'] ?? null}, ${body['nameRu'] ?? null}, ${body['description'] ?? null}, ${body['isActive'] ?? true}, NOW(), NOW())
        RETURNING *
      `);
      return rows.rows[0] as Row;
      }, 'DB_ERROR');
  }

  async updateCostCenter(id: string, dto: { code?: string; name?: string; nameRu?: string; description?: string; isActive?: boolean }): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        UPDATE cost_centers
        SET code = COALESCE(${dto.code ?? null}, code), name = COALESCE(${dto.name ?? null}, name),
            name_ru = COALESCE(${dto.nameRu ?? null}, name_ru), description = COALESCE(${dto.description ?? null}, description),
            is_active = COALESCE(${dto.isActive ?? null}, is_active), updated_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async deleteCostCenter(id: string): Promise<void> {
    await execCostCenterSoftDelete(id);
  }

  async getProfitCenters(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`SELECT * FROM profit_centers WHERE deleted_at IS NULL ORDER BY created_at DESC`);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getProfitCenter(id: string): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`SELECT * FROM profit_centers WHERE id = ${id} LIMIT 1`);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async createProfitCenter(body: Row): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        INSERT INTO profit_centers (code, name, name_ru, description, is_active, created_at, updated_at)
        VALUES (${body['code'] ?? null}, ${body['name'] ?? null}, ${body['nameRu'] ?? null}, ${body['description'] ?? null}, ${body['isActive'] ?? true}, NOW(), NOW())
        RETURNING *
      `);
      return rows.rows[0] as Row;
      }, 'DB_ERROR');
  }

  async updateProfitCenter(id: string, dto: { code?: string; name?: string; nameRu?: string; description?: string; isActive?: boolean }): Promise<Result<Row | null>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        UPDATE profit_centers
        SET code = COALESCE(${dto.code ?? null}, code), name = COALESCE(${dto.name ?? null}, name),
            name_ru = COALESCE(${dto.nameRu ?? null}, name_ru), description = COALESCE(${dto.description ?? null}, description),
            is_active = COALESCE(${dto.isActive ?? null}, is_active), updated_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL RETURNING *
      `);
      return (rows.rows[0] ?? null) as Row | null;
      }, 'DB_ERROR');
  }

  async deleteProfitCenter(id: string): Promise<void> {
    await execProfitCenterSoftDelete(id);
  }

  async getGlDocuments(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`SELECT * FROM gl_documents WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 100`);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async createGlDocument(body: Row): Promise<Result<Row>> {
    return safeCall(async () => {
      // FIX (iter-77 drift catalog #2): gl_documents.document_date is NOT NULL (no default) but
      // the INSERT omitted it → every createGlDocument raised 23502. document_date and posting_date
      // are separate NOT-NULL varchar dates; default document_date to documentDate ?? postingDate ?? today.
      const today = _time.now().toISOString().split('T')[0];
      const postingDate  = body['postingDate']  ?? today;
      const documentDate = body['documentDate'] ?? body['postingDate'] ?? today;
      const rows = await runQuery<Row>(sql`
        INSERT INTO gl_documents (document_number, document_type, document_date, posting_date, reference, description, currency, total_debit, total_credit, status, created_at, updated_at)
        VALUES (${body['documentNumber'] ?? null}, ${body['documentType'] ?? null}, ${documentDate}, ${postingDate}, ${body['reference'] ?? null}, ${body['description'] ?? null}, ${body['currency'] ?? 'UZS'}, ${body['totalDebit'] ?? 0}, ${body['totalCredit'] ?? 0}, ${body['status'] ?? 'draft'}, NOW(), NOW())
        RETURNING *
      `);
      return rows.rows[0] as Row;
      }, 'DB_ERROR');
  }

  async getGlEntries(limit: number, offset: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      // Canonical GL = `entries` (ADR-003); `gl_journal_entries` is dead/empty.
      // `entries` rows are balanced double-entry lines, so total_debit = total_credit = amount.
      const rows = await runQuery<Row>(sql`
        SELECT je.id,
               je.entry_date    AS journal_date,
               je.entry_number  AS reference,
               je.description   AS description,
               'posted'         AS status,
               je.amount        AS total_debit,
               je.amount        AS total_credit,
               je.created_at    AS created_at
        FROM entries je ORDER BY je.entry_date DESC, je.created_at DESC LIMIT ${limit} OFFSET ${offset}
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }

  async getInvoices(limit: number, offset: number): Promise<Result<Row[]>> {
    return safeCall(async () => {
      const rows = await runQuery<Row>(sql`
        SELECT id, invoice_number, invoice_date, due_date, customer_name, amount, currency, status, created_at
        FROM fi_invoices ORDER BY invoice_date DESC, created_at DESC LIMIT ${limit} OFFSET ${offset}
      `);
      return rows.rows as Row[];
      }, 'DB_ERROR');
  }
}
