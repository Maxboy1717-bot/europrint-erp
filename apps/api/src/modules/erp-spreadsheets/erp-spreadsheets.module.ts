/**
 * @module erp-spreadsheets.module
 * @description Jadval (spreadsheets) — Phase B-2. DocumentAccessLogService is injected from
 * the @Global DocumentControlModule (no import needed).
 */

import { Module } from '@nestjs/common';
import { ErpSpreadsheetsController } from './erp-spreadsheets.controller';
import { ErpSpreadsheetsRepository } from './erp-spreadsheets.repository';

@Module({
  controllers: [ErpSpreadsheetsController],
  providers: [ErpSpreadsheetsRepository],
  exports: [ErpSpreadsheetsRepository],
})
export class ErpSpreadsheetsModule {}
