import { Module } from '@nestjs/common';
import { ProductionShiftReportsController } from './production-shift-reports.controller';
import { ProductionReportsController } from './production-reports.controller';
import { ProductionService } from './production.service';
import { ProductionRepository } from './production.repository';

@Module({
  controllers: [ProductionShiftReportsController, ProductionReportsController],
  providers: [ProductionRepository, ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}
