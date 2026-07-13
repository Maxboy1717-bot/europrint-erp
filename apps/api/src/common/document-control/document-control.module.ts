/**
 * @module document-control.module
 * @description Document Control layer (owner 2026-07-13). @Global so every module can inject
 * DocumentAccessLogService without importing this module — the access-logging roll-out
 * (STEP 3.10) then only needs @Inject in each controller, no per-module wiring.
 */

import { Global, Module } from '@nestjs/common';
import { DocumentAccessLogService } from './document-access-log.service';
import { DocumentAccessController } from './document-access.controller';

@Global()
@Module({
  controllers: [DocumentAccessController],
  providers: [DocumentAccessLogService],
  exports: [DocumentAccessLogService],
})
export class DocumentControlModule {}
