/**
 * @module drizzle-finance-invoice.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { db , runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { Result, Err, Ok } from '@common/types/result.type';
import { FinanceRow } from '../../domain/repositories/i-finance.repo';

/** Opaque Drizzle transaction handle — same convention as `DrizzleTxExecutor` in the SD module. */
type FinanceTx = unknown;

export interface AppliedInvoicePayment {
  paidAmount: number;
  totalAmount: number;
  paymentStatus: 'paid' | 'partial';
}

@Injectable()
export class FinanceInvoiceRepo {
  private readonly logger = new Logger(FinanceInvoiceRepo.name);

  async findInvoiceById(id: string): Promise<Result<FinanceRow | null>> {
    try {
      const rows = await runQuery<FinanceRow>(sql`SELECT * FROM finance_invoices WHERE id = ${parseInt(id, 10)} LIMIT 1`);
      return Ok((rows.rows[0] ?? null) as FinanceRow | null);
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  async findInvoices(filters: { status?: string; customerId?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;

      // Use sql template for parameterised queries built conditionally
      // Canonical table: finance_invoices; status column = payment_status
      let countSql: ReturnType<typeof sql>;
      let itemsSql: ReturnType<typeof sql>;

      if (!filters.status && !filters.customerId && !filters.from && !filters.to) {
        // Fast path — no filters
        countSql = sql`SELECT COUNT(*)::int AS count FROM finance_invoices`;
        itemsSql = sql`SELECT * FROM finance_invoices ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      } else {
        // Build filtered queries; finance_invoices uses payment_status (not status)
        const statusCond   = filters.status     ? sql`AND payment_status = ${filters.status}`                    : sql``;
        const customerCond = filters.customerId ? sql`AND customer_id = ${parseInt(filters.customerId, 10)}`     : sql``;
        const fromCond     = filters.from       ? sql`AND created_at >= ${filters.from}`                         : sql``;
        const toCond       = filters.to         ? sql`AND created_at <= ${filters.to}`                           : sql``;

        countSql = sql`
          SELECT COUNT(*)::int AS count
          FROM finance_invoices
          WHERE 1=1
            ${statusCond}
            ${customerCond}
            ${fromCond}
            ${toCond}
        `;
        itemsSql = sql`
          SELECT *
          FROM finance_invoices
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
      const r = await runQuery<FinanceRow>(sql`SELECT * FROM fi_invoices WHERE sales_order_id = ${salesOrderId}::uuid LIMIT 1`);
      return Ok((r.rows[0] ?? null) as FinanceRow | null);
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  /**
   * C4 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): invoice_number is ALWAYS generated server-side via
   * the `invoice_number_seq` Postgres sequence (previously dormant — created but never wired to a
   * writer) instead of trusting a caller-supplied value. The two live callers
   * (finance-invoices.controller.ts) previously built `INV-${Date.now()}`, which two requests in
   * the same millisecond could collide on with nothing to catch it — `nextval()` is atomic and
   * collision-proof by construction, and a UNIQUE constraint on the column is the safety net for
   * any future caller. Format: `INV-{year}-{6-digit zero-padded sequence}`.
   */
  async saveInvoice(invoice: FinanceRow): Promise<Result<FinanceRow>> {
    try {
      const now = new Date();
      // finance_invoices columns: customer_id, vendor_id, invoice_number, invoice_type,
      //   total_amount, paid_amount, payment_status, due_date, created_at, updated_at
      // F5 (ACCOUNTING-STANDARDS-AUDIT-2026-07-06): created_by added — nullable, historical rows
      // stay NULL (cannot be fabricated); only newly-created invoices get it going forward.
      const r = await runQuery<FinanceRow>(sql`
        INSERT INTO finance_invoices
          (customer_id, vendor_id, invoice_number, invoice_type, total_amount, paid_amount, payment_status, due_date, created_at, created_by)
        VALUES
          (${invoice['customer_id'] ?? null},
           ${invoice['vendor_id'] ?? null},
           'INV-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('invoice_number_seq')::text, 6, '0'),
           ${invoice['invoice_type'] ?? 'sales'},
           ${invoice['total_amount'] ?? 0},
           ${invoice['paid_amount'] ?? 0},
           ${invoice['payment_status'] ?? invoice['status'] ?? 'unpaid'},
           ${invoice['due_date'] ?? null},
           ${invoice['created_at'] ?? now},
           ${invoice['created_by'] ?? null})
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
        UPDATE finance_invoices
        SET
          customer_id     = COALESCE(${data['customer_id'] ?? null}, customer_id),
          vendor_id       = COALESCE(${data['vendor_id'] ?? null}, vendor_id),
          invoice_type    = COALESCE(${data['invoice_type'] ?? null}, invoice_type),
          payment_status  = COALESCE(${data['payment_status'] ?? data['status'] ?? null}, payment_status),
          total_amount    = COALESCE(${data['total_amount'] ?? null}, total_amount),
          paid_amount     = COALESCE(${data['paid_amount'] ?? null}, paid_amount),
          due_date        = COALESCE(${data['due_date'] ?? null}, due_date),
          updated_at      = NOW()
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

      const invoiceIdCond = filters.invoiceId ? sql`AND invoice_id = ${parseInt(filters.invoiceId, 10)}` : sql``;
      const fromCond      = filters.from       ? sql`AND created_at >= ${filters.from}`                   : sql``;
      const toCond        = filters.to         ? sql`AND created_at <= ${filters.to}`                     : sql``;

      const [countResult, itemsResult] = await Promise.all([
        runQuery<{ count: number }>(sql`
          SELECT COUNT(*)::int AS count FROM finance_payments
          WHERE status = 'completed' ${invoiceIdCond} ${fromCond} ${toCond}
        `),
        runQuery<FinanceRow>(sql`
          SELECT * FROM finance_payments
          WHERE status = 'completed' ${invoiceIdCond} ${fromCond} ${toCond}
          ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
        `),
      ]);
      return { ok: true, data: { items: itemsResult.rows as FinanceRow[], total: Number(countResult.rows[0]?.count ?? 0) } };
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  async savePayment(payment: FinanceRow): Promise<Result<FinanceRow>> {
    try {
      // finance_payments columns: invoice_id, amount, status, payment_date, currency, payment_method, reference, notes
      const r = await runQuery<FinanceRow>(sql`
        INSERT INTO finance_payments
          (invoice_id, amount, status, payment_date, currency, payment_method, notes)
        VALUES
          (${payment['invoice_id'] ?? null},
           ${payment['amount'] ?? 0},
           ${payment['status'] ?? 'completed'},
           ${payment['payment_date'] ?? new Date()},
           ${payment['currency'] ?? 'UZS'},
           ${payment['payment_method'] ?? null},
           ${payment['notes'] ?? null})
        RETURNING *
      `);
      return Ok((r.rows[0] ?? payment) as FinanceRow);
    } catch (error: unknown) {
      this.logger.error(`savePayment failed: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * C1 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): replaces the old absolute-value `SET paid_amount =
   * X` (a read-then-write that raced under concurrent payments — two requests reading the same
   * stale `paid_amount` could each "win", the second silently overwriting/losing the first). This
   * is an atomic guarded UPDATE: the WHERE clause re-evaluates `paid_amount + amount <= total_amount`
   * against the CURRENT committed row, not a snapshot read earlier in the request. Postgres row-level
   * locking serializes concurrent UPDATEs on the same invoice row — the second concurrent payment
   * blocks until the first commits, then re-checks the guard against the now-updated balance. Returns
   * `Ok(null)` (not Err) when the guard rejects (0 rows matched) — that is an expected business
   * outcome (overpayment), not a DB failure; the caller decides how to react (roll back the tx).
   */
  async applyInvoicePayment(invoiceId: number, amount: number, tx?: FinanceTx): Promise<Result<AppliedInvoicePayment | null>> {
    try {
      const conn = (tx as typeof db | undefined) ?? db;
      const r = await conn.execute(sql`
        UPDATE finance_invoices
        SET paid_amount = COALESCE(paid_amount, 0) + ${amount},
            payment_status = CASE WHEN COALESCE(paid_amount, 0) + ${amount} >= total_amount THEN 'paid' ELSE 'partial' END,
            updated_at = NOW()
        WHERE id = ${invoiceId}
          AND COALESCE(paid_amount, 0) + ${amount} <= total_amount
        RETURNING paid_amount, total_amount, payment_status
      `);
      const row = ((r as { rows?: Record<string, unknown>[] }).rows ?? [])[0];
      if (!row) return Ok(null);
      return Ok({
        paidAmount:    parseFloat(String(row['paid_amount'])),
        totalAmount:   parseFloat(String(row['total_amount'])),
        paymentStatus: row['payment_status'] as 'paid' | 'partial',
      });
    } catch (error: unknown) {
      this.logger.error(`applyInvoicePayment failed: ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  /**
   * C1 compensating action: `GlPostingService` opens its OWN internal transaction and cannot join
   * the caller's transaction (same constraint already documented for payroll, F3/b42ab33f) — so a
   * GL-posting failure that happens AFTER `applyInvoicePayment` + payment INSERT have committed
   * cannot be undone by a plain rollback. This reverses both writes explicitly (its own transaction)
   * so the net observable effect matches "GL failure rolls back the payment+invoice rows too".
   */
  async reverseInvoicePayment(paymentId: number, invoiceId: number, amount: number): Promise<Result<void>> {
    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql`DELETE FROM finance_payments WHERE id = ${paymentId}`);
        await tx.execute(sql`
          UPDATE finance_invoices
          SET paid_amount = GREATEST(0, COALESCE(paid_amount, 0) - ${amount}),
              payment_status = CASE WHEN GREATEST(0, COALESCE(paid_amount, 0) - ${amount}) <= 0 THEN 'unpaid' ELSE 'partial' END,
              updated_at = NOW()
          WHERE id = ${invoiceId}
        `);
      });
      return Ok(undefined);
    } catch (error: unknown) {
      this.logger.error(`reverseInvoicePayment failed (payment=${paymentId}, invoice=${invoiceId}): ${(error as Error).message}`);
      return Err((error as Error).message);
    }
  }

  async markInvoicePosted(invoiceId: string): Promise<Result<{ updated: number }>> {
    try {
      const r = await db.execute(sql`
        UPDATE finance_invoices SET payment_status = 'posted', updated_at = NOW()
        WHERE id = ${parseInt(invoiceId, 10)} RETURNING id
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
