/**
 * @module drizzle-pp.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Err, Ok } from '@common/result';
import { Database } from '@/infrastructure/database/database';
import { Result } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeNum } from '@common/math/math-utils';
import { ProductionOrder } from '../../domain/aggregates/production-order.aggregate';
import { Bom } from '../../domain/aggregates/bom.aggregate';
import { Routing } from '../../domain/aggregates/routing.aggregate';
import { IPpRepository, BomComponentRow } from '../../domain/repositories/pp.repository';
import {
  execSavePo, execUpdatePoStatus, queryPo, queryPoByStatus,
  execSaveBom, queryBom, queryBomByProduct,
  execSaveRouting, queryRouting, queryRoutingByProduct,
  execUnlockPlanning, queryProductionPlan, queryMachineLoad,
  countPoBySalesOrder, querySalesOrderItemsForPlanning, execCreatePlanLine,
} from '@common/database/queries-pp';

type DbRow = Record<string, unknown>;

@Injectable()
export class DrizzlePpRepository implements IPpRepository {
  private readonly logger = new Logger(DrizzlePpRepository.name);

  constructor(private _db: Database) {}

  async savePo(po: ProductionOrder): Promise<Result<number>> {
    try {
      // Existing order (release/transition) → UPDATE status; new order → INSERT (with product_id +
      // sales_order_id). Previously this always re-inserted, so release created a duplicate row.
      if (po.getId() > 0) {
        const id = await execUpdatePoStatus(po.getId(), po.getStatus());
        return Ok(id);
      }
      const id = await execSavePo(po.getSoId(), po.getStatus(), po.getBomId(), po.getRoutingId(), po.getPlannedStart(), po.getPlannedEnd(), po.getProductId());
      return Ok(id);
    } catch {
      this.logger.error('Failed to save production order');
      return Err('Saqlashda xatolik');
    }
  }

  async getPo(id: number): Promise<Result<ProductionOrder>> {
    try {
      const row = await queryPo(id);
      if (!row) return Err('PP topilmadi');
      return Ok(new ProductionOrder(Number(row["id"]), Number(row["sales_order_id"]), Number(row["bom_id"]), Number(row["routing_id"]), new Date(String(row["scheduled_start"] ?? "")), new Date(String(row["scheduled_end"] ?? ""))));
    } catch {
      this.logger.error('Failed to get production order');
      return Err('Oqish xatoligi');
    }
  }

  async getAllPoByStatus(status: string): Promise<Result<ProductionOrder[]>> {
    try {
      const rows = await queryPoByStatus(status);
      return Ok((Array.isArray(rows) ? rows : []).map((r) => new ProductionOrder(Number(r['id']), Number(r['sales_order_id']), Number(r['bom_id']), Number(r['routing_id']), r['scheduled_start'] as Date, r['scheduled_end'] as Date)));
    } catch {
      this.logger.error('Failed to get production orders');
      return Err('Oqish xatoligi');
    }
  }

  async saveBom(bom: Bom): Promise<Result<number>> {
    try {
      const insertedId = await execSaveBom(String(bom.getProductId()), String(bom.getVersion()));
      return Ok(insertedId);
    } catch {
      this.logger.error('Failed to save BOM');
      return Err('BOM saqlashda xatolik');
    }
  }

  async getBom(id: number): Promise<Result<Bom>> {
    try {
      const row = await queryBom(id);
      if (!row) return Err('BOM topilmadi');
      return Ok(new Bom(Number(row['id']), Number(row['product_id']), Number(row['version'] ?? 1)));
    } catch {
      this.logger.error('Failed to get BOM');
      return Err('Oqish xatoligi');
    }
  }

  async getBomByProductId(productId: number): Promise<Result<Bom>> {
    try {
      const row = await queryBomByProduct(productId);
      if (!row) return Err('BOM topilmadi');
      return Ok(new Bom(Number(row['id']), Number(row['product_id']), Number(row['version'] ?? 1)));
    } catch {
      this.logger.error('Failed to get BOM by product');
      return Err('Oqish xatoligi');
    }
  }

  async saveRouting(routing: Routing): Promise<Result<number>> {
    try {
      const insertedId = await execSaveRouting(Number(routing.getProductId()), `routing-${routing.getProductId()}`, routing.getVersion());
      return Ok(insertedId);
    } catch {
      this.logger.error('Failed to save routing');
      return Err('Routing saqlashda xatolik');
    }
  }

  async getRouting(id: number): Promise<Result<Routing>> {
    try {
      const row = await queryRouting(id);
      if (!row) return Err('Routing topilmadi');
      return Ok(new Routing(Number(row['id']), Number(row['product_id'] ?? 0), Number(row['version'] ?? 1)));
    } catch {
      this.logger.error('Failed to get routing');
      return Err('Oqish xatoligi');
    }
  }

  async getRoutingByProductId(productId: number): Promise<Result<Routing>> {
    try {
      const row = await queryRoutingByProduct(productId);
      if (!row) return Err('Routing topilmadi');
      return Ok(new Routing(Number(row['id']), Number(row['product_id'] ?? 0), Number(row['version'] ?? 1)));
    } catch {
      this.logger.error('Failed to get routing by product');
      return Err('Oqish xatoligi');
    }
  }

  async unlockPlanning(orderId: number): Promise<Result<void>> {
    try {
      await execUnlockPlanning(orderId);
      return Ok(undefined);
    } catch {
      this.logger.error('Failed to unlock planning');
      return Err('Kilid ochishda xatolik');
    }
  }

  async createPlanFromSalesOrder(
    salesOrderId: number,
    createdBy?: number,
  ): Promise<Result<number>> {
    try {
      // Idempotency: a production order already exists for this sales order → skip.
      const existing = await countPoBySalesOrder(salesOrderId);
      if (existing > 0) {
        this.logger.log(
          `createPlanFromSalesOrder: ${existing} PO already exist for sales order ${salesOrderId} — skip`,
        );
        return Ok(0);
      }

      const items = await querySalesOrderItemsForPlanning(salesOrderId);
      if (items.length === 0) {
        // No product-bound line items → nothing plannable yet (no DDL, no fake row).
        this.logger.warn(
          `createPlanFromSalesOrder: sales order ${salesOrderId} has no product-bound line items — no plan created`,
        );
        return Ok(0);
      }

      let created = 0;
      for (const item of items) {
        if (!Number.isFinite(item.productId) || item.productId <= 0) continue;
        const id = await execCreatePlanLine(
          salesOrderId,
          item.productId,
          item.quantity,
          item.unit,
          createdBy ?? null,
        );
        if (id > 0) created += 1;
      }

      this.logger.log(
        `createPlanFromSalesOrder: opened ${created} production order(s) for sales order ${salesOrderId}`,
      );
      return Ok(created);
    } catch (e) {
      this.logger.error(`Failed to create plan from sales order: ${String(e)}`);
      return Err('Reja yaratishda xatolik');
    }
  }

  async getProductionPlan(startDate: Date, endDate: Date): Promise<Result<DbRow[]>> {
    try {
      return Ok(await queryProductionPlan(startDate, endDate));
    } catch {
      this.logger.error('Failed to get production plan');
      return Err('Oqish xatoligi');
    }
  }

  async getMachineLoad(workCenterId: number): Promise<Result<DbRow[]>> {
    try {
      return Ok(await queryMachineLoad(workCenterId));
    } catch {
      this.logger.error('Failed to get machine load');
      return Err('Oqish xatoligi');
    }
  }

  async findActiveBomComponents(): Promise<Result<BomComponentRow[]>> {
    try {
      const result = await runQuery<DbRow>(sql`
        SELECT parent_id AS "parentId", child_id AS "childId",
               qty_per_unit AS "qtyPerUnit"
        FROM bom_components
        WHERE is_active = true
      `);
      const rawRows = result?.rows ?? [];
      const rows: BomComponentRow[] = (Array.isArray(rawRows) ? rawRows : []).map((r) => ({
        parentId: String(r['parentId'] ?? ''),
        childId: String(r['childId'] ?? ''),
        qtyPerUnit: safeNum(r['qtyPerUnit'], 1),
      }));
      return Ok(rows);
    } catch (e) {
      this.logger.error(`Failed to load active BOM components: ${String(e)}`);
      return Err('BOM komponentlarini o\'qishda xatolik');
    }
  }
}
