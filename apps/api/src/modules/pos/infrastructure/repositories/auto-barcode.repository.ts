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
  quantity:         number;
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
        LEFT JOIN material_cards mc ON mc.id = pml.material_id
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
    quantity:       number;
    unit:           string | null;
    barcode:        string;
  }): Promise<Result<void, AppError>> {
    try {
      // MUHIM: barcode_print_queue.barcode_data NOT NULL — barcode_data/barcode_value ham yoziladi,
      // aks holda kirimda barkod generatsiya jonli NOT NULL xatosi bilan yiqiladi (jonli tasdiqlandi).
      await db.execute(sql`
        INSERT INTO pos_barcode_print_queue
          (movement_id, movement_line_id, material_id, warehouse_id,
           batch_number, quantity, unit, barcode, barcode_data, barcode_value, barcode_type, status, created_at)
        VALUES
          (${dto.movementId}, ${dto.movementLineId}, ${dto.materialCardId}, ${dto.warehouseId},
           ${dto.batchNumber}, ${dto.quantity}, ${dto.unit ?? null},
           ${dto.barcode}, ${dto.barcode}, ${dto.barcode}, 'CODE128', 'QUEUED', NOW())
      `);
      return Ok(undefined);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
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
