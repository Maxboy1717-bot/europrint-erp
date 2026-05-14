/**
 * @module finance-ap.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import { eq, ne, sql, lt } from 'drizzle-orm';
import { ap_aging_buckets, purchase_invoices } from '@shared/db';
import { safeCall, Result } from '@common/result';

type Row = Record<string, unknown>;

export type ApBucket = {
  vendor_id: null | string;
  current: number; days_31_60: number; days_61_90: number;
  days_91_120: number; over_120: number; total_outstanding: number;
};

@Injectable()
export class FinanceApRepository {
  async getApAgingBuckets(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(ap_aging_buckets)
        .orderBy(sql`${ap_aging_buckets.total_outstanding} DESC`).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getApAgingTotals(): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.select({
        current:           sql<number>`COALESCE(SUM(${ap_aging_buckets.current_amount}),0)`,
        days31to60:        sql<number>`COALESCE(SUM(${ap_aging_buckets.days_31_60}),0)`,
        days61to90:        sql<number>`COALESCE(SUM(${ap_aging_buckets.days_61_90}),0)`,
        days91to120:       sql<number>`COALESCE(SUM(${ap_aging_buckets.days_91_120}),0)`,
        over120:           sql<number>`COALESCE(SUM(${ap_aging_buckets.over_120}),0)`,
        total_outstanding: sql<number>`COALESCE(SUM(${ap_aging_buckets.total_outstanding}),0)`,
      }).from(ap_aging_buckets);
      return (rows[0] ?? {}) as Row;
      }, 'DB_ERROR');
  }

  async getOverduePurchaseInvoices(today: string): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select().from(purchase_invoices)
        .where(sql`${purchase_invoices.payment_status} != 'paid' AND ${purchase_invoices.due_date} < ${today}::date`)
        .orderBy(purchase_invoices.due_date).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async getUnpaidPurchaseInvoices(): Promise<Result<Row[]>> {
    return safeCall(async () => {
      return db.select({
        id:            purchase_invoices.id,
        due_date:      purchase_invoices.due_date,
        total_amount:  purchase_invoices.total_amount,
        paid_amount:   purchase_invoices.paid_amount,
        supplier_name: purchase_invoices.supplier_name,
      }).from(purchase_invoices)
        .where(sql`${purchase_invoices.payment_status} != 'paid'`).then(r => castTo<Row[]>(r));
      }, 'DB_ERROR');
  }

  async clearApAgingBuckets(): Promise<void> {
    await db.delete(ap_aging_buckets);
  }

  async insertApAgingBucket(b: ApBucket): Promise<void> {
    await db.insert(ap_aging_buckets).values({
      vendor_id:         b.vendor_id ?? undefined,
      current_amount:    String(b.current),
      days_31_60:        String(b.days_31_60),
      days_61_90:        String(b.days_61_90),
      days_91_120:       String(b.days_91_120),
      over_120:          String(b.over_120),
      total_outstanding: String(b.total_outstanding),
    });
  }
}
