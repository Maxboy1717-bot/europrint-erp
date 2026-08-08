/**
 * @module material-life.repository
 * @description Material hayot-tsikli repo (W4-MATERIAL-LIFE) — Drizzle/raw SQL.
 *   material_cards atribut ustunlari (owner_type/hazard_class/storage_condition/
 *   age_alert_days/is_recyclable/pallet_unit_qty/is_sample) o'qish/yozish va
 *   material_substitutes (EP-WMS-101) CRUD + aging/hazard ko'rinishlari.
 *
 *   RULE4_EXCEPTION: aging-alert va ko'p-JOIN ko'rinishlari LATERAL/window-mantiq
 *   talab qiladi — parametrli `runQuery` (SQL injection himoyasi) ishlatiladi.
 *   Q-46: faqat ADDITIVE ustunlar/jadval — mavjud WMS chiqim-yo'liga TEGILMAYDI.
 * @layer Infrastructure (WMS)
 */

import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Ok, Err, Result, AppError } from '@common/result';
import { runQuery } from '@shared/db';
import {
  IMaterialLifeRepo,
  MaterialLifeAttrs,
  MaterialLifeView,
  SubstituteRow,
  AgingAlertRow,
  CreateSubstituteInput,
} from '../../domain/repositories/i-material-life.repo';

interface LifeRow {
  material_id: number;
  name: string | null;
  owner_type: string | null;
  hazard_class: string | null;
  storage_condition: string | null;
  age_alert_days: number | string | null;
  is_recyclable: boolean | null;
  pallet_unit_qty: number | string | null;
  is_sample: boolean | null;
}

interface SubRow {
  id: number;
  material_id: number;
  substitute_id: number;
  substitute_name: string | null;
  priority: number | string | null;
  is_approved: boolean | null;
  notes: string | null;
}

interface AgingRow {
  stock_id: number;
  material_id: number;
  material_name: string | null;
  warehouse_id: number | null;
  quantity: number | string | null;
  age_days: number | string | null;
  age_alert_days: number | string | null;
}

const numOrNull = (v: number | string | null | undefined): number | null => {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const num = (v: number | string | null | undefined): number => numOrNull(v) ?? 0;

@Injectable()
export class MaterialLifeRepository implements IMaterialLifeRepo {
  private readonly logger = new Logger(MaterialLifeRepository.name);

  private toView(r: LifeRow): MaterialLifeView {
    return {
      materialId: r.material_id,
      name: r.name ?? null,
      ownerType: r.owner_type ?? 'own',
      hazardClass: r.hazard_class ?? null,
      storageCondition: r.storage_condition ?? null,
      ageAlertDays: numOrNull(r.age_alert_days),
      isRecyclable: Boolean(r.is_recyclable),
      palletUnitQty: numOrNull(r.pallet_unit_qty),
      isSample: Boolean(r.is_sample),
    };
  }

  async materialExists(materialId: number): Promise<Result<boolean, AppError>> {
    try {
      const rows = await runQuery<{ exists: boolean }>(sql`
        SELECT EXISTS (
          SELECT 1 FROM material_cards WHERE id = ${materialId} AND deleted_at IS NULL
        ) AS exists
      `);
      return Ok(Boolean(rows.rows[0]?.exists));
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `materialExists: ${String(e)}` });
    }
  }

  async getLifeView(materialId: number): Promise<Result<MaterialLifeView | null, AppError>> {
    try {
      const rows = await runQuery<LifeRow>(sql`
        SELECT id AS material_id, xom_ashyo AS name,
               owner_type, hazard_class, storage_condition,
               age_alert_days, is_recyclable, pallet_unit_qty, is_sample
        FROM material_cards
        WHERE id = ${materialId} AND deleted_at IS NULL
      `);
      const r = rows.rows[0];
      return Ok(r ? this.toView(r) : null);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `getLifeView: ${String(e)}` });
    }
  }

  async updateLifeAttrs(
    materialId: number,
    attrs: MaterialLifeAttrs,
  ): Promise<Result<MaterialLifeView, AppError>> {
    try {
      // COALESCE(${val}, col) — faqat berilgan maydonlar yangilanadi (null = teginma).
      // hazard_class/storage_condition/age_alert_days/pallet_unit_qty NULL'ga ham
      // o'rnatilishi mumkin → sentinel '__keep__' bilan farqlanadi.
      const ownerType = attrs.ownerType ?? null;
      const hazardSet = Object.prototype.hasOwnProperty.call(attrs, 'hazardClass');
      const storageSet = Object.prototype.hasOwnProperty.call(attrs, 'storageCondition');
      const ageSet = Object.prototype.hasOwnProperty.call(attrs, 'ageAlertDays');
      const palletSet = Object.prototype.hasOwnProperty.call(attrs, 'palletUnitQty');
      const isRecyclable = attrs.isRecyclable ?? null;
      const isSample = attrs.isSample ?? null;

      const rows = await runQuery<LifeRow>(sql`
        UPDATE material_cards SET
          owner_type        = COALESCE(${ownerType}, owner_type),
          hazard_class      = CASE WHEN ${hazardSet}  THEN ${attrs.hazardClass ?? null}      ELSE hazard_class END,
          storage_condition = CASE WHEN ${storageSet} THEN ${attrs.storageCondition ?? null} ELSE storage_condition END,
          age_alert_days    = CASE WHEN ${ageSet}     THEN ${attrs.ageAlertDays ?? null}     ELSE age_alert_days END,
          pallet_unit_qty   = CASE WHEN ${palletSet}  THEN ${attrs.palletUnitQty ?? null}    ELSE pallet_unit_qty END,
          is_recyclable     = COALESCE(${isRecyclable}, is_recyclable),
          is_sample         = COALESCE(${isSample}, is_sample),
          updated_at        = NOW()
        WHERE id = ${materialId} AND deleted_at IS NULL
        RETURNING id AS material_id, xom_ashyo AS name,
                  owner_type, hazard_class, storage_condition,
                  age_alert_days, is_recyclable, pallet_unit_qty, is_sample
      `);
      const r = rows.rows[0];
      if (!r) return Err({ code: 'NOT_FOUND', message: `Material topilmadi: ${materialId}` });
      return Ok(this.toView(r));
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `updateLifeAttrs: ${String(e)}` });
    }
  }

  async listSubstitutes(materialId: number): Promise<Result<SubstituteRow[], AppError>> {
    try {
      const rows = await runQuery<SubRow>(sql`
        SELECT ms.id, ms.material_id, ms.substitute_id,
               mc.xom_ashyo AS substitute_name,
               ms.priority, ms.is_approved, ms.notes
        FROM material_substitutes ms
        LEFT JOIN material_cards mc ON mc.id = ms.substitute_id
        WHERE ms.material_id = ${materialId} AND ms.deleted_at IS NULL
        ORDER BY ms.priority ASC, ms.id ASC
      `);
      const list = Array.isArray(rows.rows) ? rows.rows : [];
      return Ok(
        list.map((r) => ({
          id: r.id,
          materialId: r.material_id,
          substituteId: r.substitute_id,
          substituteName: r.substitute_name ?? null,
          priority: num(r.priority),
          isApproved: Boolean(r.is_approved),
          notes: r.notes ?? null,
        })),
      );
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `listSubstitutes: ${String(e)}` });
    }
  }

  async addSubstitute(input: CreateSubstituteInput): Promise<Result<SubstituteRow, AppError>> {
    try {
      const rows = await runQuery<SubRow>(sql`
        INSERT INTO material_substitutes
          (material_id, substitute_id, priority, is_approved, notes, created_by, created_at, updated_at)
        VALUES
          (${input.materialId}, ${input.substituteId}, ${input.priority},
           ${input.isApproved}, ${input.notes}, ${input.createdBy}, NOW(), NOW())
        ON CONFLICT (material_id, substitute_id) DO UPDATE SET
          priority    = EXCLUDED.priority,
          is_approved = EXCLUDED.is_approved,
          notes       = EXCLUDED.notes,
          deleted_at  = NULL,
          deleted_by  = NULL,
          updated_at  = NOW()
        RETURNING id, material_id, substitute_id, priority, is_approved, notes
      `);
      const r = rows.rows[0];
      if (!r) return Err({ code: 'DB_ERROR', message: 'addSubstitute: qator qaytmadi' });
      return Ok({
        id: r.id,
        materialId: r.material_id,
        substituteId: r.substitute_id,
        substituteName: null,
        priority: num(r.priority),
        isApproved: Boolean(r.is_approved),
        notes: r.notes ?? null,
      });
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `addSubstitute: ${String(e)}` });
    }
  }

  async removeSubstitute(id: number, userId: number | null): Promise<Result<void, AppError>> {
    try {
      const rows = await runQuery<{ id: number }>(sql`
        UPDATE material_substitutes
           SET deleted_at = NOW(), deleted_by = ${userId}, updated_at = NOW()
         WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id
      `);
      if (!rows.rows[0]) return Err({ code: 'NOT_FOUND', message: `Analog topilmadi: ${id}` });
      return Ok(undefined);
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `removeSubstitute: ${String(e)}` });
    }
  }

  async listAgingAlerts(): Promise<Result<AgingAlertRow[], AppError>> {
    try {
      // age_alert_days o'rnatilgan materiallar bo'yicha; partiya yoshi (warehouse_stock
      // kirim/yaratilish vaqtidan) shu kundan oshgan, qoldig'i > 0 qatorlar.
      // shelf_life_days'siz (muddatsiz) materialga ham ishlaydi (EP-WMS-126).
      const rows = await runQuery<AgingRow>(sql`
        SELECT ws.id AS stock_id, ws.material_id,
               mc.xom_ashyo AS material_name, ws.warehouse_id,
               ws.quantity,
               EXTRACT(DAY FROM (NOW() - COALESCE(ws.created_at, ws.last_updated_at)))::int AS age_days,
               mc.age_alert_days
        FROM warehouse_stock ws
        JOIN material_cards mc ON mc.id = ws.material_id
        WHERE mc.age_alert_days IS NOT NULL
          AND mc.deleted_at IS NULL
          AND COALESCE(ws.quantity, 0) > 0
          AND COALESCE(ws.created_at, ws.last_updated_at) IS NOT NULL
          AND (NOW() - COALESCE(ws.created_at, ws.last_updated_at))
              >= (mc.age_alert_days * INTERVAL '1 day')
        ORDER BY age_days DESC
      `);
      const list = Array.isArray(rows.rows) ? rows.rows : [];
      return Ok(
        list.map((r) => ({
          stockId: r.stock_id,
          materialId: r.material_id,
          materialName: r.material_name ?? null,
          warehouseId: r.warehouse_id ?? null,
          quantity: num(r.quantity),
          ageDays: num(r.age_days),
          ageAlertDays: num(r.age_alert_days),
        })),
      );
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `listAgingAlerts: ${String(e)}` });
    }
  }

  async listHazardStock(): Promise<Result<MaterialLifeView[], AppError>> {
    try {
      const rows = await runQuery<LifeRow>(sql`
        SELECT id AS material_id, xom_ashyo AS name,
               owner_type, hazard_class, storage_condition,
               age_alert_days, is_recyclable, pallet_unit_qty, is_sample
        FROM material_cards
        WHERE hazard_class IS NOT NULL AND deleted_at IS NULL
        ORDER BY hazard_class ASC, xom_ashyo ASC
      `);
      const list = Array.isArray(rows.rows) ? rows.rows : [];
      return Ok(list.map((r) => this.toView(r)));
    } catch (e) {
      return Err({ code: 'DB_ERROR', message: `listHazardStock: ${String(e)}` });
    }
  }
}
