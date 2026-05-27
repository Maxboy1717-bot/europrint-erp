/**
 * mrp-run.processor.ts — BullMQ 'mrp-run' navbat workeri.
 *
 * Qo'llab-quvvatlanadigan job turlari:
 *   1. MRP BOM explosion (productIds + planningHorizonDays)
 *   2. EOQ_RECALC_ALL   — barcha materiallar uchun EOQ qayta hisoblash (TZ-02)
 *   3. SAFETY_STOCK_REFRESH — EWM α=0.2 + ABC Z-score asosida xavfsiz zaxira (TZ-04)
 *
 * EOQ va Safety Stock implementatsiyalari .helper.ts fayllarda.
 *
 * Concurrency: 1 (og'ir hisoblash, parallel emas)
 */
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES, backoffDelay } from '../queue.constants';
import { BomExplosionService } from '../../pp/domain/services/bom-explosion.service';
import { EoqCalculatorService } from '../../wms/domain/services/eoq-calculator.service';
import { SafetyStockService } from '../../wms/domain/services/safety-stock.service';
import { runEoqRecalcAll } from './mrp-run-eoq.helper';
import { runSafetyStockRefresh } from './mrp-run-safety-stock.helper';
import { Result, Ok, Err } from '@common/types/result.type';

export interface MrpRunJobData {
  planningHorizonDays?: number;
  productIds?: string[];
  warehouseId?: string;
  triggeredBy: string;
  jobType?: 'EOQ_RECALC_ALL' | 'SAFETY_STOCK_REFRESH';
}

@Processor(QUEUE_NAMES.MRP_RUN, { concurrency: 1 })
export class MrpRunProcessor extends WorkerHost {
  private readonly logger = new Logger(MrpRunProcessor.name);

  constructor(
    private readonly bomService: BomExplosionService,
    private readonly eoqSvc: EoqCalculatorService,
    private readonly ssSvc: SafetyStockService,
  ) {
    super();
  }

  async process(job: Job<MrpRunJobData>): Promise<void> {
    const delay = backoffDelay(job.attemptsMade);
    this.logger.debug(`[mrp] Job #${job.id} type=${job.data.jobType ?? 'MRP'} backoff=${delay}ms`);

    try {
      if (job.data.jobType === 'EOQ_RECALC_ALL') {
        await runEoqRecalcAll(this.eoqSvc, this.logger);
      } else if (job.data.jobType === 'SAFETY_STOCK_REFRESH') {
        await runSafetyStockRefresh(this.ssSvc, this.logger);
      } else {
        const result = await this.runMrpBomExplosion(job.data);
        if (!result.ok) {
          throw new Error(result.error.message);
        }
      }
      this.logger.log(`[mrp] Job #${job.id} muvaffaqiyatli yakunlandi`);
    } catch (err) {
      this.logger.error(`[mrp] Job #${job.id} xato: ${String(err)}`);
      throw err;
    }
  }

  private async runMrpBomExplosion(data: MrpRunJobData): Promise<Result<void>> {
    const productIds = Array.isArray(data.productIds) ? data.productIds : [];
    if (productIds.length === 0) {
      return Err('[mrp] productIds bo\'sh — kamida bitta mahsulot talab qilinadi');
    }

    let totalNodes = 0;
    const failedIds: string[] = [];

    // Pattern 2: each BOM explosion is independent — run in parallel rather than serial N+1
    const results = await Promise.all(
      productIds.map(async (productId) => ({ productId, result: await this.bomService.explodeFromDb(productId, 1) })),
    );
    for (const { productId, result } of results) {
      if (result.ok) {
        totalNodes += result.data.totalNodes;
      } else {
        this.logger.warn(`[mrp] BOM explosion xato: productId=${productId} — ${result.error.message}`);
        failedIds.push(productId);
      }
    }

    this.logger.log(
      `[mrp] BOM yakunlandi: mahsulotlar=${productIds.length}, tugunlar=${totalNodes}, ` +
      `xato=${failedIds.length}, horizon=${data.planningHorizonDays ?? 0}d`,
    );

    if (failedIds.length > 0) {
      return Err(`[mrp] ${failedIds.length}/${productIds.length} mahsulot BOM explosion muvaffaqiyatsiz`);
    }
    return Ok();
  }
}
