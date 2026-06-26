/**
 * @module receive-fg.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Ok, Err } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { runQuery } from '@shared/db';
import { sql } from 'drizzle-orm';
import { IWmsRepository, WMS_REPO } from '../../domain/repositories/wms.repository';
import { WmsFgReceivedEvent } from '../events/wms-fg-received.event';

export class ReceiveFgCommand {
  constructor(
    public materialId: number,
    public warehouseId: number,
    public amount: number,
    public batchNumber: string,
    public expiryDate: Date | null = null,
    /** orderId enables the rental-timer trigger in WmsFgReceivedListener (Trigger 12). */
    public orderId?: number,
    public areaM2?: number,
    /**
     * T21-A2: grade-adjusted FG unit price (base × sort coefficient). When the QC inspection
     * carried a sort_grade, the QcPassedListener resolves the coefficient and passes the
     * graded value here so the IN-ledger row stores the saralangan (graded) cost.
     */
    public unitCost?: number | null,
    /**
     * T23-A1: cross-listener FG dedup. The MES→WMS hop (MesCompletedFgListener) and the
     * QC→WMS hop (QcPassedListener) BOTH receive the same finished goods for the same sales
     * order — under different batch numbers (`MES-<sessionId>` vs `QC-<inspectionId>`), so a
     * per-batch guard cannot catch the overlap and the FG was counted TWICE in
     * warehouse_stock. When this flag is true the handler runs a NOT-EXISTS guard on the
     * canonical 'IN' wms_transactions ledger keyed by (reference_id=orderId, material_id):
     * whichever golden-thread listener fires first performs the receipt, the second is a
     * no-op (idempotent skip). The manual receive endpoint (wms-rental.controller) leaves
     * this false, so legitimate manual/partial re-receipts are never blocked.
     */
    public dedupByOrderMaterial: boolean = false,
  ) {}
}

@CommandHandler(ReceiveFgCommand)
export class ReceiveFgHandler implements ICommandHandler<ReceiveFgCommand> {
  private readonly logger = new Logger(ReceiveFgHandler.name);
  constructor(
    @Inject(WMS_REPO) private wmsRepo: IWmsRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: ReceiveFgCommand): Promise<Result<void>> {
    this.logger.log(
      { materialId: command.materialId, amount: command.amount },
      'Receiving finished goods',
    );

    // T23-A1 cross-listener FG dedup (golden-thread only). MES-completed and QC-passed both
    // emit an FG receipt for the SAME order+material under different batch numbers, so the
    // batch-keyed guards inside each listener could not stop a 2x stock bump. When the caller
    // is a golden-thread listener (dedupByOrderMaterial=true) and an FG 'IN' ledger row already
    // exists for this (reference_id=orderId, material_id), the receipt is skipped (Ok no-op) —
    // whichever listener fired first wins. The manual receive endpoint leaves the flag false.
    if (command.dedupByOrderMaterial && command.orderId != null) {
      try {
        const dup = await runQuery<{ cnt: number }>(sql`
          SELECT COUNT(*)::int AS cnt
          FROM wms_transactions
          WHERE type = 'IN'
            AND reference_id = ${command.orderId}
            AND material_id = ${command.materialId}
            AND deleted_at IS NULL
        `);
        const cnt = Array.isArray(dup.rows) && dup.rows[0] ? Number(dup.rows[0].cnt) : 0;
        if (cnt > 0) {
          this.logger.log(
            { orderId: command.orderId, materialId: command.materialId, existing: cnt },
            'FG dedup: an FG receipt already exists for this order+material — skipping (idempotent, no double-stock)',
          );
          return Ok(undefined);
        }
      } catch (e: unknown) {
        // Q-40: a broken dedup check must not silently double-stock NOR silently drop the receipt.
        // Surface and fail closed on the GUARD only — let the receipt proceed (the per-listener
        // batch guards still prevent same-listener replays). A read failure here is rare.
        this.logger.warn(
          { orderId: command.orderId, materialId: command.materialId, err: e instanceof Error ? e.message : String(e) },
          'FG dedup guard read failed — proceeding with receipt (per-listener batch guard still applies)',
        );
      }
    }

    // Canonical FG receipt: warehouse_stock idempotent UPSERT (ON CONFLICT
    // (warehouse_id, material_id), backed by execReceiveFg). The legacy
    // saveStock() targeted the non-canonical `stocks` table, so QC-passed
    // finished goods never became visible to downstream WMS/POS Monitor readers
    // (golden-thread break #8). receiveFg() lands the FG in warehouse_stock.
    // A60: receiveFg() now also records an 'IN' wms_transactions ledger row in the
    // SAME transaction (atomic stock + movement). orderId is the ledger reference;
    // batchNumber (e.g. "QC-<inspectionId>") traces the receipt back to QC.
    const saveResult = await this.wmsRepo.receiveFg(
      command.materialId,
      command.warehouseId,
      command.amount,
      {
        referenceId: command.orderId ?? null,
        createdBy: null,
        notes: command.batchNumber ? `FG receipt ${command.batchNumber}` : null,
        unitCost: command.unitCost ?? null,
      },
    );
    if (!saveResult.ok) {
      return Err(saveResult.error);
    }

    // T23-A2: resolve the rental-timer storage footprint (areaM2) from a REAL source instead of
    // leaving it permanently undefined (which made WmsFgReceivedListener debug-skip every time).
    // The golden-thread listeners do not derive an area, so derive it here from the received FG:
    //   • explicit areaM2 on the command always wins (e.g. roll receipts that already know it);
    //   • otherwise, for weight-unit FG (kg/tn) we apply the canonical roll-area formula already
    //     used by wms-roll-calc.service:  areaM2 = weightKg × 1000 / grammageGsm  (from
    //     material_cards.grammage). Q-40: NO fabrication — when the FG is not weight-based or has
    //     no grammage, areaM2 stays undefined (the finance listener then books the rental with the
    //     area pending rather than inventing a number).
    const resolvedAreaM2 =
      command.areaM2 != null && Number.isFinite(command.areaM2) && command.areaM2 > 0
        ? command.areaM2
        : await this._resolveAreaM2FromMaterial(command.materialId, command.amount);

    // Trigger 12: WMS FG → FI ijara taymer
    // PA2-18 Wave 6: canonical class form; EventBridge re-emits to legacy @OnEvent listeners.
    // orderId enables the rental timer; areaM2 is the storage footprint (may be undefined when
    // the FG carries no weight/grammage — the listener books with area pending in that case).
    this.eventBus.publish(
      new WmsFgReceivedEvent(
        command.materialId,
        command.amount,
        command.warehouseId,
        _time.now(),
        command.orderId,
        resolvedAreaM2,
      ),
    );

    this.logger.log('Finished goods received');
    return Ok(undefined);
  }

  /**
   * T23-A2 — derive the FG storage footprint (m²) from real material-card data so the rental
   * timer has a non-fabricated area. Weight-unit FG (kg/tn) → areaM2 = weightKg × 1000 / grammage
   * (the canonical roll-area formula). Q-40: returns undefined (NOT a fabricated 1/0) when the FG
   * is not weight-based or has no grammage — the finance listener then books the rental with the
   * area pending. Never throws; a lookup failure simply yields undefined.
   */
  private async _resolveAreaM2FromMaterial(
    materialId: number,
    amount: number,
  ): Promise<number | undefined> {
    if (!materialId || !Number.isFinite(amount) || amount <= 0) return undefined;
    try {
      const r = await runQuery<{ unit_of_measure: string | null; grammage: string | number | null }>(sql`
        SELECT unit_of_measure, grammage
        FROM material_cards
        WHERE id = ${materialId}
        LIMIT 1
      `);
      const row = Array.isArray(r.rows) ? r.rows[0] : undefined;
      if (!row) return undefined;
      const unit = String(row.unit_of_measure ?? '').toLowerCase();
      const grammage = row.grammage != null ? Number(row.grammage) : NaN;
      // Only weight-based FG can use the weight→area formula. Pieces/sht/units carry no area.
      const weightKg = unit === 'kg' ? amount : unit === 'tn' || unit === 't' ? amount * 1000 : NaN;
      if (!Number.isFinite(weightKg) || !Number.isFinite(grammage) || grammage <= 0) {
        return undefined;
      }
      // areaM2 = weightKg × 1000 / grammageGsm  (mirrors wms-roll-calc.service)
      const area = (weightKg * 1000) / grammage;
      return Number.isFinite(area) && area > 0 ? Math.round(area * 1000) / 1000 : undefined;
    } catch (e: unknown) {
      this.logger.warn(
        { materialId, err: e instanceof Error ? e.message : String(e) },
        'areaM2 resolution failed — rental timer will book with area pending',
      );
      return undefined;
    }
  }
}
