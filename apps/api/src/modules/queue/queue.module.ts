/**
 * queue.module.ts — TZ-60: BullMQ 6 Navbat (Queue) moduli.
 *
 * 6 navbat:
 *   email            — Email yuborish
 *   telegram         — Telegram xabar (sinxron emas)
 *   pdf-generation   — PDF yaratish (sinxron emas)
 *   label-print      — Shtrix kod/label chop etish
 *   mrp-run          — MRP qayta hisoblash
 *   forecast-recalc  — Talab bashorati qayta hisoblash
 *
 * Har navbat:
 *   - Alohida Processor/Worker
 *   - Exponential backoff: t_n = t_0 × 2^n (BullMQ built-in), t_0=1000ms
 *   - removeOnComplete: 100, attempts: 10
 *
 * Redis ulanish: BullModule.forRootAsync → ConfigService orqali
 * ScheduleModule: AppModule da allaqachon import qilingan — bu yerda yo'q
 *
 * TAQIQLANGAN: sinxron telegram/PDF (blocking main thread)
 */

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProcessor } from './processors/email.processor';
import { TelegramProcessor } from './processors/telegram.processor';
import { PdfGenerationProcessor } from './processors/pdf-generation.processor';
import { LabelPrintProcessor } from './processors/label-print.processor';
import { MrpRunProcessor } from './processors/mrp-run.processor';
import { ForecastRecalcProcessor } from './processors/forecast-recalc.processor';
import { MaterializedViewRefreshService } from './materialized-view-refresh.service';
import { QUEUE_NAMES } from './queue.constants';
import { forwardRef } from '@nestjs/common';
import { PpModule } from '../pp/pp.module';
import { EoqCalculatorService } from '../wms/domain/services/eoq-calculator.service';
import { SafetyStockService } from '../wms/domain/services/safety-stock.service';
import { ForecastService } from '../ai/forecast/forecast.service';
import { ForecastRepository } from '../ai/forecast/forecast.repository';
import { ForecastPersistenceService } from '../ai/forecast/forecast-persistence.service';

export { QUEUE_NAMES, backoffDelay } from './queue.constants';
export type { QueueName } from './queue.constants';

/**
 * Barcha navbatlar uchun standart job parametrlari.
 * Exponential backoff: t_n = 1000ms × 2^n (BullMQ native `exponential` type).
 * 10 ta urinish bilan max delay ≈ 1024s < 1800s = t_max.
 */
const defaultJobOptions = {
  attempts: 10,
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
};

@Module({
  imports: [
    ConfigModule,
    // forwardRef breaks the bootstrap-time cycle: PpModule has internal
    // dependencies that NestJS resolves only after the module graph is
    // fully built. BomExplosionService (used by MrpRunProcessor) is
    // exported by PpModule and depends on PP_REPO.
    forwardRef(() => PpModule),
    // BullMQ Redis ulanishini ConfigService orqali sozlash
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host:     configService.get<string>('REDIS_HOST', 'localhost'),
          port:     Number(configService.get<number>('REDIS_PORT', 6379)),
          password: configService.get<string | undefined>('REDIS_PASSWORD') || undefined,
          db:       Number(configService.get<number>('REDIS_DB', 0)),
          maxRetriesPerRequest: null,
          enableOfflineQueue: false,
          lazyConnect: true,
          retryStrategy: (times: number) => times > 3 ? null : Math.min(times * 200, 2000),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_NAMES.EMAIL,           defaultJobOptions },
      { name: QUEUE_NAMES.TELEGRAM,        defaultJobOptions },
      { name: QUEUE_NAMES.PDF_GENERATION,  defaultJobOptions },
      { name: QUEUE_NAMES.LABEL_PRINT,     defaultJobOptions },
      { name: QUEUE_NAMES.MRP_RUN,         defaultJobOptions },
      { name: QUEUE_NAMES.FORECAST_RECALC, defaultJobOptions },
    ),
  ],
  providers: [
    EmailProcessor,
    TelegramProcessor,
    PdfGenerationProcessor,
    LabelPrintProcessor,
    MrpRunProcessor,
    ForecastRecalcProcessor,
    MaterializedViewRefreshService,
    // BomExplosionService comes from PpModule via forwardRef import above.
    EoqCalculatorService,
    SafetyStockService,
    // Forecast processor uchun — pure math + persistence
    ForecastService,
    ForecastRepository,
    ForecastPersistenceService,
  ],
  exports: [
    BullModule,
    MaterializedViewRefreshService,
  ],
})
export class QueueModule {}
