/**
 * @module pos-warehouse-integration-queries.service
 * @description POS↔Warehouse read-side queries — real-time stock, barcode
 *   lookup, movement history (pos_movements + legacy material_movements),
 *   stock alerts. Kept separate so the parent facade stays under 300 lines.
 */
import { Injectable, NotFoundException } from '@nestjs/common';
import { rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

interface StockFilters {
  warehouseId?: number;
  category?: string;
  onlyAvailable?: boolean;
  search?: string;
}

interface HistoryFilters {
  materialCardId?: number;
  warehouseId?: number;
  movementType?: string;
  limit?: number;
}

@Injectable()
export class PosWarehouseIntegrationQueriesService {

  /**
   * GET /api/pos/stock — POS uchun real-time stok ro'yxati (warehouse'dan).
   */
  async getRealTimeStock(filters?: StockFilters): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const whereClause = this.buildStockWhereClause(filters);
      const rows = await rawSql(sql`
        SELECT
          stock_id AS id,
          warehouse_id AS "warehouseId",
          warehouse_code AS "warehouseCode",
          warehouse_name AS "warehouseName",
          warehouse_type AS "warehouseType",
          material_id AS "materialId",
          material_code AS "materialCode",
          material_name AS "materialName",
          material_name_ru AS "materialNameRu",
          category, material_type AS "materialType",
          unit_of_measure AS unit,
          quantity, reserved_quantity AS "reserved",
          available_quantity AS "available",
          min_stock AS "minStock", max_stock AS "maxStock",
          unit_price AS "unitPrice", currency,
          stock_status AS "stockStatus"
        FROM pos_warehouse_stock_view
        ${whereClause}
        ORDER BY material_name
        LIMIT 500
      `);
      return dbRows(rows);
    });
  }

  private buildStockWhereClause(filters?: StockFilters): ReturnType<typeof sql> {
    const conditions: ReturnType<typeof sql>[] = [];
    if (filters?.warehouseId) conditions.push(sql`warehouse_id = ${filters.warehouseId}`);
    if (filters?.category) conditions.push(sql`category = ${filters.category}`);
    if (filters?.onlyAvailable) conditions.push(sql`available_quantity > 0`);
    if (filters?.search) {
      const q = `%${filters.search}%`;
      conditions.push(sql`(material_code ILIKE ${q} OR material_name ILIKE ${q})`);
    }
    if (conditions.length === 0) return sql``;
    return sql.join([sql`WHERE`, ...conditions.map((c, i) => i === 0 ? c : sql.join([sql`AND`, c], sql` `))], sql` `);
  }

  /**
   * Material searching by barcode (PRD Q15-17).
   */
  async findByBarcode(barcode: string): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const rows = await rawSql(sql`
        SELECT v.*, b.barcode_value AS barcode
        FROM pos_warehouse_stock_view v
        LEFT JOIN material_barcodes b ON b.material_id = v.material_id
        WHERE b.barcode_value = ${barcode} OR v.material_code = ${barcode}
        LIMIT 1
      `);
      const item = dbRows(rows)[0];
      if (!item) {
        throw new NotFoundException(
          `Barcode "${barcode}" topilmadi. Qo'lda qidirish yoki yangi material kartochka yaratish kerak.`,
        );
      }
      return item;
    });
  }

  /**
   * Movement tarixi (jurnal) — yangi POS Monitor harakatlari (pos_movements)
   * + eski jadval (material_movements) — UNION ALL bilan birlashtiriladi.
   *
   * Shu sababli ERP /warehouse/hub/ va POS Monitor BIR XIL harakatlarni ko'radi.
   */
  async getMovementHistory(filters?: HistoryFilters): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const lim = Math.min(filters?.limit ?? 100, 500);
      const matFilter   = filters?.materialCardId ?? null;
      const whFilter    = filters?.warehouseId    ?? null;
      const typeFilter  = filters?.movementType   ?? null;
      const rows = await rawSql(this.buildHistoryQuery(matFilter, whFilter, typeFilter, lim));
      return dbRows(rows);
    });
  }

  private buildHistoryQuery(
    matFilter: number | null,
    whFilter: number | null,
    typeFilter: string | null,
    lim: number,
  ): ReturnType<typeof sql> {
    // pos_movements (YANGI POS Monitor harakatlari) + material_movements (LEGACY) — UNION ALL
    return sql`
      SELECT * FROM (
        ${this.buildPosMovementsSubquery(matFilter, whFilter, typeFilter)}
        UNION ALL
        ${this.buildLegacyMovementsSubquery(matFilter, typeFilter)}
      ) combined
      ORDER BY "createdAt" DESC NULLS LAST
      LIMIT ${lim}
    `;
  }

  private buildPosMovementsSubquery(
    matFilter: number | null,
    whFilter: number | null,
    typeFilter: string | null,
  ): ReturnType<typeof sql> {
    return sql`
      SELECT
        pm.id,
        COALESCE(pml.material_card_id, 0)             AS "materialId",
        COALESCE(mc.xom_ashyo, mc.kod, '—')           AS "materialName",
        pm.movement_type                              AS "movementType",
        COALESCE(pml.quantity, 0)                     AS quantity,
        COALESCE(pml.unit, mc.unit_of_measure, '')    AS unit,
        NULL::text                                    AS barcode,
        NULL::timestamp                               AS "scannedAt",
        pm.created_by                                 AS "performedBy",
        pm.return_reason                              AS reason,
        pm.notes,
        pm.created_at                                 AS "createdAt",
        pm.movement_number                            AS "movementNumber",
        pm.status                                     AS status,
        pm.from_warehouse_id                          AS "fromWarehouseId",
        pm.to_warehouse_id                            AS "toWarehouseId",
        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') AS "performedByName",
        'pos_monitor'                                 AS source
      FROM pos_movements pm
      LEFT JOIN LATERAL (
        SELECT material_id AS material_card_id, quantity, unit
        FROM pos_movement_lines
        WHERE movement_id = pm.id
        ORDER BY id ASC
        LIMIT 1
      ) pml ON true
      LEFT JOIN material_cards mc ON mc.id = pml.material_card_id
      LEFT JOIN users u ON u.id = pm.created_by
      WHERE pm.deleted_at IS NULL
        AND (${matFilter}::int  IS NULL OR pml.material_card_id = ${matFilter})
        AND (${typeFilter}::text IS NULL OR pm.movement_type    = ${typeFilter})
        AND (${whFilter}::int   IS NULL
             OR pm.from_warehouse_id = ${whFilter}
             OR pm.to_warehouse_id   = ${whFilter})
    `;
  }

  private buildLegacyMovementsSubquery(
    matFilter: number | null,
    typeFilter: string | null,
  ): ReturnType<typeof sql> {
    return sql`
      SELECT
        mm.id + 1000000  AS id,
        mm.material_id   AS "materialId",
        mm.material_name AS "materialName",
        mm.movement_type AS "movementType",
        mm.quantity,
        mm.unit,
        mm.barcode,
        mm.scanned_at    AS "scannedAt",
        mm.performed_by  AS "performedBy",
        mm.reason,
        mm.notes,
        mm.created_at    AS "createdAt",
        'LEGACY-' || mm.id::text AS "movementNumber",
        'completed'      AS status,
        NULL::int        AS "fromWarehouseId",
        NULL::int        AS "toWarehouseId",
        COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '') AS "performedByName",
        'legacy'         AS source
      FROM material_movements mm
      LEFT JOIN users u ON u.id = mm.performed_by
      WHERE (${matFilter}::int  IS NULL OR mm.material_id   = ${matFilter})
        AND (${typeFilter}::text IS NULL OR mm.movement_type = ${typeFilter})
    `;
  }

  /**
   * Stock alerts (low stock, out of stock).
   */
  async getStockAlerts(): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const rows = await rawSql(sql`
        SELECT
          stock_id AS id, warehouse_code AS "warehouseCode", warehouse_name AS "warehouseName",
          material_code AS "materialCode", material_name AS "materialName",
          available_quantity AS "available", min_stock AS "minStock", max_stock AS "maxStock",
          stock_status AS "alertType"
        FROM pos_warehouse_stock_view
        WHERE stock_status IN ('OUT_OF_STOCK', 'LOW_STOCK')
        ORDER BY
          CASE stock_status WHEN 'OUT_OF_STOCK' THEN 1 WHEN 'LOW_STOCK' THEN 2 ELSE 3 END,
          available_quantity ASC
      `);
      return dbRows(rows);
    });
  }
}
