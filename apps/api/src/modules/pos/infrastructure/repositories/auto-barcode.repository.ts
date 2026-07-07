/**
 * NOTE: Raw SQL retained intentionally — Drizzle ORM cannot express:
 *   - Snake-case-to-camelCase column aliasing via "double-quoted" identifiers
 *     (movementLineId, materialCardId, materialCode, batchNumber) needed by
 *     the typedExecute<T> contract — Drizzle's select projection produces
 *     snake_case property names and would require a mapping pass.
 *   - LEFT JOIN material_cards with selective column projection that excludes
 *     the joined table from the result shape; Drizzle's relational query
 *     builder always materialises full joined rows.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module auto-barcode.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Result, Ok, Err, AppError } from '@common/result';

export interface MovementLineForBarcode {
  movementLineId:   number;
  materialCardId:   number;
  materialCode:     string | null;
  batchNumber:      string | null;
  // NOTE: pos_movement_lines.quantity NUMERIC — pg drayveri string qaytaradi
  // ("1.0000"), shuning uchun turi number bilan cheklanmaydi (§2.7 fix).
  quantity:         number | string;
  unit:             string | null;
}

@Injectable()
export class AutoBarcodeRepository {
  async findMovement(movementId: number): Promise<Result<{
    id: number; movement_type: string; to_warehouse_id: number | null;
  } | null, AppError>> {
    try {
      const rows = await typedExecute<{ id: number; movement_type: string; to_warehouse_id: number | null }>(sql`
        SELECT id, movement_type, to_warehouse_id
          FROM pos_movements
         WHERE id = ${movementId}
         LIMIT 1
      `);
      return Ok(rows[0] ?? null);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async findLines(movementId: number): Promise<Result<MovementLineForBarcode[], AppError>> {
    try {
      const rows = await typedExecute<MovementLineForBarcode>(sql`
        SELECT
          pml.id           AS "movementLineId",
          pml.material_id AS "materialCardId",
          mc.kod           AS "materialCode",
          pml.batch_number AS "batchNumber",
          pml.quantity,
          pml.unit
        FROM pos_movement_lines pml
        -- C6.5 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): a soft-deleted/deactivated material must
        -- not surface its code/name onto a printed barcode. Filtering in the JOIN condition (not
        -- WHERE) preserves the movement line row — materialCode simply comes back NULL, which
        -- generateBarcode() already falls back to 'MAT' for — instead of silently dropping the
        -- whole line from the barcode-generation batch.
        LEFT JOIN material_cards mc ON mc.id = pml.material_id AND mc.deleted_at IS NULL AND mc.is_active = true
        WHERE pml.movement_id = ${movementId}
      `);
      return Ok(rows);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  async insertBarcode(dto: {
    movementId:     number;
    movementLineId: number;
    materialCardId: number;
    warehouseId:    number | null;
    batchNumber:    string | null;
    quantity:       number | string;
    unit:           string | null;
    barcode:        string;
  }): Promise<Result<void, AppError>> {
    try {
      // MUHIM: barcode_print_queue.barcode_data NOT NULL — barcode_data/barcode_value ham yoziladi,
      // aks holda kirimda barkod generatsiya jonli NOT NULL xatosi bilan yiqiladi (jonli tasdiqlandi).
      //
      // MUHIM 2 (2026-07-03, §2.7): pos_barcode_print_queue.quantity ustuni INTEGER,
      // lekin manba pos_movement_lines.quantity NUMERIC — pg drayveri buni STRING
      // ("1.0000") qaytaradi va to'g'ridan-to'g'ri integer ustunga bog'lansa
      // "invalid input syntax for type integer" bilan yiqiladi (jonli tasdiqlandi:
      // shuning uchun pos_barcode_print_queue doim bo'sh qolgan edi). Yaqin butun
      // songa yaxlitlab, xavfsiz butun songa aylantiriladi.
      const rawQty = Number(dto.quantity);
      const safeQty = Number.isFinite(rawQty) ? Math.round(rawQty) : 0;
      await db.execute(sql`
        INSERT INTO pos_barcode_print_queue
          (movement_id, movement_line_id, material_id, warehouse_id,
           batch_number, quantity, unit, barcode, barcode_data, barcode_value, barcode_type, status, created_at)
        VALUES
          (${dto.movementId}, ${dto.movementLineId}, ${dto.materialCardId}, ${dto.warehouseId},
           ${dto.batchNumber}, ${safeQty}, ${dto.unit ?? null},
           ${dto.barcode}, ${dto.barcode}, ${dto.barcode}, 'CODE128', 'QUEUED', NOW())
      `);
      return Ok(undefined);
    } catch (e) {
      // C8.1 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): surface the Postgres error code so the
      // caller can tell a unique-violation (23505, barcode collision — retry with a fresh
      // barcode) apart from any other DB failure (log and give up, don't loop forever).
      const pgCode = (e as { code?: string } | null)?.code;
      return Err({ message: String(e), code: 'DB_ERROR', details: { pgCode } });
    }
  }

  async listForMovement(movementId: number): Promise<Result<unknown[], AppError>> {
    try {
      const rows = await typedExecute<unknown>(sql`
        SELECT id, barcode, barcode_type, batch_number, quantity, unit,
               material_id AS material_card_id, status, printed_at, created_at
          FROM pos_barcode_print_queue
         WHERE movement_id = ${movementId}
         ORDER BY id
      `);
      return Ok(rows);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
