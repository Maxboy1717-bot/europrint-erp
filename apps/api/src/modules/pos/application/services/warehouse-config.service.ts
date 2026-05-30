/**
 * @module warehouse-config.service
 * @description Ombor tip KONFIGURATSIYASI (warehouse_types) + omborlar o'qish — config-driven UI uchun.
 *   Yangi toza per-tur ombor sahifalari shu config'dan generatsiya qilinadi (eski rasvo WMS'ni almashtirish).
 */
import { Injectable } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../../../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

@Injectable()
export class WarehouseConfigService {
  /** Faol ombor turlari (sort_order bo'yicha) + har turdagi omborlar soni. */
  async listTypes(): Promise<Result<Record<string, unknown>[], AppError>> {
    return safeCall(async () => {
      const rows = await rawSql(sql`
        SELECT wt.code, wt.name_uz AS "nameUz", wt.name_ru AS "nameRu", wt.category, wt.icon,
               wt.inbound_flow AS "inboundFlow", wt.outbound_flow AS "outboundFlow",
               wt.needs_quarantine AS "needsQuarantine", wt.needs_qc AS "needsQc",
               wt.unit_basis AS "unitBasis", wt.label_template AS "labelTemplate", wt.sort_order AS "sortOrder",
               (SELECT COUNT(*)::int FROM warehouses w WHERE w.type = wt.code AND w.is_active) AS "warehouseCount"
        FROM warehouse_types wt
        WHERE wt.is_active = true
        ORDER BY wt.sort_order
      `);
      return dbRows(rows);
    });
  }

  /** Omborlar ro'yxati (ixtiyoriy ?type= filtri). */
  async listWarehouses(type?: string): Promise<Result<Record<string, unknown>[], AppError>> {
    return safeCall(async () => {
      const t = type ?? null;
      const rows = await rawSql(sql`
        SELECT id, code, name, name_ru AS "nameRu", type, location, is_active AS "isActive"
        FROM warehouses
        WHERE is_active = true AND (${t}::text IS NULL OR type = ${t})
        ORDER BY name
      `);
      return dbRows(rows);
    });
  }
}
