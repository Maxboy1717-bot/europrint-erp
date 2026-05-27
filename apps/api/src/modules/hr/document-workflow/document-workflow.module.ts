/**
 * @module document-workflow.module
 * @description NestJS @Module() definition. Providers, controllers, and imports for this feature slice.
 */

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DocumentWorkflowService } from './document-workflow.service';
import {
  DocumentWorkflowProcessor,
  DocumentSubmittedHandler,
  DocumentApprovedHandler,
  DocumentRejectedHandler,
} from './document-workflow.processor';
import { DocumentWorkflowRepository } from './document-workflow.repository';

@Module({
  imports: [CqrsModule],
  controllers: [],
  providers: [
    DocumentWorkflowService,
    DocumentWorkflowProcessor,
    DocumentSubmittedHandler,
    DocumentApprovedHandler,
    DocumentRejectedHandler,
    DocumentWorkflowRepository,
  ],
  exports: [DocumentWorkflowService],
})
export class DocumentWorkflowModule {}
