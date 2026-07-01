/**
 * @module drizzle-cashier-hub.repo
 * @description Drizzle implementation of the CASHIER-HUB KAS-1 repository. Real INSERT/UPDATE
 *   against cashier_shifts / cashier_movements (no echo, no fake-green — Q-40). Returns Result<T>.
 *   Imports tables from @workspace/db (canonical lib/db build), mirroring drizzle-gl-posting.repo.
 * @layer Infrastructure (Finance)
 */

import { Injectable } from '@nestjs/common';
import { db, runQuery } from '@shared/db';
import { typedExecute } from '@shared/db/typed-execute';
import { cashierShifts, cashierMovements } from '@workspace/db';
import { and, eq, sql } from 'drizzle-orm';
import { Result, Ok, Err, AppErr } from '@common/result';
import type {
  ICashierHubRepository,
  OpenShiftDto,
  RecordMovementDto,
  ShiftMovementTotals,
  ListShiftsFilters,
  ShiftListPage,
  ShiftListRow,
  CashierMovementType,
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

  async listShifts(filters: ListShiftsFilters): Promise<Result<ShiftListPage>> {
    try {
      // Optional WHERE — build with parametrised sql fragments (no sql.raw of variables — Qoida B).
      const conds = [sql`1 = 1`];
      if (filters.status) conds.push(sql`s.status = ${filters.status}`);
      if (typeof filters.cashierUserId === 'number') {
        conds.push(sql`s.cashier_user_id = ${filters.cashierUserId}`);
      }
      const whereSql = sql.join(conds, sql` AND `);

      // One SQL for the page (JOIN to users for the cashier name — no N+1, Performance §).
      const rows = await typedExecute<ShiftListRow>(sql`
        SELECT s.id,
               s.cashier_user_id        AS "cashierUserId",
               COALESCE(NULLIF(TRIM(u.full_name), ''), u.username) AS "cashierName",
               s.opened_at              AS "openedAt",
               s.opened_amount          AS "openedAmount",
               s.closed_at              AS "closedAt",
               s.closed_amount          AS "closedAmount",
               s.expected_amount        AS "expectedAmount",
               s.variance               AS "variance",
               s.status,
               s.notes
          FROM cashier_shifts s
          LEFT JOIN users u ON u.id = s.cashier_user_id
         WHERE ${whereSql}
         ORDER BY s.opened_at DESC, s.id DESC
         LIMIT ${filters.limit} OFFSET ${filters.offset}
      `);

      // Total matching count (same WHERE, no pagination) for the {data,total} list shape.
      const countRows = await typedExecute<{ total: number }>(sql`
        SELECT COUNT(*)::int AS total
          FROM cashier_shifts s
         WHERE ${whereSql}
      `);
      const total = Array.isArray(countRows) ? Number(countRows[0]?.total ?? 0) : 0;

      return Ok({ data: Array.isArray(rows) ? rows : [], total });
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_SHIFTS_LIST_FAILED: ${String(e)}`));
    }
  }

  /** One shift joined to the cashier's display name (kunlik PDF header) — reuses the listShifts join. */
  async getShiftForPdf(shiftId: number): Promise<Result<ShiftListRow | null>> {
    try {
      const rows = await typedExecute<ShiftListRow>(sql`
        SELECT s.id,
               s.cashier_user_id        AS "cashierUserId",
               COALESCE(NULLIF(TRIM(u.full_name), ''), u.username) AS "cashierName",
               s.opened_at              AS "openedAt",
               s.opened_amount          AS "openedAmount",
               s.closed_at              AS "closedAt",
               s.closed_amount          AS "closedAmount",
               s.expected_amount        AS "expectedAmount",
               s.variance               AS "variance",
               s.status,
               s.notes
          FROM cashier_shifts s
          LEFT JOIN users u ON u.id = s.cashier_user_id
         WHERE s.id = ${shiftId}
         LIMIT 1
      `);
      return Ok((Array.isArray(rows) ? rows[0] : undefined) ?? null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_SHIFT_PDF_LOOKUP_FAILED: ${String(e)}`));
    }
  }

  async openShift(dto: OpenShiftDto): Promise<Result<CashierShift>> {
    try {
      const inserted = await db
        .insert(cashierShifts)
        .values({
          cashierUserId: dto.cashierUserId,
          openedAmount: dto.openingAmount,
          // Optional per-shift cash ceiling. null/undefined = no per-shift limit (global default applies).
          dailyCashLimit: dto.dailyCashLimit ?? null,
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

      // Itemised per-type tally for the X/Z reconciliation breakdown — one grouped SQL (no N+1).
      const breakdown = await db
        .select({
          type: cashierMovements.type,
          count: sql<number>`COUNT(*)`,
          total: sql<string>`COALESCE(SUM(${cashierMovements.amount}), 0)`,
        })
        .from(cashierMovements)
        .where(eq(cashierMovements.shiftId, shiftId))
        .groupBy(cashierMovements.type)
        .orderBy(cashierMovements.type);
      const byType = (Array.isArray(breakdown) ? breakdown : []).map((r) => ({
        type: r.type as CashierMovementType,
        count: Number(r.count),
        total: Number(r.total),
      }));

      return Ok({
        cashIn: Number(agg.cashIn),
        cashOut: Number(agg.cashOut),
        movementCount: Number(agg.count),
        byType,
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

  async findGlobalDailyCashLimit(): Promise<Result<number | null>> {
    try {
      // Read the global default from cfo_config. 0 (or absent) → null (no limit), so the
      // ledger only warns when a positive ceiling is actually configured (no fabricated cap).
      const rows = await runQuery<{ config_value: string | null }>(
        sql`SELECT config_value FROM cfo_config WHERE config_key = 'cashier_daily_cash_limit_uzs' LIMIT 1`,
      );
      const raw = Array.isArray(rows.rows) ? rows.rows[0]?.config_value : null;
      const val = raw === null || raw === undefined ? 0 : Number(raw);
      return Ok(Number.isFinite(val) && val > 0 ? val : null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', `CASHIER_GLOBAL_LIMIT_LOOKUP_FAILED: ${String(e)}`));
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
