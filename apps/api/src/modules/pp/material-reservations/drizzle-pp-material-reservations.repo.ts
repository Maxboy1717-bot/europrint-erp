/**
 * @module drizzle-pp-material-reservations.repo
 * @description Parameterised-SQL implementation of the PP material-reservation port
 *   (vision 07-pp#30 / EP-PP-068). pp_material_reservations is a migration-added table
 *   (pp-material-reservations-priority-fifo-2026-07-11.sql); like the sibling
 *   pp_reason_codes repo it is read/written through parameterised runQuery (Rule B: no
 *   sql.raw of a variable; every value is bound). All methods return Result<T> and guard
 *   rows with Array.isArray (Rule 1/2). The priority -> FIFO ranking lives in the
 *   allocationQueue ORDER BY; the director override writes the audit columns.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { Result, Ok, Err, AppErr } from '@common/result';
import type {
  IPpMaterialReservationsRepo,
  MaterialReservationRow,
  ReservationStatus,
  CreateReservationInput,
} from './i-pp-material-reservations.repo';

/** Raw DB row (snake_case) before mapping to the camelCase API view. */
interface ReservationDbRow {
  id: number | string;
  production_order_id: number | string;
  material_id: number | string;
  qty: number | string;
  priority: number | string;
  reserved_at: string | Date;
  status: string;
  estimated_available_date: string | Date | null;
  priority_overridden_by: number | string | null;
  override_reason: string | null;
  overridden_at: string | Date | null;
  released_at: string | Date | null;
  created_at: string | Date;
}

function asIso(v: string | Date | null): string | null {
  if (v == null) return null;
  return v instanceof Date ? v.toISOString() : String(v);
}

function mapRow(row: ReservationDbRow): MaterialReservationRow {
  return {
    id: Number(row.id),
    productionOrderId: Number(row.production_order_id),
    materialId: Number(row.material_id),
    qty: Number(row.qty ?? 0),
    priority: Number(row.priority ?? 3),
    reservedAt: asIso(row.reserved_at) ?? '',
    status: String(row.status) as ReservationStatus,
    estimatedAvailableDate: asIso(row.estimated_available_date),
    priorityOverriddenBy:
      row.priority_overridden_by != null ? Number(row.priority_overridden_by) : null,
    overrideReason: row.override_reason != null ? String(row.override_reason) : null,
    overriddenAt: asIso(row.overridden_at),
    releasedAt: asIso(row.released_at),
    createdAt: asIso(row.created_at) ?? '',
  };
}

@Injectable()
export class DrizzlePpMaterialReservationsRepository implements IPpMaterialReservationsRepo {
  async allocationQueue(materialId: number): Promise<Result<MaterialReservationRow[]>> {
    try {
      const r = await runQuery<ReservationDbRow>(sql`
        SELECT id, production_order_id, material_id, qty, priority, reserved_at, status,
               estimated_available_date, priority_overridden_by, override_reason,
               overridden_at, released_at, created_at
        FROM pp_material_reservations
        WHERE material_id = ${materialId} AND status IN ('reserved','waiting')
        ORDER BY priority ASC, reserved_at ASC, id ASC`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      return Ok(rows.map(mapRow));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Rezerv navbatini o'qishda xatolik"));
    }
  }

  async findByOrder(productionOrderId: number): Promise<Result<MaterialReservationRow[]>> {
    try {
      const r = await runQuery<ReservationDbRow>(sql`
        SELECT id, production_order_id, material_id, qty, priority, reserved_at, status,
               estimated_available_date, priority_overridden_by, override_reason,
               overridden_at, released_at, created_at
        FROM pp_material_reservations
        WHERE production_order_id = ${productionOrderId}
        ORDER BY id DESC`);
      const rows = Array.isArray(r.rows) ? r.rows : [];
      return Ok(rows.map(mapRow));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Buyurtma rezervlarini o'qishda xatolik"));
    }
  }

  async findById(id: number): Promise<Result<MaterialReservationRow | null>> {
    try {
      const r = await runQuery<ReservationDbRow>(sql`
        SELECT id, production_order_id, material_id, qty, priority, reserved_at, status,
               estimated_available_date, priority_overridden_by, override_reason,
               overridden_at, released_at, created_at
        FROM pp_material_reservations WHERE id = ${id}`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      return Ok(row ? mapRow(row) : null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Rezervni o'qishda xatolik"));
    }
  }

  async create(input: CreateReservationInput): Promise<Result<MaterialReservationRow>> {
    try {
      // priority inherits the production order's own priority when not supplied
      // (COALESCE param -> orders.priority -> 3). reserved_at/status/created_at = DB defaults.
      const r = await runQuery<ReservationDbRow>(sql`
        INSERT INTO pp_material_reservations (production_order_id, material_id, qty, priority)
        VALUES (
          ${input.productionOrderId},
          ${input.materialId},
          ${input.qty},
          COALESCE(${input.priority ?? null}, (SELECT priority FROM production_orders WHERE id = ${input.productionOrderId}), 3)
        )
        RETURNING id, production_order_id, material_id, qty, priority, reserved_at, status,
                  estimated_available_date, priority_overridden_by, override_reason,
                  overridden_at, released_at, created_at`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      if (!row) return Err(AppErr('DB_ERROR', 'Rezerv yaratilmadi'));
      return Ok(mapRow(row));
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Rezerv yaratishda xatolik'));
    }
  }

  async overridePriority(
    id: number,
    newPriority: number,
    overriddenBy: number,
    reason: string,
  ): Promise<Result<MaterialReservationRow | null>> {
    try {
      const r = await runQuery<ReservationDbRow>(sql`
        UPDATE pp_material_reservations SET
          priority = ${newPriority},
          priority_overridden_by = ${overriddenBy},
          override_reason = ${reason},
          overridden_at = NOW()
        WHERE id = ${id}
        RETURNING id, production_order_id, material_id, qty, priority, reserved_at, status,
                  estimated_available_date, priority_overridden_by, override_reason,
                  overridden_at, released_at, created_at`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      return Ok(row ? mapRow(row) : null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Ustuvorlikni o'zgartirishda xatolik"));
    }
  }

  async markWaiting(
    id: number,
    estimatedAvailableDate: string,
  ): Promise<Result<MaterialReservationRow | null>> {
    try {
      const r = await runQuery<ReservationDbRow>(sql`
        UPDATE pp_material_reservations SET
          status = 'waiting',
          estimated_available_date = ${estimatedAvailableDate}
        WHERE id = ${id}
        RETURNING id, production_order_id, material_id, qty, priority, reserved_at, status,
                  estimated_available_date, priority_overridden_by, override_reason,
                  overridden_at, released_at, created_at`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      return Ok(row ? mapRow(row) : null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Kutish holatiga o'tkazishda xatolik"));
    }
  }

  async release(id: number): Promise<Result<MaterialReservationRow | null>> {
    try {
      const r = await runQuery<ReservationDbRow>(sql`
        UPDATE pp_material_reservations SET
          status = 'released',
          released_at = NOW()
        WHERE id = ${id}
        RETURNING id, production_order_id, material_id, qty, priority, reserved_at, status,
                  estimated_available_date, priority_overridden_by, override_reason,
                  overridden_at, released_at, created_at`);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      return Ok(row ? mapRow(row) : null);
    } catch (e: unknown) {
      return Err(AppErr('DB_ERROR', (e as Error)?.message || "Rezervni bo'shatishda xatolik"));
    }
  }
}
