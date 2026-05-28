/**
 * material-360.service.ts
 *
 * Material 360° profili — bitta material uchun TO'LIQ ma'lumot:
 *   • Asosiy ma'lumot (kod, nom, kategoriya, birlik, narx)
 *   • Stok har omborda alohida
 *   • Oxirgi 50 ta harakat (kirim/chiqim)
 *   • FIFO partiyalar (mavjud bo'lsa)
 *   • Narx tarixi (material_price_history)
 *   • Ta'minotchilar ro'yxati
 *   • Auto-yaratilgan barkodlar
 */
import { Injectable, Logger } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { db } from '@shared/db';
import { typedExecute } from '@shared/db/typed-execute';
import { Result, Ok, Err, AppError } from '@common/result';

export interface Material360Profile {
  material: {
    id:              number;
    code:            string;
    name:            string;
    nameRu:          string | null;
    category:        string | null;
    materialType:    string | null;
    unit:            string;
    unitPrice:       number;
    currency:        string;
    currentStock:    number;
    minStock:        number;
    maxStock:        number | null;
    description:     string | null;
    supplierName:    string | null;
    isActive:        boolean;
    createdAt:       string;
  };
  stockByWarehouse: Array<{
    warehouseId:   number;
    warehouseCode: string;
    warehouseName: string;
    warehouseType: string;
    available:     number;
    reserved:      number;
    total:         number;
    lastUpdated:   string | null;
  }>;
  recentMovements: Array<{
    movementId:     number;
    movementNumber: string;
    movementType:   string;
    status:         string;
    quantity:       number;
    unit:           string;
    unitPrice:      number;
    fromWarehouseId: number | null;
    toWarehouseId:   number | null;
    createdAt:      string;
    createdByName:  string;
  }>;
  priceHistory: Array<{
    id:           number;
    unitPrice:    number;
    currency:     string;
    supplierName: string | null;
    purchaseDate: string | null;
    createdAt:    string;
  }>;
  suppliers: Array<{
    name:        string;
    lastPrice:   number;
    lastDate:    string | null;
    occurrences: number;
  }>;
  barcodes: Array<{
    id:           number;
    barcode:      string;
    barcodeType:  string;
    batchNumber:  string | null;
    quantity:     number | null;
    status:       string;
    createdAt:    string;
  }>;
  totals: {
    totalInflow:    number;   // hamma kirim
    totalOutflow:   number;   // hamma chiqim
    netChange:      number;   // kirim - chiqim
    distinctWarehouses: number;
    movementCount:  number;
  };
}

@Injectable()
export class Material360Service {
  private readonly logger = new Logger(Material360Service.name);

  async getProfile(materialId: number): Promise<Result<Material360Profile, AppError>> {
    try {
      this.logger.log(`[Material360] Material ${materialId} profili yuklanmoqda...`);

      // ── 1. Asosiy ma'lumot ─────────────────────────────────────────────
      const matRows = await this._fetchMaterial(materialId);
      if (matRows.length === 0) {
        return Err({ message: 'Material topilmadi', code: 'NOT_FOUND' });
      }
      const material = matRows[0];

      // ── 2 & 3. Stok va harakatlar ─────────────────────────────────────
      const stockByWarehouse = await this._fetchStockByWarehouse(materialId);
      const recentMovements  = await this._fetchRecentMovements(materialId);

      // ── 4. Narx tarixi ────────────────────────────────────────────────
      let priceHistory: Material360Profile['priceHistory'] = [];
      try {
        priceHistory = (await typedExecute<Material360Profile['priceHistory'][number]>(sql`
          SELECT id, unit_price::numeric AS "unitPrice", currency,
                 supplier_name AS "supplierName",
                 purchase_date AS "purchaseDate",
                 created_at    AS "createdAt"
          FROM material_price_history
          WHERE material_card_id = ${materialId}
          ORDER BY purchase_date DESC NULLS LAST, created_at DESC
          LIMIT 30
        `))
          .map(r => ({ ...r, unitPrice: Number(r.unitPrice ?? 0) }));
      } catch { /* jadval yo'q bo'lsa, bo'sh massiv */ }

      // ── 5. Ta'minotchilar (harakatlardan extracted) — try/catch bilan ──
      let suppliers: Material360Profile['suppliers'] = [];
      try {
        suppliers = (await typedExecute<Material360Profile['suppliers'][number]>(sql`
          SELECT
            COALESCE(pip.supplier_name, '')              AS name,
            MAX(COALESCE(pml.unit_price, 0))::numeric    AS "lastPrice",
            MAX(pm.created_at)                           AS "lastDate",
            COUNT(*)::int                                AS occurrences
          FROM pos_movements pm
          JOIN pos_movement_lines pml ON pml.movement_id = pm.id
          LEFT JOIN pos_inventory_passport pip ON pip.movement_id = pm.id
          WHERE pml.material_card_id = ${materialId}
            AND pm.movement_type = 'EXTERNAL_IN'
            AND pip.supplier_name IS NOT NULL
          GROUP BY pip.supplier_name
          ORDER BY MAX(pm.created_at) DESC
          LIMIT 20
        `))
          .filter(r => r.name && r.name.trim() !== '')
          .map(r => ({ ...r, lastPrice: Number(r.lastPrice ?? 0) }));
      } catch (e) {
        this.logger.warn(`[Material360] suppliers o'tkazib yuborildi: ${String(e)}`);
      }

      // ── 6. Auto-yaratilgan barkodlar ───────────────────────────────────
      const barcodes = (await typedExecute<Material360Profile['barcodes'][number]>(sql`
        SELECT id, barcode, barcode_type AS "barcodeType",
               batch_number AS "batchNumber",
               quantity::numeric, status, created_at AS "createdAt"
        FROM pos_barcode_print_queue
        WHERE material_card_id = ${materialId}
        ORDER BY created_at DESC
        LIMIT 50
      `))
        .map(r => ({ ...r, quantity: r.quantity == null ? null : Number(r.quantity) }));

      // ── 7. Yig'indi statistika ────────────────────────────────────────
      const totRows = (await typedExecute<{ totalInflow: string|number; totalOutflow: string|number; movementCount: number; distinctWarehouses: number }>(sql`
        SELECT
          COALESCE(SUM(CASE WHEN pm.movement_type IN ('EXTERNAL_IN','INTERNAL_RETURN')
                            THEN pml.quantity::numeric ELSE 0 END), 0)::numeric AS "totalInflow",
          COALESCE(SUM(CASE WHEN pm.movement_type IN ('EXTERNAL_OUT','INTERNAL_ISSUE','DAMAGE')
                            THEN pml.quantity::numeric ELSE 0 END), 0)::numeric AS "totalOutflow",
          COUNT(DISTINCT pm.id)::int        AS "movementCount",
          COUNT(DISTINCT pm.from_warehouse_id) + COUNT(DISTINCT pm.to_warehouse_id) AS "distinctWarehouses"
        FROM pos_movements pm
        JOIN pos_movement_lines pml ON pml.movement_id = pm.id
        WHERE pml.material_card_id = ${materialId}
          AND pm.deleted_at IS NULL
      `))[0];
      const totals = {
        totalInflow:    Number(totRows?.totalInflow  ?? 0),
        totalOutflow:   Number(totRows?.totalOutflow ?? 0),
        netChange:      Number(totRows?.totalInflow ?? 0) - Number(totRows?.totalOutflow ?? 0),
        movementCount:  Number(totRows?.movementCount ?? 0),
        distinctWarehouses: Number(totRows?.distinctWarehouses ?? 0),
      };

      this.logger.log(
        `[Material360] ${material.code} → ${stockByWarehouse.length} ombor, ` +
        `${recentMovements.length} harakat, ${suppliers.length} ta'minotchi, ` +
        `${barcodes.length} barkod`
      );

      return Ok({
        material: { ...material,
          unitPrice:    Number(material.unitPrice ?? 0),
          currentStock: Number(material.currentStock ?? 0),
          minStock:     Number(material.minStock ?? 0),
          maxStock:     material.maxStock == null ? null : Number(material.maxStock),
        },
        stockByWarehouse, recentMovements, priceHistory, suppliers, barcodes, totals,
      });
    } catch (e) {
      this.logger.error(`[Material360] Xato: ${String(e)}`);
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private async _fetchMaterial(
    materialId: number,
  ): Promise<Material360Profile['material'][]> {
    return typedExecute<Material360Profile['material']>(sql`
      SELECT
        id, kod                AS code,
        xom_ashyo              AS name,
        xom_ashyo_ru           AS "nameRu",
        category, material_type AS "materialType",
        unit_of_measure        AS unit,
        COALESCE(unit_price, 0)  AS "unitPrice",
        COALESCE(currency, 'UZS') AS currency,
        COALESCE(current_stock, 0) AS "currentStock",
        COALESCE(min_stock, 0)   AS "minStock",
        max_stock              AS "maxStock",
        description,
        supplier_name          AS "supplierName",
        is_active              AS "isActive",
        created_at             AS "createdAt"
      FROM material_cards
      WHERE id = ${materialId}
      LIMIT 1
    `);
  }

  private async _fetchStockByWarehouse(
    materialId: number,
  ): Promise<Material360Profile['stockByWarehouse']> {
    return (await typedExecute<Material360Profile['stockByWarehouse'][number]>(sql`
      SELECT
        w.id                              AS "warehouseId",
        w.code                            AS "warehouseCode",
        w.name                            AS "warehouseName",
        UPPER(COALESCE(w.type,'MAIN'))    AS "warehouseType",
        COALESCE(ws.available_quantity,0)::numeric  AS available,
        COALESCE(ws.reserved_quantity,0)::numeric   AS reserved,
        (COALESCE(ws.available_quantity,0) + COALESCE(ws.reserved_quantity,0))::numeric AS total,
        ws.last_updated_at                AS "lastUpdated"
      FROM warehouses w
      LEFT JOIN warehouse_stock ws
        ON ws.warehouse_id = w.id AND ws.material_card_id = ${materialId}
      WHERE w.is_active = true
      ORDER BY w.code
    `))
      .map(r => ({ ...r,
        available: Number(r.available ?? 0),
        reserved:  Number(r.reserved  ?? 0),
        total:     Number(r.total     ?? 0),
      }));
  }

  private async _fetchRecentMovements(
    materialId: number,
  ): Promise<Material360Profile['recentMovements']> {
    return (await typedExecute<Material360Profile['recentMovements'][number]>(sql`
      SELECT
        pm.id                            AS "movementId",
        pm.movement_number               AS "movementNumber",
        pm.movement_type                 AS "movementType",
        pm.status,
        pml.quantity::numeric            AS quantity,
        pml.unit,
        COALESCE(pml.unit_price, 0)::numeric  AS "unitPrice",
        pm.from_warehouse_id             AS "fromWarehouseId",
        pm.to_warehouse_id               AS "toWarehouseId",
        pm.created_at                    AS "createdAt",
        (COALESCE(u.first_name,'') || ' ' || COALESCE(u.last_name,'')) AS "createdByName"
      FROM pos_movement_lines pml
      JOIN pos_movements pm ON pm.id = pml.movement_id
      LEFT JOIN users u ON u.id = pm.created_by
      WHERE pml.material_card_id = ${materialId}
        AND pm.deleted_at IS NULL
      ORDER BY pm.created_at DESC
      LIMIT 50
    `))
      .map(r => ({ ...r,
        quantity:  Number(r.quantity  ?? 0),
        unitPrice: Number(r.unitPrice ?? 0),
      }));
  }
}
