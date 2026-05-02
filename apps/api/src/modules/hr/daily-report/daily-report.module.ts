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
