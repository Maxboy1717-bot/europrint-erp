/**
 * @module document-control.module
 * @description Document Control layer (owner 2026-07-13). @Global so every module can inject
 * DocumentAccessLogService / DocumentDeliveryService without importing this module — the
 * roll-out (STEP 3.10) then only needs @Inject in each controller/service, no per-module
 * wiring. Imports ChatModule so DocumentDeliveryService can compose the exported ChatService
 * + ChatGateway (STEP 3.5, #2) as a pure consumer of chat's public API.
 */

import { Global, Module } from '@nestjs/common';
import { DocumentAccessLogService } from './document-access-log.service';
import { DocumentAccessController } from './document-access.controller';
import { DocumentDeliveryService } from './document-delivery.service';
import { ChatModule } from '../../modules/chat/chat.module';

@Global()
@Module({
  imports: [ChatModule],
  controllers: [DocumentAccessController],
  providers: [DocumentAccessLogService, DocumentDeliveryService],
  exports: [DocumentAccessLogService, DocumentDeliveryService],
})
export class DocumentControlModule {}
