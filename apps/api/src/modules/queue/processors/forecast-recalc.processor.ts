/**
 * forecast-recalc.processor.ts — BullMQ 'forecast-recalc' navbat workeri.
 * Talab bashorati (demand forecast) qayta hisoblash.
 * ForecastService (EMA) + ForecastPersistenceService.
 * concurrency: 1 — ML model inference resurs ko'p
 */
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { QUEUE_NAMES, backoffDelay } from '../queue.constants';
import { ForecastService } from '../../ai/forecast/forecast.service';
import { ForecastPersistenceService } from '../../ai/forecast/forecast-persistence.service';
import { safeNum } from '@common/math/math-utils';

export interface ForecastRecalcJobData {
  modelId: string;
  productIds?: string[];
  periodMonths: number;
  triggeredBy: string;
}

const MIN_HISTORY_POINTS = 4;
const WEEKS_PER_MONTH = 4;

@Processor(QUEUE_NAMES.FORECAST_RECALC, { concurrency: 1 })
export class ForecastRecalcProcessor extends WorkerHost {
  private readonly logger = new Logger(ForecastRecalcProcessor.name);

  constructor(
    private readonly forecastSvc: ForecastService,
    private readonly persistSvc: ForecastPersistenceService,
  ) {
    super();
  }

  async process(job: Job<ForecastRecalcJobData>): Promise<void> {
    const delay = backoffDelay(job.attemptsMade);
    this.logger.debug(
      `[forecast] Job #${job.id} — model: ${job.data.modelId}, period: ${job.data.periodMonths}m, backoff: ${delay}ms`,
    );

    try {
      await this.recalcForecast(job.data);
      this.logger.log(`[forecast] Job #${job.id} bashorat qayta hisoblandi`);
    } catch (err) {
      this.logger.error(`[forecast] Job #${job.id} xato: ${String(err)}`);
      throw err;
    }
  }

  private async recalcForecast(data: ForecastRecalcJobData): Promise<void> {
    const productIds = Array.isArray(data.productIds) ? data.productIds : [];

    if (productIds.length === 0) {
      throw new Error('[forecast] productIds bo\'sh — bashorat hisoblash uchun kamida bitta mahsulot talab qilinadi');
    }

    const horizon = data.periodMonths * WEEKS_PER_MONTH;
    let succeeded = 0;
    let skipped = 0;
    let failed = 0;

    // Pattern 2: forecasting is independent per product — parallelise to avoid N+1 latency
    const outcomes = await Promise.all(productIds.map(async (productId): Promise<'success' | 'skipped' | 'failed'> => {
      const histRes = await this.persistSvc.loadHistory(productId, 52);
      if (!histRes.ok) {
        this.logger.warn(`[forecast] Tarix yuklash xato: ${productId} — ${histRes.error.message}`);
        return 'failed';
      }

      const history = histRes.data;
      if (history.length < MIN_HISTORY_POINTS) {
        this.logger.debug(`[forecast] Yetarli tarix yo'q: ${productId} (${history.length} ta, min=${MIN_HISTORY_POINTS})`);
        return 'skipped';
      }

      const emaRes = await this.forecastSvc.forecastEma(history, horizon);
      if (!emaRes.ok) {
        this.logger.warn(`[forecast] EMA xato: ${productId} — ${emaRes.error.message}`);
        return 'failed';
      }

      const predictedQty = safeNum(emaRes.data.predicted[0]);
      const nextPeriod = new Date();
      nextPeriod.setDate(nextPeriod.getDate() + 7);

      const saveRes = await this.persistSvc.saveForecast([{
        materialId: productId,
        period: nextPeriod,
        forecastQty: predictedQty,
        method: 'EMA',
        alpha: emaRes.data.alpha,
        metrics: emaRes.data.metrics,
      }]);

      if (saveRes.ok) return 'success';
      this.logger.warn(`[forecast] Saqlash xato: ${productId} — ${saveRes.error.message}`);
      return 'failed';
    }));

    for (const outcome of outcomes) {
      if (outcome === 'success') succeeded++;
      else if (outcome === 'skipped') skipped++;
      else failed++;
    }

    this.logger.log(
      `[forecast] Yakunlandi: model=${data.modelId}, ` +
      `muvaffaqiyat=${succeeded}, skip=${skipped}, xato=${failed}`,
    );

    if (failed > 0) {
      throw new Error(
        `[forecast] ${failed}/${productIds.length} mahsulot uchun bashorat muvaffaqiyatsiz ` +
        `(model=${data.modelId}, muvaffaqiyat=${succeeded}, skip=${skipped})`,
      );
    }
  }
}
