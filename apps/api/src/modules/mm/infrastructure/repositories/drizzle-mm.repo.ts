import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { Err, Ok } from '@common/result';
import { Database } from '@/infrastructure/database/database';
import { Result } from '@common/result';
import { Material } from '../../domain/aggregates/material.aggregate';
import { PurchaseOrder } from '../../domain/aggregates/purchase-order.aggregate';
import { IMmRepository } from '../../domain/repositories/mm.repository';
import { db , runQuery } from '@shared/db';
import { materials, purchase_orders, vendors } from '@shared/db';
import { execMmMaterialInsert, execMmPurchaseOrderInsert } from '@common/database/queries-remaining';

type DbRow = Record<string, unknown>;

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

  async savePurchaseOrder(po: PurchaseOrder): Promise<Result<number>> {
    try {
      await execMmPurchaseOrderInsert(po.getPoNumber(), String(po.getSupplierId()), po.getTotalAmount(), String(po.getStatus()), String(po.getCreatedBy()));
      return Ok(1);
    } catch (error: unknown) {
      this.logger.error('Failed to save purchase order');
      return Err('PO saqlashda xatolik');
    }
  }

  async getPurchaseOrder(id: number): Promise<Result<PurchaseOrder>> {
    try {
      const rows = await db.select().from(purchase_orders).where(eq(purchase_orders.id, String(id))).limit(1);
      const row = rows[0] as DbRow | undefined;
      if (!row) return Err('PO topilmadi');
      return Ok(new PurchaseOrder(row['id'] as number, String(row['po_number'] ?? ''), row['vendor_id'] as number, Number(row['created_by'] ?? 0)));
    } catch (error: unknown) {
      this.logger.error('Failed to get purchase order');
      return Err('Oqish xatoligi');
    }
  }

  async getAllPoByStatus(status: string): Promise<Result<PurchaseOrder[]>> {
    try {
      const result = await runQuery<DbRow>(sql`SELECT * FROM purchase_orders WHERE status = ${status}`);
      return Ok((result.rows ?? []).map((r) => new PurchaseOrder(r['id'] as number, String(r['po_number'] ?? ''), r['vendor_id'] as number, Number(r['created_by'] ?? 0))));
    } catch (error: unknown) {
      this.logger.error('Failed to get purchase orders');
      return Err('Oqish xatoligi');
    }
  }

  async recordGoodsReceipt(poId: number, _quantity: number): Promise<Result<void>> {
    try {
      const rows = await db.select().from(purchase_orders).where(eq(purchase_orders.id, String(poId))).limit(1);
      if (!rows[0]) return Err('PO topilmadi');
      await db.update(purchase_orders).set({ goods_received_at: _time.now() }).where(eq(purchase_orders.id, String(poId)));
      return Ok(undefined);
    } catch (error: unknown) {
      this.logger.error('Failed to record goods receipt');
      return Err("Ro'yxatdan o'tkazishda xatolik");
    }
  }

  async recordInvoice(poId: number, _quantity: number): Promise<Result<void>> {
    try {
      const rows = await db.select().from(purchase_orders).where(eq(purchase_orders.id, String(poId))).limit(1);
      if (!rows[0]) return Err('PO topilmadi');
      await db.update(purchase_orders).set({ invoice_matched: true }).where(eq(purchase_orders.id, String(poId)));
      return Ok(undefined);
    } catch (error: unknown) {
      this.logger.error('Failed to record invoice');
      return Err("Invoysni ro'yxatdan o'tkazishda xatolik");
    }
  }

  async validateThreeWayMatch(poId: number): Promise<Result<{ matched: boolean; difference: number }>> {
    try {
      const rows = await db.select().from(purchase_orders).where(eq(purchase_orders.id, String(poId))).limit(1);
      const po = rows[0] as DbRow | undefined;
      if (!po) return Err('PO topilmadi');
      const invoiceMatched = Boolean(po['invoice_matched']);
      const goodsReceived = Boolean(po['goods_received_at']);
      const matched = invoiceMatched && goodsReceived;
      return Ok({ matched, difference: matched ? 0 : 1 });
    } catch (error: unknown) {
      this.logger.error('Failed to validate three-way match');
      return Err('Tekshirishda xatolik');
    }
  }

  async updateVendorRating(supplierId: number, newRating: number): Promise<Result<void>> {
    try {
      await db.update(vendors).set({ rating: String(newRating) }).where(eq(vendors.id, String(supplierId)));
      return Ok(undefined);
    } catch (error: unknown) {
      this.logger.error('Failed to update vendor rating');
      return Err('Reyting yangilashda xatolik');
    }
  }
}
