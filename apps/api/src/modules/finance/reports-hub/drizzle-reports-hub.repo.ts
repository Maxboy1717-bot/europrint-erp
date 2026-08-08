/**
 * @module drizzle-reports-hub.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { invoices, payments, budgets, entries } from '@shared/db';
import { count, sql } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IReportsHubRepository } from './i-reports-hub.repo';

@Injectable()
export class DrizzleReportsHubRepository implements IReportsHubRepository {
  async getSummary(): Promise<Result<Record<string, unknown>>> {
    try {
      const [invoiceStats, paymentStats, budgetStats, glStats] = await Promise.all([
        db.select({
          total: count(),
          paid: sql<number>`COUNT(*) FILTER (WHERE status = 'paid')`,
        }).from(invoices),
        db.select({ total: count() }).from(payments),
        db.select({
          total: count(),
          approved: sql<number>`COUNT(*) FILTER (WHERE status = 'approved')`,
        }).from(budgets),
        // GL two-world (2026-07-14 fix): gl_entries has zero writers since the
        // 2026-06-17..07-02 SAP#76 consolidation onto `entries` (ADR-003 canonical).
        // Read from `entries` so this stat isn't permanently frozen at 0.
        db.select({ total: count() }).from(entries),
      ]);
      return Ok({
        invoices: {
          total: Number(invoiceStats[0]?.total || 0),
          paid: Number(invoiceStats[0]?.paid || 0),
        },
        payments: { total: Number(paymentStats[0]?.total || 0) },
        budgets: {
          total: Number(budgetStats[0]?.total || 0),
          approved: Number(budgetStats[0]?.approved || 0),
        },
        glEntries: { total: Number(glStats[0]?.total || 0) },
      });
    } catch (e: unknown) { return Err((e as Error).message || 'Hisobot xulosa topilmadi'); }
  }
}
