/**
 * pos-warehouse-integration.service.ts
 *
 * PRD Q21-58: POS ↔ Warehouse to'liq integratsiya.
 *
 * Asosiy printsiplar:
 *   1. POS warehouse_stock'dan REAL-TIME stok o'qiydi
 *   2. Har POS harakat material_movements'ga yoziladi (audit trail)
 *   3. Stok warehouse'da yangilanadi (UPDATE warehouse_stock)
 *   4. Movement turlari: EXTERNAL_IN/OUT, INTERNAL_ISSUE/RETURN/TRANSFER, DAMAGE
 *
 * Movement workflow:
 *   - DRAFT → KARANTIN → QC → OMBOR_MENEJER → AI_GL (EXTERNAL_IN — 5 bosqich)
 *   - DRAFT → MENEJER (INTERNAL_ISSUE — 1 bosqich)
 *   - DRAFT (INTERNAL_RETURN — tasdiq yo'q)
 */
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { rawSql, db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { dbRows } from '../hr/common/db-rows';
import { safeCall, Result, AppError } from '@common/result';

interface MovementDto {
  movementType: 'EXTERNAL_IN' | 'EXTERNAL_OUT' | 'INTERNAL_ISSUE' | 'INTERNAL_RETURN' | 'INTERNAL_TRANSFER' | 'DAMAGE';
  fromWarehouseId?: number;
  toWarehouseId?: number;
  materialCardId: number;
  quantity: number;
  performedBy: number;
  reason?: string;
  notes?: string;
  barcode?: string;
}

@Injectable()
export class PosWarehouseIntegrationService {
  private readonly logger = new Logger(PosWarehouseIntegrationService.name);

  /**
   * GET /api/pos/stock — POS uchun real-time stok ro'yxati (warehouse'dan).
   */
  async getRealTimeStock(filters?: {
    warehouseId?: number;
    category?: string;
    onlyAvailable?: boolean;
    search?: string;
  }): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const conditions: ReturnType<typeof sql>[] = [];
      if (filters?.warehouseId) conditions.push(sql`warehouse_id = ${filters.warehouseId}`);
      if (filters?.category) conditions.push(sql`category = ${filters.category}`);
      if (filters?.onlyAvailable) conditions.push(sql`available_quantity > 0`);
      if (filters?.search) {
        const q = `%${filters.search}%`;
        conditions.push(sql`(material_code ILIKE ${q} OR material_name ILIKE ${q})`);
      }

      const whereClause = conditions.length > 0
        ? sql.join([sql`WHERE`, ...conditions.map((c, i) => i === 0 ? c : sql.join([sql`AND`, c], sql` `))], sql` `)
        : sql``;

      const rows = await rawSql(sql`
        SELECT
          stock_id AS id,
          warehouse_id AS "warehouseId",
          warehouse_code AS "warehouseCode",
          warehouse_name AS "warehouseName",
          warehouse_type AS "warehouseType",
          material_card_id AS "materialId",
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

  /**
   * Material searching by barcode (PRD Q15-17).
   */
  async findByBarcode(barcode: string): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const rows = await rawSql(sql`
        SELECT v.*, b.barcode_value AS barcode
        FROM pos_warehouse_stock_view v
        LEFT JOIN material_barcodes b ON b.material_card_id = v.material_card_id
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
   * POS movement yaratish — har turi uchun mos workflow.
   * Atomic: material_movement + warehouse_stock update.
   */
  async createMovement(dto: MovementDto): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      // Validatsiya
      if (!dto.materialCardId) throw new BadRequestException('materialCardId majburiy');
      if (!dto.quantity || dto.quantity <= 0) throw new BadRequestException("quantity > 0 bo'lishi kerak");
      if (!dto.performedBy) throw new BadRequestException('performedBy majburiy');

      // Stock tekshirish (chiqim turlari uchun)
      if (['EXTERNAL_OUT', 'INTERNAL_ISSUE', 'INTERNAL_TRANSFER', 'DAMAGE'].includes(dto.movementType)) {
        if (!dto.fromWarehouseId) {
          throw new BadRequestException(`${dto.movementType} uchun fromWarehouseId majburiy`);
        }
        const stockRows = await rawSql(sql`
          SELECT available_quantity, material_type FROM pos_warehouse_stock_view
          WHERE warehouse_id = ${dto.fromWarehouseId} AND material_card_id = ${dto.materialCardId}
          LIMIT 1
        `);
        const stock = dbRows(stockRows)[0];
        if (!stock) {
          throw new BadRequestException(
            `Material #${dto.materialCardId} ombor #${dto.fromWarehouseId} da yo'q`,
          );
        }
        const available = Number(stock['available_quantity']);
        if (available < dto.quantity) {
          // PRD Q38: ASSET → BLOCK, CONSUMABLE → OGOHLANTIRISH (lekin ruxsat)
          if (stock['material_type'] === 'ASSET') {
            throw new BadRequestException(
              `Aktiv yetarli emas. Mavjud: ${available}, So'ralgan: ${dto.quantity}. Aktivlar uchun minus saldo BLOK.`,
            );
          }
          this.logger.warn(`Minus saldo: material #${dto.materialCardId}, available=${available}, requested=${dto.quantity}`);
        }
      }

      // Kirim turlari uchun toWarehouseId majburiy
      if (['EXTERNAL_IN', 'INTERNAL_RETURN', 'INTERNAL_TRANSFER'].includes(dto.movementType)) {
        if (!dto.toWarehouseId) {
          throw new BadRequestException(`${dto.movementType} uchun toWarehouseId majburiy`);
        }
      }

      // Atomic transaction
      return await db.transaction(async (tx) => {
        // 1. material_movements'ga yozish
        const movementRows = await tx.execute(sql`
          INSERT INTO material_movements (
            material_id, material_name, movement_type, quantity, unit,
            barcode, scanned_at, performed_by, reason, notes, created_at
          )
          SELECT
            ${dto.materialCardId},
            mc.xom_ashyo,
            ${dto.movementType},
            ${dto.quantity},
            mc.unit_of_measure,
            ${dto.barcode ?? null},
            NOW(),
            ${dto.performedBy},
            ${dto.reason ?? null},
            ${dto.notes ?? null},
            NOW()
          FROM material_cards mc
          WHERE mc.id = ${dto.materialCardId}
          RETURNING id
        `);
        const movement = dbRows(movementRows)[0];
        const movementId = Number(movement?.['id'] ?? 0);

        // 2. warehouse_stock yangilash
        // Chiqish (FROM)
        if (dto.fromWarehouseId) {
          await tx.execute(sql`
            UPDATE warehouse_stock
            SET quantity = quantity - ${dto.quantity},
                available_quantity = available_quantity - ${dto.quantity},
                last_updated_at = NOW()
            WHERE warehouse_id = ${dto.fromWarehouseId} AND material_card_id = ${dto.materialCardId}
          `);
        }

        // Kirish (TO)
        if (dto.toWarehouseId) {
          // INSERT yoki UPDATE
          await tx.execute(sql`
            INSERT INTO warehouse_stock (
              warehouse_id, material_card_id, quantity, reserved_quantity,
              available_quantity, unit_of_measure, last_updated_at, created_at
            )
            SELECT
              ${dto.toWarehouseId}, ${dto.materialCardId}, ${dto.quantity}, 0,
              ${dto.quantity}, mc.unit_of_measure, NOW(), NOW()
            FROM material_cards mc
            WHERE mc.id = ${dto.materialCardId}
            ON CONFLICT (warehouse_id, material_card_id) DO UPDATE
            SET quantity = warehouse_stock.quantity + EXCLUDED.quantity,
                available_quantity = warehouse_stock.available_quantity + EXCLUDED.quantity,
                last_updated_at = NOW()
          `);
        }

        // 3. material_cards.current_stock yangilash (cached)
        await tx.execute(sql`
          UPDATE material_cards
          SET current_stock = (
            SELECT COALESCE(SUM(quantity), 0)
            FROM warehouse_stock
            WHERE material_card_id = ${dto.materialCardId}
          ),
          updated_at = NOW()
          WHERE id = ${dto.materialCardId}
        `);

        this.logger.log(`Movement #${movementId} ${dto.movementType} qty=${dto.quantity}`);

        return {
          movementId,
          movementType: dto.movementType,
          materialCardId: dto.materialCardId,
          quantity: dto.quantity,
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          status: 'completed',
        };
      });
    });
  }

  /**
   * Movement tarixi (jurnal) — yangi POS Monitor harakatlari (pos_movements)
   * + eski jadval (material_movements) — UNION ALL bilan birlashtiriladi.
   *
   * Shu sababli ERP /warehouse/hub/ va POS Monitor BIR XIL harakatlarni ko'radi.
   */
  async getMovementHistory(filters?: {
    materialCardId?: number;
    warehouseId?: number;
    movementType?: string;
    limit?: number;
  }): Promise<Result<unknown, AppError>> {
    return safeCall(async () => {
      const lim = Math.min(filters?.limit ?? 100, 500);
      const matFilter   = filters?.materialCardId ?? null;
      const whFilter    = filters?.warehouseId    ?? null;
      const typeFilter  = filters?.movementType   ?? null;

      // pos_movements (YANGI POS Monitor harakatlari) — har bir movement uchun
      // pos_movement_lines dan birinchi qatorni olamiz (material, miqdor)
      // material_movements (LEGACY) — eski yozuvlar
      // UNION ALL — ikkalasini birlashtiramiz
      const rows = await rawSql(sql`
        SELECT * FROM (
          -- ── YANGI: pos_movements (POS Monitor yaratgan harakatlar) ──
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
            SELECT material_card_id, quantity, unit
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

          UNION ALL

          -- ── LEGACY: material_movements (eski harakatlar) ──
          SELECT
            mm.id + 1000000  AS id,                  -- ID konflikt oldini olish
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
        ) combined
        ORDER BY "createdAt" DESC NULLS LAST
        LIMIT ${lim}
      `);
      return dbRows(rows);
    });
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
