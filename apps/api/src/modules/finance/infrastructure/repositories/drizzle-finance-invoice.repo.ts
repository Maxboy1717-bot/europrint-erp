/**
 * @module drizzle-finance-invoice.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { FinanceRow } from '../../domain/repositories/i-finance.repo';

@Injectable()
export class FinanceInvoiceRepo {
  private readonly logger = new Logger(FinanceInvoiceRepo.name);

  async findInvoiceById(id: string): Promise<Result<FinanceRow | null>> {
    try {
      const rows = await runQuery<FinanceRow>(sql`SELECT * FROM fi_invoices WHERE id = ${parseInt(id, 10)} LIMIT 1`);
      return Ok((rows.rows[0] ?? null) as FinanceRow | null);
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  async findInvoices(filters: { status?: string; customerId?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      // Build WHERE conditions dynamically
      const conditions: string[] = ['1=1'];
      const params: unknown[] = [];
      let paramIdx = 1;

      if (filters.status) {
        conditions.push(`status = $${paramIdx++}`);
        params.push(filters.status);
      }
      if (filters.customerId) {
        conditions.push(`customer_id = $${paramIdx++}`);
        params.push(parseInt(filters.customerId, 10));
      }
      if (filters.from) {
        conditions.push(`created_at >= $${paramIdx++}`);
        params.push(filters.from);
      }
      if (filters.to) {
        conditions.push(`created_at <= $${paramIdx++}`);
        params.push(filters.to);
      }

      const where = conditions.join(' AND ');

      // Use sql template for parameterised queries built conditionally
      let countSql: ReturnType<typeof sql>;
      let itemsSql: ReturnType<typeof sql>;

      if (!filters.status && !filters.customerId && !filters.from && !filters.to) {
        // Fast path — no filters
        countSql = sql`SELECT COUNT(*)::int AS count FROM fi_invoices`;
        itemsSql = sql`SELECT * FROM fi_invoices ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      } else {
        // Build filtered queries using sql tagged template; we compose conditions selectively
        const statusCond   = filters.status     ? sql`AND status = ${filters.status}`                            : sql``;
        const customerCond = filters.customerId ? sql`AND customer_id = ${parseInt(filters.customerId, 10)}`     : sql``;
        const fromCond     = filters.from       ? sql`AND created_at >= ${filters.from}`                         : sql``;
        const toCond       = filters.to         ? sql`AND created_at <= ${filters.to}`                           : sql``;

        countSql = sql`
          SELECT COUNT(*)::int AS count
          FROM fi_invoices
          WHERE 1=1
            ${statusCond}
            ${customerCond}
            ${fromCond}
            ${toCond}
        `;
        itemsSql = sql`
          SELECT *
          FROM fi_invoices
          WHERE 1=1
            ${statusCond}
            ${customerCond}
            ${fromCond}
            ${toCond}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }

      const [countResult, itemsResult] = await Promise.all([
        runQuery<{ count: number }>(countSql),
        runQuery<FinanceRow>(itemsSql),
      ]);
      return { ok: true, data: { items: itemsResult.rows as FinanceRow[], total: Number(countResult.rows[0]?.count ?? 0) } };
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  async findInvoiceBySalesOrderId(salesOrderId: string): Promise<Result<FinanceRow | null>> {
    try {
      const rows = await runQuery<FinanceRow>(sql`SELECT * FROM fi_invoices WHERE source_id = ${salesOrderId} LIMIT 1`);
      return Ok((rows.rows[0] ?? null) as FinanceRow | null);
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  async saveInvoice(invoice: FinanceRow): Promise<Result<FinanceRow>> {
    try {
      const now = new Date();
      const r = await runQuery<FinanceRow>(sql`
        INSERT INTO fi_invoices
          (customer_id, source_type, source_id, status, total_amount, paid_amount, due_date, notes, created_at)
        VALUES
          (${invoice['customer_id'] ?? null},
           ${invoice['source_type'] ?? null},
           ${invoice['source_id'] ?? null},
           ${invoice['status'] ?? 'draft'},
           ${invoice['total_amount'] ?? 0},
           ${invoice['paid_amount'] ?? 0},
           ${invoice['due_date'] ?? null},
           ${invoice['notes'] ?? null},
           ${invoice['created_at'] ?? now})
        RETURNING *
      `);
      return Ok((r.rows[0] ?? invoice) as FinanceRow);
    } catch (error: unknown) {
      this.logger.error(`saveInvoice failed: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async updateInvoice(id: string, data: FinanceRow): Promise<Result<FinanceRow>> {
    try {
      const r = await runQuery<FinanceRow>(sql`
        UPDATE fi_invoices
        SET
          customer_id  = COALESCE(${data['customer_id'] ?? null}, customer_id),
          source_type  = COALESCE(${data['source_type'] ?? null}, source_type),
          source_id    = COALESCE(${data['source_id'] ?? null}, source_id),
          status       = COALESCE(${data['status'] ?? null}, status),
          total_amount = COALESCE(${data['total_amount'] ?? null}, total_amount),
          paid_amount  = COALESCE(${data['paid_amount'] ?? null}, paid_amount),
          due_date     = COALESCE(${data['due_date'] ?? null}, due_date),
          notes        = COALESCE(${data['notes'] ?? null}, notes),
          updated_at   = NOW()
        WHERE id = ${parseInt(id, 10)}
        RETURNING *
      `);
      return Ok((r.rows[0] ?? { id, ...data }) as FinanceRow);
    } catch (error: unknown) {
      this.logger.error(`updateInvoice failed: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findPayments(filters: { invoiceId?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      const invoiceIdCond = filters.invoiceId ? sql`AND id = ${parseInt(filters.invoiceId, 10)}` : sql``;
      const fromCond      = filters.from       ? sql`AND updated_at >= ${filters.from}`           : sql``;
      const toCond        = filters.to         ? sql`AND updated_at <= ${filters.to}`             : sql``;

      const [countResult, itemsResult] = await Promise.all([
        runQuery<{ count: number }>(sql`
          SELECT COUNT(*)::int AS count FROM fi_invoices
          WHERE status = 'paid' ${invoiceIdCond} ${fromCond} ${toCond}
        `),
        runQuery<FinanceRow>(sql`
          SELECT * FROM fi_invoices
          WHERE status = 'paid' ${invoiceIdCond} ${fromCond} ${toCond}
          ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}
        `),
      ]);
      return { ok: true, data: { items: itemsResult.rows as FinanceRow[], total: Number(countResult.rows[0]?.count ?? 0) } };
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  async savePayment(payment: FinanceRow): Promise<Result<FinanceRow>> {
    try {
      const r = await runQuery<FinanceRow>(sql`
        INSERT INTO fi_payments
          (invoice_id, amount, status, recorded_by, payment_date)
        VALUES
          (${payment['invoice_id'] ?? null},
           ${payment['amount'] ?? 0},
           ${payment['status'] ?? 'completed'},
           ${payment['recorded_by'] ?? null},
           ${payment['payment_date'] ?? new Date()})
        RETURNING *
      `);
      return Ok((r.rows[0] ?? payment) as FinanceRow);
    } catch (error: unknown) {
      this.logger.error(`savePayment failed: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async saveGlEntry(entry: FinanceRow): Promise<Result<FinanceRow>> {
    try {
      const r = await runQuery<FinanceRow>(sql`
        INSERT INTO gl_journal_entries
          (source_type, source_id, entry_date, total_debit, total_credit, notes, created_at)
        VALUES
          (${entry['source_type'] ?? null},
           ${entry['source_id'] ?? null},
           ${entry['entry_date'] ?? new Date()},
           ${entry['total_debit'] ?? 0},
           ${entry['total_credit'] ?? 0},
           ${entry['notes'] ?? null},
           ${entry['created_at'] ?? new Date()})
        RETURNING *
      `);
      return Ok((r.rows[0] ?? entry) as FinanceRow);
    } catch (error: unknown) {
      this.logger.error(`saveGlEntry failed: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async findGlEntries(filters: { account?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      const accountCond = filters.account ? sql`AND gje.source_id = ${filters.account}` : sql``;
      const fromCond    = filters.from    ? sql`AND gje.entry_date >= ${filters.from}`   : sql``;
      const toCond      = filters.to      ? sql`AND gje.entry_date <= ${filters.to}`     : sql``;

      const [countResult, itemsResult] = await Promise.all([
        runQuery<{ count: number }>(sql`
          SELECT COUNT(*)::int AS count FROM gl_journal_entries gje
          WHERE 1=1 ${accountCond} ${fromCond} ${toCond}
        `),
        runQuery<FinanceRow>(sql`
          SELECT gje.*,
                 COALESCE(json_agg(json_build_object('account_id', gjl.account_id, 'debit', gjl.debit, 'credit', gjl.credit)) FILTER (WHERE gjl.id IS NOT NULL), '[]') AS lines
          FROM gl_journal_entries gje
          LEFT JOIN gl_journal_lines gjl ON gjl.entry_id = gje.id
          WHERE 1=1 ${accountCond} ${fromCond} ${toCond}
          GROUP BY gje.id
          ORDER BY gje.created_at DESC LIMIT ${limit} OFFSET ${offset}
        `),
      ]);
      return { ok: true, data: { items: itemsResult.rows as FinanceRow[], total: Number(countResult.rows[0]?.count ?? 0) } };
    } catch (error: unknown) { return Err((error as Error).message); }
  }
}
