/**
 * @module integration-extended-mro.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { db } from '@shared/db';
import {
  mro_equipment, mro_items, mro_requests, mro_budgets,
  expense_requests, advance_payments, stock_gl_postings,
  gl_account_mappings, vendor_invoices, three_way_match_results, shifts,
} from '@shared/db';
import { safeCall, Result } from '@common/result';
import { eq, isNotNull, gte, sql, isNull, and, or } from 'drizzle-orm';

import { MAX_QUERY_LIMIT } from '@common/constants/app.constants';
type Row = Record<string, unknown>;

@Injectable()
export class IntegrationExtendedMroRepository {
  findFlatEquipment(): Promise<Result<Row[]>> {
    return safeCall(() =>
      db.select().from(mro_equipment).orderBy(mro_equipment.name).limit(MAX_QUERY_LIMIT) as Promise<Row[]>,
    );
  }

  insertFlatEquipment(name: string, category: string, status: string, location: string | null, purchaseDate: string | null, nextMaintenanceDate: string | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(mro_equipment).values({
        name,
        category,
        status,
        location,
        purchase_date: purchaseDate ?? undefined,
        next_maintenance_date: nextMaintenanceDate ?? undefined,
      }).returning();
      return (rows[0] ?? {}) as Row;
    });
  }

  findFlatRequests(status?: string): Promise<Result<Row[]>> {
    return safeCall(() => {
      const q = db.select().from(mro_requests).orderBy(sql`${mro_requests.createdAt} DESC`).limit(MAX_QUERY_LIMIT);
      if (status) return q.where(eq(mro_requests.status, status)) as Promise<Row[]>;
      return castTo<Promise<Row[]>>(q);
    });
  }

  insertFlatRequest(itemId: string | number | null, requestedQuantity: number, reason: string | null, requestedBy: string | number | null, priority: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(mro_requests).values({
        requestNumber: `REQ-${Date.now()}`,
        itemId: itemId != null ? String(itemId) : '',
        requestedQuantity,
        requestedBy: requestedBy != null ? String(requestedBy) : '',
        purpose: reason ?? undefined,
        status: 'pending',
      }).returning();
      return (rows[0] ?? {}) as Row;
    });
  }

  findFlatItems(category?: string): Promise<Result<Row[]>> {
    return safeCall(() => {
      const q = db.select().from(mro_items).orderBy(sql`${mro_items.createdAt} DESC`).limit(MAX_QUERY_LIMIT);
      if (category) return q.where(eq(mro_items.category, category)) as Promise<Row[]>;
      return castTo<Promise<Row[]>>(q);
    });
  }

  insertFlatItem(name: string, category: string, unit: string, currentStock: number, minStock: number, unitCost: number, location: string | null, supplier: string | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(mro_items).values({
        itemCode: `MRO-${Date.now()}`,
        name,
        category,
        unit,
        currentStock,
        minStock,
        unitCost,
      }).returning();
      return (rows[0] ?? {}) as Row;
    });
  }

  getFlatStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const [totalItems, lowStock, pendingReqs, activeEq, totalVal] = await Promise.all([
        db.select({ count: sql<number>`COUNT(*)::int` }).from(mro_items),
        db.select({ count: sql<number>`COUNT(*)::int` }).from(mro_items).where(sql`${mro_items.currentStock} <= ${mro_items.minStock}`),
        db.select({ count: sql<number>`COUNT(*)::int` }).from(mro_requests).where(eq(mro_requests.status, 'pending')),
        db.select({ count: sql<number>`COUNT(*)::int` }).from(mro_equipment).where(eq(mro_equipment.status, 'active')),
        db.select({ val: sql<string>`COALESCE(SUM(${mro_items.unitCost} * ${mro_items.currentStock}), 0)` }).from(mro_items),
      ]);
      return {
        total_items: totalItems[0]?.count ?? 0,
        low_stock_count: lowStock[0]?.count ?? 0,
        pending_requests: pendingReqs[0]?.count ?? 0,
        active_equipment: activeEq[0]?.count ?? 0,
        total_value: totalVal[0]?.val ?? '0',
      } as Row;
    });
  }

  getMroOverview(): Promise<Result<Row>> {
    return safeCall(async () => {
      const [items, requests, equipment, budgets] = await Promise.all([
        db.select({ count: sql<number>`COUNT(*)::int` }).from(mro_items),
        db.select({ count: sql<number>`COUNT(*)::int` }).from(mro_requests).where(eq(mro_requests.status, 'pending')),
        db.select({ count: sql<number>`COUNT(*)::int` }).from(mro_equipment),
        db.select({ count: sql<number>`COUNT(*)::int` }).from(mro_budgets),
      ]);
      return {
        total_items: items[0]?.count ?? 0,
        pending_requests: requests[0]?.count ?? 0,
        total_equipment: equipment[0]?.count ?? 0,
        total_budgets: budgets[0]?.count ?? 0,
      } as Row;
    });
  }

  findPmUpcoming(): Promise<Result<Row[]>> {
    return safeCall(() =>
      db.select().from(mro_equipment)
        .where(and(isNotNull(mro_equipment.next_maintenance_date), gte(mro_equipment.next_maintenance_date, sql`NOW()`)))
        .orderBy(mro_equipment.next_maintenance_date)
        .limit(50) as Promise<Row[]>,
    );
  }

  findShifts(): Promise<Result<Row[]>> {
    return safeCall(() =>
      db.select({
        id: shifts.id,
        name: shifts.name,
        start_time: shifts.start_time,
        end_time: shifts.end_time,
        department: shifts.department,
        is_active: shifts.is_active,
        created_at: shifts.created_at,
      }).from(shifts).orderBy(shifts.start_time).limit(100) as Promise<Row[]>,
    );
  }

  findExpenseRequests(status?: string): Promise<Result<Row[]>> {
    return safeCall(() => {
      const q = db.select().from(expense_requests).orderBy(sql`${expense_requests.created_at} DESC`).limit(100);
      if (status) return q.where(eq(expense_requests.status, status)) as Promise<Row[]>;
      return castTo<Promise<Row[]>>(q);
    });
  }

  insertExpenseRequest(title: string, amount: number, category: string, description: string | null, requestedBy: string | number | null): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.insert(expense_requests).values({
        title,
        amount: String(amount),
        category,
        description,
        requested_by: requestedBy != null ? Number(requestedBy) : undefined,
        status: 'pending',
      }).returning();
      return (rows[0] ?? {}) as Row;
    });
  }

  getExpenseStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.select({
        total_requests: sql<number>`COUNT(*)::int`,
        pending:        sql<number>`COUNT(CASE WHEN ${expense_requests.status} = 'pending'  THEN 1 END)::int`,
        approved:       sql<number>`COUNT(CASE WHEN ${expense_requests.status} = 'approved' THEN 1 END)::int`,
        total_approved_amount: sql<string>`COALESCE(SUM(CASE WHEN ${expense_requests.status} = 'approved' THEN ${expense_requests.amount} ELSE 0 END), 0)`,
      }).from(expense_requests);
      return (rows[0] ?? {}) as Row;
    });
  }

  findAdvancePayments(): Promise<Result<Row[]>> {
    return safeCall(() =>
      db.select().from(advance_payments).orderBy(sql`${advance_payments.created_at} DESC`).limit(100) as Promise<Row[]>,
    );
  }

  approveExpenseRequest(id: string, action: string, comments: string): Promise<Result<Row>> {
    return safeCall(async () => {
      const status = action === 'approve' ? 'approved' : 'rejected';
      const rows = await db.update(expense_requests)
        .set({ status, comments, updated_at: _time.now() })
        .where(eq(expense_requests.id, Number(id)))
        .returning();
      return (rows[0] ?? {}) as Row;
    });
  }

  findGlPostings(status?: string, type?: string): Promise<Result<Row[]>> {
    return safeCall(() => {
      const conditions: ReturnType<typeof eq>[] = [];
      if (status) conditions.push(eq(stock_gl_postings.status, status));
      if (type) conditions.push(eq(stock_gl_postings.type, type));
      const q = db.select().from(stock_gl_postings).orderBy(sql`${stock_gl_postings.created_at} DESC`).limit(MAX_QUERY_LIMIT);
      if (conditions.length > 0) return q.where(and(...conditions)) as Promise<Row[]>;
      return castTo<Promise<Row[]>>(q);
    });
  }

  getGlPostingStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.select({
        total:   sql<number>`COUNT(*)::int`,
        pending: sql<number>`COUNT(CASE WHEN ${stock_gl_postings.status} = 'pending' THEN 1 END)::int`,
        posted:  sql<number>`COUNT(CASE WHEN ${stock_gl_postings.status} = 'posted'  THEN 1 END)::int`,
        failed:  sql<number>`COUNT(CASE WHEN ${stock_gl_postings.status} = 'failed'  THEN 1 END)::int`,
      }).from(stock_gl_postings);
      return (rows[0] ?? {}) as Row;
    });
  }

  findGlAccountMapping(): Promise<Result<Row[]>> {
    return safeCall(() =>
      db.select().from(gl_account_mappings).orderBy(sql`${gl_account_mappings.created_at} DESC`).limit(MAX_QUERY_LIMIT) as Promise<Row[]>,
    );
  }

  findVendorInvoices(matchStatus?: string): Promise<Result<Row[]>> {
    return safeCall(() => {
      const q = db.select().from(vendor_invoices).orderBy(sql`${vendor_invoices.created_at} DESC`).limit(100);
      if (matchStatus) return q.where(eq(vendor_invoices.match_status, matchStatus)) as Promise<Row[]>;
      return castTo<Promise<Row[]>>(q);
    });
  }

  getThreeWayMatchStats(): Promise<Result<Row>> {
    return safeCall(async () => {
      const rows = await db.select({
        total_invoices: sql<number>`COUNT(*)::int`,
        matched:        sql<number>`COUNT(CASE WHEN ${vendor_invoices.match_status} = 'matched'   THEN 1 END)::int`,
        unmatched:      sql<number>`COUNT(CASE WHEN ${vendor_invoices.match_status} = 'unmatched' THEN 1 END)::int`,
        partial:        sql<number>`COUNT(CASE WHEN ${vendor_invoices.match_status} = 'partial'   THEN 1 END)::int`,
      }).from(vendor_invoices);
      return (rows[0] ?? {}) as Row;
    });
  }

  findThreeWayMatchResults(): Promise<Result<Row[]>> {
    return safeCall(() =>
      db.select().from(three_way_match_results).orderBy(sql`${three_way_match_results.created_at} DESC`).limit(100) as Promise<Row[]>,
    );
  }

}
