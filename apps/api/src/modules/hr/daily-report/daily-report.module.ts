/**
 * @module daily-report.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { DailyReportService } from './daily-report.service';
import { DailyReportRepository } from './daily-report.repository';
import { DailyReportController } from './daily-report.controller';

@Module({
  controllers: [DailyReportController],
  providers: [DailyReportRepository, DailyReportService],
  exports: [DailyReportService],
})
export class DailyReportModule {}
