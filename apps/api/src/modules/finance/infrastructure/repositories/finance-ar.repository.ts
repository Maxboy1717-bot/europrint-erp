/**
 * @module finance-ar.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Finance)
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { and, eq, ne, lt, sql } from 'drizzle-orm';
import { ar_aging_buckets, finance_invoices } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { IFinanceArRepo, ArBucket, CreateArEntryDto } from '../../domain/repositories/i-finance-ar.repo';

// OWNER QARORI 2026-07-02 (Moliya-GL-Kassa): finance_invoices = kanonik invoice-manba.
// sales_invoices / fi_invoices (view over legacy `invoices`) o'rniga finance_invoices
// (invoice_type='sales') ishlatiladi — sales_invoices'ning yagona yozuvchisi shu fayl edi
// (0 satr, boshqa consumer yo'q); fi_invoices o'qish esa createArEntry yozuvi bilan
// mos kelmas edi (o'qish ≠ yozish jadvali — endi ikkalasi ham finance_invoices).

type Row = Record<string, unknown>;

export type { ArBucket };

@Injectable()
export class FinanceArRepository implements IFinanceArRepo {
  async getArAgingBuckets(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(ar_aging_buckets)
        .orderBy(sql`${ar_aging_buckets.total_outstanding} DESC`).then(r => r as Row[]);
      }, 'DB_ERROR');
  }

  async getArAgingTotals(): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.select({
        current:           sql<number>`COALESCE(SUM(${ar_aging_buckets.current_amount}),0)`,
        days31to60:        sql<number>`COALESCE(SUM(${ar_aging_buckets.days_31_60}),0)`,
        days61to90:        sql<number>`COALESCE(SUM(${ar_aging_buckets.days_61_90}),0)`,
        days91to120:       sql<number>`COALESCE(SUM(${ar_aging_buckets.days_91_120}),0)`,
        over120:           sql<number>`COALESCE(SUM(${ar_aging_buckets.over_120}),0)`,
        total_outstanding: sql<number>`COALESCE(SUM(${ar_aging_buckets.total_outstanding}),0)`,
      }).from(ar_aging_buckets);
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async getOverdueInvoices(today: string): Promise<Result<Row[]>> {
    // Read from finance_invoices (kanonik, 2026-07-02) — invoice_type='sales'.
    return safeCall(async () => {
      const rows = await db.select({
        id:            finance_invoices.id,
        due_date:      finance_invoices.due_date,
        total_amount:  finance_invoices.total_amount,
        paid_amount:   finance_invoices.paid_amount,
        customer_name: finance_invoices.customer_name,
        status:        finance_invoices.payment_status,
      }).from(finance_invoices)
        .where(and(
          eq(finance_invoices.invoice_type, 'sales'),
          ne(finance_invoices.payment_status, 'paid'),
          lt(finance_invoices.due_date, today),
        ));
      return rows as Row[];
    }, 'DB_ERROR');
  }

  async getUnpaidInvoices(): Promise<Result<Row[]>> {
    // Read from finance_invoices (kanonik, 2026-07-02) — invoice_type='sales'.
    return safeCall(async () => {
      const rows = await db.select({
        id:            finance_invoices.id,
        due_date:      finance_invoices.due_date,
        total_amount:  finance_invoices.total_amount,
        paid_amount:   finance_invoices.paid_amount,
        customer_name: finance_invoices.customer_name,
      }).from(finance_invoices)
        .where(and(
          eq(finance_invoices.invoice_type, 'sales'),
          ne(finance_invoices.payment_status, 'paid'),
        ));
      return rows as Row[];
    }, 'DB_ERROR');
  }

  async clearArAgingBuckets(): Promise<void> {
    await db.delete(ar_aging_buckets);
  }

  async insertArAgingBucket(b: ArBucket): Promise<void> {
    await db.insert(ar_aging_buckets).values({
      customer_id:       b.customer_id ?? undefined,
      customer_type:     b.customer_type,
      current_amount:    String(b.current),
      days_31_60:        String(b.days_31_60),
      days_61_90:        String(b.days_61_90),
      days_91_120:       String(b.days_91_120),
      over_120:          String(b.over_120),
      total_outstanding: String(b.total_outstanding),
    });
  }

  async replaceArAgingBuckets(rows: ArBucket[]): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(ar_aging_buckets);
      if (rows.length > 0) {
        await tx.insert(ar_aging_buckets).values(
          rows.map(b => ({
            customer_id:       b.customer_id ?? undefined,
            customer_type:     b.customer_type,
            current_amount:    String(b.current),
            days_31_60:        String(b.days_31_60),
            days_61_90:        String(b.days_61_90),
            days_91_120:       String(b.days_91_120),
            over_120:          String(b.over_120),
            total_outstanding: String(b.total_outstanding),
          })),
        );
      }
    });
  }

  async createArEntry(dto: CreateArEntryDto): Promise<Result<Row>> {
    return safeCall(async () => {
      // C4 continued (CRITICAL-CORRECTNESS-AUDIT-2026-07-06, finding 1.3): was `AR-${Date.now()}` —
      // same finance_invoices.invoice_number collision risk as the other 3 independent writers
      // (drizzle-finance-invoice.repo.ts, finance-actions.repository.ts, finance-ap.repository.ts),
      // now closed the same way — server-side nextval(invoice_number_seq), atomic.
      const rows = await db.insert(finance_invoices).values({
        invoice_number: sql`'AR-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('invoice_number_seq')::text, 6, '0')`,
        invoice_type:   'sales',
        customer_id:    dto.customerId != null ? Number(dto.customerId) : null,
        total_amount:   String(dto.amount),
        paid_amount:    '0',
        payment_status: 'unpaid',
        due_date:       dto.dueDate ?? null,
        created_by:     dto.createdBy ?? null,
      } as unknown as typeof finance_invoices.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
    }, 'DB_ERROR');
  }
}
