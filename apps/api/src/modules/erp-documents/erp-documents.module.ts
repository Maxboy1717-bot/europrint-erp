/**
 * @module erp-documents.module
 * @description Erkin hujjatlar (free-form documents) — Phase A2. DocumentAccessLogService is
 * injected from the @Global DocumentControlModule (no import needed).
 */

import { Module } from '@nestjs/common';
import { ErpDocumentsController } from './erp-documents.controller';
import { ErpDocumentsRepository } from './erp-documents.repository';

@Module({
  controllers: [ErpDocumentsController],
  providers: [ErpDocumentsRepository],
  exports: [ErpDocumentsRepository],
})
export class ErpDocumentsModule {}
