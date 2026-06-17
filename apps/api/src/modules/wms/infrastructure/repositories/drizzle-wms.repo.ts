/**
 * @module drizzle-wms.repo
 * @description Repository / data-access layer. Wraps Drizzle ORM queries; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Injectable, Logger } from '@nestjs/common';
import { castTo } from '@common/db-rows';
import { AppErr, Err, Ok } from '@common/result';
import { Database } from '@/infrastructure/database/database';
import { Result } from '@common/result';
import { db, stocks, warehouses } from '@shared/db';
import { sql, eq, isNull, and, asc } from 'drizzle-orm';
import { wms_stock } from '@shared/db/schema-compat-5';
import { Stock } from '../../domain/aggregates/stock.aggregate';
import { IWmsRepository, DrizzleExecutor, CreateWarehouseInput } from '../../domain/repositories/wms.repository';
import {
  execSaveStock, queryStock, queryStockByMaterialAndWarehouse, queryFefoStock,
  execUpdateStockReserved, execUpdateStockIssued, execReceiveFg, execIssueFromWarehouseStock, queryAllStockByWarehouse,
} from '@common/database/queries-wms';

type StockRow = Record<string, unknown>;

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

const toStock = (r: StockRow): Stock =>
  new Stock(Number(r['id']), Number(r['warehouse_id']), Number(r['material_id']), Number(r['quantity']), r['expiry_date'] ? new Date(String(r['expiry_date'])) : null, String(r['batch_number'] ?? ''));

@Injectable()
export class DrizzleWmsRepository implements IWmsRepository {
  private readonly logger = new Logger(DrizzleWmsRepository.name);

  constructor(private _db: Database) {}

  async saveStock(stock: Stock, tx?: DrizzleExecutor): Promise<Result<number>> {
    try {
      if (tx) {
        // In-transaction path: inline insert against the supplied tx executor.
        const exec = asExec(tx);
        await exec.insert(stocks).values({
          warehouse_id: stock.getWarehouseId(),
          material_id: stock.getMaterialId(),
          quantity: String(stock.getQuantity()),
          reserved_quantity: String(stock.getReservedQuantity()),
          expiry_date: (stock.getExpiryDate() ? new Date(stock.getExpiryDate() as Date).toISOString() : null) as string | null,
          batch_number:
            ((castTo<StockRow>(stock))['batchNumber'] as string | null) ?? null,
          received_at:
            ((castTo<StockRow>(stock))['receivedAt'] as Date | null) ?? null,
        }).onConflictDoNothing();
        return Ok(1);
      }
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

  async withTransaction<T>(
    work: (tx: DrizzleExecutor) => Promise<Result<T>>,
  ): Promise<Result<T>> {
    try {
      return await db.transaction(async (tx) => work(tx as DrizzleExecutor));
    } catch (e: unknown) {
      this.logger.error('WMS transaction failed');
      return Err(AppErr('DB_ERROR', (e as Error)?.message || 'Tranzaksiya xatoligi'));
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

  async getFefoStock(
    materialId: number,
    warehouseId: number,
    tx?: DrizzleExecutor,
  ): Promise<Result<Stock[]>> {
    try {
      if (tx) {
        const exec = asExec(tx);
        const rows = await exec.select().from(stocks)
          .where(and(eq(stocks.material_id, materialId), eq(stocks.warehouse_id, warehouseId)))
          .orderBy(sql`${stocks.expiry_date} ASC NULLS LAST`, asc(stocks.received_at));
        return Ok((Array.isArray(rows) ? rows : []).map((r) => toStock(r as StockRow)));
      }
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

  async issueFromWarehouseStock(materialId: number, warehouseId: number, amount: number): Promise<Result<void>> {
    try {
      const id = await execIssueFromWarehouseStock(warehouseId, materialId, amount);
      if (id === 0) return Err("Yetarli stock yo'q yoki material topilmadi");
      return Ok(undefined);
    } catch {
      this.logger.error('Failed to issue from warehouse_stock');
      return Err('Chiqarish xatoligi');
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

  async createWarehouse(input: CreateWarehouseInput): Promise<Result<CreateWarehouseInput>> {
    try {
      await db.insert(warehouses).values({
        id: input.id,
        name: input.name,
        address: input.address,
        is_free_storage: input.is_free_storage,
        free_storage_days: input.free_storage_days,
        monthly_rate: input.monthly_rate,
        created_at: input.created_at,
      });
      return Ok(input);
    } catch (e) {
      this.logger.error({ method: 'createWarehouse', error: e }, 'Failed to insert warehouse');
      return Err(AppErr('DB_ERROR', `Warehouse yaratishda xato: ${(e as Error)?.message ?? String(e)}`));
    }
  }

  async softDeleteStock(id: number, deletedBy: number | null, _deletedAt?: Date): Promise<Result<void>> {
    try {
      await db.update(wms_stock)
        .set({ deleted_at: _time.now(), deleted_by: deletedBy })
        .where(and(eq(wms_stock.id, id), isNull(wms_stock.deleted_at)));
      return Ok(undefined);
    } catch (error) {
      this.logger.error(
        { method: 'softDeleteStock', stockId: id, deletedBy, error },
        'Database query failed',
      );
      return Err(`Failed to soft-delete stock: ${(error as Error).message}`);
    }
  }
}
