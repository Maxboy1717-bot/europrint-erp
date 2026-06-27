/**
 * @module warehouse-open.repository
 * @description POS Terminal — xodim→ombor AUTO-OPEN + per-warehouse-type ETIKET config.
 * Spec: OMBOR-TERMINAL-INTERFEYS-SPEC-2026-06-27.md.
 *   - my-warehouses: warehouse_employees'dan joriy user omborlari (is_primary birinchi).
 *   - label-config:  pos_label_config (warehouse_type bo'yicha). Q-40: config yo'q → default.
 * Returns Result<T>; Drizzle ORM bilan ifodalab bo'lmaydigan JOIN/COALESCE → typedExecute raw SQL (Qoida 4/16).
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Result, Ok, Err, AppError } from '@common/result';

/** Default etiket-o'lchami (config topilmasa) — Q-40 graceful. */
export const DEFAULT_LABEL_CONFIG = {
  labelWidthMm: 58,
  labelHeightMm: 40,
  template: 'standard',
} as const;

export interface MyWarehouse {
  warehouseId:   number;
  warehouseCode: string;
  warehouseName: string;
  warehouseType: string;
  role:          string;
  isPrimary:     boolean;
}

export interface LabelConfig {
  id:             number | null;
  warehouseType:  string;
  labelWidthMm:   number;
  labelHeightMm:  number;
  template:       string;
  isDefault:      boolean;
}

@Injectable()
export class WarehouseOpenRepository {
  private readonly logger = new Logger(WarehouseOpenRepository.name);

  /** Joriy user biriktirilgan faol omborlar (is_primary birinchi). */
  async listMyWarehouses(userId: number): Promise<Result<MyWarehouse[], AppError>> {
    try {
      const rows = await typedExecute<MyWarehouse>(sql`
        SELECT
          we.warehouse_id AS "warehouseId",
          w.code          AS "warehouseCode",
          w.name          AS "warehouseName",
          COALESCE(w.type, '') AS "warehouseType",
          we.role,
          we.is_primary   AS "isPrimary"
        FROM warehouse_employees we
        JOIN warehouses w ON w.id = we.warehouse_id
        WHERE we.user_id = ${userId}
          AND we.removed_at IS NULL
          AND w.is_active = true
          AND w.deleted_at IS NULL
        ORDER BY we.is_primary DESC, w.code
      `);
      return Ok(rows);
    } catch (e) {
      this.logger.error(`listMyWarehouses: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  /** Ombor (id) → type (yo'q → null). */
  async findWarehouseType(warehouseId: number): Promise<Result<string | null, AppError>> {
    try {
      const rows = await typedExecute<{ type: string | null }>(sql`
        SELECT type FROM warehouses WHERE id = ${warehouseId} LIMIT 1
      `);
      return Ok(rows[0]?.type ?? null);
    } catch (e) {
      this.logger.error(`findWarehouseType: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  /** Bitta ombor-turi uchun etiket config (yo'q → null). */
  async findLabelConfig(warehouseType: string): Promise<Result<LabelConfig | null, AppError>> {
    try {
      const rows = await typedExecute<LabelConfig>(sql`
        SELECT
          id,
          warehouse_type   AS "warehouseType",
          label_width_mm   AS "labelWidthMm",
          label_height_mm  AS "labelHeightMm",
          template,
          false            AS "isDefault"
        FROM pos_label_config
        WHERE warehouse_type = ${warehouseType}
          AND is_active = true
        LIMIT 1
      `);
      return Ok(rows[0] ?? null);
    } catch (e) {
      this.logger.error(`findLabelConfig: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  /** Barcha etiket configlar (admin ko'rinishi). */
  async listLabelConfigs(): Promise<Result<LabelConfig[], AppError>> {
    try {
      const rows = await typedExecute<LabelConfig>(sql`
        SELECT
          id,
          warehouse_type   AS "warehouseType",
          label_width_mm   AS "labelWidthMm",
          label_height_mm  AS "labelHeightMm",
          template,
          false            AS "isDefault"
        FROM pos_label_config
        WHERE is_active = true
        ORDER BY warehouse_type
      `);
      return Ok(rows);
    } catch (e) {
      this.logger.error(`listLabelConfigs: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  /** Etiket config upsert (warehouse_type kaliti bo'yicha). */
  async upsertLabelConfig(dto: {
    warehouseType:  string;
    labelWidthMm:   number;
    labelHeightMm:  number;
    template:       string;
    updatedBy:      number;
  }): Promise<Result<LabelConfig, AppError>> {
    try {
      const rows = await typedExecute<LabelConfig>(sql`
        INSERT INTO pos_label_config
          (warehouse_type, label_width_mm, label_height_mm, template, updated_by, updated_at)
        VALUES
          (${dto.warehouseType}, ${dto.labelWidthMm}, ${dto.labelHeightMm},
           ${dto.template}, ${dto.updatedBy}, NOW())
        ON CONFLICT (warehouse_type) DO UPDATE SET
          label_width_mm  = EXCLUDED.label_width_mm,
          label_height_mm = EXCLUDED.label_height_mm,
          template        = EXCLUDED.template,
          is_active       = true,
          updated_by      = EXCLUDED.updated_by,
          updated_at      = NOW()
        RETURNING
          id,
          warehouse_type   AS "warehouseType",
          label_width_mm   AS "labelWidthMm",
          label_height_mm  AS "labelHeightMm",
          template,
          false            AS "isDefault"
      `);
      const row = rows[0];
      if (!row) return Err({ message: 'Upsert natija qaytarmadi', code: 'DB_ERROR' });
      return Ok(row);
    } catch (e) {
      this.logger.error(`upsertLabelConfig: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
