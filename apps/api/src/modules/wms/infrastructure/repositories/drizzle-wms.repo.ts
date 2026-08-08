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
import { db } from '@shared/db';
// APPROVED: egasi ikki-dunyo-tuzatish 2026-07-02 — live `warehouses`.id is
// INTEGER (serial), not the uuid PK schema-wms.ts declares. schema-compat-2.ts's
// `warehouses` already has the correct integer id + the address/isFreeStorage/
// freeStorageDays/monthlyRate columns createWarehouse() below needs.
import { warehouses } from '@shared/db/schema-compat-2';
import { sql, eq, isNull, and } from 'drizzle-orm';
import { wms_stock } from '@shared/db/schema-compat-5';
import { BATCH_ISSUABLE_QUALITY_STATUSES } from '../../domain/constants/wms-batch-issue.constants';
import { Stock } from '../../domain/aggregates/stock.aggregate';
import { IWmsRepository, DrizzleExecutor, CreateWarehouseInput, InsertGoodsIssueInput } from '../../domain/repositories/wms.repository';
import { IssuableBatchLot } from '../../domain/services/batch-selection.service';
import {
  execSaveStock, queryStock, queryStockByMaterialAndWarehouse, queryFefoStock, queryFefoBatchLots,
  execUpdateStockReserved, execUpdateStockIssued, execReceiveFg, execIssueFromWarehouseStock, queryAllStockByWarehouse,
  queryIssuableBatchLots, queryHasAnyBatchLots, execDecrementBatchLot, execInsertWmsTransaction, BatchLotRow,
} from '@common/database/queries-wms';

type StockRow = Record<string, unknown>;

/** Raw-SQL executor surface (db or tx) for the batch-lot query helpers. */
type ExecuteLike = { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> };
const asTxExec = (tx?: DrizzleExecutor): ExecuteLike | undefined =>
  tx ? (tx as unknown as ExecuteLike) : undefined;

const toStock = (r: StockRow): Stock =>
  new Stock(Number(r['id']), Number(r['warehouse_id']), Number(r['material_id']), Number(r['quantity']), r['expiry_date'] ? new Date(String(r['expiry_date'])) : null, String(r['batch_number'] ?? ''));

@Injectable()
export class DrizzleWmsRepository implements IWmsRepository {
  private readonly logger = new Logger(DrizzleWmsRepository.name);

  constructor(private _db: Database) {}

  async saveStock(stock: Stock, tx?: DrizzleExecutor): Promise<Result<number>> {
    try {
      if (tx) {
        // In-transaction reserve path: increment reserved / shrink available on the CANONICAL
        // warehouse_stock against the supplied tx executor (was a dead insert into `stocks`).
        // getReservedQuantity() is the delta to reserve (aggregate starts reserved at 0).
        const exec = asTxExec(tx);
        const delta = stock.getReservedQuantity();
        await exec?.execute(sql`
          UPDATE warehouse_stock
          SET reserved_quantity  = reserved_quantity + ${delta},
              available_quantity = available_quantity - ${delta},
              last_movement_at   = NOW(),
              last_updated_at    = NOW()
          WHERE warehouse_id = ${stock.getWarehouseId()} AND material_id = ${stock.getMaterialId()}
            AND available_quantity >= ${delta}
        `);
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
        // tx-branch repoint: was reading the DEAD `stocks` table (0 rows → chiqim found
        // nothing). The canonical batch/expiry source is `batch_lots` (live, carries
        // expiry_date + received_date), so true first-expiry FEFO reads it ordered by
        // expiry ASC. `remaining_quantity` is exposed as `quantity` and `reserved_quantity`
        // aliased to 0 (batch_lots tracks no reservation) to match the toStock mapper /
        // the non-tx queryFefoStock shape. Same QC-allowed + active + positive-qoldiq
        // filter as queryIssuableBatchLots so the read agrees with the issue selection.
        const exec = asTxExec(tx);
        const allowed = [...BATCH_ISSUABLE_QUALITY_STATUSES];
        const res = await exec?.execute(sql`
          SELECT id,
                 warehouse_id,
                 material_id,
                 remaining_quantity AS quantity,
                 0::numeric AS reserved_quantity,
                 remaining_quantity AS on_hand_quantity,
                 expiry_date,
                 batch_number,
                 COALESCE(received_date, created_at) AS received_at
          FROM batch_lots
          WHERE material_id = ${materialId}
            AND warehouse_id = ${warehouseId}
            AND is_active = true
            AND remaining_quantity > 0
            AND quality_status = ANY(${allowed})
          ORDER BY expiry_date ASC NULLS LAST, COALESCE(received_date, created_at) ASC
        `);
        const rows = (Array.isArray(res?.rows) ? res.rows : []) as StockRow[];
        return Ok(rows.map(toStock));
      }
      // Non-tx GET /api/wms/stock/fefo read-parity: read TRUE first-expiry FEFO from the
      // canonical batch_lots (same shape/filter/order as the tx-branch above), NOT the
      // approximate-FIFO warehouse_stock. queryFefoStock (warehouse_stock) stays the
      // reserve/issue writer source below — those UPDATE warehouse_stock by id.
      const rows = await queryFefoBatchLots(materialId, warehouseId);
      return Ok((Array.isArray(rows) ? rows : []).map(toStock));
    } catch {
      this.logger.error('Failed to get FEFO stock');
      return Err('FEFO stock oqishda xatolik');
    }
  }

  /**
   * C1.4 (CRITICAL-CORRECTNESS-AUDIT-2026-07-06): `queryFefoStock`'s SELECT is a snapshot that can
   * be stale by the time the per-row UPDATE runs. `execUpdateStockReserved`/`execUpdateStockIssued`
   * now guard the write itself against the row's CURRENT state and report success/failure —
   * `toReserve`/`toIssue` amounts computed from the stale snapshot are only ATTRIBUTED to
   * `remainingAmount` once the guarded UPDATE actually confirms it applied. If a concurrent
   * operation already consumed this row's capacity between the SELECT and this UPDATE, the guard
   * fails, the amount is NOT deducted from `remainingAmount`, and the loop moves to the next FEFO
   * row — conservative (may under-attribute to an exhausted row) but never oversells.
   */
  async reserveMaterial(materialId: number, warehouseId: number, amount: number): Promise<Result<void>> {
    try {
      const rows = await queryFefoStock(materialId, warehouseId);
      let remainingAmount = amount;
      for (const row of rows) {
        if (remainingAmount <= 0) break;
        const available = Number(row['quantity']) - Number(row['reserved_quantity']);
        const toReserve = Math.min(available, remainingAmount);
        if (toReserve > 0) {
          const applied = await execUpdateStockReserved(row['id'], toReserve);
          if (applied) remainingAmount -= toReserve;
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
            const applied = await execUpdateStockIssued(row['id'], toIssue, toIssue);
            if (applied) remainingAmount -= toIssue;
          }
        } else {
          // Ad-hoc issue: deduct from available (quantity - reserved_quantity), reserved unchanged
          const available = Number(row['quantity']) - Number(row['reserved_quantity']);
          const toIssue = Math.min(available, remainingAmount);
          if (toIssue > 0) {
            const applied = await execUpdateStockIssued(row['id'], toIssue, 0);
            if (applied) remainingAmount -= toIssue;
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

  async receiveFg(
    materialId: number,
    warehouseId: number,
    amount: number,
    context?: { referenceId?: number | null; createdBy?: number | null; notes?: string | null; unitCost?: number | null },
  ): Promise<Result<void>> {
    // A60: the warehouse_stock upsert and the 'IN' wms_transactions ledger row run in ONE
    // transaction — a receipt can NEVER bump the canonical stock without also leaving an
    // auditable movement (and vice-versa). If the ledger INSERT fails, the stock bump rolls back.
    // T21-A2: unitCost (grade-adjusted FG unit price = base × sort coefficient) is recorded on
    // the IN-ledger row so downstream stock-valuation reads the saralangan (graded) value.
    return this.withTransaction(async (tx) => {
      try {
        const exec = asTxExec(tx);
        await execReceiveFg(warehouseId, materialId, amount, exec);
        await execInsertWmsTransaction(
          {
            warehouseId,
            materialId,
            type: 'IN',
            quantity: amount,
            unitCost: context?.unitCost ?? null,
            referenceId: context?.referenceId ?? null,
            createdBy: context?.createdBy ?? null,
            notes: context?.notes ?? null,
          },
          exec,
        );
        return Ok(undefined);
      } catch {
        this.logger.error('Failed to receive FG');
        return Err('FG qabul qilishda xatolik');
      }
    });
  }

  async insertGoodsIssue(
    input: InsertGoodsIssueInput,
    tx?: DrizzleExecutor,
  ): Promise<Result<number>> {
    try {
      // Run against the supplied tx (atomic with the stock decrement) or db.
      const exec = (tx ?? db) as unknown as {
        execute: (q: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }>;
      };
      const res = await exec.execute(sql`
        INSERT INTO wms_goods_issues
          (material_id, warehouse_id, quantity, pp_id, status, issued_by)
        VALUES (
          ${input.materialId}, ${input.warehouseId}, ${String(input.quantity)},
          ${input.ppId ?? null}, 'issued', ${input.issuedBy ?? null}
        )
        RETURNING id`);
      const rows = Array.isArray(res?.rows) ? res.rows : [];
      const first = rows[0] as { id?: unknown } | undefined;
      const id = Number(first?.id ?? 0);
      if (id === 0) return Err(AppErr('DB_ERROR', "Chiqim yozuvi saqlanmadi"));
      return Ok(id);
    } catch (e) {
      this.logger.error({ method: 'insertGoodsIssue', error: e }, 'Failed to insert goods issue');
      return Err(AppErr('DB_ERROR', `Chiqim yozuvini saqlashda xato: ${(e as Error)?.message ?? String(e)}`));
    }
  }

  async recordWmsTransaction(
    input: {
      warehouseId: number;
      materialId: number;
      type: string;
      quantity: number;
      referenceId?: number | null;
      createdBy?: number | null;
      notes?: string | null;
      unitCost?: number | null;
    },
    tx?: DrizzleExecutor,
  ): Promise<Result<void>> {
    try {
      // Same helper receiveFg uses for the 'IN' row; here the goods-issue path supplies
      // type 'OUT' and the SAME tx as the warehouse_stock decrement (atomic stock<->ledger).
      await execInsertWmsTransaction(input, asTxExec(tx));
      return Ok(undefined);
    } catch (e) {
      this.logger.error({ method: 'recordWmsTransaction', error: e }, 'Failed to record WMS transaction');
      return Err(AppErr('DB_ERROR', `WMS harakat yozuvini saqlashda xato: ${(e as Error)?.message ?? String(e)}`));
    }
  }

  async issueFromWarehouseStock(materialId: number, warehouseId: number, amount: number, tx?: DrizzleExecutor): Promise<Result<void>> {
    try {
      const id = await execIssueFromWarehouseStock(warehouseId, materialId, amount, asTxExec(tx));
      if (id === 0) return Err("Yetarli stock yo'q yoki material topilmadi");
      return Ok(undefined);
    } catch {
      this.logger.error('Failed to issue from warehouse_stock');
      return Err('Chiqarish xatoligi');
    }
  }

  async getIssuableBatchLots(
    materialId: number,
    warehouseId: number,
    tx?: DrizzleExecutor,
  ): Promise<Result<IssuableBatchLot[]>> {
    try {
      const rows = await queryIssuableBatchLots(materialId, warehouseId, asTxExec(tx));
      const lots: IssuableBatchLot[] = (Array.isArray(rows) ? rows : []).map(
        (r: BatchLotRow) => ({
          id: Number(r.id),
          remaining: Number(r.remaining_quantity ?? 0),
          expiryDate: r.expiry_date ? new Date(String(r.expiry_date)) : null,
          receivedAt: r.received_date ? new Date(String(r.received_date)) : null,
          costPerUnit:
            r.cost_per_unit != null && Number.isFinite(Number(r.cost_per_unit)) && Number(r.cost_per_unit) > 0
              ? Number(r.cost_per_unit)
              : null,
          qualityStatus: r.quality_status != null ? String(r.quality_status) : null,
        }),
      );
      return Ok(lots);
    } catch {
      this.logger.error('Failed to get issuable batch lots');
      return Err('Partiya o\'qishda xatolik');
    }
  }

  async hasAnyBatchLots(
    materialId: number,
    warehouseId: number,
    tx?: DrizzleExecutor,
  ): Promise<Result<boolean>> {
    try {
      const has = await queryHasAnyBatchLots(materialId, warehouseId, asTxExec(tx));
      return Ok(has);
    } catch {
      this.logger.error('Failed to check batch lots existence');
      return Err('Partiya tekshirishda xatolik');
    }
  }

  async decrementBatchLot(
    lotId: number,
    qty: number,
    tx?: DrizzleExecutor,
  ): Promise<Result<void>> {
    try {
      const id = await execDecrementBatchLot(lotId, qty, asTxExec(tx));
      if (id === 0) return Err(AppErr('INVALID_QUANTITY', "Partiyada yetarli qoldiq yo'q"));
      return Ok(undefined);
    } catch {
      this.logger.error('Failed to decrement batch lot');
      return Err('Partiya kamaytirishda xatolik');
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

  async createWarehouse(input: CreateWarehouseInput): Promise<Result<CreateWarehouseInput & { id: number }>> {
    try {
      // `id` is a DB-generated serial (nextval) — never supplied on insert.
      const inserted = await db.insert(warehouses).values({
        name: input.name,
        address: input.address,
        isFreeStorage: input.is_free_storage,
        freeStorageDays: input.free_storage_days,
        monthlyRate: input.monthly_rate,
        createdAt: input.created_at,
      }).returning({ id: warehouses.id });
      const id = inserted[0]?.id;
      if (id == null) return Err(AppErr('DB_ERROR', 'Warehouse yaratishda xato: id qaytarilmadi'));
      return Ok({ ...input, id });
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
