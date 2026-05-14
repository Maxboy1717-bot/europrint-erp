/**
 * @module drizzle-wms.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { Err, Ok } from '@common/result';
import { Database } from '@/infrastructure/database/database';
import { Result } from '@common/result';
import { db } from '@shared/db';
import { sql, eq, isNull, and } from 'drizzle-orm';
import { wms_stock } from '@shared/db/schema-compat-5';
import { Stock } from '../../domain/aggregates/stock.aggregate';
import { IWmsRepository } from '../../domain/repositories/wms.repository';
import {
  execSaveStock, queryStock, queryStockByMaterialAndWarehouse, queryFefoStock,
  execUpdateStockReserved, execUpdateStockIssued, execReceiveFg, queryAllStockByWarehouse,
} from '@common/database/queries-wms';

type StockRow = Record<string, unknown>;

const toStock = (r: StockRow): Stock =>
  new Stock(Number(r['id']), Number(r['warehouse_id']), Number(r['material_id']), Number(r['quantity']), r['expiry_date'] ? new Date(String(r['expiry_date'])) : null, String(r['batch_number'] ?? ''));

@Injectable()
export class DrizzleWmsRepository implements IWmsRepository {
  private readonly logger = new Logger(DrizzleWmsRepository.name);

  constructor(private _db: Database) {}

  async saveStock(stock: Stock): Promise<Result<number>> {
    try {
      await execSaveStock(
        stock.getWarehouseId(), stock.getMaterialId(), stock.getQuantity(),
        stock.getReservedQuantity(), stock.getExpiryDate(),
        (castTo<StockRow>(stock))['batchNumber'], (castTo<StockRow>(stock))['receivedAt'],
      );
      return Ok(1);
    } catch {
      this.logger.error('Failed to save stock');
      return Err('Stock saqlashda xatolik');
    }
  }

  async getStock(id: number): Promise<Result<Stock>> {
    try {
      const row = await queryStock(id);
      if (!row) return Err('Stock topilmadi');
      return Ok(toStock(row));
    } catch {
      this.logger.error('Failed to get stock');
      return Err('Oqish xatoligi');
    }
  }

  async getStockByMaterialAndWarehouse(materialId: number, warehouseId: number): Promise<Result<Stock[]>> {
    try {
      const rows = await queryStockByMaterialAndWarehouse(materialId, warehouseId);
      return Ok((Array.isArray(rows) ? rows : []).map(toStock));
    } catch {
      this.logger.error('Failed to get stock');
      return Err('Oqish xatoligi');
    }
  }

  async getFefoStock(materialId: number, warehouseId: number): Promise<Result<Stock[]>> {
    try {
      const rows = await queryFefoStock(materialId, warehouseId);
      return Ok((Array.isArray(rows) ? rows : []).map(toStock));
    } catch {
      this.logger.error('Failed to get FEFO stock');
      return Err('FEFO stock oqishda xatolik');
    }
  }

  async reserveMaterial(materialId: number, warehouseId: number, amount: number): Promise<Result<void>> {
    try {
      const rows = await queryFefoStock(materialId, warehouseId);
      let remainingAmount = amount;
      for (const row of rows) {
        if (remainingAmount <= 0) break;
        const available = Number(row['quantity']) - Number(row['reserved_quantity']);
        const toReserve = Math.min(available, remainingAmount);
        if (toReserve > 0) {
          await execUpdateStockReserved(row['id'], Number(row['reserved_quantity']) + toReserve);
          remainingAmount -= toReserve;
        }
      }
      if (remainingAmount > 0) return Err("Yetarli stock yo'q");
      return Ok(undefined);
    } catch {
      this.logger.error('Failed to reserve material');
      return Err('Rezerv qilishda xatolik');
    }
  }

  async issueGoods(materialId: number, warehouseId: number, amount: number, reservationId?: number | null): Promise<Result<void>> {
    try {
      const rows = await queryFefoStock(materialId, warehouseId);
      let remainingAmount = amount;
      const isReservedIssue = reservationId != null && reservationId > 0;

      for (const row of rows) {
        if (remainingAmount <= 0) break;

        if (isReservedIssue) {
          // Reserved issue: deduct from reserved_quantity and current quantity
          const toIssue = Math.min(Number(row['reserved_quantity']), remainingAmount);
          if (toIssue > 0) {
            await execUpdateStockIssued(
              row['id'],
              Number(row['quantity']) - toIssue,
              Number(row['reserved_quantity']) - toIssue,
            );
            remainingAmount -= toIssue;
          }
        } else {
          // Ad-hoc issue: deduct from available (quantity - reserved_quantity), reserved unchanged
          const available = Number(row['quantity']) - Number(row['reserved_quantity']);
          const toIssue = Math.min(available, remainingAmount);
          if (toIssue > 0) {
            await execUpdateStockIssued(
              row['id'],
              Number(row['quantity']) - toIssue,
              Number(row['reserved_quantity']), // reserved_quantity unchanged
            );
            remainingAmount -= toIssue;
          }
        }
      }
      if (remainingAmount > 0) return Err("Yetarli miqdor yo'q");
      return Ok(undefined);
    } catch {
      this.logger.error('Failed to issue goods');
      return Err('Chiqarish xatoligi');
    }
  }

  async receiveFg(materialId: number, warehouseId: number, amount: number): Promise<Result<void>> {
    try {
      await execReceiveFg(warehouseId, materialId, amount);
      return Ok(undefined);
    } catch {
      this.logger.error('Failed to receive FG');
      return Err('FG qabul qilishda xatolik');
    }
  }

  async getAllStockByStatus(warehouseId: number): Promise<Result<Stock[]>> {
    try {
      const rows = await queryAllStockByWarehouse(warehouseId);
      return Ok((Array.isArray(rows) ? rows : []).map(toStock));
    } catch {
      this.logger.error('Failed to get all stock');
      return Err('Oqish xatoligi');
    }
  }

  async softDeleteStock(id: number, deletedBy: number | null, _deletedAt?: Date): Promise<Result<void>> {
    try {
      await db.update(wms_stock)
        .set({ deleted_at: _time.now(), deleted_by: deletedBy })
        .where(and(eq(wms_stock.id, id), isNull(wms_stock.deleted_at)));
      return Ok(undefined);
    } catch {
      this.logger.error('Failed to soft-delete stock');
      return Err('Soft-delete xatoligi');
    }
  }
}
