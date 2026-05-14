/**
 * POS → WMS Query Service
 *
 * ERP "Ombor Boshqaruvi" moduli bilan bir xil `warehouses` va `material_cards`
 * jadvallaridan ma'lumot oladi. resources.service.ts da tasdiqlangan pattern ishlatiladi.
 *
 * Asosiy pattern (ishlaydi):
 *   FROM warehouses w
 *   LEFT JOIN current_stock cs ON cs.warehouse_id::text = w.id::text
 *   WHERE w.is_active = true
 *   GROUP BY w.id ORDER BY w.name
 */
import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { runQuery } from '@shared/db';
import { safeCall, Result, AppError } from '@common/result';

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------
export interface WmsWarehouse {
  id:             string;
  code:           string | null;
  name:           string | null;
  type:           string | null;
  isActive:       boolean;
  totalMaterials: number;
  totalQty:       number;
  departmentCode: string | null;
}

export interface WmsStockView {
  materialCardId: string | number;
  materialCode:   string | null;
  materialName:   string | null;
  unit:           string | null;
  availableQty:   number;
  reservedQty:    number;
  totalQty:       number;
  lastUpdated:    Date | string | null;
}

export interface WmsMovementHistory {
  id:             string | number;
  movementNumber: string | null;
  movementType:   string | null;
  status:         string | null;
  createdAt:      Date | string | null;
  completedAt:    Date | string | null;
  createdByName:  string | null;
}

export interface LowStockItem {
  materialCardId: string | number;
  materialCode:   string | null;
  materialName:   string | null;
  unit:           string | null;
  availableQty:   number;
  minStock:       number;
  warehouseId:    string | null;
}

// ---------------------------------------------------------------------------
// Internal raw row shapes
// ---------------------------------------------------------------------------
interface WarehouseRow {
  id:              string | number;
  code:            string | null;
  name:            string | null;
  type:            string | null;
  is_active:       boolean | null;
  department_code: string | null;
  total_materials: string | number | null;
  total_qty:       string | number | null;
}

export interface MaterialSearchRow {
  id:                  string | number;
  code:                string | null;
  name:                string | null;
  category:            string | null;
  unit:                string | null;
  material_type:       string | null;
  available_qty:       string | number | null;
  warehouse_id:        string | null;
  last_purchase_price: string | null;
}

interface StockRow {
  material_card_id: string | number;
  material_code:    string | null;
  material_name:    string | null;
  unit:             string | null;
  available_qty:    string | number | null;
  reserved_qty:     string | number | null;
  total_qty:        string | number | null;
  last_updated:     string | null;
}

interface MovementRow {
  id:               string | number;
  movement_number:  string | null;
  movement_type:    string | null;
  status:           string | null;
  created_at:       string | null;
  completed_at:     string | null;
  created_by_name:  string | null;
}

interface LowStockRow {
  material_card_id: string | number;
  material_code:    string | null;
  material_name:    string | null;
  unit:             string | null;
  available_qty:    string | number | null;
  min_stock:        string | number | null;
  warehouse_id:     string | null;
}

const DEFAULT_MOVEMENT_LIMIT = 100;

@Injectable()
export class PosWmsQueryService {
  private readonly logger = new Logger(PosWmsQueryService.name);

  // =========================================================================
  // getWarehousesList
  // resources.service.ts bilan bir xil pattern — ishlaydi (ERP modulida ko'rinadi)
  // =========================================================================
  async getWarehousesList(): Promise<Result<WmsWarehouse[], AppError>> {
    return safeCall(async () => {
      const rows = await runQuery<WarehouseRow>(sql`
        SELECT
          w.id::text                                    AS id,
          w.code                                        AS code,
          COALESCE(w.name, w.code)                      AS name,
          UPPER(COALESCE(w.type, 'MAIN'))               AS type,
          w.is_active                                   AS is_active,
          NULL::text                                    AS department_code,
          COUNT(DISTINCT cs.material_card_id)::text     AS total_materials,
          COALESCE(SUM(cs.quantity_on_hand), 0)::text   AS total_qty
        FROM warehouses w
        LEFT JOIN current_stock cs ON cs.warehouse_id::text = w.id::text
        WHERE w.is_active = true
        GROUP BY w.id, w.code, w.name, w.type, w.is_active
        ORDER BY w.name
      `);

      return rows.map((r): WmsWarehouse => ({
        id:             String(r.id),
        code:           r.code,
        name:           r.name,
        type:           r.type,
        isActive:       r.is_active ?? true,
        departmentCode: r.department_code,
        totalMaterials: parseInt(String(r.total_materials ?? '0'), 10),
        totalQty:       parseFloat(String(r.total_qty ?? '0')),
      }));
    });
  }

  // =========================================================================
  // searchMaterials
  // resources.service.ts: mc.xom_ashyo, mc.kod, mc.unit_of_measure, mc.category
  // =========================================================================
  async searchMaterials(
    query?: string,
    category?: string,
    warehouseId?: string,
    limit = 200,
  ): Promise<Result<MaterialSearchRow[], AppError>> {
    return safeCall(async () => {
      const likeQ = query ? `%${query.toLowerCase()}%` : '%';
      const rows = await runQuery<MaterialSearchRow>(sql`
        SELECT
          mc.id,
          mc.kod                                              AS code,
          COALESCE(mc.xom_ashyo, mc.kod)                      AS name,
          mc.category,
          mc.unit_of_measure                                  AS unit,
          mc.material_type,
          COALESCE(
            (SELECT SUM(ws2.available_quantity)
             FROM warehouse_stock ws2
             WHERE ws2.material_card_id = mc.id
               AND (${warehouseId ?? null}::text IS NULL
                    OR ws2.warehouse_id::text = ${warehouseId ?? null})),
            mc.current_stock,
            0
          )::text                                             AS available_qty,
          (SELECT ws3.warehouse_id::text
           FROM warehouse_stock ws3
           WHERE ws3.material_card_id = mc.id
           ORDER BY ws3.available_quantity DESC
           LIMIT 1)                                           AS warehouse_id,
          mc.unit_price::text                                 AS last_purchase_price
        FROM material_cards mc
        WHERE mc.is_active = true
          AND (
            ${query ?? null}::text IS NULL
            OR LOWER(COALESCE(mc.xom_ashyo, '')) LIKE ${likeQ}
            OR LOWER(COALESCE(mc.kod, ''))        LIKE ${likeQ}
          )
          AND (
            ${category ?? null}::text IS NULL
            OR mc.category     = ${category ?? null}
            OR mc.material_type = ${category ?? null}
          )
        ORDER BY mc.xom_ashyo
        LIMIT ${limit}
      `);
      return rows;
    });
  }

  // =========================================================================
  // getWarehouseStockForWms — ombordagi barcha materiallar
  // =========================================================================
  async getWarehouseStockForWms(
    warehouseId: string,
  ): Promise<Result<WmsStockView[], AppError>> {
    return safeCall(async () => {
      const rows = await runQuery<StockRow>(sql`
        SELECT
          ws.material_card_id,
          mc.kod                                              AS material_code,
          COALESCE(mc.xom_ashyo, mc.kod)                      AS material_name,
          mc.unit_of_measure                                  AS unit,
          ws.available_quantity                               AS available_qty,
          ws.reserved_quantity                                AS reserved_qty,
          (ws.available_quantity + ws.reserved_quantity)      AS total_qty,
          ws.last_updated_at                                  AS last_updated
        FROM warehouse_stock ws
        JOIN material_cards mc ON mc.id = ws.material_card_id
        WHERE ws.warehouse_id::text = ${warehouseId}
          AND mc.is_active = true
        ORDER BY mc.xom_ashyo
      `);

      return rows.map((r): WmsStockView => ({
        materialCardId: r.material_card_id,
        materialCode:   r.material_code,
        materialName:   r.material_name,
        unit:           r.unit,
        availableQty:   parseFloat(String(r.available_qty  ?? '0')),
        reservedQty:    parseFloat(String(r.reserved_qty   ?? '0')),
        totalQty:       parseFloat(String(r.total_qty      ?? '0')),
        lastUpdated:    r.last_updated,
      }));
    });
  }

  // =========================================================================
  // getMovementHistoryForWms — ombor harakatlari tarixi
  // Barcha statuslar ko'rsatiladi (draft, pending, completed, qc_pending, ...)
  // ERP /warehouse/hub/ va POS Monitor BIR XIL ma'lumotni ko'radi.
  // =========================================================================
  async getMovementHistoryForWms(
    warehouseId: string,
    limit: number = DEFAULT_MOVEMENT_LIMIT,
  ): Promise<Result<WmsMovementHistory[], AppError>> {
    return safeCall(async () => {
      const rows = await runQuery<MovementRow>(sql`
        SELECT
          pm.id,
          pm.movement_number,
          pm.movement_type,
          pm.status,
          pm.created_at,
          pm.completed_at,
          (COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) AS created_by_name
        FROM pos_movements pm
        LEFT JOIN users u ON u.id = pm.created_by
        WHERE pm.deleted_at IS NULL
          AND (
            pm.from_warehouse_id::text = ${warehouseId}
            OR pm.to_warehouse_id::text = ${warehouseId}
          )
        ORDER BY pm.created_at DESC
        LIMIT ${limit}
      `);

      return rows.map((r): WmsMovementHistory => ({
        id:             r.id,
        movementNumber: r.movement_number,
        movementType:   r.movement_type,
        status:         r.status,
        createdAt:      r.created_at,
        completedAt:    r.completed_at,
        createdByName:  r.created_by_name,
      }));
    });
  }

  // =========================================================================
  // getLowStockForWms — minimal qoldiqdan past materiallar
  // =========================================================================
  async getLowStockForWms(): Promise<Result<LowStockItem[], AppError>> {
    return safeCall(async () => {
      const rows = await runQuery<LowStockRow>(sql`
        SELECT
          mc.id                                               AS material_card_id,
          mc.kod                                              AS material_code,
          COALESCE(mc.xom_ashyo, mc.kod)                      AS material_name,
          mc.unit_of_measure                                  AS unit,
          COALESCE(mc.current_stock, 0)                       AS available_qty,
          COALESCE(mc.min_stock, 0)                           AS min_stock,
          (SELECT ws.warehouse_id::text
           FROM warehouse_stock ws
           WHERE ws.material_card_id = mc.id
           ORDER BY ws.available_quantity DESC
           LIMIT 1)                                           AS warehouse_id
        FROM material_cards mc
        WHERE mc.is_active = true
          AND COALESCE(mc.current_stock, 0) < COALESCE(mc.min_stock, 0)
          AND mc.min_stock IS NOT NULL
          AND mc.min_stock > 0
        ORDER BY (COALESCE(mc.min_stock, 0) - COALESCE(mc.current_stock, 0)) DESC
      `);

      return rows.map((r): LowStockItem => ({
        materialCardId: r.material_card_id,
        materialCode:   r.material_code,
        materialName:   r.material_name,
        unit:           r.unit,
        availableQty:   parseFloat(String(r.available_qty ?? '0')),
        minStock:       parseFloat(String(r.min_stock    ?? '0')),
        warehouseId:    r.warehouse_id,
      }));
    });
  }
}
