/**
 * @module drizzle-mm.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { AppErr, Err, Ok } from '@common/result';
import { Database } from '@/infrastructure/database/database';
import { Result } from '@common/result';
import { Material } from '../../domain/aggregates/material.aggregate';
import { PurchaseOrder } from '../../domain/aggregates/purchase-order.aggregate';
import { IMmRepository, DrizzleExecutor } from '../../domain/repositories/mm.repository';
import { db , runQuery } from '@shared/db';
import { materials, purchase_orders_legacy } from '@shared/db';
// APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02 — live `purchase_orders`.id is
// INTEGER, not the uuid PK schema-wms.ts declares (see schema-compat-mm-po-intpk.ts).
import { purchase_orders } from '@shared/db/schema-compat-mm-po-intpk';
// live `vendors`.id is also INTEGER — schema-compat-2.ts's `vendors` already has
// the correct integer id (plus the `rating` column updateVendorRating() needs).
import { vendors } from '@shared/db/schema-compat-2';
import { execMmMaterialInsert } from '@common/database/queries-remaining';
import { MM_THREE_WAY_MATCH_TOLERANCE } from '@common/constants/business.constants';

type DbRow = Record<string, unknown>;

/**
 * Narrow shape we need from a Drizzle executor (db or tx). Restricted to the
 * surface used in this repo so we don't import `PgTransaction` types.
 */
type ExecLike = {
  select: typeof db.select;
  insert: typeof db.insert;
  update: typeof db.update;
};

const asExec = (tx?: DrizzleExecutor): ExecLike => (tx ?? db) as unknown as ExecLike;

@Injectable()
export class DrizzleMmRepository implements IMmRepository {
  private readonly logger = new Logger(DrizzleMmRepository.name);

  constructor(private _db: Database) {}

  async saveMaterial(material: Material): Promise<Result<number>> {
    try {
      await execMmMaterialInsert(material.materialCode, material.name, material.category, material.unitOfMeasure, material.unitCost);
      return Ok(1);
    } catch (error: unknown) {
      this.logger.error('Failed to save material');
      return Err('Material saqlashda xatolik');
    }
  }

  async getMaterial(id: number): Promise<Result<Material>> {
    try {
      const rows = await db.select().from(materials).where(eq(materials.id, String(id))).limit(1);
      const row = rows[0] as DbRow | undefined;
      if (!row) return Err('Material topilmadi');
      return Ok(new Material(String(row['id']), String(row['materialCode'] ?? ''), String(row['name'] ?? ''), String(row['category'] ?? ''), String(row['unitOfMeasure'] ?? ''), 0, 0, Number(row['unitCost'] ?? 0), 0, true, _time.now(), _time.now()));
    } catch (error: unknown) {
      this.logger.error('Failed to get material');
      return Err('Oqish xatoligi');
    }
  }

  async getMaterialByCode(code: string): Promise<Result<Material>> {
    try {
      const rows = await db.select().from(materials).where(eq(materials.materialCode, code)).limit(1);
      const row = rows[0] as DbRow | undefined;
      if (!row) return Err('Material topilmadi');
      return Ok(new Material(String(row['id']), String(row['materialCode'] ?? ''), String(row['name'] ?? ''), String(row['category'] ?? ''), String(row['unitOfMeasure'] ?? ''), 0, 0, Number(row['unitCost'] ?? 0), 0, true, _time.now(), _time.now()));
    } catch (error: unknown) {
      this.logger.error('Failed to get material by code');
      return Err('Oqish xatoligi');
    }
  }

  async savePurchaseOrder(po: PurchaseOrder, _tx?: DrizzleExecutor): Promise<Result<number>> {
    try {
      // mm_purchase_orders is a VIEW over the purchase_orders base table (integer-PK).
      // The LIST/GET endpoints read from this view. We INSERT into the base table directly.
      // Required NOT-NULL columns: po_number, vendor_id, order_date, status, tenant_id(default=1).
      // NOTE: raw SQL is used because the Drizzle 'purchase_orders' schema in schema-wms.ts
      // maps to a different uuid-PK variant — not the integer-PK base table we need here.
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const poNumber = po.getPoNumber(); // generated as PO-{timestamp} in the handler
      const result = await db.execute(sql`
        INSERT INTO purchase_orders
          (po_number, vendor_id, order_date, status, total_amount, currency, created_by)
        VALUES
          (${poNumber}, ${po.getSupplierId()}, ${today},
           ${po.getStatus()}, ${po.getTotalAmount()}, ${'UZS'}, ${po.getCreatedBy()})
        RETURNING id
      `);
      const rows = Array.isArray(result) ? result : ((result as { rows?: unknown[] }).rows ?? []);
      const poId = (rows[0] as Record<string, unknown>)?.['id'] as number | undefined;
      if (!poId) return Err('PO saqlashda xatolik: id qaytarilmadi');

      // Insert line items into purchase_order_items (integer purchase_order_id).
      // The LIST query JOINs this table on purchase_order_id to aggregate item count/totals.
      // NOT NULL cols: po_id, raw_material_id, quantity, unit, unit_price, total_price.
      // 'unit' is not on PurchaseOrderItem domain object — default to the canonical
      // unit_of_measures.code for "piece" (B13/Decision 3, 2026-07-06: was 'sht').
      const items = po.getItems();
      for (const item of items) {
        await db.execute(sql`
          INSERT INTO purchase_order_items
            (po_id, purchase_order_id, material_id, raw_material_id, quantity, unit, unit_price, total_price)
          VALUES
            (${poId}, ${poId}, ${item.materialId}, ${item.materialId},
             ${item.quantity}, ${'dona'}, ${item.unitPrice}, ${item.quantity * item.unitPrice})
        `);
      }

      return Ok(poId);
    } catch (error: unknown) {
      this.logger.error('Failed to save purchase order');
      return Err('PO saqlashda xatolik');
    }
  }

  async getPurchaseOrder(id: number, tx?: DrizzleExecutor): Promise<Result<PurchaseOrder>> {
    try {
      const exec = asExec(tx);
      const rows = await exec.select().from(purchase_orders).where(eq(purchase_orders.id, id)).limit(1);
      const row = rows[0] as DbRow | undefined;
      if (!row) return Err('PO topilmadi');
      return Ok(new PurchaseOrder(row['id'] as number, String(row['po_number'] ?? ''), row['vendor_id'] as number, Number(row['created_by'] ?? 0)));
    } catch (error: unknown) {
      this.logger.error('Failed to get purchase order');
      return Err('Oqish xatoligi');
    }
  }

  async withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>> {
    try {
      return await db.transaction(async (tx) => work(tx as DrizzleExecutor));
    } catch (e: unknown) {
      this.logger.error('MM transaction failed');
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Tranzaksiya xatoligi'));
    }
  }

  async getAllPoByStatus(status: string): Promise<Result<PurchaseOrder[]>> {
    try {
      const rows = await db.select().from(purchase_orders).where(eq(purchase_orders.status, status as never));
      return Ok((Array.isArray(rows) ? rows : []).map((r) => {
        const row = r as DbRow;
        return new PurchaseOrder(row['id'] as number, String(row['po_number'] ?? ''), row['vendor_id'] as number, Number(row['created_by'] ?? 0));
      }));
    } catch (error: unknown) {
      this.logger.error('Failed to get purchase orders');
      return Err('Oqish xatoligi');
    }
  }

  async recordGoodsReceipt(poId: number, _quantity: number): Promise<Result<void>> {
    try {
      const rows = await db.select().from(purchase_orders).where(eq(purchase_orders.id, poId)).limit(1);
      if (!rows[0]) return Err('PO topilmadi');
      await db.update(purchase_orders).set({ goods_received_at: _time.now() }).where(eq(purchase_orders.id, poId));
      return Ok(undefined);
    } catch (error: unknown) {
      this.logger.error('Failed to record goods receipt');
      return Err("Ro'yxatdan o'tkazishda xatolik");
    }
  }

  async recordInvoice(poId: number, _quantity: number): Promise<Result<void>> {
    try {
      const rows = await db.select().from(purchase_orders).where(eq(purchase_orders.id, poId)).limit(1);
      if (!rows[0]) return Err('PO topilmadi');
      await db.update(purchase_orders).set({ invoice_matched: true }).where(eq(purchase_orders.id, poId));
      return Ok(undefined);
    } catch (error: unknown) {
      this.logger.error('Failed to record invoice');
      return Err("Invoysni ro'yxatdan o'tkazishda xatolik");
    }
  }

  async validateThreeWayMatch(
    poId: number,
    tx?: DrizzleExecutor,
  ): Promise<Result<{ matched: boolean; difference: number }>> {
    try {
      // §17 3-Way Match: compare the three monetary documents tied to the PO.
      //  1. PO total       → purchase_orders.total_amount
      //  2. Goods receipt  → mm_goods_receipts.total_value (linked by purchase_order_id).
      //                      When total_value is missing/zero we recompute it as
      //                      Σ(received_qty × PO line unit_price) from the receipt items.
      //  3. Invoice        → finance_invoices.total_amount (invoice_type='purchase'),
      //                      linked by vendor_id — same linkage the read endpoint uses,
      //                      since finance_invoices has no purchase_order_id column.
      //                      finance_invoices = kanonik AP invoice-manba, OWNER QARORI
      //                      2026-07-02 (purchase_invoices endi yozuvchisiz — commit d6286993).
      // The match passes only when the largest pairwise spread stays within
      // MM_THREE_WAY_MATCH_TOLERANCE of the PO total. `difference` is the real
      // numeric spread (UZS), not a boolean flag.
      type AmtRow = {
        po_total: number | string | null;
        gr_total: number | string | null;
        invoice_total: number | string | null;
      };
      // Honor the caller's transaction boundary: the goods-receipt handler runs
      // this inside `withTransaction`, so reads must go through that `tx` executor.
      const exec = (tx ?? db) as { execute: (q: ReturnType<typeof sql>) => Promise<unknown> };
      const query = sql`
          SELECT
            po.total_amount AS po_total,
            COALESCE(
              gr.total_value,
              gri.computed_value,
              0
            ) AS gr_total,
            COALESCE(inv.invoice_total, 0) AS invoice_total
          FROM purchase_orders po
          LEFT JOIN LATERAL (
            SELECT g.id, g.total_value
            FROM mm_goods_receipts g
            WHERE g.purchase_order_id = po.id
            ORDER BY g.id DESC
            LIMIT 1
          ) gr ON TRUE
          LEFT JOIN LATERAL (
            SELECT SUM(it.received_qty * COALESCE(poi.unit_price, 0)) AS computed_value
            FROM mm_goods_receipts g2
            JOIN mm_goods_receipt_items it ON it.gr_id = g2.id
            LEFT JOIN purchase_order_items poi
              ON poi.purchase_order_id = po.id
             AND poi.raw_material_id = it.raw_material_id
            WHERE g2.purchase_order_id = po.id
          ) gri ON TRUE
          LEFT JOIN LATERAL (
            SELECT SUM(COALESCE(pi.total_amount, 0)) AS invoice_total
            FROM finance_invoices pi
            WHERE pi.invoice_type = 'purchase' AND pi.vendor_id = po.vendor_id
          ) inv ON TRUE
          WHERE po.id = ${poId}
          LIMIT 1
        `;
      const result = await exec.execute(query);
      const rows = (Array.isArray(result)
        ? result
        : ((result as { rows?: AmtRow[] }).rows ?? [])) as AmtRow[];
      const row = rows[0];
      if (!row) return Err('PO topilmadi');

      const poTotal = Number(row.po_total ?? 0);
      const grTotal = Number(row.gr_total ?? 0);
      const invoiceTotal = Number(row.invoice_total ?? 0);

      // Largest pairwise spread between the three documents (real UZS difference).
      const amounts = [poTotal, grTotal, invoiceTotal];
      const difference = Math.max(...amounts) - Math.min(...amounts);

      // Tolerance is a fraction of the PO total (absolute floor of 1 UZS so a
      // zero-value PO still requires the other two documents to be present/zero).
      const toleranceAbs = Math.max(Math.abs(poTotal) * MM_THREE_WAY_MATCH_TOLERANCE, 1);

      // A goods receipt and an invoice must both exist for a match to be possible.
      const documentsPresent = grTotal > 0 && invoiceTotal > 0;
      const matched = documentsPresent && difference <= toleranceAbs;

      return Ok({ matched, difference: Math.round(difference) });
    } catch (error: unknown) {
      this.logger.error('Failed to validate three-way match');
      return Err('Tekshirishda xatolik');
    }
  }

  async updateVendorRating(supplierId: number, newRating: number): Promise<Result<void>> {
    try {
      await db.update(vendors).set({ rating: String(newRating) }).where(eq(vendors.id, supplierId));
      return Ok(undefined);
    } catch (error: unknown) {
      this.logger.error('Failed to update vendor rating');
      return Err('Reyting yangilashda xatolik');
    }
  }
}
