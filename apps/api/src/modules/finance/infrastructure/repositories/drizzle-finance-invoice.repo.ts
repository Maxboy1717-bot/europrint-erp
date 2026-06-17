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

  /**
   * Atomically post an invoice to the GL.
   * ONE transaction: GL DR/CR entries in `entries` + fi_invoices status flip.
   * Idempotent: if the invoice is already 'posted', returns Ok({ alreadyPosted: true }).
   *
   * RULE4_EXCEPTION: `entries.debit_account_id`/`credit_account_id` are INTEGER in the
   * live DB but STRING in the Drizzle schema (drift). We use the free-text columns
   * `debit_account`/`credit_account` (TEXT, nullable) to avoid the FK type cast error.
   *
   * NOTE: `fi_invoices.id` is UUID in the live DB while the controller passes integer
   * params.  The UPDATE uses `WHERE id::text = $1` (cast UUID to text) so that an
   * integer-string lookup produces 0 rows updated (not a type error) while a UUID-string
   * lookup works correctly.
   */
  /**
   * Data op only: flip an invoice to 'posted'. GL posting (DR AR / CR Revenue + VAT) is orchestrated by
   * the controller through GlPostingService (the ONE engine, resolves codes → entries._id, balanced) —
   * #10 GL-unify. The old postInvoiceWithGl inserted text labels (accounts_receivable/revenue/tax_payable)
   * into entries with NULL _id, bypassing the chart of accounts; it has been removed.
   * fi_invoices.id is UUID; `id::text = $1` lets an integer-string lookup yield 0 rows (no type error).
   */
  async markInvoicePosted(invoiceId: string): Promise<Result<{ updated: number }>> {
    try {
      const r = await db.execute(sql`
        UPDATE fi_invoices SET status = 'posted', updated_at = NOW()
        WHERE id::text = ${invoiceId} RETURNING id
      `);
      const rows = ((r as { rows?: unknown[] }).rows) ?? [];
      return Ok({ updated: rows.length });
    } catch (e: unknown) {
      this.logger.error(`markInvoicePosted failed: ${(e as Error).message}`);
      return Err((e as Error).message);
    }
  }

  async saveGlEntry(entry: FinanceRow): Promise<Result<FinanceRow>> {
    try {
      const entryDate = entry['entry_date']
        ? sql`TO_CHAR(${entry['entry_date']}::timestamptz AT TIME ZONE 'UTC', 'YYYY-MM-DD')`
        : sql`TO_CHAR(NOW(), 'YYYY-MM-DD')`;
      const amount = entry['total_debit'] ?? entry['total_credit'] ?? 0;
      const r = await runQuery<FinanceRow>(sql`
        INSERT INTO entries
          (entry_date, document_type, amount, description, debit_account, currency, created_at)
        VALUES
          (${entryDate},
           ${entry['source_type'] ?? 'other'},
           ${amount},
           ${entry['notes'] ?? null},
           ${entry['source_type'] ?? null},
           'UZS',
           COALESCE(${entry['created_at'] ?? null}::timestamptz, NOW()))
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

      const accountCond = filters.account ? sql`AND e.description ILIKE ${`%${filters.account}%`}` : sql``;
      const fromCond    = filters.from    ? sql`AND e.entry_date >= TO_CHAR(${filters.from}::date, 'YYYY-MM-DD')` : sql``;
      const toCond      = filters.to      ? sql`AND e.entry_date <= TO_CHAR(${filters.to}::date, 'YYYY-MM-DD')`   : sql``;

      const [countResult, itemsResult] = await Promise.all([
        runQuery<{ count: number }>(sql`
          SELECT COUNT(*)::int AS count FROM entries e
          WHERE 1=1 ${accountCond} ${fromCond} ${toCond}
        `),
        runQuery<FinanceRow>(sql`
          SELECT e.*, '[]'::json AS lines
          FROM entries e
          WHERE 1=1 ${accountCond} ${fromCond} ${toCond}
          ORDER BY e.created_at DESC LIMIT ${limit} OFFSET ${offset}
        `),
      ]);
      return { ok: true, data: { items: itemsResult.rows as FinanceRow[], total: Number(countResult.rows[0]?.count ?? 0) } };
    } catch (error: unknown) { return Err((error as Error).message); }
  }
}
