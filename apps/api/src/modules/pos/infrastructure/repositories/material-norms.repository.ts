/**
 * NOTE: Raw SQL retained intentionally — mirrors the sibling
 *   pos-anomaly.repository.ts pattern: `material_norms.material_id` is
 *   declared `varchar` in the Drizzle schema (lib/db/src/schema/pp/pp-enhanced.ts)
 *   but is an `integer` column in the live DB (known drift, see
 *   docs/duplicates-full-audit.md). Raw SQL + typedExecute<T> sidesteps the
 *   type mismatch instead of risking a silent bad-cast through the ORM layer.
 *   See ARCHITECTURE_RULES.md Rule 4: complex SQL is permitted with documentation.
 */
/**
 * @module material-norms.repository
 * @description FAZA J (Bo'lim ombori + AI norma) — material_norms CRUD +
 *   haqiqiy tarixiy iste'mol asosida AI-norma hisoblash. Bu jadval avval
 *   faqat O'QUVCHI edi (pos-anomaly.repository.ts) — yozuvchi/CRUD yo'q edi.
 *   Result<T> qaytaradi, hech qachon throw qilmaydi.
 */

import { Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { safeCall, Result } from '@common/result';
import { POS_AI_NORM_LOOKBACK_LIMIT } from '@common/constants/business.constants';

export interface MaterialNormRow {
  id: number;
  product_id: string | null;
  technology_card_id: string | null;
  material_category_id: string | null;
  material_id: number | null;
  material_name: string;
  norm_quantity_per_1000: string | number;
  unit: string;
  waste_percentage: string | number | null;
  safety_stock_percentage: string | number | null;
  based_on_orders_count: number | null;
  average_actual_consumption: string | number | null;
  calculated_by_ai: boolean;
  formula: string | null;
  department_code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialNormListFilter {
  materialId: number | null;
  departmentCode: string | null;
  isActive: boolean | null;
  limit: number;
  offset: number;
}

export interface MaterialNormCreateInput {
  materialId: number | null;
  materialName: string;
  normQuantityPer1000: number;
  unit: string;
  wastePercentage: number | null;
  safetyStockPercentage: number | null;
  departmentCode: string | null;
  formula: string | null;
  calculatedByAI: boolean;
}

export interface MaterialNormUpdateInput {
  materialName?: string;
  normQuantityPer1000?: number;
  unit?: string;
  wastePercentage?: number | null;
  safetyStockPercentage?: number | null;
  departmentCode?: string | null;
  formula?: string | null;
  isActive?: boolean;
}

export interface HistoricalConsumption {
  sampleCount: number;
  avgQty: number;
  materialName: string | null;
  unit: string | null;
}

@Injectable()
export class MaterialNormsRepository {
  /** Ro'yxat — filtr (material/bo'lim/faollik) + pagination. Data yo'q → bo'sh (Q-40). */
  async list(filter: MaterialNormListFilter): Promise<Result<MaterialNormRow[]>> {
    return safeCall(async () => {
      const rows = await typedExecute<MaterialNormRow>(sql`
        SELECT id, product_id, technology_card_id, material_category_id, material_id,
               material_name, norm_quantity_per_1000, unit, waste_percentage,
               safety_stock_percentage, based_on_orders_count, average_actual_consumption,
               calculated_by_ai, formula, department_code, is_active, created_at, updated_at
        FROM material_norms
        WHERE deleted_at IS NULL
          AND (${filter.materialId}::int IS NULL OR material_id = ${filter.materialId})
          AND (${filter.departmentCode}::text IS NULL OR department_code = ${filter.departmentCode})
          AND (${filter.isActive}::boolean IS NULL OR is_active = ${filter.isActive})
        ORDER BY id DESC
        LIMIT ${filter.limit} OFFSET ${filter.offset}
      `);
      return Array.isArray(rows) ? rows : [];
    }, 'DB_ERROR');
  }

  /** Bitta norma (detal). Topilmasa → null. */
  async getById(id: number): Promise<Result<MaterialNormRow | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<MaterialNormRow>(sql`
        SELECT id, product_id, technology_card_id, material_category_id, material_id,
               material_name, norm_quantity_per_1000, unit, waste_percentage,
               safety_stock_percentage, based_on_orders_count, average_actual_consumption,
               calculated_by_ai, formula, department_code, is_active, created_at, updated_at
        FROM material_norms
        WHERE id = ${id} AND deleted_at IS NULL
        LIMIT 1
      `);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  /** Faol norma (material + bo'lim doirasi) — AI-recalculate upsert uchun ishlatiladi. */
  async findActive(materialId: number, departmentCode: string | null): Promise<Result<MaterialNormRow | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<MaterialNormRow>(sql`
        SELECT id, product_id, technology_card_id, material_category_id, material_id,
               material_name, norm_quantity_per_1000, unit, waste_percentage,
               safety_stock_percentage, based_on_orders_count, average_actual_consumption,
               calculated_by_ai, formula, department_code, is_active, created_at, updated_at
        FROM material_norms
        WHERE material_id = ${materialId}
          AND deleted_at IS NULL
          AND is_active = true
          AND (
            (${departmentCode}::text IS NULL AND department_code IS NULL)
            OR department_code = ${departmentCode}
          )
        ORDER BY id DESC
        LIMIT 1
      `);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  /** Qo'lda norma yaratish (manual entry, calculatedByAI=false odatiy holatda). */
  async create(input: MaterialNormCreateInput, createdBy: number | null): Promise<Result<MaterialNormRow>> {
    return safeCall(async () => {
      const rows = await typedExecute<MaterialNormRow>(sql`
        INSERT INTO material_norms
          (material_id, material_name, norm_quantity_per_1000, unit, waste_percentage,
           safety_stock_percentage, department_code, formula, calculated_by_ai,
           based_on_orders_count, is_active, created_at, updated_at)
        VALUES
          (${input.materialId}, ${input.materialName}, ${input.normQuantityPer1000}, ${input.unit},
           ${input.wastePercentage}, ${input.safetyStockPercentage}, ${input.departmentCode},
           ${input.formula}, ${input.calculatedByAI}, 0, true, NOW(), NOW())
        RETURNING id, product_id, technology_card_id, material_category_id, material_id,
                  material_name, norm_quantity_per_1000, unit, waste_percentage,
                  safety_stock_percentage, based_on_orders_count, average_actual_consumption,
                  calculated_by_ai, formula, department_code, is_active, created_at, updated_at
      `);
      // createdBy hozircha auditga yozilmaydi (material_norms'da created_by ustuni yo'q) —
      // faqat interfeys mosligini saqlash uchun parametr qabul qilinadi.
      void createdBy;
      return rows[0];
    }, 'DB_ERROR');
  }

  /** Qisman yangilash (COALESCE — berilmagan maydon o'zgarmaydi). */
  async update(id: number, patch: MaterialNormUpdateInput): Promise<Result<MaterialNormRow | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<MaterialNormRow>(sql`
        UPDATE material_norms SET
          material_name           = COALESCE(${patch.materialName ?? null}, material_name),
          norm_quantity_per_1000  = COALESCE(${patch.normQuantityPer1000 ?? null}, norm_quantity_per_1000),
          unit                    = COALESCE(${patch.unit ?? null}, unit),
          waste_percentage        = COALESCE(${patch.wastePercentage ?? null}, waste_percentage),
          safety_stock_percentage = COALESCE(${patch.safetyStockPercentage ?? null}, safety_stock_percentage),
          department_code         = CASE WHEN ${patch.departmentCode !== undefined} THEN ${patch.departmentCode ?? null} ELSE department_code END,
          formula                 = COALESCE(${patch.formula ?? null}, formula),
          is_active               = COALESCE(${patch.isActive ?? null}, is_active),
          calculated_by_ai        = false,
          updated_at              = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id, product_id, technology_card_id, material_category_id, material_id,
                  material_name, norm_quantity_per_1000, unit, waste_percentage,
                  safety_stock_percentage, based_on_orders_count, average_actual_consumption,
                  calculated_by_ai, formula, department_code, is_active, created_at, updated_at
      `);
      return rows[0] ?? null;
    }, 'DB_ERROR');
  }

  /** Soft-delete (deaktivatsiya) — jismoniy o'chirmaydi. */
  async deactivate(id: number, deletedBy: number | null): Promise<Result<boolean>> {
    return safeCall(async () => {
      const rows = await typedExecute<{ id: number }>(sql`
        UPDATE material_norms
        SET is_active = false, deleted_at = NOW(), deleted_by = ${deletedBy}, updated_at = NOW()
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id
      `);
      return rows.length > 0;
    }, 'DB_ERROR');
  }

  /**
   * Haqiqiy tarixiy iste'mol (INTERNAL_ISSUE, tugallangan harakatlar) — AI-norma
   * hisoblashning ma'lumot bazasi. Namuna yo'q bo'lsa → null (fabrikatsiya yo'q, Q-40).
   */
  async computeHistoricalConsumption(
    materialId: number,
    departmentCode: string | null,
  ): Promise<Result<HistoricalConsumption | null>> {
    return safeCall(async () => {
      const rows = await typedExecute<{
        sample_count: number;
        avg_qty: string | number | null;
        material_name: string | null;
        unit: string | null;
      }>(sql`
        WITH recent_movements AS (
          SELECT pm.id
          FROM pos_movements pm
          WHERE pm.status = 'completed'
            AND pm.movement_type = 'INTERNAL_ISSUE'
            AND pm.deleted_at IS NULL
            AND (${departmentCode}::text IS NULL OR pm.bulim = ${departmentCode})
          ORDER BY pm.completed_at DESC NULLS LAST, pm.id DESC
          LIMIT ${POS_AI_NORM_LOOKBACK_LIMIT}
        ), movement_qty AS (
          SELECT pml.movement_id, SUM(pml.quantity) AS qty, MAX(pml.unit) AS unit
          FROM pos_movement_lines pml
          JOIN recent_movements rm ON rm.id = pml.movement_id
          WHERE pml.material_id = ${materialId}
          GROUP BY pml.movement_id
        )
        SELECT
          COUNT(*)::int AS sample_count,
          AVG(mq.qty)::numeric AS avg_qty,
          rmat.name AS material_name,
          COALESCE(MAX(mq.unit), rmat.unit) AS unit
        FROM movement_qty mq
        LEFT JOIN raw_materials rmat ON rmat.id = ${materialId}
        GROUP BY rmat.name, rmat.unit
      `);
      const r = rows[0];
      if (!r || Number(r.sample_count) <= 0) return null;
      return {
        sampleCount: Number(r.sample_count),
        avgQty: Number(r.avg_qty ?? 0),
        materialName: r.material_name,
        unit: r.unit,
      };
    }, 'DB_ERROR');
  }

  /**
   * AI-norma upsert: mavjud faol norma (material+bo'lim doirasi) bo'lsa yangilaydi,
   * bo'lmasa yangi qator yaratadi. calculatedByAI=true, formula tarixiy hisoblash
   * usulini tavsiflaydi (shaffof, Q-40 — soxta emas).
   */
  async upsertAiNorm(
    materialId: number,
    departmentCode: string | null,
    computed: { materialName: string; unit: string; avgQty: number; sampleCount: number; formula: string },
  ): Promise<Result<MaterialNormRow>> {
    return safeCall(async () => {
      const existingR = await this.findActive(materialId, departmentCode);
      if (existingR.ok && existingR.data) {
        const rows = await typedExecute<MaterialNormRow>(sql`
          UPDATE material_norms SET
            norm_quantity_per_1000    = ${computed.avgQty},
            average_actual_consumption = ${computed.avgQty},
            based_on_orders_count     = ${computed.sampleCount},
            calculated_by_ai          = true,
            formula                   = ${computed.formula},
            material_name             = COALESCE(material_name, ${computed.materialName}),
            unit                      = COALESCE(unit, ${computed.unit}),
            updated_at                = NOW()
          WHERE id = ${existingR.data.id}
          RETURNING id, product_id, technology_card_id, material_category_id, material_id,
                    material_name, norm_quantity_per_1000, unit, waste_percentage,
                    safety_stock_percentage, based_on_orders_count, average_actual_consumption,
                    calculated_by_ai, formula, department_code, is_active, created_at, updated_at
        `);
        return rows[0];
      }

      const rows = await typedExecute<MaterialNormRow>(sql`
        INSERT INTO material_norms
          (material_id, material_name, norm_quantity_per_1000, unit, department_code,
           average_actual_consumption, based_on_orders_count, calculated_by_ai, formula,
           is_active, created_at, updated_at)
        VALUES
          (${materialId}, ${computed.materialName}, ${computed.avgQty}, ${computed.unit}, ${departmentCode},
           ${computed.avgQty}, ${computed.sampleCount}, true, ${computed.formula},
           true, NOW(), NOW())
        RETURNING id, product_id, technology_card_id, material_category_id, material_id,
                  material_name, norm_quantity_per_1000, unit, waste_percentage,
                  safety_stock_percentage, based_on_orders_count, average_actual_consumption,
                  calculated_by_ai, formula, department_code, is_active, created_at, updated_at
      `);
      return rows[0];
    }, 'DB_ERROR');
  }
}
