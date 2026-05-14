/**
 * @module financial-reports.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { FinancialReportsTelegramService } from './services/financial-reports-telegram.service';
import { FinancialReportsQueryService } from './services/financial-reports-query.service';
import { FinancialReportsAnalyticsService } from './services/financial-reports-analytics.service';
import { FinancialReportsSnapshotService } from './services/financial-reports-snapshot.service';
import { FinancialReportsDailyCron } from './cron/financial-reports-daily.cron';
import { FinancialReportsWeeklyCron } from './cron/financial-reports-weekly.cron';
import { FinancialReportsMonthlyCron } from './cron/financial-reports-monthly.cron';
import { FinancialReportsAlertsCron } from './cron/financial-reports-alerts.cron';
import { FinancialReportsController } from './presentation/financial-reports.controller';
import { FinancialReportsRepository } from './repositories/financial-reports.repository';

@Module({
  controllers: [FinancialReportsController],
  providers: [
    FinancialReportsRepository,
    FinancialReportsTelegramService,
    FinancialReportsQueryService,
    FinancialReportsAnalyticsService,
    FinancialReportsSnapshotService,
    FinancialReportsDailyCron,
    FinancialReportsWeeklyCron,
    FinancialReportsMonthlyCron,
    FinancialReportsAlertsCron,
  ],
  exports: [FinancialReportsQueryService, FinancialReportsTelegramService],
})
export class FinancialReportsModule {}
