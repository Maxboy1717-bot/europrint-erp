/**
 * @module pos-stock-issuable.repository
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 *
 * BE-T2-BARCODE-RESERV — Ombor terminal spec (2026-06-27):
 *  • KIRIM barkod-gen: ombor-prefiks + ketma-ket seq orqali noyob barkod hosil qiladi,
 *    `pos_barcode_print_queue` ga 'QUEUED' yozadi (POS Monitor printeri "tug'iradi").
 *  • CHIQIM bron-blok: skanlangan barkod → material + jami qoldiq + BRON (stock_reservations
 *    ACTIVE/reserved_by_ai) → bo'sh qoldiq. Q-40: bron jadval bo'sh → 0 bron (hammasi bo'sh).
 *
 * Ma'lumot-mantiq BUZILMAYDI (Q-46): mavjud kanonik jadvallar bilan ishlaydi —
 * warehouse_stock (qoldiq), stock_reservations (bron), warehouse_types (label-config),
 * material_cards (material). Yangi jadval YO'Q.
 */

import { Injectable } from '@nestjs/common';
import { db } from '@shared/db';
import { sql } from 'drizzle-orm';
import { typedExecute } from '@shared/db/typed-execute';
import { Result, Ok, Err, AppError } from '@common/result';

/** Skanlangan barkod → material + ombor + qoldiq + bron (CHIQIM oqimi uchun). */
export interface IssuableStockRow {
  materialCardId: number;
  kod:            string | null;
  name:           string;
  nameRu:         string | null;
  unit:           string;
  warehouseId:    number;
  warehouseCode:  string | null;
  warehouseName:  string | null;
  onHand:         number;
  reserved:       number;
  available:      number;
}

/** Material uchun ombor-darajasidagi bron (AI-planning + qo'lda) yig'indisi. */
export interface ReservationBreakdownRow {
  reservationId:   number;
  reservationNumber: string | null;
  reservedQuantity: number;
  reservedByAi:    boolean;
  status:          string;
  orderId:         number | null;
  orderType:       string | null;
}

/** KIRIM barkod-gen uchun ombor turi + label-config. */
export interface WarehouseLabelConfigRow {
  warehouseId:   number;
  warehouseCode: string;
  warehouseName: string;
  type:          string;
  labelTemplate: string | null;
  unitBasis:     string | null;
}

@Injectable()
export class PosStockIssuableRepository {
  // ─── KIRIM: ombor + label-config ──────────────────────────────────────────

  /**
   * Ombor turi va label-config (warehouse_types.label_template / unit_basis).
   * Etiket o'lchami har ombor turiga moslashadi (spec) — bu config'dan keladi.
   */
  async findWarehouseLabelConfig(warehouseId: number): Promise<Result<WarehouseLabelConfigRow | null, AppError>> {
    try {
      const rows = await typedExecute<WarehouseLabelConfigRow>(sql`
        SELECT
          w.id            AS "warehouseId",
          w.code          AS "warehouseCode",
          w.name          AS "warehouseName",
          w.type          AS "type",
          wt.label_template AS "labelTemplate",
          wt.unit_basis     AS "unitBasis"
        FROM warehouses w
        LEFT JOIN warehouse_types wt ON wt.code = w.type
        WHERE w.id = ${warehouseId}
        LIMIT 1
      `);
      return Ok(rows[0] ?? null);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  /** Material kartochka (kod/nom/birlik) — barkod label matni uchun. */
  async findMaterialForLabel(materialCardId: number): Promise<Result<{
    id: number; kod: string | null; name: string; nameRu: string | null; unit: string;
  } | null, AppError>> {
    try {
      const rows = await typedExecute<{ id: number; kod: string | null; name: string; nameRu: string | null; unit: string }>(sql`
        SELECT
          mc.id              AS "id",
          mc.kod             AS "kod",
          COALESCE(mc.xom_ashyo, mc.kod, '—')   AS "name",
          mc.xom_ashyo_ru    AS "nameRu",
          COALESCE(mc.unit_of_measure, 'dona')  AS "unit"
        FROM material_cards mc
        WHERE mc.id = ${materialCardId}
        LIMIT 1
      `);
      return Ok(rows[0] ?? null);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  /**
   * Ombor uchun shu kungi keyingi ketma-ket raqam (pos_barcode_print_queue ichida
   * shu prefiks bilan boshlanganlar soni + 1). Barkod ombor-prefiks + seq + sana
   * bilan NOYOB bo'ladi (qarama-qarshilik bo'lsa upstream qayta urinadi).
   */
  async nextSequenceForPrefix(prefix: string): Promise<Result<number, AppError>> {
    try {
      const rows = await typedExecute<{ next: number }>(sql`
        SELECT COALESCE(COUNT(*), 0)::int + 1 AS "next"
        FROM pos_barcode_print_queue
        WHERE barcode LIKE ${prefix + '%'}
      `);
      return Ok(Number(rows[0]?.next ?? 1));
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  /** Barkod allaqachon mavjudligini tekshirish (noyoblik kafolati). */
  async barcodeExists(barcode: string): Promise<Result<boolean, AppError>> {
    try {
      const rows = await typedExecute<{ hit: number }>(sql`
        SELECT 1 AS "hit" FROM pos_barcode_print_queue WHERE barcode = ${barcode}::text
        UNION
        SELECT 1 AS "hit" FROM material_cards WHERE barcode = ${barcode}::text
        UNION
        SELECT 1 AS "hit" FROM pos_barcode_map WHERE barcode = ${barcode}::text
        LIMIT 1
      `);
      return Ok(rows.length > 0);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  /**
   * KIRIM barkodini "tug'iradi" — pos_barcode_print_queue ga 'QUEUED' yozadi
   * (POS Monitor printeri shu navbatdan chop etadi). barcode_data/barcode_value
   * NOT NULL — auto-barcode.repository pattern'i bilan bir xil.
   */
  async insertGeneratedBarcode(dto: {
    materialCardId: number;
    warehouseId:    number;
    barcode:        string;
    quantity:       number | null;
    unit:           string | null;
    templateName:   string | null;
    requestedBy:    number;
  }): Promise<Result<{ id: number }, AppError>> {
    try {
      const rows = await typedExecute<{ id: number }>(sql`
        INSERT INTO pos_barcode_print_queue
          (material_id, warehouse_id, quantity, unit, barcode, barcode_data, barcode_value,
           barcode_type, template_name, label_type, status, trigger_type, requested_by, created_at)
        VALUES
          (${dto.materialCardId}, ${dto.warehouseId}, ${dto.quantity}, ${dto.unit},
           ${dto.barcode}, ${dto.barcode}, ${dto.barcode},
           'CODE128', ${dto.templateName}, 'INBOUND', 'QUEUED', 'KIRIM', ${dto.requestedBy}, NOW())
        RETURNING id
      `);
      const id = Number(rows[0]?.id ?? 0);
      if (!id) return Err({ message: 'Barkod navbatga yozilmadi', code: 'DB_ERROR' });
      return Ok({ id });
    } catch (e) {
      // C8.2 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): surface the Postgres error code so the
      // caller can distinguish a unique-violation (23505 — the COUNT(*)+1/barcodeExists
      // allocation above is TOCTOU-racy; the live UNIQUE constraint on barcode_print_queue.barcode
      // is what actually catches a collision) from any other DB failure.
      const pgCode = (e as { code?: string } | null)?.code;
      return Err({ message: String(e), code: 'DB_ERROR', details: { pgCode } });
    }
  }

  // ─── CHIQIM: barkod → material + qoldiq + bron ────────────────────────────

  /**
   * Skanlangan barkod → material + ombor qoldig'i (warehouse_stock).
   * Barkod uch manbada qidiriladi: material_cards.barcode, pos_barcode_map.barcode,
   * pos_barcode_print_queue.barcode (KIRIMda tug'ilgan barkod). Ombor — barkod
   * generatsiya qilingan ombor (queue.warehouse_id) yoki qoldiq topilgan ombor.
   */
  async findIssuableByBarcode(barcode: string, warehouseId?: number): Promise<Result<IssuableStockRow | null, AppError>> {
    try {
      const rows = await typedExecute<IssuableStockRow>(sql`
        WITH resolved AS (
          SELECT mc.id AS material_card_id,
                 mc.kod,
                 COALESCE(mc.xom_ashyo, mc.kod, '—') AS name,
                 mc.xom_ashyo_ru AS name_ru,
                 COALESCE(mc.unit_of_measure, 'dona') AS unit,
                 q.warehouse_id AS hint_warehouse_id
          FROM material_cards mc
          LEFT JOIN LATERAL (
            SELECT warehouse_id
            FROM pos_barcode_print_queue
            WHERE barcode = ${barcode}::text AND material_id = mc.id
            ORDER BY id DESC LIMIT 1
          ) q ON TRUE
          WHERE mc.barcode = ${barcode}::text
             OR mc.id IN (
                  SELECT material_id FROM pos_barcode_map         WHERE barcode = ${barcode}::text
                  UNION
                  SELECT material_id FROM pos_barcode_print_queue WHERE barcode = ${barcode}::text
                )
          LIMIT 1
        )
        SELECT
          r.material_card_id AS "materialCardId",
          r.kod              AS "kod",
          r.name             AS "name",
          r.name_ru          AS "nameRu",
          r.unit             AS "unit",
          ws.warehouse_id    AS "warehouseId",
          w.code             AS "warehouseCode",
          w.name             AS "warehouseName",
          COALESCE(ws.quantity, 0)           AS "onHand",
          COALESCE(ws.reserved_quantity, 0)  AS "reserved",
          COALESCE(ws.available_quantity, 0) AS "available"
        FROM resolved r
        LEFT JOIN warehouse_stock ws
          ON ws.material_id = r.material_card_id
         AND ws.warehouse_id = COALESCE(${warehouseId ?? null}::int, r.hint_warehouse_id, ws.warehouse_id)
        LEFT JOIN warehouses w ON w.id = ws.warehouse_id
        ORDER BY ws.available_quantity DESC NULLS LAST
        LIMIT 1
      `);
      return Ok(rows[0] ?? null);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }

  /**
   * Material + ombor uchun FAOL bronlar (stock_reservations).
   * AI-planning bronlari `reserved_by_ai = TRUE` bilan belgilanadi (spec).
   * Q-40: jadval bo'sh → bo'sh massiv (0 bron, hammasi bo'sh-qoldiq).
   */
  async findActiveReservations(materialCardId: number, warehouseId: number): Promise<Result<ReservationBreakdownRow[], AppError>> {
    try {
      const rows = await typedExecute<ReservationBreakdownRow>(sql`
        SELECT
          sr.id                AS "reservationId",
          sr.reservation_number AS "reservationNumber",
          COALESCE(sr.reserved_quantity, sr.quantity, 0) AS "reservedQuantity",
          COALESCE(sr.reserved_by_ai, FALSE)             AS "reservedByAi",
          sr.status            AS "status",
          sr.order_id          AS "orderId",
          sr.order_type        AS "orderType"
        FROM stock_reservations sr
        WHERE sr.material_id = ${materialCardId}
          AND sr.warehouse_id = ${warehouseId}
          AND UPPER(COALESCE(sr.status, '')) = 'ACTIVE'
        ORDER BY sr.id DESC
      `);
      return Ok(rows);
    } catch (e) {
      return Err({ message: String(e), code: 'DB_ERROR' });
    }
  }
}
