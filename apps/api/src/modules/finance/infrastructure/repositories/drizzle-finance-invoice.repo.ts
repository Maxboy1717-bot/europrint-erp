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
      const [countResult, itemsResult] = await Promise.all([
        runQuery<{ count: number }>(sql`SELECT COUNT(*)::int AS count FROM fi_invoices`),
        runQuery<FinanceRow>(sql`SELECT * FROM fi_invoices ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`),
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
    try { return Ok(invoice); } catch (error: unknown) { return Err((error as Error).message); }
  }

  async updateInvoice(id: string, data: FinanceRow): Promise<Result<FinanceRow>> {
    try { return { ok: true, data: { id, ...data } }; } catch (error: unknown) { return Err((error as Error).message); }
  }

  async findPayments(filters: { invoiceId?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;
      const [countResult, itemsResult] = await Promise.all([
        runQuery<{ count: number }>(sql`SELECT COUNT(*)::int AS count FROM fi_invoices WHERE status = 'paid'`),
        runQuery<FinanceRow>(sql`SELECT * FROM fi_invoices WHERE status = 'paid' ORDER BY updated_at DESC LIMIT ${limit} OFFSET ${offset}`),
      ]);
      return { ok: true, data: { items: itemsResult.rows as FinanceRow[], total: Number(countResult.rows[0]?.count ?? 0) } };
    } catch (error: unknown) { return Err((error as Error).message); }
  }

  async savePayment(payment: FinanceRow): Promise<Result<FinanceRow>> {
    try { return Ok(payment); } catch (error: unknown) { return Err((error as Error).message); }
  }

  async saveGlEntry(entry: FinanceRow): Promise<Result<FinanceRow>> {
    try { return Ok(entry); } catch (error: unknown) { return Err((error as Error).message); }
  }

  async findGlEntries(filters: { account?: string; from?: Date; to?: Date; page?: number; limit?: number }): Promise<Result<{ items: FinanceRow[]; total: number }>> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;
      const [countResult, itemsResult] = await Promise.all([
        runQuery<{ count: number }>(sql`SELECT COUNT(*)::int AS count FROM gl_journal_entries`),
        runQuery<FinanceRow>(sql`
          SELECT gje.*,
                 COALESCE(json_agg(json_build_object('account_id', gjl.account_id, 'debit', gjl.debit, 'credit', gjl.credit)) FILTER (WHERE gjl.id IS NOT NULL), '[]') AS lines
          FROM gl_journal_entries gje
          LEFT JOIN gl_journal_lines gjl ON gjl.entry_id = gje.id
          GROUP BY gje.id
          ORDER BY gje.created_at DESC LIMIT ${limit} OFFSET ${offset}
        `),
      ]);
      return { ok: true, data: { items: itemsResult.rows as FinanceRow[], total: Number(countResult.rows[0]?.count ?? 0) } };
    } catch (error: unknown) { return Err((error as Error).message); }
  }
}
