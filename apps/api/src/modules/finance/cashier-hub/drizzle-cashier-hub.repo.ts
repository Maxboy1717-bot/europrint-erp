/**
 * @module drizzle-cashier-hub.repo
 * @description Drizzle implementation of the CASHIER-HUB KAS-1 repository. Real INSERT/UPDATE
 *   against cashier_shifts / cashier_movements (no echo, no fake-green — Q-40). Returns Result<T>.
 *   Imports tables from @workspace/db (canonical lib/db build), mirroring drizzle-gl-posting.repo.
 * @layer Infrastructure (Finance)
 */

import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { cashierShifts, cashierMovements } from '@workspace/db';
import { and, eq, sql } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';
import type {
  ICashierHubRepository,
  OpenShiftDto,
  RecordMovementDto,
  ShiftMovementTotals,
} from './i-cashier-hub.repo';
import type { CashierShift, CashierMovement } from '@workspace/db';

@Injectable()
export class DrizzleCashierHubRepository implements ICashierHubRepository {
  async findOpenShiftByCashier(cashierUserId: number): Promise<Result<CashierShift | null>> {
    try {
      const rows = await db
        .select()
        .from(cashierShifts)
        .where(and(eq(cashierShifts.cashierUserId, cashierUserId), eq(cashierShifts.status, 'open')))
        .limit(1);
      return Ok((rows[0] ?? null) as CashierShift | null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_OPEN_SHIFT_LOOKUP_FAILED: ${String(e)}`));
    }
  }

  async findShiftById(id: number): Promise<Result<CashierShift | null>> {
    try {
      const rows = await db.select().from(cashierShifts).where(eq(cashierShifts.id, id)).limit(1);
      return Ok((rows[0] ?? null) as CashierShift | null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_SHIFT_LOOKUP_FAILED: ${String(e)}`));
    }
  }

  async openShift(dto: OpenShiftDto): Promise<Result<CashierShift>> {
    try {
      const inserted = await db
        .insert(cashierShifts)
        .values({
          cashierUserId: dto.cashierUserId,
          openedAmount: dto.openingAmount,
          status: 'open',
          openedAt: new Date(),
        })
        .returning();
      if (!inserted[0]) return Err(AppErr('DB_ERROR', 'Smena ochilmadi — INSERT qaytarmadi'));
      return Ok(inserted[0] as CashierShift);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_OPEN_SHIFT_FAILED: ${String(e)}`));
    }
  }

  async closeShift(
    id: number,
    fields: { closedAmount: number; expectedAmount: number; variance: number; notes?: string | null },
  ): Promise<Result<CashierShift>> {
    try {
      const updated = await db
        .update(cashierShifts)
        .set({
          closedAmount: fields.closedAmount,
          expectedAmount: fields.expectedAmount,
          variance: fields.variance,
          status: 'closed',
          closedAt: new Date(),
          notes: fields.notes ?? null,
          updatedAt: new Date(),
        })
        .where(eq(cashierShifts.id, id))
        .returning();
      if (!updated[0]) return Err(AppErr('DB_ERROR', 'Smena yopilmadi — UPDATE qaytarmadi'));
      return Ok(updated[0] as CashierShift);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_CLOSE_SHIFT_FAILED: ${String(e)}`));
    }
  }

  async getShiftMovementTotals(shiftId: number): Promise<Result<ShiftMovementTotals>> {
    try {
      // Aggregate inflow vs outflow. cash_in is the only inflow type; everything else
      // (cash_out / salary_payout / advance / expense) reduces the drawer.
      const rows = await db
        .select({
          cashIn: sql<string>`COALESCE(SUM(CASE WHEN ${cashierMovements.type} = 'cash_in' THEN ${cashierMovements.amount} ELSE 0 END), 0)`,
          cashOut: sql<string>`COALESCE(SUM(CASE WHEN ${cashierMovements.type} <> 'cash_in' THEN ${cashierMovements.amount} ELSE 0 END), 0)`,
          count: sql<number>`COUNT(*)`,
        })
        .from(cashierMovements)
        .where(eq(cashierMovements.shiftId, shiftId));
      const agg = rows[0] ?? { cashIn: '0', cashOut: '0', count: 0 };
      return Ok({
        cashIn: Number(agg.cashIn),
        cashOut: Number(agg.cashOut),
        movementCount: Number(agg.count),
      });
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_TOTALS_FAILED: ${String(e)}`));
    }
  }

  async findMovementByReference(reference: string): Promise<Result<CashierMovement | null>> {
    try {
      const rows = await db
        .select()
        .from(cashierMovements)
        .where(eq(cashierMovements.reference, reference))
        .limit(1);
      return Ok((rows[0] ?? null) as CashierMovement | null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_MOVEMENT_REF_LOOKUP_FAILED: ${String(e)}`));
    }
  }

  async insertMovement(dto: RecordMovementDto): Promise<Result<CashierMovement>> {
    try {
      const inserted = await db
        .insert(cashierMovements)
        .values({
          shiftId: dto.shiftId,
          type: dto.type,
          amount: dto.amount,
          reference: dto.reference,
          glEntryId: dto.glEntryId ?? null,
          description: dto.description ?? null,
          createdBy: dto.createdBy ?? null,
          pinVerified: dto.pinVerified,
          createdAt: new Date(),
        })
        .returning();
      if (!inserted[0]) return Err(AppErr('DB_ERROR', 'Harakat yaratilmadi — INSERT qaytarmadi'));
      return Ok(inserted[0] as CashierMovement);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_MOVEMENT_INSERT_FAILED: ${String(e)}`));
    }
  }

  async listMovements(shiftId: number): Promise<Result<CashierMovement[]>> {
    try {
      const rows = await db
        .select()
        .from(cashierMovements)
        .where(eq(cashierMovements.shiftId, shiftId))
        .orderBy(cashierMovements.id);
      return Ok(rows as CashierMovement[]);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_MOVEMENT_LIST_FAILED: ${String(e)}`));
    }
  }

  async findCashierPinHash(cashierUserId: number): Promise<Result<string | null>> {
    try {
      // owner #8 — cashier PIN store. There is NO users.pin_hash column today; rather than
      // forge/mint a PIN (forbidden), probe information_schema first. Column absent → null
      // (the service then GATES PIN-required movements). When the owner later adds the column
      // (gated DDL), this reads the real bcrypt hash with no code change.
      const colCheck = await runQuery<{ exists: boolean }>(
        sql`SELECT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'pin_hash'
        ) AS exists`,
      );
      const hasColumn = Array.isArray(colCheck.rows) && colCheck.rows[0]?.exists === true;
      if (!hasColumn) return Ok(null);

      const rows = await runQuery<{ pin_hash: string | null }>(
        sql`SELECT pin_hash FROM users WHERE id = ${cashierUserId} LIMIT 1`,
      );
      const pinHash = Array.isArray(rows.rows) ? rows.rows[0]?.pin_hash ?? null : null;
      return Ok(pinHash);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_PIN_LOOKUP_FAILED: ${String(e)}`));
    }
  }
}
