/**
 * @module goods-issue.handler
 * @description CQRS command/query handler. execute() applies one use-case; returns Result<T>.
 *
 * #08 PHASE 4/7 — FIFO/FEFO batch issue. The issue path now SELECTS specific
 * `batch_lots` rows (FIFO = oldest received first; FEFO = earliest expiry first
 * for dated materials such as kley/bo'yoq/kimyo), decrements the chosen batches,
 * blocks expired batches (EP-WMS-079), and only falls back to the aggregate
 * warehouse_stock decrement when NO batch tracking exists for the material.
 */

import { TashkentTimeService } from '@common/time';
const _time = new TashkentTimeService();
import { Err, Ok, AppErr } from '@common/result';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { WmsGoodsIssuedEvent } from '../events/wms-goods-issued.event';
import { Inject, Logger } from '@nestjs/common';
import { Result } from '@common/result';
import { IWmsRepository, WMS_REPO, DrizzleExecutor } from '../../domain/repositories/wms.repository';
import { BatchSelectionService } from '../../domain/services/batch-selection.service';
import { BatchIssueStrategy } from '../../domain/constants/wms-batch-issue.constants';

export class GoodsIssueCommand {
  constructor(public materialId: number,
    public warehouseId: number,
    public amount: number,
    public ppId: number,
    /** Optional explicit FIFO/FEFO override; otherwise auto-resolved from batches. */
    public strategy?: BatchIssueStrategy) {}
}

@CommandHandler(GoodsIssueCommand)
export class GoodsIssueHandler implements ICommandHandler<GoodsIssueCommand> {
  private readonly logger = new Logger(GoodsIssueHandler.name);
  private readonly batchSelection = new BatchSelectionService();

  constructor(
    @Inject(WMS_REPO) private wmsRepo: IWmsRepository,
    private eventBus: EventBus
  ) {}

  async execute(command: GoodsIssueCommand): Promise<Result<void>> {
    this.logger.log(
      { materialId: command.materialId, warehouseId: command.warehouseId, amount: command.amount },
      'EP-WMS-055 Issuing goods (FIFO/FEFO batch selection)',
    );

    const issued = await this.wmsRepo.withTransaction((tx) =>
      this.issueInTx(command, tx),
    );
    if (!issued.ok) return Err(issued.error);

    // Trigger 9: WMS Goods Issue → PP (fired only after the tx committed)
    this.eventBus.publish(new WmsGoodsIssuedEvent({
      materialId: command.materialId,
      amount: command.amount,
      ppId: command.ppId,
      timestamp: _time.now(),
    }));

    this.logger.log('Goods issued successfully');
    return Ok(undefined);
  }

  /**
   * Batch-aware issue inside one transaction:
   *   1. No batch tracking for this material → aggregate warehouse_stock fallback.
   *   2. Batches exist → select FIFO/FEFO, block expired, decrement each chosen
   *      batch AND the aggregate warehouse_stock (canonical balance stays correct).
   */
  private async issueInTx(
    command: GoodsIssueCommand,
    tx: DrizzleExecutor,
  ): Promise<Result<void>> {
    const { materialId, warehouseId, amount } = command;

    const hasBatches = await this.wmsRepo.hasAnyBatchLots(materialId, warehouseId, tx);
    if (!hasBatches.ok) return Err(hasBatches.error);

    if (!hasBatches.data) {
      // No batch tracking → aggregate canonical decrement (guarded, can't go negative).
      this.logger.log({ materialId, warehouseId }, 'No batch lots — aggregate fallback');
      return this.wmsRepo.issueFromWarehouseStock(materialId, warehouseId, amount, tx);
    }

    const lots = await this.wmsRepo.getIssuableBatchLots(materialId, warehouseId, tx);
    if (!lots.ok) return Err(lots.error);

    const plan = this.batchSelection.buildPlan(
      lots.data,
      amount,
      _time.now(),
      command.strategy,
    );
    if (!plan.ok) return Err(plan.error);

    // Decrement each chosen batch (guarded) — spans multiple batches as planned.
    for (const pick of plan.data.picks) {
      const dec = await this.wmsRepo.decrementBatchLot(pick.lotId, pick.qty, tx);
      if (!dec.ok) return Err(dec.error);
    }

    // Keep the canonical aggregate balance in sync with the batch detail (same tx).
    const agg = await this.wmsRepo.issueFromWarehouseStock(materialId, warehouseId, amount, tx);
    if (!agg.ok) {
      return Err(
        AppErr(
          'BUSINESS_RULE_VIOLATION',
          `Partiyalar tanlandi, ammo umumiy qoldiq mos emas: ${agg.error.message}`,
        ),
      );
    }

    this.logger.log(
      { materialId, warehouseId, strategy: plan.data.strategy, batches: plan.data.picks.length },
      'EP-WMS-055 Batch issue applied',
    );
    return Ok(undefined);
  }
}
