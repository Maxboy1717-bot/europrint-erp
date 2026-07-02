/**
 * @module drizzle-dashboard-svc.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { users, salesOrders, hitlApprovals, approvalRequests } from '@europrint/schemas';
import { eq, count } from 'drizzle-orm';
import { Result, Ok, Err } from '@common/result';
import { IDashboardSvcRepository } from './i-dashboard-svc.repo';

@Injectable()
export class DrizzleDashboardSvcRepository implements IDashboardSvcRepository {
  async countUsers(): Promise<Result<number>> {
    try {
      const result = await db.select({ count: count() }).from(users);
      return Ok(Number(result[0]?.count || 0));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Foydalanuvchilarni sanashda xatolik');
    }
  }

  async countOrders(): Promise<Result<number>> {
    try {
      // STEP 3 A.1: count canonical sales_orders (12 real), not the dormant sd_orders view (0).
      const result = await db.select({ count: count() }).from(salesOrders);
      return Ok(Number(result[0]?.count || 0));
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Buyurtmalarni sanashda xatolik');
    }
  }

  async countPendingApprovals(): Promise<Result<number>> {
    try {
      // Widget aggregates BOTH the legacy hitl_approvals table AND the CQRS
      // approval_requests table (director module) so pending counts from either
      // approval flow are reflected in the director dashboard.
      const [hitlResult, cqrsResult] = await Promise.all([
        db.select({ count: count() }).from(hitlApprovals).where(eq(hitlApprovals.status, 'pending')),
        db.select({ count: count() }).from(approvalRequests).where(eq(approvalRequests.status, 'pending')),
      ]);
      const total = Number(hitlResult[0]?.count || 0) + Number(cqrsResult[0]?.count || 0);
      return Ok(total);
    } catch (e: unknown) {
      return Err((e as Error)?.message || 'Tasdiqlashlarni sanashda xatolik');
    }
  }
}
