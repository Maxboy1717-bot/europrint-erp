/**
 * @module finance-ar.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 * @layer Infrastructure (Finance)
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { ar_aging_buckets, sales_invoices } from '@shared/db';
import { safeCall, Result } from '@common/result';
import type { IFinanceArRepo, ArBucket, CreateArEntryDto } from '../../domain/repositories/i-finance-ar.repo';

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
    return safeCall(async () => {
      return db.select().from(sales_invoices)
        .where(sql`${sales_invoices.payment_status} != 'paid' AND ${sales_invoices.due_date} < ${today}::date`)
        .orderBy(sales_invoices.due_date).then(r => r as Row[]);
      }, 'DB_ERROR');
  }

  async getUnpaidInvoices(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:            sales_invoices.id,
        due_date:      sales_invoices.due_date,
        total_amount:  sales_invoices.total_amount,
        paid_amount:   sales_invoices.paid_amount,
        customer_name: sales_invoices.customer_name,
      }).from(sales_invoices)
        .where(sql`${sales_invoices.payment_status} != 'paid'`).then(r => r as Row[]);
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
      const invoiceNumber = `AR-${Date.now()}`;
      const rows = await db.insert(sales_invoices).values({
        customer_id:    dto.customerId != null ? String(dto.customerId) : null,
        customer_name:  null,
        invoice_number: invoiceNumber,
        sales_order_id: null,
        total_amount:   String(dto.amount),
        paid_amount:    '0',
        currency:       'UZS',
        status:         'draft',
        payment_status: 'unpaid',
        due_date:       dto.dueDate ?? null,
      } as typeof sales_invoices.$inferInsert).returning();
      return (rows[0] ?? {}) as Row;
    }, 'DB_ERROR');
  }
}
