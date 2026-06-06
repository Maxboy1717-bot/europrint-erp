/**
 * @module forecast-weekly.job
 * @description Source module. See exports for details.
 */

import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job } from 'bullmq';
import { runQuery, rawSql } from '@shared/db';
import { sql } from 'drizzle-orm';
import { safeNum } from '@common/math/math-utils';
import { ForecastService } from './forecast.service';
import { HoltWintersService } from './holt-winters.service';
import { ForecastPersistenceService } from './forecast-persistence.service';
import type { ForecastRecord } from './forecast-persistence.service';

export const FORECAST_QUEUE_NAME = 'forecast-recalc';

export interface ForecastJobPayload {
  materialId: string;
  historyLength?: number;
}

/**
 * TZ-06/07/08 Haftalik BullMQ Queue + Worker
 *
 * PRODUCER (@Cron — har dushanba 00:00):
 *   1. Barcha aktiv materiallarni yuklaydi
 *   2. Har material uchun ForecastJobPayload bilan job queue'ga qo'shiladi
 *
 * CONSUMER (BullMQ Worker):
 *   Har job uchun:
 *   1. EMA (≥4 tarix nuqtasi bo'lsa) → forecast_series
 *   2. HW Additive (≥24 oylik bo'lsa) → forecast_series
 *   3. OLS Linear regression (≥6 nuqta bo'lsa) → forecast_series
 *
 * Connection: REDIS_HOST + REDIS_PORT (ConfigService orqali)
 */
@Injectable()
export class ForecastWeeklyJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ForecastWeeklyJob.name);
  private queue: Queue | null = null;
  private worker: Worker | null = null;

  constructor(
    private readonly forecastSvc: ForecastService,
    private readonly hwSvc: HoltWintersService,
    private readonly persistSvc: ForecastPersistenceService,
    private readonly configSvc: ConfigService,
  ) {}

  onModuleInit(): void {
    const connection = {
      host: this.configSvc.get<string>('REDIS_HOST', 'localhost'),
      port: this.configSvc.get<number>('REDIS_PORT', 6379),
    };

    // BullMQ Queue (Producer)
    this.queue = new Queue(FORECAST_QUEUE_NAME, {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    // BullMQ Worker (Consumer/Processor)
    this.worker = new Worker(
      FORECAST_QUEUE_NAME,
      (job: Job<ForecastJobPayload>) => this.processJob(job),
      { connection, concurrency: 5 },
    );

    this.worker.on('completed', (job) =>
      this.logger.debug(`Job ${job.id} (${job.data.materialId}) bajarildi`),
    );
    this.worker.on('failed', (job, err) =>
      this.logger.error(`Job ${job?.id} xato: ${String(err)}`),
    );

    this.logger.log(`ForecastWeeklyJob tayyor: queue="${FORECAST_QUEUE_NAME}" redis=${connection.host}:${connection.port}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }

  /**
   * Haftalik trigger: har dushanba 00:00 UTC — barcha materiallar uchun job qo'shadi
   */
  // Har dushanba soat 00:00 UTC
  @Cron('0 0 * * 1')
  async scheduleForecastJobs(): Promise<void> {
    if (!this.queue) {
      this.logger.warn('Queue tayyor emas — skip');
      return;
    }

    const materials = await this.loadActiveMaterials();
    if (!materials.length) {
      this.logger.log('Aktiv material topilmadi — haftalik job skip');
      return;
    }

    for (const matId of materials) {
      await this.queue.add('weekly-forecast', { materialId: matId });
    }

    this.logger.log(`${materials.length} ta material uchun forecast job'lari queue'ga qo'shildi`);
  }

  /**
   * BullMQ Worker processor — har material uchun EMA + HW + OLS
   */
  async processJob(job: Job<ForecastJobPayload>): Promise<void> {
    const { materialId } = job.data;
    const histRes = await this.persistSvc.loadHistory(materialId, 52);
    if (!histRes.ok) {
      this.logger.warn(
        `loadHistory xato (materialId=${materialId}): ${histRes.error.message ?? histRes.error.code}`,
      );
    }
    const history = histRes.ok ? histRes.data : [];
    if (history.length < 4) return;

    const records: ForecastRecord[] = [];
    const nextPeriod = new Date();
    nextPeriod.setDate(nextPeriod.getDate() + 7);
    const horizon = 13; // 13 hafta / 3 oy

    // 1. EMA — optimal alpha bilan
    const emaRes = await this.forecastSvc.forecastEma(history, horizon);
    if (emaRes.ok && emaRes.data.predicted.length > 0) {
      records.push({
        materialId,
        period: nextPeriod,
        forecastQty: safeNum(emaRes.data.predicted[0]),
        method: 'EMA',
        alpha: emaRes.data.alpha,
        metrics: emaRes.data.metrics,
      });
    }

    // 2. Holt-Winters — ≥24 oylik tarix kerak
    if (history.length >= 24) {
      const hwRes = await this.hwSvc.autoForecast(history, horizon, 12);
      if (hwRes.ok && hwRes.data.predicted.length > 0) {
        records.push({
          materialId,
          period: nextPeriod,
          forecastQty: safeNum(hwRes.data.predicted[0]),
          method: 'HW',
          metrics: hwRes.data.metrics,
        });
      }
    }

    // 3. OLS Linear Regression — ≥6 nuqta bo'lsa (trend bashorat)
    if (history.length >= 6) {
      const x = (Array.isArray(history) ? history : []).map((_, i) => i);
      const olsRes = await this.forecastSvc.fitLinear(x, history);
      if (olsRes.ok) {
        const { slope, intercept } = olsRes.data;
        const nextX = history.length; // x: 0..n-1 → keyingi nuqta n
        const forecastQty = Math.max(0, slope * nextX + intercept);
        records.push({
          materialId,
          period: nextPeriod,
          forecastQty,
          method: 'LINEAR',
          metrics: olsRes.data.metrics,
        });
      }
    }

    if (records.length > 0) {
      await this.persistSvc.saveForecast(records);
    }
  }

  /**
   * Aktiv materiallar ro'yxatini `material_cards` jadvalidan yuklaydi (is_active=true).
   * Canonical EuroPrint material master (21+ rows). `materials` was 0 rows — forecast never ran.
   */
  private async loadActiveMaterials(): Promise<string[]> {
    try {
      const result = await runQuery<Record<string, unknown>>(sql`
        SELECT id::text AS material_id
        FROM material_cards
        WHERE is_active = TRUE
        LIMIT 1000
      `);
      return (Array.isArray(result?.rows) ? result?.rows : []).map((r) => String(r['material_id'] ?? '')).filter(Boolean);
    } catch {
      return [];
    }
  }
}
