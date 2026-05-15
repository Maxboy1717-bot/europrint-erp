/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   Optimistic-lock UPDATE with COALESCE(version, 0) = ${expected} RETURNING
 *   id and new version, and the atomic advance-payment CTE chain
 *   (WITH existing_key AS ..., lock_update AS UPDATE ... RETURNING,
 *    idempotency_insert AS INSERT ... ON CONFLICT DO NOTHING RETURNING)
 *   that combines idempotency-key check, conditional UPDATE, and
 *   key-write into a single statement. Drizzle has no CTE-with-DML composition.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module drizzle-sales-order.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { runQuery, db } from '@shared/db';
import { castTo } from '@common/db-rows';
import { Injectable } from '@nestjs/common';
import { Result } from '@common/types/result.type';
import { sql } from 'drizzle-orm';
import { execSdSalesOrderInsert, execSdSalesOrderUpdate, execSdSalesOrderDelete } from '@common/database/queries-sd';
import { Err } from '@common/result';
import { SalesOrder } from '../../domain/aggregates/sales-order.aggregate';
import { ISalesOrderRepository } from '../../domain/repositories/i-sales-order.repo';
import { SoStatus } from '../../domain/value-objects/so-status.vo';
import { Money } from '@common/money/money.vo';

type Row = Record<string, unknown>;

@Injectable()
export class DrizzleSalesOrderRepository implements ISalesOrderRepository {
  async save(order: SalesOrder): Promise<Result<SalesOrder>> {
    try {
      await execSdSalesOrderInsert(
        order.getOrderNumber(), order.getStatus(), order.getCompanyId(),
        order.getTotalAmount(), (castTo<Row>(order))['createdBy'],
      );
      return { ok: true as const, data: order };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findById(id: number): Promise<Result<SalesOrder | null>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE id = ${id} AND deleted_at IS NULL LIMIT 1`);
      if (!r.rows[0]) return { ok: true as const, data: null };
      return { ok: true as const, data: this.toDomain(r.rows[0] as Row) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findByOrderNumber(orderNumber: string): Promise<Result<SalesOrder | null>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE order_number = ${orderNumber} AND deleted_at IS NULL LIMIT 1`);
      if (!r.rows[0]) return { ok: true as const, data: null };
      return { ok: true as const, data: this.toDomain(r.rows[0] as Row) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findByCompanyId(companyId: number, limit: number, offset: number): Promise<Result<SalesOrder[]>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE company_id = ${companyId} AND deleted_at IS NULL LIMIT ${limit} OFFSET ${offset}`);
      return { ok: true as const, data: ((r.rows as Row[]) ?? []).map((row) => this.toDomain(row)) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findByStatus(status: string, limit: number, offset: number): Promise<Result<SalesOrder[]>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE status = ${status} AND deleted_at IS NULL LIMIT ${limit} OFFSET ${offset}`);
      return { ok: true as const, data: ((r.rows as Row[]) ?? []).map((row) => this.toDomain(row)) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findAll(limit: number, offset: number): Promise<Result<SalesOrder[]>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
      return { ok: true as const, data: ((r.rows as Row[]) ?? []).map((row) => this.toDomain(row)) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async findPendingAdvanceOrders(limit: number, offset: number): Promise<Result<SalesOrder[]>> {
    try {
      const r = await runQuery<Row>(sql`SELECT * FROM sd_sales_orders WHERE advance_status IN ('pending', 'partial') AND deleted_at IS NULL LIMIT ${limit} OFFSET ${offset}`);
      return { ok: true as const, data: ((r.rows as Row[]) ?? []).map((row) => this.toDomain(row)) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async update(order: SalesOrder): Promise<Result<void>> {
    try {
      await execSdSalesOrderUpdate(order.getStatus(), order.getAdvanceStatus(), order.getId());
      return { ok: true as const, data: undefined };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async updateAdvancePaidWithLock(
    id: number,
    newAdvancePaid: number,
    newAdvanceStatus: string,
    expectedVersion: number,
  ): Promise<Result<{ updated: boolean; newVersion: number }>> {
    try {
      const result = await runQuery<{ id: number; new_version: number }>(sql`
        UPDATE sd_sales_orders
           SET advance_paid   = ${newAdvancePaid},
               advance_status = ${newAdvanceStatus},
               version        = COALESCE(version, 0) + 1,
               updated_at     = NOW()
         WHERE id      = ${id}
           AND COALESCE(version, 0) = ${expectedVersion}
        RETURNING id, COALESCE(version, 1) AS new_version
      `);
      if (!result.rows?.length) {
        return Err({ code: 'CONFLICT', message: 'Optimistic lock conflict: version mismatch' });
      }
      return { ok: true as const, data: { updated: true, newVersion: Number(result.rows[0]?.new_version ?? expectedVersion + 1) } };
    } catch (err) {
      return Err({ code: 'DB_ERROR', message: String(err) });
    }
  }

  async updateAdvancePaidAtomic(
    id: number,
    newAdvancePaid: number,
    newAdvanceStatus: string,
    expectedVersion: number,
    idempotencyKey: string,
  ): Promise<Result<{ updated: boolean; newVersion: number; duplicate: boolean }>> {
    try {
      const result = await runQuery<{ duplicate_count: number; lock_count: number; new_version: number | null }>(sql`
        WITH existing_key AS (
          SELECT id FROM sd_advance_idempotency_keys
           WHERE order_id = ${id} AND idempotency_key = ${idempotencyKey}
           LIMIT 1
        ),
        lock_update AS (
          UPDATE sd_sales_orders
             SET advance_paid   = ${newAdvancePaid},
                 advance_status = ${newAdvanceStatus},
                 version        = COALESCE(version, 0) + 1,
                 updated_at     = NOW()
           WHERE sd_sales_orders.id = ${id}
             AND COALESCE(version, 0) = ${expectedVersion}
             AND NOT EXISTS (SELECT 1 FROM existing_key)
          RETURNING id, COALESCE(version, 1) AS new_version
        ),
        idempotency_insert AS (
          INSERT INTO sd_advance_idempotency_keys (order_id, idempotency_key, advance_paid)
          SELECT ${id}, ${idempotencyKey}, ${newAdvancePaid}
           WHERE EXISTS (SELECT 1 FROM lock_update)
          ON CONFLICT (order_id, idempotency_key) DO NOTHING
          RETURNING id
        )
        SELECT
          (SELECT COUNT(*)::int FROM existing_key) AS duplicate_count,
          (SELECT COUNT(*)::int FROM lock_update)  AS lock_count,
          (SELECT new_version FROM lock_update LIMIT 1) AS new_version
      `);
      const row           = result.rows?.[0];
      const duplicateCount = Number(row?.duplicate_count ?? 0);
      const lockCount      = Number(row?.lock_count ?? 0);
      const newVersion     = row?.new_version != null ? Number(row.new_version) : null;

      if (duplicateCount > 0) {
        return { ok: true as const, data: { updated: false, newVersion: -1, duplicate: true } };
      }
      if (lockCount === 0 || newVersion === null) {
        return Err({ code: 'CONFLICT', message: 'Optimistic lock conflict: version mismatch' });
      }
      return { ok: true as const, data: { updated: true, newVersion, duplicate: false } };
    } catch (err) {
      return Err({ code: 'DB_ERROR', message: String(err) });
    }
  }

  async delete(id: number): Promise<Result<void>> {
    try {
      await execSdSalesOrderDelete(id);
      return { ok: true as const, data: undefined };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  async count(): Promise<Result<number>> {
    try {
      const r = await runQuery<{ count: number }>(sql`SELECT COUNT(*)::int AS count FROM sd_sales_orders`);
      return { ok: true as const, data: Number(r.rows[0]?.count ?? 0) };
    } catch (err) { return Err({ code: 'DB_ERROR', message: String(err) }); }
  }

  private toDomain(row: Row): SalesOrder {
    const statusResult = SoStatus.create(String(row.status ?? 'draft'));
    const moneyResult = Money.of(Number(row.total_amount ?? 0), String(row.currency ?? 'UZS'));
    return new SalesOrder({
      id: Number(row.id ?? 0), orderNumber: String(row.order_number ?? ''),
      status: statusResult.data as SoStatus, companyId: Number(row.company_id ?? 0),
      totalAmount: moneyResult,
      advanceRequired: Number(row.advance_required ?? 0), advancePaid: Number(row.advance_paid ?? 0),
      advanceStatus: String(row.advance_status ?? 'pending') as 'pending' | 'approved' | 'partial' | 'bypassed',
      advanceBypassBy: Number(row.advance_bypass_by ?? 0),
      advanceBypassReason: String(row.advance_bypass_reason ?? ''),
      designFlag: Boolean(row.design_flag), sampleFlag: Boolean(row.sample_flag),
      techBomApproved: Boolean(row.tech_bom_approved),
      techRoutingApproved: Boolean(row.tech_routing_approved),
      techCardApproved: Boolean(row.tech_card_approved),
      createdBy: Number(row.created_by ?? 0),
      createdAt: row.created_at ? new Date(String(row.created_at)) : _time.now(),
      updatedAt: row.updated_at ? new Date(String(row.updated_at)) : _time.now(),
      version: Number(row.version ?? 0),
    });
  }
}
