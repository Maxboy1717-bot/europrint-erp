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
import { OutboundEnforcementService } from '../outbound-enforcement.service';
import { InventoryFreezeService } from '../inventory-freeze.service';

export class GoodsIssueCommand {
  constructor(public materialId: number,
    public warehouseId: number,
    public amount: number,
    public ppId: number,
    /** Authenticated user who issued the goods (recorded on the wms_goods_issues row). */
    public issuedBy: number | null = null,
    /** Optional explicit FIFO/FEFO override; otherwise auto-resolved from batches. */
    public strategy?: BatchIssueStrategy,
    /**
     * Optional tech-card id for the EP-WMS-084/085 hard-gate. When supplied AND the
     * tech-card BOM (`tech_card_bom`) has rows, an outbound material/gofra-layer
     * mismatch BLOCKS the issue. When null/0 (no tech-card link), the gate is a no-op
     * — preserving the existing issue behavior (no regression).
     */
    public technologyCardId: number | null = null,
    /** Optional gofra layer of the issued material (EP-WMS-085); null skips the layer check. */
    public issuedLayer: number | null = null) {}
}

/**
 * FAZA K (Kassa+Moliya FIFO tannarx) — natija of the in-tx issue: the FIFO cost
 * basis of the issued quantity, computed from the ACTUAL picked `batch_lots`.
 * `fifoValue` is null when there is no batch data (aggregate fallback) OR when
 * any picked batch is missing a recorded `cost_per_unit` — a partial/guessed
 * figure is never invented (Q-40); the finance listener falls back to
 * material_cards.unit_price for that issue instead.
 */
interface IssueOutcome {
  fifoValue: number | null;
}

@CommandHandler(GoodsIssueCommand)
export class GoodsIssueHandler implements ICommandHandler<GoodsIssueCommand> {
  private readonly logger = new Logger(GoodsIssueHandler.name);
  private readonly batchSelection = new BatchSelectionService();

  constructor(
    @Inject(WMS_REPO) private wmsRepo: IWmsRepository,
    private eventBus: EventBus,
    private readonly enforcement: OutboundEnforcementService,
    private readonly freeze: InventoryFreezeService,
  ) {}

  async execute(command: GoodsIssueCommand): Promise<Result<void>> {
    this.logger.log(
      { materialId: command.materialId, warehouseId: command.warehouseId, amount: command.amount },
      'EP-WMS-055 Issuing goods (FIFO/FEFO batch selection)',
    );

    // EP-WMS-084 / EP-WMS-085 hard-gate: when a tech-card is supplied, block a
    // material/gofra-layer mismatch BEFORE touching stock. No tech-card → no-op (no regress).
    const gate = await this.enforcement.checkIssueAllowed({
      materialId: command.materialId,
      technologyCardId: command.technologyCardId,
      issuedLayer: command.issuedLayer,
    });
    if (!gate.ok) return Err(gate.error);
    if (!gate.data.allowed) {
      return Err(
        AppErr(
          'BUSINESS_RULE_VIOLATION',
          gate.data.message ?? 'Chiqim bloklandi (texkarta/gofra mos kelmadi)',
          { blockCode: gate.data.blockCode },
        ),
      );
    }

    // W3-COUNT inventarizatsiya-muzlatish hard-gate: ombor-zona (yoki ayrim material)
    // muzlatilgan bo'lsa chiqim BLOKLANADI. Muzlatish yo'q → fail-open (no-op, regress YO'Q).
    const freezeGate = await this.freeze.checkExitAllowed(command.warehouseId, command.materialId);
    if (!freezeGate.ok) return Err(freezeGate.error);
    if (!freezeGate.data.allowed) {
      return Err(
        AppErr(
          'BUSINESS_RULE_VIOLATION',
          freezeGate.data.message ?? 'Chiqim bloklandi (zona muzlatilgan — inventarizatsiya)',
          { blockCode: freezeGate.data.blockCode },
        ),
      );
    }

    const issued = await this.wmsRepo.withTransaction((tx) =>
      this.issueInTx(command, tx),
    );
    if (!issued.ok) return Err(issued.error);

    // Trigger 9: WMS Goods Issue → PP (fired only after the tx committed).
    // FAZA K: `fifoValue` (when known) carries the real batch_lots FIFO cost basis so
    // FIN's WmsGoodsIssuedListener posts the actual per-batch cost instead of the
    // material_cards fallback (Q-40 — never invented, only attached when fully known).
    const payload: Record<string, unknown> = {
      materialId: command.materialId,
      amount: command.amount,
      ppId: command.ppId,
      timestamp: _time.now(),
    };
    if (issued.data.fifoValue != null) {
      payload.fifoValue = issued.data.fifoValue;
    }
    this.eventBus.publish(new WmsGoodsIssuedEvent(payload));

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
  ): Promise<Result<IssueOutcome>> {
    const { materialId, warehouseId, amount } = command;

    const hasBatches = await this.wmsRepo.hasAnyBatchLots(materialId, warehouseId, tx);
    if (!hasBatches.ok) return Err(hasBatches.error);

    if (!hasBatches.data) {
      // No batch tracking → aggregate canonical decrement (guarded, can't go negative).
      this.logger.log({ materialId, warehouseId }, 'No batch lots — aggregate fallback');
      const agg = await this.wmsRepo.issueFromWarehouseStock(materialId, warehouseId, amount, tx);
      if (!agg.ok) return Err(agg.error);
      // Record WMS's own goods-issue row in the SAME tx as the stock decrement (atomic).
      const recorded = await this.recordIssue(command, tx, null);
      if (!recorded.ok) return Err(recorded.error);
      return Ok({ fifoValue: null });
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
    // Record WMS's own goods-issue row in the SAME tx as the batch + aggregate decrement.
    const fifoValue = this.computeFifoValue(plan.data.picks);
    const recorded = await this.recordIssue(
      command,
      tx,
      fifoValue != null ? Math.round((fifoValue / amount) * 100) / 100 : null,
    );
    if (!recorded.ok) return Err(recorded.error);

    return Ok({ fifoValue });
  }

  /**
   * FAZA K — real FIFO cost basis of the picked batches: sum(qty × cost_per_unit).
   * Returns null (never a partial/guessed number) unless EVERY picked batch carries
   * a known positive `cost_per_unit` — Q-40 (ishlaydi ≠ to'g'ri; no invented value).
   */
  private computeFifoValue(picks: { qty: number; costPerUnit: number | null }[]): number | null {
    if (!Array.isArray(picks) || picks.length === 0) return null;
    const allKnown = picks.every((p) => p.costPerUnit != null && p.costPerUnit > 0);
    if (!allKnown) return null;
    const total = picks.reduce((sum, p) => sum + p.qty * (p.costPerUnit as number), 0);
    return Math.round(total * 100) / 100;
  }

  /**
   * Persists WMS's own `wms_goods_issues` record AND the canonical 'OUT'
   * `wms_transactions` ledger row inside the issue transaction (both atomic with
   * the stock decrement — if either INSERT fails the whole issue rolls back).
   *
   * A60 (OUT side): receiveFg() already writes the matching 'IN' ledger row, so the
   * stock<->wms_transactions ledger now stays symmetric — every issue is visible to
   * the dashboard "today_movements" KPI and the per-material recent-transactions
   * readers (previously goods-issue decremented warehouse_stock but left NO OUT row,
   * undercounting the ledger). The event published after commit is the cross-module
   * trigger; these two rows are WMS's own audit/record of the issue.
   */
  private async recordIssue(
    command: GoodsIssueCommand,
    tx: DrizzleExecutor,
    /** FAZA K — weighted-average FIFO unit cost of the picked batches (null = unknown). */
    unitCost: number | null,
  ): Promise<Result<void>> {
    const inserted = await this.wmsRepo.insertGoodsIssue(
      {
        materialId: command.materialId,
        warehouseId: command.warehouseId,
        quantity: command.amount,
        ppId: command.ppId,
        issuedBy: command.issuedBy,
      },
      tx,
    );
    if (!inserted.ok) return Err(inserted.error);

    // Canonical OUT movement — same tx as the stock decrement (symmetric with receiveFg's IN row).
    // FAZA K: unitCost (when known from batch_lots FIFO) makes this ledger row carry the REAL
    // acquisition cost of the issued stock, mirroring the T21-A2 pattern used for FG receipts.
    const ledger = await this.wmsRepo.recordWmsTransaction(
      {
        warehouseId: command.warehouseId,
        materialId: command.materialId,
        type: 'OUT',
        quantity: command.amount,
        referenceId: command.ppId ?? null,
        createdBy: command.issuedBy ?? null,
        notes: 'Goods issue',
        unitCost,
      },
      tx,
    );
    if (!ledger.ok) return Err(ledger.error);
    return Ok(undefined);
  }
}
